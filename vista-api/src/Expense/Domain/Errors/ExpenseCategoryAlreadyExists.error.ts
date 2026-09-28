export class ExpenseCategoryAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Já existe uma categoria de gasto chamada "${name}"`);
    this.name = 'ExpenseCategoryAlreadyExistsError';
  }
}
