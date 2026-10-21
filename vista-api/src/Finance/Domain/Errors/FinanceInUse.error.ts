/** Registro que não pode ser removido porque outros dependem dele. */
export class FinanceInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FinanceInUseError';
  }
}
