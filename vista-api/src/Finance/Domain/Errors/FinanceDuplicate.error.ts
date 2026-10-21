/** Nome já usado por outro registro do mesmo tipo. */
export class FinanceDuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FinanceDuplicateError';
  }
}
