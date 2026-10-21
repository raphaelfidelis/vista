/**
 * E-mail desconhecido, senha errada e conta sem senha dão a mesma resposta:
 * quem erra não descobre quais e-mails têm conta.
 */
export class AuthInvalidCredentialsError extends Error {
  constructor() {
    super('E-mail ou senha incorretos');
    this.name = 'AuthInvalidCredentialsError';
  }
}
