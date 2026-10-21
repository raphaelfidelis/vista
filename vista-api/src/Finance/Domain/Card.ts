import { randomUUID } from 'node:crypto';
import { MAX_AMOUNT_IN_CENTS } from './Amounts';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { MAX_NAME_LENGTH } from './Limits';
import { Month } from './Month';
import { Transaction } from './Transaction';

export interface NewCard {
  userId: string;
  name: string;
  bankId?: string | null;
  /** Dia do fechamento da fatura, de 1 a 31. */
  closingDay: number;
  /** Dia do vencimento da fatura, de 1 a 31. */
  dueDay: number;
  limitInCents?: number | null;
}

export interface CardUsage {
  /** Compras ainda não pagas: todas as cobranças menos todos os pagamentos. */
  usedInCents: number;
  /** Limite menos o usado; nulo quando o cartão não tem limite. */
  availableInCents: number | null;
}

/**
 * Cartão de crédito. A fatura é identificada pelo mês do vencimento (AAAA-MM).
 * Uma compra feita no dia do fechamento já cai na fatura seguinte.
 */
export class Card {
  private _id: string;
  private _userId: string;
  private _name: string;
  private _bankId: string | null;
  private _closingDay: number;
  private _dueDay: number;
  private _limitInCents: number | null;
  private _archived: boolean;
  private _createdAt: Date;

  constructor(
    id: string,
    userId: string,
    name: string,
    bankId: string | null,
    closingDay: number,
    dueDay: number,
    limitInCents: number | null,
    archived: boolean,
    createdAt: Date,
  ) {
    this._id = id;
    this._userId = userId;
    this._name = Card.validName(name);
    this._bankId = bankId;
    this._closingDay = Card.validDay(closingDay, 'fechamento');
    this._dueDay = Card.validDay(dueDay, 'vencimento');
    this._limitInCents = Card.validLimit(limitInCents);
    this._archived = archived;
    this._createdAt = createdAt;
  }

  static create({
    userId,
    name,
    bankId = null,
    closingDay,
    dueDay,
    limitInCents = null,
  }: NewCard): Card {
    return new Card(
      randomUUID(),
      userId,
      name,
      bankId,
      closingDay,
      dueDay,
      limitInCents,
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
    this._name = Card.validName(name);
  }

  get bankId(): string | null {
    return this._bankId;
  }

  set bankId(bankId: string | null) {
    this._bankId = bankId;
  }

  get closingDay(): number {
    return this._closingDay;
  }

  /** Mudar o dia não recalcula as compras já lançadas. */
  set closingDay(day: number) {
    this._closingDay = Card.validDay(day, 'fechamento');
  }

  get dueDay(): number {
    return this._dueDay;
  }

  set dueDay(day: number) {
    this._dueDay = Card.validDay(day, 'vencimento');
  }

  get limitInCents(): number | null {
    return this._limitInCents;
  }

  set limitInCents(limit: number | null) {
    this._limitInCents = Card.validLimit(limit);
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

  /** Fatura (mês do vencimento, AAAA-MM) em que uma compra de `date` (AAAA-MM-DD) cai. */
  invoiceMonthFor(date: string): string {
    const purchaseMonth = Month.parse(date.slice(0, 7));
    const day = Number(date.slice(8, 10));
    const closing = Math.min(
      this._closingDay,
      Number(purchaseMonth.lastDay().slice(-2)),
    );
    // Dia do fechamento: já é da fatura seguinte.
    const closesIn = day < closing ? purchaseMonth : purchaseMonth.plus(1);

    // Vence no mesmo mês do fechamento se o vencimento vem depois dele.
    return (
      this._dueDay > this._closingDay ? closesIn : closesIn.plus(1)
    ).toString();
  }

  /** AAAA-MM-DD em que a fatura do mês fecha. */
  closingDateOf(invoiceMonth: string): string {
    const month = Month.parse(invoiceMonth);
    const closesIn = this._dueDay > this._closingDay ? month : month.plus(-1);

    return closesIn.dateOn(this._closingDay);
  }

  /** AAAA-MM-DD em que a fatura do mês vence. */
  dueDateOf(invoiceMonth: string): string {
    return Month.parse(invoiceMonth).dateOn(this._dueDay);
  }

  /** `transactions`: todos os lançamentos do cartão (compras e pagamentos), em qualquer fatura. */
  usage(transactions: Transaction[]): CardUsage {
    let used = 0;

    for (const transaction of transactions) {
      if (transaction.kind === 'EXPENSE' && transaction.cardId === this._id) {
        used += transaction.amountInCents;
      } else if (
        transaction.kind === 'TRANSFER' &&
        transaction.toCardId === this._id
      ) {
        used -= transaction.amountInCents;
      }
    }

    return {
      usedInCents: used,
      availableInCents:
        this._limitInCents === null ? null : this._limitInCents - used,
    };
  }

  private static validName(value: string): string {
    const name = value.trim();

    if (name === '') {
      throw new FinanceValidationError('O nome do cartão é obrigatório');
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new FinanceValidationError(
        `O nome do cartão deve ter até ${MAX_NAME_LENGTH} caracteres`,
      );
    }

    return name;
  }

  private static validDay(value: number, label: string): number {
    if (!Number.isInteger(value) || value < 1 || value > 31) {
      throw new FinanceValidationError(`O dia do ${label} deve ser de 1 a 31`);
    }

    return value;
  }

  private static validLimit(value: number | null): number | null {
    if (value === null) {
      return null;
    }

    if (!Number.isInteger(value) || value <= 0 || value > MAX_AMOUNT_IN_CENTS) {
      throw new FinanceValidationError(
        'O limite deve ser um número inteiro de centavos maior que zero',
      );
    }

    return value;
  }
}
