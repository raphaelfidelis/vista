/** Dado que viola uma regra do domínio de gastos. */
export class ExpenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpenseValidationError';
  }
}
