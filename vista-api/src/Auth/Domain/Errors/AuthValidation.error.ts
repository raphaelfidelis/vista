/** Dado de conta que viola uma regra (nome, e-mail, senha). */
export class AuthValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthValidationError';
  }
}
