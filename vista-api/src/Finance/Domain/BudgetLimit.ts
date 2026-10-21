import { validPositiveAmount } from './Amounts';

/** Limite mensal padrão de uma categoria de despesa: vale para todo mês sem exceção. */
export class BudgetLimit {
  private _userId: string;
  private _categoryId: string;
  private _amountInCents: number;

  constructor(userId: string, categoryId: string, amountInCents: number) {
    this._userId = userId;
    this._categoryId = categoryId;
    this._amountInCents = validPositiveAmount(amountInCents);
  }

  /** Imutável: o dono dos dados. */
  get userId(): string {
    return this._userId;
  }

  get categoryId(): string {
    return this._categoryId;
  }

  get amountInCents(): number {
    return this._amountInCents;
  }
}
