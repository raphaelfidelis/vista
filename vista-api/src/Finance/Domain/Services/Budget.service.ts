export const BUDGET_SERVICE = Symbol('BudgetService');

export interface BudgetService {
  /** Define (ou troca) o limite padrão de uma categoria de despesa. */
  setLimit(
    userId: string,
    categoryId: string,
    amountInCents: number,
  ): Promise<void>;
  removeLimit(userId: string, categoryId: string): Promise<void>;
  /** Define (ou troca) o limite de uma categoria só num mês (AAAA-MM). */
  setOverride(
    userId: string,
    categoryId: string,
    month: string,
    amountInCents: number,
  ): Promise<void>;
  removeOverride(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<void>;
}
