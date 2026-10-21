import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { AttemptLimiter } from '../../Domain/AttemptLimiter';
import { AuthAccountNotFoundError } from '../../Domain/Errors/AuthAccountNotFound.error';
import { AuthEmailTakenError } from '../../Domain/Errors/AuthEmailTaken.error';
import { AuthInvalidCredentialsError } from '../../Domain/Errors/AuthInvalidCredentials.error';
import { AuthInvalidInviteError } from '../../Domain/Errors/AuthInvalidInvite.error';
import { AuthUnauthenticatedError } from '../../Domain/Errors/AuthUnauthenticated.error';
import { AuthValidationError } from '../../Domain/Errors/AuthValidation.error';
import { MAX_PASSWORD_LENGTH, validPassword } from '../../Domain/Password';
import type { SessionRepository } from '../../Domain/Repositories/Session.repository';
import { SESSION_REPOSITORY } from '../../Domain/Repositories/Session.repository';
import type { UserRepository } from '../../Domain/Repositories/User.repository';
import { USER_REPOSITORY } from '../../Domain/Repositories/User.repository';
import {
  AuthenticatedSession,
  AuthService,
  AuthSessionResult,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from '../../Domain/Services/Auth.service';
import type { AccountSetup } from '../../Domain/Services/AccountSetup';
import { ACCOUNT_SETUP } from '../../Domain/Services/AccountSetup';
import type { AuthClock } from '../../Domain/Services/AuthClock';
import { AUTH_CLOCK } from '../../Domain/Services/AuthClock';
import type { PasswordHasher } from '../../Domain/Services/PasswordHasher';
import { PASSWORD_HASHER } from '../../Domain/Services/PasswordHasher';
import {
  generateSessionToken,
  hashSessionToken,
  Session,
} from '../../Domain/Session';
import { MAX_EMAIL_LENGTH, User } from '../../Domain/User';

/** O convite configurado (INVITE_CODE); vazio ou curto = cadastro fechado. */
export const INVITE_CODE = Symbol('InviteCode');

export const MIN_INVITE_LENGTH = 12;
const MAX_INVITE_LENGTH = 128;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** Requisições de login e cadastro por IP: sucesso ou falha. */
const REQUESTS_PER_IP = 30;
/** Senhas erradas por e-mail. */
const LOGIN_FAILURES_PER_EMAIL = 5;
/** Senhas atuais erradas por usuário, em MINHA CONTA. */
const PASSWORD_FAILURES_PER_USER = 5;
/** Convites errados, por IP e no total: o total fecha o cadastro mesmo com IPs trocados. */
const INVITE_FAILURES_PER_IP = 5;
const INVITE_FAILURES_TOTAL = 20;

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

@Injectable()
export class AuthServiceImpl implements AuthService {
  private readonly requestsByIp = new AttemptLimiter(
    REQUESTS_PER_IP,
    15 * MINUTE_MS,
  );
  private readonly loginFailuresByEmail = new AttemptLimiter(
    LOGIN_FAILURES_PER_EMAIL,
    15 * MINUTE_MS,
  );
  private readonly passwordFailuresByUser = new AttemptLimiter(
    PASSWORD_FAILURES_PER_USER,
    15 * MINUTE_MS,
  );
  private readonly inviteFailuresByIp = new AttemptLimiter(
    INVITE_FAILURES_PER_IP,
    HOUR_MS,
  );
  private readonly inviteFailuresTotal = new AttemptLimiter(
    INVITE_FAILURES_TOTAL,
    HOUR_MS,
  );
  /** Hash de uma senha que ninguém tem: gasta o mesmo tempo quando o e-mail não existe. */
  private dummyHash: Promise<string> | null = null;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessions: SessionRepository,
    @Inject(PASSWORD_HASHER)
    private readonly hasher: PasswordHasher,
    @Inject(AUTH_CLOCK)
    private readonly clock: AuthClock,
    @Inject(INVITE_CODE)
    private readonly inviteCode: string,
    @Inject(ACCOUNT_SETUP)
    private readonly accountSetup: AccountSetup,
  ) {}

  async register(input: RegisterInput): Promise<AuthSessionResult> {
    const now = this.clock.now();

    this.countRequest(input.clientIp, now);
    // O convite vem antes de qualquer outra regra: sem ele, nada além disso é revelado.
    this.assertInvite(input.inviteCode, input.clientIp, now);

    const user = User.create({ name: input.name, email: input.email });

    validPassword(input.password, user.email);

    if (await this.users.findByEmail(user.email)) {
      throw new AuthEmailTakenError();
    }

    user.changePasswordHash(await this.hasher.hash(input.password));
    // Duas requisições ao mesmo tempo passam do findByEmail: quem barra é o
    // índice único, e o repositório converte a violação em AuthEmailTakenError.
    await this.users.save(user);
    await this.prepareAccount(user.id);

    return this.openSession(user.id, now);
  }

  async login(input: LoginInput): Promise<AuthSessionResult> {
    const now = this.clock.now();
    const email = User.normalizeEmail(input.email);
    const emailKey = email.slice(0, MAX_EMAIL_LENGTH);

    this.countRequest(input.clientIp, now);
    this.loginFailuresByEmail.assertAllowed(emailKey, now.getTime());

    const user = await this.users.findByEmail(email);
    // Sem conta, ou conta só do Google: verifica contra o hash falso, para o
    // tempo de resposta não revelar quais e-mails existem.
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const correct = await this.hasher.verify(hash, input.password);

    if (!user || !user.hasPassword || !correct) {
      this.loginFailuresByEmail.record(emailKey, now.getTime());
      throw new AuthInvalidCredentialsError();
    }

    this.loginFailuresByEmail.reset(emailKey);
    await this.sessions.deleteExpired(now);

    return this.openSession(user.id, now);
  }

  async authenticate(token: string): Promise<AuthenticatedSession> {
    const now = this.clock.now();
    const session = await this.sessions.findByTokenHash(
      hashSessionToken(token),
    );

    if (!session) {
      throw new AuthUnauthenticatedError();
    }

    if (session.isExpiredAt(now)) {
      await this.sessions.delete(session.id);
      throw new AuthUnauthenticatedError();
    }

    if (session.touch(now)) {
      await this.sessions.save(session);
    }

    return { userId: session.userId, sessionId: session.id };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.delete(sessionId);
  }

  async rename(userId: string, name: string): Promise<void> {
    const user = await this.findUser(userId);

    user.name = name;
    await this.users.save(user);
  }

  async changePassword(
    userId: string,
    sessionId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const now = this.clock.now().getTime();
    const key = userId;

    this.passwordFailuresByUser.assertAllowed(key, now);

    const user = await this.findUser(userId);

    if (user.passwordHash !== null) {
      if (!input.currentPassword) {
        throw new AuthValidationError('Informe a senha atual');
      }

      if (
        !(await this.hasher.verify(user.passwordHash, input.currentPassword))
      ) {
        this.passwordFailuresByUser.record(key, now);
        throw new AuthValidationError('A senha atual está incorreta');
      }
    }

    validPassword(input.newPassword, user.email);

    user.changePasswordHash(await this.hasher.hash(input.newPassword));
    await this.users.save(user);
    this.passwordFailuresByUser.reset(key);
    // Quem tinha a senha antiga (ou um token roubado) perde o acesso.
    await this.sessions.deleteOthers(userId, sessionId);
  }

  async resetPassword(email: string): Promise<string> {
    const user = await this.users.findByEmail(User.normalizeEmail(email));

    if (!user) {
      throw new AuthAccountNotFoundError();
    }

    const temporary = randomBytes(12).toString('base64url');

    user.changePasswordHash(await this.hasher.hash(temporary));
    await this.users.save(user);
    await this.sessions.deleteByUser(user.id);

    return temporary;
  }

  /**
   * Categorias padrão etc. São conveniência: se falharem, a conta já existe e
   * o cadastro segue; o usuário cria as categorias à mão.
   */
  private async prepareAccount(userId: string): Promise<void> {
    try {
      await this.accountSetup.prepare(userId);
    } catch (error) {
      new Logger('Auth').warn(
        'Não foi possível preparar a conta nova: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /** Cada requisição de login ou cadastro conta para o IP, deu certo ou não. */
  private countRequest(clientIp: string, now: Date): void {
    this.requestsByIp.assertAllowed(clientIp, now.getTime());
    this.requestsByIp.record(clientIp, now.getTime());
  }

  private assertInvite(code: string, clientIp: string, now: Date): void {
    if (this.inviteCode.length < MIN_INVITE_LENGTH) {
      throw new AuthInvalidInviteError('Cadastro fechado');
    }

    const time = now.getTime();

    this.inviteFailuresByIp.assertAllowed(clientIp, time);
    this.inviteFailuresTotal.assertAllowed('total', time);

    const matches =
      code.length <= MAX_INVITE_LENGTH &&
      timingSafeEqual(sha256(code), sha256(this.inviteCode));

    if (!matches) {
      this.inviteFailuresByIp.record(clientIp, time);
      this.inviteFailuresTotal.record('total', time);
      throw new AuthInvalidInviteError('Código de convite inválido');
    }
  }

  private async openSession(
    userId: string,
    now: Date,
  ): Promise<AuthSessionResult> {
    const token = generateSessionToken();
    const session = Session.create({
      userId,
      tokenHash: hashSessionToken(token),
      now,
    });

    await this.sessions.save(session);

    return { token, expiresAt: session.expiresAt };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hasher.hash(
      randomBytes(MAX_PASSWORD_LENGTH).toString('base64url'),
    );

    return this.dummyHash;
  }

  private async findUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AuthUnauthenticatedError();
    }

    return user;
  }
}
