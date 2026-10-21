import { randomUUID } from 'node:crypto';
import { MAX_AMOUNT_IN_CENTS } from './Amounts';
import { CategoryKind } from './Category';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { MAX_DESCRIPTION_LENGTH } from './Limits';
import { Month } from './Month';

export interface NewRecurring {
  userId: string;
  description: string;
  /** Despesa fixa (aluguel) ou receita fixa (salário). */
  kind: CategoryKind;
  categoryId: string;
  /** Conta onde o lançamento cai; ou o cartão (só despesa), no lugar dela. */
  accountId?: string | null;
  cardId?: string | null;
  /** Obrigatório quando o valor não varia; quando varia, é só uma referência. */
  amountInCents?: number | null;
  /** O valor muda todo mês (energia): o lançamento pede o valor na hora. */
  variableAmount: boolean;
  /** Dia do vencimento, de 1 a 31. Em meses curtos vale o último dia. */
  dueDay: number;
}

/** Gasto ou receita que se repete todo mês. Não é um lançamento: serve de modelo para eles. */
export class Recurring {
  private _id: string;
  private _userId: string;
  private _description: string;
  private _kind: CategoryKind;
  private _categoryId: string;
  private _accountId: string | null;
  private _cardId: string | null;
  private _amountInCents: number | null;
  private _variableAmount: boolean;
  private _dueDay: number;
  private _active: boolean;
  private _createdAt: Date;

  constructor(
    id: string,
    userId: string,
    description: string,
    kind: CategoryKind,
    categoryId: string,
    accountId: string | null,
    cardId: string | null,
    amountInCents: number | null,
    variableAmount: boolean,
    dueDay: number,
    active: boolean,
    createdAt: Date,
  ) {
    this._id = id;
    this._userId = userId;
    this._description = Recurring.validDescription(description);
    this._kind = kind;
    this._categoryId = categoryId;
    this._accountId = accountId;
    this._cardId = cardId;
    Recurring.validOrigin(kind, accountId, cardId);
    this._amountInCents = Recurring.validAmount(amountInCents, variableAmount);
    this._variableAmount = variableAmount;
    this._dueDay = Recurring.validDueDay(dueDay);
    this._active = active;
    this._createdAt = createdAt;
  }

  static create({
    userId,
    description,
    kind,
    categoryId,
    accountId = null,
    cardId = null,
    amountInCents = null,
    variableAmount,
    dueDay,
  }: NewRecurring): Recurring {
    return new Recurring(
      randomUUID(),
      userId,
      description,
      kind,
      categoryId,
      accountId,
      cardId,
      amountInCents,
      variableAmount,
      dueDay,
      true,
      new Date(),
    );
  }

  get id(): string {
    return this._id;
  }

  /** Imutável: o dono dos dados. */
  get userId(): string {
    return this._userId;
  }

  get description(): string {
    return this._description;
  }

  set description(description: string) {
    this._description = Recurring.validDescription(description);
  }

  /** Imutável: trocar despesa por receita faria os lançamentos antigos mentirem. */
  get kind(): CategoryKind {
    return this._kind;
  }

  get categoryId(): string {
    return this._categoryId;
  }

  set categoryId(categoryId: string) {
    this._categoryId = categoryId;
  }

  get accountId(): string | null {
    return this._accountId;
  }

  get cardId(): string | null {
    return this._cardId;
  }

  /**
   * Conta e cartão são alternativas (exatamente uma), então mudam juntos:
   * dois setters separados deixariam um estado intermediário inválido.
   */
  defineOrigin(accountId: string | null, cardId: string | null): void {
    Recurring.validOrigin(this._kind, accountId, cardId);
    this._accountId = accountId;
    this._cardId = cardId;
  }

  get amountInCents(): number | null {
    return this._amountInCents;
  }

  get variableAmount(): boolean {
    return this._variableAmount;
  }

  /**
   * Valor e "varia" só fazem sentido juntos (sem valor, tem que variar), então
   * mudam juntos: dois setters separados deixariam um estado intermediário inválido.
   */
  defineAmount(amountInCents: number | null, variableAmount: boolean): void {
    this._amountInCents = Recurring.validAmount(amountInCents, variableAmount);
    this._variableAmount = variableAmount;
  }

  get dueDay(): number {
    return this._dueDay;
  }

  set dueDay(dueDay: number) {
    this._dueDay = Recurring.validDueDay(dueDay);
  }

  get active(): boolean {
    return this._active;
  }

  set active(active: boolean) {
    this._active = active;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  /** AAAA-MM-DD: o vencimento neste mês, ou o último dia dele se o mês for mais curto. */
  dueDateIn(month: Month): string {
    const lastDay = Number(month.lastDay().slice(-2));
    const day = Math.min(this._dueDay, lastDay);

    return `${month.toString()}-${String(day).padStart(2, '0')}`;
  }

  private static validOrigin(
    kind: CategoryKind,
    accountId: string | null,
    cardId: string | null,
  ): void {
    if ((accountId === null) === (cardId === null)) {
      throw new FinanceValidationError('Escolha a conta ou o cartão');
    }

    if (cardId !== null && kind !== 'EXPENSE') {
      throw new FinanceValidationError('Só a despesa pode ser no cartão');
    }
  }

  private static validDescription(value: string): string {
    const description = value.trim();

    if (description === '') {
      throw new FinanceValidationError('A descrição é obrigatória');
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new FinanceValidationError(
        `A descrição deve ter até ${MAX_DESCRIPTION_LENGTH} caracteres`,
      );
    }

    return description;
  }

  private static validAmount(
    value: number | null,
    variableAmount: boolean,
  ): number | null {
    if (value === null) {
      if (!variableAmount) {
        throw new FinanceValidationError(
          'Informe o valor, ou marque que ele muda todo mês',
        );
      }

      return null;
    }

    const valid =
      Number.isInteger(value) && value > 0 && value <= MAX_AMOUNT_IN_CENTS;

    if (!valid) {
      throw new FinanceValidationError(
        'O valor deve ser um número inteiro de centavos maior que zero',
      );
    }

    return value;
  }

  private static validDueDay(value: number): number {
    if (!Number.isInteger(value) || value < 1 || value > 31) {
      throw new FinanceValidationError(
        'O dia do vencimento deve ser de 1 a 31',
      );
    }

    return value;
  }
}
