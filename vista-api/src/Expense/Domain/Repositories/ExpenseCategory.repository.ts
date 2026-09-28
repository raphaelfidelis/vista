import { ExpenseCategory } from '../ExpenseCategory';

export const EXPENSE_CATEGORY_REPOSITORY = Symbol('ExpenseCategoryRepository');

export interface ExpenseCategoryRepository {
  findAll(): Promise<ExpenseCategory[]>;
  findById(id: string): Promise<ExpenseCategory | null>;
  /** Sem diferenciar maiúsculas de minúsculas: "Mercado" e "mercado" são o mesmo nome. */
  findByName(name: string): Promise<ExpenseCategory | null>;
  save(category: ExpenseCategory): Promise<void>;
  delete(id: string): Promise<void>;
}
