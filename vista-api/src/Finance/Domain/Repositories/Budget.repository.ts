import { BudgetLimit } from '../BudgetLimit';
import { BudgetOverride } from '../BudgetOverride';
import { Month } from '../Month';

export const BUDGET_REPOSITORY = Symbol('BudgetRepository');

export interface BudgetRepository {
  findLimits(userId: string): Promise<BudgetLimit[]>;
  findLimit(userId: string, categoryId: string): Promise<BudgetLimit | null>;
  /** Só as exceções do mês. */
  findOverrides(userId: string, month: Month): Promise<BudgetOverride[]>;
  findOverride(
    userId: string,
    categoryId: string,
    month: Month,
  ): Promise<BudgetOverride | null>;
  /** Tem limite padrão ou alguma exceção. */
  existsWithCategory(userId: string, categoryId: string): Promise<boolean>;
  /** Cria ou troca o limite padrão da categoria. */
  saveLimit(limit: BudgetLimit): Promise<void>;
  deleteLimit(userId: string, categoryId: string): Promise<void>;
  /** Cria ou troca a exceção da categoria no mês. */
  saveOverride(override: BudgetOverride): Promise<void>;
  deleteOverride(
    userId: string,
    categoryId: string,
    month: Month,
  ): Promise<void>;
}
