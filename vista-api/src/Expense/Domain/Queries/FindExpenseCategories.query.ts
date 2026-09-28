export const FIND_EXPENSE_CATEGORIES_QUERY = Symbol(
  'FindExpenseCategoriesQuery',
);

export interface ExpenseCategoryDto {
  id: string;
  name: string;
  createdAt: string;
}

export interface FindExpenseCategoriesQuery {
  execute(): Promise<ExpenseCategoryDto[]>;
}
