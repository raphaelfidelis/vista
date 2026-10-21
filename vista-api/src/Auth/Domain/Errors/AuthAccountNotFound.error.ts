export class AuthAccountNotFoundError extends Error {
  constructor() {
    super('Nenhuma conta com este e-mail. Crie uma em Criar conta.');
    this.name = 'AuthAccountNotFoundError';
  }
}
