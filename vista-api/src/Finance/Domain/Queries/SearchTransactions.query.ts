import { TransactionFilters } from '../TransactionSearch';
import { TransactionDto } from './FindTransactionsByMonth.query';

export const SEARCH_TRANSACTIONS_QUERY = Symbol('SearchTransactionsQuery');

export const DEFAULT_SEARCH_LIMIT = 50;
export const MAX_SEARCH_LIMIT = 100;

export interface SearchPage {
  offset: number;
  limit: number;
}

export interface TransactionSearchDto {
  /** Quantos casam com os filtros, em todas as páginas. */
  total: number;
  /** Somas de todos os resultados, não só desta página. */
  incomeInCents: number;
  expenseInCents: number;
  /** Do mais novo para o mais antigo. */
  transactions: TransactionDto[];
}

export interface SearchTransactionsQuery {
  execute(
    userId: string,
    filters: TransactionFilters,
    page: SearchPage,
  ): Promise<TransactionSearchDto>;
}
