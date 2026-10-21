import { validPositiveAmount } from './Amounts';
import { Month } from './Month';

/** Limite de uma categoria só num mês (ex.: dezembro): vale no lugar do padrão. */
export class BudgetOverride {
  private _userId: string;
  private _categoryId: string;
  private _month: string;
  private _amountInCents: number;

  /** `month`: AAAA-MM. */
  constructor(
    userId: string,
    categoryId: string,
    month: string,
    amountInCents: number,
  ) {
    this._userId = userId;
    this._categoryId = categoryId;
    this._month = Month.parse(month).toString();
    this._amountInCents = validPositiveAmount(amountInCents);
  }

  /** Imutável: o dono dos dados. */
  get userId(): string {
    return this._userId;
  }

  get categoryId(): string {
    return this._categoryId;
  }

  /** AAAA-MM */
  get month(): string {
    return this._month;
  }

  get amountInCents(): number {
    return this._amountInCents;
  }
}
