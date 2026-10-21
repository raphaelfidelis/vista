import { Card } from './Card';
import { Month } from './Month';
import { Transaction } from './Transaction';

export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE';

function sum(transactions: Transaction[]): number {
  return transactions.reduce(
    (total, transaction) => total + transaction.amountInCents,
    0,
  );
}

function chronological(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
}

/**
 * Fatura de um cartão num mês (o do vencimento). O que sobrar de faturas
 * anteriores entra no total: pagar menos que o total rola o saldo adiante.
 */
export class CardInvoice {
  private _month: Month;
  private _closingDate: string;
  private _dueDate: string;
  private _charges: Transaction[];
  private _payments: Transaction[];
  private _previousBalanceInCents: number;
  private _status: InvoiceStatus;

  /**
   * `transactions`: todos os lançamentos do cartão, em qualquer fatura.
   * `today`: AAAA-MM-DD, para decidir se a fatura já fechou ou venceu.
   */
  constructor(
    card: Card,
    month: Month,
    transactions: Transaction[],
    today: string,
  ) {
    const key = month.toString();
    const charges = transactions.filter(
      (t) => t.kind === 'EXPENSE' && t.cardId === card.id,
    );
    const payments = transactions.filter(
      (t) => t.kind === 'TRANSFER' && t.toCardId === card.id,
    );
    const before = (t: Transaction) => (t.invoiceMonth ?? '') < key;
    const here = (t: Transaction) => t.invoiceMonth === key;

    this._month = month;
    this._closingDate = card.closingDateOf(key);
    this._dueDate = card.dueDateOf(key);
    this._charges = chronological(charges.filter(here));
    this._payments = chronological(payments.filter(here));
    this._previousBalanceInCents =
      sum(charges.filter(before)) - sum(payments.filter(before));
    this._status = this.statusOn(today);
  }

  private statusOn(today: string): InvoiceStatus {
    if (today < this._closingDate) {
      return 'OPEN';
    }

    if (this.remainingInCents <= 0) {
      return 'PAID';
    }

    return today > this._dueDate ? 'OVERDUE' : 'CLOSED';
  }

  get month(): Month {
    return this._month;
  }

  get closingDate(): string {
    return this._closingDate;
  }

  get dueDate(): string {
    return this._dueDate;
  }

  get status(): InvoiceStatus {
    return this._status;
  }

  /** Pode ser negativo: crédito de pagamento a mais. */
  get previousBalanceInCents(): number {
    return this._previousBalanceInCents;
  }

  get chargesInCents(): number {
    return sum(this._charges);
  }

  get paymentsInCents(): number {
    return sum(this._payments);
  }

  get totalInCents(): number {
    return this._previousBalanceInCents + this.chargesInCents;
  }

  get remainingInCents(): number {
    return this.totalInCents - this.paymentsInCents;
  }

  /** Compras da fatura, em ordem cronológica. */
  get charges(): readonly Transaction[] {
    return this._charges;
  }

  /** Pagamentos que quitam esta fatura, em ordem cronológica. */
  get payments(): readonly Transaction[] {
    return this._payments;
  }
}

/**
 * A fatura que importa agora: a anterior, se ainda falta pagar (fechada ou
 * vencida); senão a que está aberta, onde caem as compras de hoje.
 */
export function currentInvoiceOf(
  card: Card,
  transactions: Transaction[],
  today: string,
): CardInvoice {
  const open = Month.parse(card.invoiceMonthFor(today));
  const previous = new CardInvoice(card, open.plus(-1), transactions, today);

  return previous.status === 'CLOSED' || previous.status === 'OVERDUE'
    ? previous
    : new CardInvoice(card, open, transactions, today);
}
