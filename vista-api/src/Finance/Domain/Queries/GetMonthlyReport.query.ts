import { Month } from '../Month';
import { TransactionDto } from './FindTransactionsByMonth.query';

export const GET_MONTHLY_REPORT_QUERY = Symbol('GetMonthlyReportQuery');

export interface CategoryBreakdownDto {
  categoryId: string;
  categoryName: string;
  totalInCents: number;
  previousTotalInCents: number;
  differenceInCents: number;
  /** Fração (0.25 = 25%); nulo quando o mês anterior foi zero. */
  change: number | null;
  /** Fração do total do mês; nulo quando o mês não teve movimento do tipo. */
  share: number | null;
}

export interface MonthlyReportDto {
  /** AAAA-MM */
  month: string;
  incomeInCents: number;
  expenseInCents: number;
  resultInCents: number;
  previousExpenseInCents: number;
  expenseDifferenceInCents: number;
  /** Fração; nulo quando o mês anterior foi zero. */
  expenseChange: number | null;
  /** Despesas vindas de gastos fixos. */
  fixedExpenseInCents: number;
  /** Despesas avulsas. */
  variableExpenseInCents: number;
  expenseCategories: CategoryBreakdownDto[];
  incomeCategories: CategoryBreakdownDto[];
  /** Em ordem cronológica; inclui transferências e ajustes. Compras no cartão entram pela fatura. */
  transactions: TransactionDto[];
  /**
   * Gastos fixos já lançados com data neste mês. Pode incluir fixos no cartão
   * que aparecem nas despesas da fatura seguinte.
   */
  launchedRecurringIds: string[];
}

export interface GetMonthlyReportQuery {
  execute(userId: string, month: Month): Promise<MonthlyReportDto>;
}
