import { NewExpense } from '../Expense';
import { ExpenseDto } from '../Queries/FindExpensesByMonth.query';

export const EXPENSE_SERVICE = Symbol('ExpenseService');

export type CreateExpenseInput = NewExpense;

/** Só os campos presentes são alterados. */
export type UpdateExpenseInput = Partial<NewExpense>;

export interface ExpenseService {
  create(input: CreateExpenseInput): Promise<ExpenseDto>;
  update(id: string, input: UpdateExpenseInput): Promise<ExpenseDto>;
  remove(id: string): Promise<void>;
}
