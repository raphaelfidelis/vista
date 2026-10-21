import { randomUUID } from 'node:crypto';
import { validSignedAmount } from './Amounts';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { MAX_NAME_LENGTH } from './Limits';
import { validIsoDate } from './IsoDate';
import { Transaction } from './Transaction';

export type AccountType = 'CHECKING' | 'CASH' | 'RESERVE';

export interface NewAccount {
  userId: string;
  name: string;
  type: AccountType;
  bankId?: string | null;
  /** Pode ser negativo (cheque especial). */
  initialBalanceInCents?: number;
  /** AAAA-MM-DD: lançamentos anteriores a ela já estão dentro do saldo inicial. */
  initialBalanceDate: string;
}

/** Corrente, dinheiro ou reserva. O saldo é calculado: saldo inicial + movimentos. */
export class Account {
  private _id: string;
  private _userId: string;
  private _name: string;
  private _type: AccountType;
  private _bankId: string | null;
  private _initialBalanceInCents: number;
  private _initialBalanceDate: string;
  private _archived: boolean;
  private _createdAt: Date;

  constructor(
    id: string,
    userId: string,
    name: string,
    type: AccountType,
    bankId: string | null,
    initialBalanceInCents: number,
    initialBalanceDate: string,
    archived: boolean,
    createdAt: Date,
  ) {
    this._id = id;
    this._userId = userId;
    this._name = Account.validName(name);
    this._type = type;
    this._bankId = bankId;
    this._initialBalanceInCents = validSignedAmount(initialBalanceInCents);
    this._initialBalanceDate = validIsoDate(initialBalanceDate);
    this._archived = archived;
    this._createdAt = createdAt;
  }

  static create({
    userId,
    name,
    type,
    bankId = null,
    initialBalanceInCents = 0,
    initialBalanceDate,
  }: NewAccount): Account {
    return new Account(
      randomUUID(),
      userId,
      name,
      type,
      bankId,
      initialBalanceInCents,
      initialBalanceDate,
      false,
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

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = Account.validName(name);
  }

  /** Imutável: uma reserva não vira corrente sem reescrever o que ela significa nos relatórios. */
  get type(): AccountType {
    return this._type;
  }

  get bankId(): string | null {
    return this._bankId;
  }

  set bankId(bankId: string | null) {
    this._bankId = bankId;
  }

  get initialBalanceInCents(): number {
    return this._initialBalanceInCents;
  }

  set initialBalanceInCents(value: number) {
    this._initialBalanceInCents = validSignedAmount(value);
  }

  get initialBalanceDate(): string {
    return this._initialBalanceDate;
  }

  set initialBalanceDate(value: string) {
    this._initialBalanceDate = validIsoDate(value);
  }

  get archived(): boolean {
    return this._archived;
  }

  set archived(archived: boolean) {
    this._archived = archived;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Quanto o lançamento move o saldo desta conta: 0 se não a envolve ou se é
   * anterior à data do saldo inicial (já está contado nele).
   */
  effectOf(transaction: Transaction): number {
    if (transaction.date < this._initialBalanceDate) {
      return 0;
    }

    const amount = transaction.amountInCents;

    if (transaction.toAccountId === this._id) {
      return amount;
    }

    if (transaction.accountId !== this._id) {
      return 0;
    }

    switch (transaction.kind) {
      case 'INCOME':
      case 'ADJUSTMENT':
        return amount;
      case 'EXPENSE':
      case 'TRANSFER':
        return -amount;
    }
  }

  balance(transactions: Transaction[]): number {
    return transactions.reduce(
      (total, transaction) => total + this.effectOf(transaction),
      this._initialBalanceInCents,
    );
  }

  private static validName(value: string): string {
    const name = value.trim();

    if (name === '') {
      throw new FinanceValidationError('O nome da conta é obrigatório');
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new FinanceValidationError(
        `O nome da conta deve ter até ${MAX_NAME_LENGTH} caracteres`,
      );
    }

    return name;
  }
}
