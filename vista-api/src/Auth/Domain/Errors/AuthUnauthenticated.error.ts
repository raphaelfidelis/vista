/** Sessão ausente, inexistente ou vencida. */
export class AuthUnauthenticatedError extends Error {
  constructor() {
    super('Não autenticado');
    this.name = 'AuthUnauthenticatedError';
  }
}
