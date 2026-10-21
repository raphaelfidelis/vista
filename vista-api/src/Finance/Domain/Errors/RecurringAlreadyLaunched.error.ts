export class RecurringAlreadyLaunchedError extends Error {
  /** `month` no formato AAAA-MM. */
  constructor(description: string, month: string) {
    super(`O gasto fixo "${description}" já foi lançado em ${month}`);
    this.name = 'RecurringAlreadyLaunchedError';
  }
}
