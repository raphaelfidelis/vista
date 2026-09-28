export class ExpenseCategoryInUseError extends Error {
  constructor(name: string) {
    super(`A categoria "${name}" tem gastos e não pode ser removida`);
    this.name = 'ExpenseCategoryInUseError';
  }
}
