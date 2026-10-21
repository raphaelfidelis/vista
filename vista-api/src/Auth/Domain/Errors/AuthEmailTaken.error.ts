export class AuthEmailTakenError extends Error {
  constructor() {
    super('Já existe uma conta com este e-mail. Entre.');
    this.name = 'AuthEmailTakenError';
  }
}
