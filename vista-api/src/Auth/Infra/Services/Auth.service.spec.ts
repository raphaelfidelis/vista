import { AuthAccountNotFoundError } from '../../Domain/Errors/AuthAccountNotFound.error';
import { AuthEmailTakenError } from '../../Domain/Errors/AuthEmailTaken.error';
import { AuthInvalidCredentialsError } from '../../Domain/Errors/AuthInvalidCredentials.error';
import { AuthInvalidInviteError } from '../../Domain/Errors/AuthInvalidInvite.error';
import { AuthTooManyAttemptsError } from '../../Domain/Errors/AuthTooManyAttempts.error';
import { AuthUnauthenticatedError } from '../../Domain/Errors/AuthUnauthenticated.error';
import { AuthValidationError } from '../../Domain/Errors/AuthValidation.error';
import {
  hashSessionToken,
  Session,
  SESSION_LIFETIME_MS,
  SESSION_TOUCH_INTERVAL_MS,
} from '../../Domain/Session';
import { User } from '../../Domain/User';
import { Logger } from '@nestjs/common';
import { AuthServiceImpl } from './Auth.service';

const INVITE = 'convite-secreto-123';
const PASSWORD = 'senha-correta-123';
const START = new Date('2026-10-13T12:00:00Z');
const IP = '10.0.0.1';
const MINUTE = 60 * 1000;

/** O "hash" do teste só prefixa a senha: assim o verify confere de verdade. */
const hashOf = (password: string) => 'hash:' + password;

function userWithPassword(email = 'maria@exemplo.com'): User {
  return User.create({
    name: 'Maria',
    email,
    passwordHash: hashOf(PASSWORD),
  });
}

function setup(inviteCode = INVITE) {
  let now = START;
  const users = {
    findById: jest.fn<Promise<User | null>, [string]>(),
    findByEmail: jest.fn<Promise<User | null>, [string]>(),
    save: jest.fn<Promise<void>, [User]>(),
  };
  const sessions = {
    findByTokenHash: jest.fn<Promise<Session | null>, [string]>(),
    save: jest.fn<Promise<void>, [Session]>(),
    delete: jest.fn<Promise<void>, [string]>(),
    deleteOthers: jest.fn<Promise<void>, [string, string]>(),
    deleteByUser: jest.fn<Promise<void>, [string]>(),
    deleteExpired: jest.fn<Promise<void>, [Date]>(),
  };
  const hasher = {
    hash: jest.fn<Promise<string>, [string]>((password) =>
      Promise.resolve(hashOf(password)),
    ),
    verify: jest.fn<Promise<boolean>, [string, string]>((hash, password) =>
      Promise.resolve(hash === hashOf(password)),
    ),
  };
  const clock = { now: () => now };
  const accountSetup = {
    prepare: jest.fn<Promise<void>, [string]>(() => Promise.resolve()),
  };

  users.findByEmail.mockResolvedValue(null);

  return {
    users,
    sessions,
    hasher,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
    accountSetup,
    service: new AuthServiceImpl(
      users,
      sessions,
      hasher,
      clock,
      inviteCode,
      accountSetup,
    ),
  };
}

const registration = {
  inviteCode: INVITE,
  name: 'Maria',
  email: 'Maria@Exemplo.com',
  password: PASSWORD,
  clientIp: IP,
};

