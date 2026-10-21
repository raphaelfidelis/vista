export const AUTH_SERVICE = Symbol('AuthService');

/** O que o navegador guarda: o token em si e quando a sessão acaba. */
export interface AuthSessionResult {
  token: string;
  expiresAt: Date;
}

export interface RegisterInput {
  inviteCode: string;
  name: string;
  email: string;
  password: string;
  /** IP de quem fez a requisição, para o limite de tentativas. */
  clientIp: string;
}

export interface LoginInput {
  email: string;
  password: string;
  clientIp: string;
}

export interface ChangePasswordInput {
  /** Obrigatória quando a conta já tem senha. */
  currentPassword?: string;
  newPassword: string;
}

export interface AuthenticatedSession {
  userId: string;
  sessionId: string;
}

export interface AuthService {
  register(input: RegisterInput): Promise<AuthSessionResult>;
  login(input: LoginInput): Promise<AuthSessionResult>;
  /** Sessão inexistente ou vencida: AuthUnauthenticatedError. */
  authenticate(token: string): Promise<AuthenticatedSession>;
  logout(sessionId: string): Promise<void>;
  rename(userId: string, name: string): Promise<void>;
  /** Encerra as outras sessões do usuário e mantém a atual. */
  changePassword(
    userId: string,
    sessionId: string,
    input: ChangePasswordInput,
  ): Promise<void>;
  /** Só para o comando de terminal: devolve a senha temporária e encerra todas as sessões. */
  resetPassword(email: string): Promise<string>;
}
