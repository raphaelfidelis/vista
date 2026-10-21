import { Month } from '../Month';
import { BudgetStatus } from '../MonthlyBudget';

export const GET_MONTHLY_BUDGET_QUERY = Symbol('GetMonthlyBudgetQuery');

export interface BudgetItemDto {
  categoryId: string;
  categoryName: string;
  /** O limite que vale neste mês: a exceção, se houver, senão o padrão. */
  limitInCents: number;
  /** Nulo quando a categoria só tem limite neste mês. */
  defaultLimitInCents: number | null;
  /** O limite deste mês é uma exceção. */
  isOverride: boolean;
  spentInCents: number;
  /** Negativo quando estourou. */
  remainingInCents: number;
  /** Gasto sobre o limite (1 = 100%). */
  ratio: number;
  status: BudgetStatus;
}

export interface UnbudgetedCategoryDto {
  categoryId: string;
  categoryName: string;
  spentInCents: number;
}

export interface MonthlyBudgetDto {
  /** AAAA-MM */
  month: string;
  totalLimitInCents: number;
  /** Só das categorias com limite. */
  totalSpentInCents: number;
  /** Do mais perto de estourar para o mais folgado. */
  items: BudgetItemDto[];
  /** Categorias de despesa sem limite neste mês. */
  unbudgeted: UnbudgetedCategoryDto[];
}

export interface GetMonthlyBudgetQuery {
  execute(userId: string, month: Month): Promise<MonthlyBudgetDto>;
}
