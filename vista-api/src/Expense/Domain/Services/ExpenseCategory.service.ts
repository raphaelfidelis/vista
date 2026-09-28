import { ExpenseCategoryDto } from '../Queries/FindExpenseCategories.query';

export const EXPENSE_CATEGORY_SERVICE = Symbol('ExpenseCategoryService');

export interface ExpenseCategoryInput {
  name: string;
}

export interface ExpenseCategoryService {
  create(input: ExpenseCategoryInput): Promise<ExpenseCategoryDto>;
  rename(id: string, input: ExpenseCategoryInput): Promise<ExpenseCategoryDto>;
  /** Recusa remover categoria que ainda tem gastos. */
  remove(id: string): Promise<void>;
}
