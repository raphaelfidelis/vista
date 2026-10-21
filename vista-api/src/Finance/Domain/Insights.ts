import { Card } from './Card';
import { currentInvoiceOf } from './CardInvoice';
import { Category } from './Category';
import { formatMoney } from './FormatMoney';
import { Month } from './Month';
import { Transaction } from './Transaction';

export type InsightKind = 'OVERDUE_INVOICE' | 'SPIKE' | 'SUBSCRIPTION';

export interface Insight {
  kind: InsightKind;
  title: string;
  detail: string;
  amountInCents: number;
  /** A categoria (pico) ou o cartão (fatura vencida) de que se trata; nulo na assinatura. */
  refId: string | null;
}

/** Gasto do mês acima de quantas vezes a média dos 3 meses anteriores. */
export const SPIKE_RATIO = 1.5;
/** E acima dela em pelo menos quanto: pico de centavos não interessa. */
export const SPIKE_MIN_CENTS = 5000;
/** Quanto o valor mensal de uma assinatura pode variar em torno da média. */
export const SUBSCRIPTION_TOLERANCE = 0.1;

const HISTORY_MONTHS = 3;

function normalize(description: string): string {
  return description.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** AAAA-MM → MM/AAAA. */
function monthLabel(month: string): string {
  return month.slice(5) + '/' + month.slice(0, 4);
}

function shortDate(isoDate: string): string {
  return isoDate.slice(8, 10) + '/' + isoDate.slice(5, 7);
}

/** Avisos determinísticos sobre o mês: fatura vencida, gasto fora do padrão e assinatura esquecida. */
export class Insights {
  private _alerts: Insight[];

  /** `transactions`: todos os lançamentos. `today`: AAAA-MM-DD. */
  constructor(
    month: Month,
    today: string,
    transactions: Transaction[],
    categories: Category[],
    cards: Card[],
  ) {
    const overdue = Insights.overdueInvoices(cards, transactions, today);
    const spikes = Insights.spikes(month, transactions, categories);
    const subscriptions = Insights.subscriptions(month, transactions);

    this._alerts = [...overdue, ...spikes, ...subscriptions].map(
      (entry) => entry.insight,
    );
  }

  private static overdueInvoices(
    cards: Card[],
    transactions: Transaction[],
    today: string,
  ): { insight: Insight }[] {
    return cards
      .flatMap((card) => {
        const invoice = currentInvoiceOf(card, transactions, today);

        return invoice.status === 'OVERDUE' ? [{ card, invoice }] : [];
      })
      .sort((a, b) => b.invoice.remainingInCents - a.invoice.remainingInCents)
      .map(({ card, invoice }) => ({
        insight: {
          kind: 'OVERDUE_INVOICE' as const,
          title: 'Fatura vencida: ' + card.name,
          detail:
            'A fatura de ' +
            monthLabel(invoice.month.toString()) +
            ' venceu em ' +
            shortDate(invoice.dueDate) +
            ' e faltam ' +
            formatMoney(invoice.remainingInCents) +
            '.',
          amountInCents: invoice.remainingInCents,
          refId: card.id,
        },
      }));
  }

  private static spikes(
    month: Month,
    transactions: Transaction[],
    categories: Category[],
  ): { insight: Insight }[] {
    const spent = (target: Month, categoryId: string): number =>
      transactions
        .filter(
          (transaction) =>
            transaction.kind === 'EXPENSE' &&
            transaction.categoryId === categoryId &&
            transaction.reportMonth === target.toString(),
        )
        .reduce((total, transaction) => total + transaction.amountInCents, 0);
    const found: { excess: number; insight: Insight }[] = [];

    for (const category of categories) {
      if (category.kind !== 'EXPENSE') {
        continue;
      }

      let previousTotal = 0;

      for (let back = 1; back <= HISTORY_MONTHS; back += 1) {
        previousTotal += spent(month.plus(-back), category.id);
      }

      const average = previousTotal / HISTORY_MONTHS;
      const current = spent(month, category.id);

      // Sem histórico não há padrão para fugir dele: a primeira vez não é pico.
      if (
        average > 0 &&
        current > average * SPIKE_RATIO &&
        current - average >= SPIKE_MIN_CENTS
      ) {
        found.push({
          excess: current - average,
          insight: {
            kind: 'SPIKE',
            title: 'Gasto alto em ' + category.name,
            detail:
              formatMoney(current) +
              ' no mês, contra uma média de ' +
              formatMoney(Math.round(average)) +
              ' nos ' +
              HISTORY_MONTHS +
              ' meses anteriores.',
            amountInCents: current,
            refId: category.id,
          },
        });
      }
    }

    return found.sort((a, b) => b.excess - a.excess);
  }

  /**
   * Despesa avulsa, de mesma descrição, em cada um dos 3 últimos meses e de
   * valor parecido: provável assinatura que não está cadastrada como fixo.
   * Compra parcelada se repete sem ser assinatura, então fica de fora.
   */
  private static subscriptions(
    month: Month,
    transactions: Transaction[],
  ): { insight: Insight }[] {
    const months = Array.from({ length: HISTORY_MONTHS }, (_, back) =>
      month.plus(-back).toString(),
    );
    const byDescription = new Map<
      string,
      { name: string; totals: Map<string, number> }
    >();

    for (const transaction of transactions) {
      if (
        transaction.kind !== 'EXPENSE' ||
        transaction.recurringId !== null ||
        transaction.purchaseId !== null ||
        !months.includes(transaction.reportMonth)
      ) {
        continue;
      }

      const key = normalize(transaction.description);
      const entry = byDescription.get(key) ?? {
        name: transaction.description.trim(),
        totals: new Map<string, number>(),
      };

      entry.totals.set(
        transaction.reportMonth,
        (entry.totals.get(transaction.reportMonth) ?? 0) +
          transaction.amountInCents,
      );
      byDescription.set(key, entry);
    }

    const found: { insight: Insight }[] = [];

    for (const { name, totals } of byDescription.values()) {
      if (totals.size < HISTORY_MONTHS) {
        continue;
      }

      const values = [...totals.values()];
      const average =
        values.reduce((total, value) => total + value, 0) / values.length;
      const stable = values.every(
        (value) =>
          Math.abs(value - average) <= average * SUBSCRIPTION_TOLERANCE,
      );

      if (stable) {
        found.push({
          insight: {
            kind: 'SUBSCRIPTION',
            title: 'Possível assinatura: ' + name,
            detail:
              'Aparece nos ' +
              HISTORY_MONTHS +
              ' últimos meses, por volta de ' +
              formatMoney(Math.round(average)) +
              ' por mês. Cadastre como gasto fixo para acompanhar.',
            amountInCents: Math.round(average),
            refId: null,
          },
        });
      }
    }

    return found.sort(
      (a, b) => b.insight.amountInCents - a.insight.amountInCents,
    );
  }

  /** Vencidas primeiro, depois gastos fora do padrão e, por fim, assinaturas. */
  get alerts(): readonly Insight[] {
    return this._alerts;
  }
}