describe('AuthServiceImpl', () => {
  describe('register', () => {
    it('cria a conta com a senha em hash e abre a sessão', async () => {
      const { service, users, sessions } = setup();

      const result = await service.register(registration);

      const saved = users.save.mock.calls[0]?.[0];
      expect(saved?.email).toBe('maria@exemplo.com');
      expect(saved?.passwordHash).toBe(hashOf(PASSWORD));
      const session = sessions.save.mock.calls[0]?.[0];
      expect(session?.userId).toBe(saved?.id);
      expect(session?.tokenHash).toBe(hashSessionToken(result.token));
      expect(result.expiresAt.getTime()).toBe(
        START.getTime() + SESSION_LIFETIME_MS,
      );
    });

    it('prepara a conta nova (categorias padrão) depois de salvá-la', async () => {
      const { service, users, accountSetup } = setup();
      const order: string[] = [];
      users.save.mockImplementation(() => {
        order.push('save');

        return Promise.resolve();
      });
      accountSetup.prepare.mockImplementation(() => {
        order.push('prepare');

        return Promise.resolve();
      });

      await service.register(registration);

      expect(accountSetup.prepare).toHaveBeenCalledWith(
        users.save.mock.calls[0]?.[0].id,
      );
      expect(order).toEqual(['save', 'prepare']);
    });

    it('se preparar a conta falhar, o cadastro segue e abre a sessão', async () => {
      const { service, sessions, accountSetup } = setup();
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      accountSetup.prepare.mockRejectedValue(new Error('banco ocupado'));

      await expect(service.register(registration)).resolves.toHaveProperty(
        'token',
      );
      expect(sessions.save).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('cadastro recusado não prepara conta nenhuma', async () => {
      const { service, accountSetup } = setup();

      await service
        .register({ ...registration, inviteCode: 'errado' })
        .catch(() => undefined);
      await service
        .register({ ...registration, password: 'curta' })
        .catch(() => undefined);

      expect(accountSetup.prepare).not.toHaveBeenCalled();
    });

    it('o token nunca é guardado, só o hash', async () => {
      const { service, sessions } = setup();

      const { token } = await service.register(registration);

      expect(sessions.save.mock.calls[0]?.[0].tokenHash).not.toBe(token);
    });

    it('procura o e-mail já normalizado', async () => {
      const { service, users } = setup();

      await service.register({ ...registration, email: '  MARIA@exemplo.COM' });

      expect(users.findByEmail).toHaveBeenCalledWith('maria@exemplo.com');
    });

    it('recusa convite errado sem tocar na conta', async () => {
      const { service, users, hasher } = setup();

      await expect(
        service.register({ ...registration, inviteCode: 'errado' }),
      ).rejects.toThrow(
        new AuthInvalidInviteError('Código de convite inválido'),
      );
      expect(users.findByEmail).not.toHaveBeenCalled();
      expect(hasher.hash).not.toHaveBeenCalled();
      expect(users.save).not.toHaveBeenCalled();
    });

    it('com o cadastro fechado (sem INVITE_CODE) nem o convite certo entra', async () => {
      const { service, users } = setup('');

      await expect(service.register(registration)).rejects.toThrow(
        'Cadastro fechado',
      );
      expect(users.save).not.toHaveBeenCalled();
    });

    it('INVITE_CODE com menos de 12 caracteres também fecha o cadastro', async () => {
      const { service } = setup('curto-demai');

      await expect(
        service.register({ ...registration, inviteCode: 'curto-demai' }),
      ).rejects.toThrow('Cadastro fechado');
    });

    it('confere o convite antes de qualquer outra regra: senha curta com convite errado não vaza', async () => {
      const { service } = setup();

      await expect(
        service.register({
          ...registration,
          inviteCode: 'errado',
          password: 'curta',
          email: 'nao-é-email',
        }),
      ).rejects.toBeInstanceOf(AuthInvalidInviteError);
    });

    it('recusa convite gigante sem compará-lo', async () => {
      const { service } = setup();

      await expect(
        service.register({ ...registration, inviteCode: 'x'.repeat(5000) }),
      ).rejects.toBeInstanceOf(AuthInvalidInviteError);
    });

    it('recusa e-mail que já tem conta, sem gastar um hash', async () => {
      const { service, users, hasher } = setup();
      users.findByEmail.mockResolvedValue(userWithPassword());

      await expect(service.register(registration)).rejects.toBeInstanceOf(
        AuthEmailTakenError,
      );
      expect(hasher.hash).not.toHaveBeenCalled();
    });

    it('recusa senha curta, nome vazio e e-mail inválido antes de salvar', async () => {
      const { service, users } = setup();

      await expect(
        service.register({ ...registration, password: 'curta' }),
      ).rejects.toBeInstanceOf(AuthValidationError);
      await expect(
        service.register({ ...registration, name: '  ' }),
      ).rejects.toBeInstanceOf(AuthValidationError);
      await expect(
        service.register({ ...registration, email: 'invalido' }),
      ).rejects.toBeInstanceOf(AuthValidationError);
      expect(users.save).not.toHaveBeenCalled();
    });

    it('recusa senha igual ao e-mail', async () => {
      const { service } = setup();

      await expect(
        service.register({
          ...registration,
          email: 'maria.silva@exemplo.com',
          password: 'maria.silva@exemplo.com',
        }),
      ).rejects.toThrow(/igual ao e-mail/);
    });

    it('a corrida por um e-mail livre vira o erro do repositório (409), não uma conta duplicada', async () => {
      const { service, users, sessions } = setup();
      users.save.mockRejectedValue(new AuthEmailTakenError());

      await expect(service.register(registration)).rejects.toBeInstanceOf(
        AuthEmailTakenError,
      );
      expect(sessions.save).not.toHaveBeenCalled();
    });

    describe('limite de convites errados', () => {
      it('5 por IP em uma hora: a 6ª tentativa bloqueia, até com o convite certo', async () => {
        const { service } = setup();

        for (let i = 0; i < 5; i++) {
          await expect(
            service.register({ ...registration, inviteCode: 'palpite-' + i }),
          ).rejects.toBeInstanceOf(AuthInvalidInviteError);
        }

        await expect(service.register(registration)).rejects.toBeInstanceOf(
          AuthTooManyAttemptsError,
        );
      });

      it('outro IP não é afetado pelo bloqueio do primeiro', async () => {
        const { service } = setup();

        for (let i = 0; i < 5; i++) {
          await service
            .register({ ...registration, inviteCode: 'palpite-' + i })
            .catch(() => undefined);
        }

        await expect(
          service.register({ ...registration, clientIp: '10.0.0.2' }),
        ).resolves.toHaveProperty('token');
      });

      it('20 no total fecham o cadastro para todos os IPs', async () => {
        const { service } = setup();

        for (let i = 0; i < 20; i++) {
          await service
            .register({
              ...registration,
              inviteCode: 'palpite-' + i,
              clientIp: '10.1.0.' + i,
            })
            .catch(() => undefined);
        }

        await expect(
          service.register({ ...registration, clientIp: '10.2.0.1' }),
        ).rejects.toBeInstanceOf(AuthTooManyAttemptsError);
      });

      it('uma hora depois o bloqueio acaba', async () => {
        const { service, advance } = setup();

        for (let i = 0; i < 5; i++) {
          await service
            .register({ ...registration, inviteCode: 'palpite-' + i })
            .catch(() => undefined);
        }
        advance(60 * MINUTE);

        await expect(service.register(registration)).resolves.toHaveProperty(
          'token',
        );
      });
    });

    it('30 requisições por IP em 15 minutos, certas ou erradas', async () => {
      const { service, users } = setup();
      users.findByEmail.mockResolvedValue(userWithPassword());

      for (let i = 0; i < 30; i++) {
        await service.register(registration).catch(() => undefined);
      }

      await expect(service.register(registration)).rejects.toBeInstanceOf(
        AuthTooManyAttemptsError,
      );
    });
  });

  describe('login', () => {
    const credentials = {
      email: 'MARIA@exemplo.com',
      password: PASSWORD,
      clientIp: IP,
    };

    it('entra com a senha certa, abre a sessão e limpa as vencidas', async () => {
      const { service, users, sessions } = setup();
      const user = userWithPassword();
      users.findByEmail.mockResolvedValue(user);

      const result = await service.login(credentials);

      expect(users.findByEmail).toHaveBeenCalledWith('maria@exemplo.com');
      expect(sessions.deleteExpired).toHaveBeenCalledWith(START);
      expect(sessions.save.mock.calls[0]?.[0].userId).toBe(user.id);
      expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('cada login abre uma sessão com token novo', async () => {
      const { service, users } = setup();
      users.findByEmail.mockResolvedValue(userWithPassword());

      const first = await service.login(credentials);
      const second = await service.login(credentials);

      expect(first.token).not.toBe(second.token);
    });

    it('senha errada: credenciais inválidas', async () => {
      const { service, users, sessions } = setup();
      users.findByEmail.mockResolvedValue(userWithPassword());

      await expect(
        service.login({ ...credentials, password: 'senha-errada-123' }),
      ).rejects.toBeInstanceOf(AuthInvalidCredentialsError);
      expect(sessions.save).not.toHaveBeenCalled();
    });

    it('e-mail desconhecido: a mesma resposta, e ainda gasta uma verificação de hash', async () => {
      const { service, hasher } = setup();

      const unknown = await service.login(credentials).catch((e: Error) => e);

      expect(unknown).toBeInstanceOf(AuthInvalidCredentialsError);
      expect(unknown).toHaveProperty('message', 'E-mail ou senha incorretos');
      expect(hasher.verify).toHaveBeenCalledTimes(1);
    });

    it('a mensagem é a mesma para senha errada, e-mail desconhecido e conta sem senha', async () => {
      const { service, users } = setup();
      const messages: string[] = [];

      users.findByEmail.mockResolvedValueOnce(null);
      messages.push(await message(service.login(credentials)));
      users.findByEmail.mockResolvedValueOnce(userWithPassword());
      messages.push(
        await message(
          service.login({ ...credentials, password: 'senha-errada-123' }),
        ),
      );
      users.findByEmail.mockResolvedValueOnce(
        User.create({ name: 'Google', email: 'maria@exemplo.com' }),
      );
      messages.push(await message(service.login(credentials)));

      expect(new Set(messages).size).toBe(1);
    });

    it('conta sem senha (só Google) não entra por senha nenhuma', async () => {
      const { service, users, hasher } = setup();
      users.findByEmail.mockResolvedValue(
        User.create({ name: 'Google', email: 'maria@exemplo.com' }),
      );

      await expect(service.login(credentials)).rejects.toBeInstanceOf(
        AuthInvalidCredentialsError,
      );
      expect(hasher.verify).toHaveBeenCalledTimes(1);
    });

    it('o hash falso é calculado uma vez só', async () => {
      const { service, hasher } = setup();

      await service.login(credentials).catch(() => undefined);
      await service.login(credentials).catch(() => undefined);

      expect(hasher.hash).toHaveBeenCalledTimes(1);
    });

    describe('limite de senhas erradas', () => {
      async function failFiveTimes(
        service: AuthServiceImpl,
        email = credentials.email,
      ) {
        for (let i = 0; i < 5; i++) {
          await expect(
            service.login({
              email,
              password: 'errada-' + i + '-xxxxx',
              clientIp: '10.5.0.' + i,
            }),
          ).rejects.toBeInstanceOf(AuthInvalidCredentialsError);
        }
      }

      it('5 falhas por e-mail: a 6ª bloqueia, até com a senha certa, sem verificar o hash', async () => {
        const { service, users, hasher } = setup();
        users.findByEmail.mockResolvedValue(userWithPassword());
        await failFiveTimes(service);
        hasher.verify.mockClear();

        await expect(service.login(credentials)).rejects.toBeInstanceOf(
          AuthTooManyAttemptsError,
        );
        expect(hasher.verify).not.toHaveBeenCalled();
      });

      it('conta o e-mail desconhecido também, para não distinguir', async () => {
        const { service } = setup();
        await failFiveTimes(service);

        await expect(service.login(credentials)).rejects.toBeInstanceOf(
          AuthTooManyAttemptsError,
        );
      });

      it('o bloqueio vale por e-mail: outro e-mail não é afetado', async () => {
        const { service, users } = setup();
        users.findByEmail.mockResolvedValue(userWithPassword('outro@e.co'));
        await failFiveTimes(service);

        await expect(
          service.login({ ...credentials, email: 'outro@e.co' }),
        ).resolves.toHaveProperty('token');
      });

      it('o bloqueio acaba depois de 15 minutos', async () => {
        const { service, users, advance } = setup();
        users.findByEmail.mockResolvedValue(userWithPassword());
        await failFiveTimes(service);
        advance(15 * MINUTE);

        await expect(service.login(credentials)).resolves.toHaveProperty(
          'token',
        );
      });

      it('um login certo zera a contagem', async () => {
        const { service, users } = setup();
        users.findByEmail.mockResolvedValue(userWithPassword());

        for (let i = 0; i < 4; i++) {
          await service
            .login({ ...credentials, password: 'errada-' + i + '-xxxxx' })
            .catch(() => undefined);
        }
        await service.login(credentials);
        for (let i = 0; i < 4; i++) {
          await service
            .login({ ...credentials, password: 'errada-' + i + '-yyyyy' })
            .catch(() => undefined);
        }

        await expect(service.login(credentials)).resolves.toHaveProperty(
          'token',
        );
      });
    });

    it('30 requisições por IP em 15 minutos, mesmo para e-mails diferentes', async () => {
      const { service } = setup();

      for (let i = 0; i < 30; i++) {
        await service
          .login({ ...credentials, email: `p${i}@e.co` })
          .catch(() => undefined);
      }

      await expect(
        service.login({ ...credentials, email: 'novo@e.co' }),
      ).rejects.toBeInstanceOf(AuthTooManyAttemptsError);
    });
  });

  describe('authenticate', () => {
    function openSession(): Session {
      return Session.create({
        userId: 'user-1',
        tokenHash: hashSessionToken('token-1'),
        now: START,
      });
    }

    it('procura a sessão pelo hash do token e devolve o usuário e a sessão', async () => {
      const { service, sessions } = setup();
      const session = openSession();
      sessions.findByTokenHash.mockResolvedValue(session);

      const result = await service.authenticate('token-1');

      expect(sessions.findByTokenHash).toHaveBeenCalledWith(
        hashSessionToken('token-1'),
      );
      expect(result).toEqual({ userId: 'user-1', sessionId: session.id });
    });

    it('token desconhecido', async () => {
      const { service, sessions } = setup();
      sessions.findByTokenHash.mockResolvedValue(null);

      await expect(service.authenticate('x')).rejects.toBeInstanceOf(
        AuthUnauthenticatedError,
      );
    });

    it('sessão vencida é apagada e recusada', async () => {
      const { service, sessions, advance } = setup();
      const session = openSession();
      sessions.findByTokenHash.mockResolvedValue(session);
      advance(SESSION_LIFETIME_MS);

      await expect(service.authenticate('token-1')).rejects.toBeInstanceOf(
        AuthUnauthenticatedError,
      );
      expect(sessions.delete).toHaveBeenCalledWith(session.id);
    });

    it('sessão parada por 7 dias também vence', async () => {
      const { service, sessions, advance } = setup();
      sessions.findByTokenHash.mockResolvedValue(openSession());
      advance(7 * 24 * 60 * MINUTE);

      await expect(service.authenticate('token-1')).rejects.toBeInstanceOf(
        AuthUnauthenticatedError,
      );
    });

    it('registra o uso só depois de uma hora', async () => {
      const { service, sessions, advance } = setup();
      const session = openSession();
      sessions.findByTokenHash.mockResolvedValue(session);

      await service.authenticate('token-1');
      expect(sessions.save).not.toHaveBeenCalled();

      advance(SESSION_TOUCH_INTERVAL_MS);
      await service.authenticate('token-1');
      expect(sessions.save).toHaveBeenCalledWith(session);
    });
  });

  describe('logout', () => {
    it('apaga a sessão', async () => {
      const { service, sessions } = setup();

      await service.logout('session-1');

      expect(sessions.delete).toHaveBeenCalledWith('session-1');
    });
  });

  describe('rename', () => {
    it('troca o nome e salva', async () => {
      const { service, users } = setup();
      const user = userWithPassword();
      users.findById.mockResolvedValue(user);

      await service.rename(user.id, '  Maria Silva ');

      expect(users.save.mock.calls[0]?.[0].name).toBe('Maria Silva');
    });

    it('recusa nome inválido sem salvar', async () => {
      const { service, users } = setup();
      users.findById.mockResolvedValue(userWithPassword());

      await expect(service.rename('u', '   ')).rejects.toBeInstanceOf(
        AuthValidationError,
      );
      expect(users.save).not.toHaveBeenCalled();
    });

    it('usuário que não existe mais: não autenticado', async () => {
      const { service, users } = setup();
      users.findById.mockResolvedValue(null);

      await expect(service.rename('u', 'Maria')).rejects.toBeInstanceOf(
        AuthUnauthenticatedError,
      );
    });
  });

  describe('changePassword', () => {
    const NEW_PASSWORD = 'senha-nova-456';

    it('troca a senha e encerra as OUTRAS sessões, mantendo a atual', async () => {
      const { service, users, sessions } = setup();
      const user = userWithPassword();
      users.findById.mockResolvedValue(user);

      await service.changePassword(user.id, 'session-atual', {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      expect(users.save.mock.calls[0]?.[0].passwordHash).toBe(
        hashOf(NEW_PASSWORD),
      );
      expect(sessions.deleteOthers).toHaveBeenCalledWith(
        user.id,
        'session-atual',
      );
    });

    it('senha atual errada: recusa sem trocar nem encerrar sessão', async () => {
      const { service, users, sessions } = setup();
      users.findById.mockResolvedValue(userWithPassword());

      await expect(
        service.changePassword('u', 's', {
          currentPassword: 'errada-errada',
          newPassword: NEW_PASSWORD,
        }),
      ).rejects.toThrow('A senha atual está incorreta');
      expect(users.save).not.toHaveBeenCalled();
      expect(sessions.deleteOthers).not.toHaveBeenCalled();
    });

    it('conta com senha exige a atual', async () => {
      const { service, users } = setup();
      users.findById.mockResolvedValue(userWithPassword());

      await expect(
        service.changePassword('u', 's', { newPassword: NEW_PASSWORD }),
      ).rejects.toThrow('Informe a senha atual');
    });

    it('conta criada pelo Google define a primeira senha sem a atual', async () => {
      const { service, users } = setup();
      const user = User.create({ name: 'Google', email: 'g@e.co' });
      users.findById.mockResolvedValue(user);

      await service.changePassword(user.id, 's', {
        newPassword: NEW_PASSWORD,
      });

      expect(users.save.mock.calls[0]?.[0].hasPassword).toBe(true);
    });

    it('recusa senha nova curta ou igual ao e-mail', async () => {
      const { service, users } = setup();
      users.findById.mockResolvedValue(userWithPassword());

      await expect(
        service.changePassword('u', 's', {
          currentPassword: PASSWORD,
          newPassword: 'curta',
        }),
      ).rejects.toBeInstanceOf(AuthValidationError);
      await expect(
        service.changePassword('u', 's', {
          currentPassword: PASSWORD,
          newPassword: 'maria@exemplo.com',
        }),
      ).rejects.toThrow(/igual ao e-mail/);
      expect(users.save).not.toHaveBeenCalled();
    });

    it('5 senhas atuais erradas bloqueiam o usuário, até a certa, sem verificar o hash', async () => {
      const { service, users, hasher } = setup();
      users.findById.mockResolvedValue(userWithPassword());

      for (let i = 0; i < 5; i++) {
        await service
          .changePassword('u', 's', {
            currentPassword: 'errada-' + i + '-xxxx',
            newPassword: NEW_PASSWORD,
          })
          .catch(() => undefined);
      }
      hasher.verify.mockClear();

      await expect(
        service.changePassword('u', 's', {
          currentPassword: PASSWORD,
          newPassword: NEW_PASSWORD,
        }),
      ).rejects.toBeInstanceOf(AuthTooManyAttemptsError);
      expect(hasher.verify).not.toHaveBeenCalled();
    });

    it('o bloqueio é por usuário', async () => {
      const { service, users } = setup();
      users.findById.mockResolvedValue(userWithPassword());

      for (let i = 0; i < 5; i++) {
        await service
          .changePassword('u1', 's', {
            currentPassword: 'errada-' + i + '-xxxx',
            newPassword: NEW_PASSWORD,
          })
          .catch(() => undefined);
      }

      await expect(
        service.changePassword('u2', 's', {
          currentPassword: PASSWORD,
          newPassword: NEW_PASSWORD,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('gera uma senha temporária válida, guarda só o hash e derruba todas as sessões', async () => {
      const { service, users, sessions } = setup();
      const user = userWithPassword();
      users.findByEmail.mockResolvedValue(user);

      const temporary = await service.resetPassword(' MARIA@exemplo.com ');

      expect(users.findByEmail).toHaveBeenCalledWith('maria@exemplo.com');
      expect(temporary.length).toBeGreaterThanOrEqual(10);
      expect(users.save.mock.calls[0]?.[0].passwordHash).toBe(
        hashOf(temporary),
      );
      expect(sessions.deleteByUser).toHaveBeenCalledWith(user.id);
    });

    it('cada redefinição gera uma senha diferente', async () => {
      const { service, users } = setup();
      users.findByEmail.mockResolvedValue(userWithPassword());

      expect(await service.resetPassword('a@e.co')).not.toBe(
        await service.resetPassword('a@e.co'),
      );
    });

    it('e-mail sem conta', async () => {
      const { service, users, sessions } = setup();

      await expect(service.resetPassword('x@e.co')).rejects.toBeInstanceOf(
        AuthAccountNotFoundError,
      );
      expect(users.save).not.toHaveBeenCalled();
      expect(sessions.deleteByUser).not.toHaveBeenCalled();
    });
  });
});

async function message(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return error instanceof Error ? `${error.name}: ${error.message}` : '?';
  }

  return 'não falhou';
}
