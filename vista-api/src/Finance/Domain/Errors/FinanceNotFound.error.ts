/** Registro que não existe. A mensagem já diz qual (conta, categoria…). */
export class FinanceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FinanceNotFoundError';
  }
}
