export class ExpenseCategoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Categoria de gasto não encontrada: ${id}`);
    this.name = 'ExpenseCategoryNotFoundError';
  }
}
