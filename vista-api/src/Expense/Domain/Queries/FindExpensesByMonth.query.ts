import { Month } from '../Month';

export const FIND_EXPENSES_BY_MONTH_QUERY = Symbol('FindExpensesByMonthQuery');

export interface ExpenseDto {
  id: string;
  description: string;
  amountInCents: number;
  /** AAAA-MM-DD */
  date: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
}

export interface FindExpensesByMonthQuery {
  /** Em ordem cronológica. */
  execute(month: Month): Promise<ExpenseDto[]>;
}
