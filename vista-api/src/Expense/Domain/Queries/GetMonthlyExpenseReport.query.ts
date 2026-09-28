import { Month } from '../Month';
import { ExpenseDto } from './FindExpensesByMonth.query';

export const GET_MONTHLY_EXPENSE_REPORT_QUERY = Symbol(
  'GetMonthlyExpenseReportQuery',
);

export interface CategoryBreakdownDto {
  categoryId: string;
  categoryName: string;
  totalInCents: number;
  previousTotalInCents: number;
  differenceInCents: number;
  /** Fração (0.25 = 25%); `null` quando o mês anterior foi zero. */
  change: number | null;
  /** Fração do total do mês; `null` quando o mês não teve gasto. */
  share: number | null;
}

export interface MonthlyExpenseReportDto {
  /** AAAA-MM */
  month: string;
  totalInCents: number;
  previousTotalInCents: number;
  differenceInCents: number;
  /** Fração; `null` quando o mês anterior foi zero. */
  change: number | null;
  categories: CategoryBreakdownDto[];
  expenses: ExpenseDto[];
}

export interface GetMonthlyExpenseReportQuery {
  execute(month: Month): Promise<MonthlyExpenseReportDto>;
}
