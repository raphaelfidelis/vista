import { Month } from '../Month';
import { TransactionDto } from './FindTransactionsByMonth.query';
import { InvoiceSummaryDto } from './FindCards.query';

export const GET_CARD_INVOICE_QUERY = Symbol('GetCardInvoiceQuery');

export interface CardInvoiceDto extends InvoiceSummaryDto {
  cardId: string;
  /** O que sobrou de faturas anteriores; negativo = crédito. */
  previousBalanceInCents: number;
  chargesInCents: number;
  paymentsInCents: number;
  /** Compras da fatura, em ordem cronológica. */
  charges: TransactionDto[];
  /** Pagamentos que quitam a fatura, em ordem cronológica. */
  payments: TransactionDto[];
}

export interface GetCardInvoiceQuery {
  execute(
    userId: string,
    cardId: string,
    month: Month,
  ): Promise<CardInvoiceDto>;
}
