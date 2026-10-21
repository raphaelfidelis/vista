import { Account } from './Account';
import { Card } from './Card';
import { CardInvoice } from './CardInvoice';
import { CategoryKind } from './Category';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Month } from './Month';
import { Recurring } from './Recurring';
import { Transaction } from './Transaction';

export const DEFAULT_MONTHS = 6;
export const MAX_MONTHS = 12;

export interface CashFlowItem {
  description: string;
  kind: CategoryKind;
  amountInCents: number;
  /** O valor é uma estimativa: o gasto fixo muda todo mês (vale a referência, ou zero). */
  estimated: boolean;
}

export interface CashFlowMonth {
  /** AAAA-MM */
  month: string;
  openingInCents: number;
  incomeInCents: number;
  expenseInCents: number;
  closingInCents: number;
  /** De onde vêm as entradas e saídas previstas, das entradas para as saídas e do maior para o menor valor. */
  items: CashFlowItem[];
}

/**
 * Saldo do dia a dia mês a mês, a partir do mês atual: o que já está lançado
 * está no saldo de partida; o que falta vem dos gastos fixos ainda não
 * lançados e das faturas dos cartões.
 */
export class CashFlowProjection {
  private _months: CashFlowMonth[];

  /**
   * `transactions`: todos os lançamentos. `today`: AAAA-MM-DD. O saldo de
   * partida soma as contas correntes e de dinheiro ativas (reservas ficam de fora).
   */
  constructor(
    today: string,
    months: number,
    accounts: Account[],
    cards: Card[],
    recurring: Recurring[],
    transactions: Transaction[],
  ) {
    if (!Number.isInteger(months) || months < 1 || months > MAX_MONTHS) {
      throw new FinanceValidationError(
        'Projete de 1 a ' + MAX_MONTHS + ' meses',
      );
    }

    const first = Month.parse(today.slice(0, 7));
    const window = Array.from({ length: months }, (_, index) =>
      first.plus(index),
    );
    const items = new Map<string, CashFlowItem[]>(
      window.map((month) => [month.toString(), []]),
    );

    this.addPendingRecurring(items, window, cards, recurring, transactions);
    this.addInvoices(items, window, cards, transactions, today);

    let opening = accounts
      .filter((account) => !account.archived && account.type !== 'RESERVE')
      .reduce((total, account) => total + account.balance(transactions), 0);

    this._months = window.map((month) => {
      const monthItems = (items.get(month.toString()) ?? []).sort(
        (a, b) =>
          Number(b.kind === 'INCOME') - Number(a.kind === 'INCOME') ||
          b.amountInCents - a.amountInCents,
      );
      const income = CashFlowProjection.total(monthItems, 'INCOME');
      const expense = CashFlowProjection.total(monthItems, 'EXPENSE');
      const projected: CashFlowMonth = {
        month: month.toString(),
        openingInCents: opening,
        incomeInCents: income,
        expenseInCents: expense,
        closingInCents: opening + income - expense,
        items: monthItems,
      };

      opening = projected.closingInCents;

      return projected;
    });
  }

  private static total(items: CashFlowItem[], kind: CategoryKind): number {
    return items
      .filter((item) => item.kind === kind)
      .reduce((total, item) => total + item.amountInCents, 0);
  }

  /**
   * Gasto fixo ativo sem lançamento com data no mês. Na conta, entra no mês;
   * no cartão, entra na fatura em que a compra cairia (e é paga quando ela vence).
   */
  private addPendingRecurring(
    items: Map<string, CashFlowItem[]>,
    window: Month[],
    cards: Card[],
    recurring: Recurring[],
    transactions: Transaction[],
  ): void {
    for (const month of window) {
      const launched = new Set(
        transactions
          .filter(
            (transaction) =>
              transaction.recurringId !== null &&
              transaction.date.startsWith(month.toString()),
          )
          .map((transaction) => transaction.recurringId),
      );

      for (const item of recurring) {
        if (!item.active || launched.has(item.id)) {
          continue;
        }

        const base = {
          kind: item.kind,
          amountInCents: item.amountInCents ?? 0,
          estimated: item.variableAmount,
        };
        const card =
          item.cardId === null
            ? undefined
            : cards.find((candidate) => candidate.id === item.cardId);

        if (card === undefined) {
          items
            .get(month.toString())
            ?.push({ ...base, description: item.description });
        } else {
          const invoice = card.invoiceMonthFor(item.dueDateIn(month));

          items.get(invoice)?.push({
            ...base,
            description: item.description + ' (' + card.name + ')',
          });
        }
      }
    }
  }

  /**
   * O que falta de cada fatura sai da conta no mês do vencimento. No primeiro
   * mês vale o restante inteiro (inclui faturas antigas em aberto). Nos
   * seguintes só o que a fatura tem de seu: o saldo que ela herda de faturas
   * anteriores já foi contado no mês delas, e contar de novo dobraria a dívida.
   */
  private addInvoices(
    items: Map<string, CashFlowItem[]>,
    window: Month[],
    cards: Card[],
    transactions: Transaction[],
    today: string,
  ): void {
    for (const [index, month] of window.entries()) {
      for (const card of cards) {
        const invoice = new CardInvoice(card, month, transactions, today);
        const owed =
          index === 0
            ? invoice.remainingInCents
            : invoice.chargesInCents - invoice.paymentsInCents;

        if (owed > 0) {
          items.get(month.toString())?.push({
            description: 'Fatura ' + card.name,
            kind: 'EXPENSE',
            amountInCents: owed,
            estimated: false,
          });
        }
      }
    }
  }

  get months(): readonly CashFlowMonth[] {
    return this._months;
  }
}
