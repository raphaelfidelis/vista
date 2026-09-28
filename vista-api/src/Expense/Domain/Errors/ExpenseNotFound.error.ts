export class ExpenseNotFoundError extends Error {
  constructor(id: string) {
    super(`Gasto não encontrado: ${id}`);
    this.name = 'ExpenseNotFoundError';
  }
}
