import { Expense } from '../Expense';
import { Month } from '../Month';

export const EXPENSE_REPOSITORY = Symbol('ExpenseRepository');

export interface ExpenseRepository {
  findByMonth(month: Month): Promise<Expense[]>;
  findById(id: string): Promise<Expense | null>;
  existsWithCategory(categoryId: string): Promise<boolean>;
  save(expense: Expense): Promise<void>;
  delete(id: string): Promise<void>;
}
