import { Month } from '../Month';
import { TransactionKind } from '../Transaction';

export const FIND_TRANSACTIONS_BY_MONTH_QUERY = Symbol(
  'FindTransactionsByMonthQuery',
);

export interface TransactionDto {
  id: string;
  kind: TransactionKind;
  description: string;
  /** Positivo; no ajuste, com o sinal da correção. Na parcela, o valor dela. */
  amountInCents: number;
  /** AAAA-MM-DD; na compra no cartão, a data da compra. */
  date: string;
  categoryId: string | null;
  categoryName: string | null;
  /** Nulo na despesa no cartão. */
  accountId: string | null;
  accountName: string | null;
  /** Só na despesa no cartão. */
  cardId: string | null;
  cardName: string | null;
  toAccountId: string | null;
  toAccountName: string | null;
  /** Só no pagamento de fatura. */
  toCardId: string | null;
  toCardName: string | null;
  /** AAAA-MM (vencimento) da fatura da compra, ou da que o pagamento quita. */
  invoiceMonth: string | null;
  purchaseId: string | null;
  installmentNumber: number | null;
  installmentCount: number | null;
  /** Nulo para lançamento avulso (variável). */
  recurringId: string | null;
  createdAt: string;
}

export interface FindTransactionsByMonthQuery {
  /** Os que contam no mês, em ordem cronológica. */
  execute(userId: string, month: Month): Promise<TransactionDto[]>;
}
