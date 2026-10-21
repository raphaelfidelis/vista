/** Dado que viola uma regra do domínio financeiro. */
export class FinanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FinanceValidationError';
  }
}
