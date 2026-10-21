/** Código de convite errado, ou cadastro fechado (sem INVITE_CODE válido no .env). */
export class AuthInvalidInviteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthInvalidInviteError';
  }
}
