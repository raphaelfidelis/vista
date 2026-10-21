import { BudgetLimit } from './BudgetLimit';
import { BudgetOverride } from './BudgetOverride';
import { Category } from './Category';
import { Month } from './Month';

export type BudgetStatus = 'OK' | 'WARNING' | 'OVER';

/** A partir de quanto do limite gasto o orçamento passa a dar aviso. */
export const WARNING_RATIO = 0.8;

export interface BudgetItem {
  categoryId: string;
  categoryName: string;
  /** O limite que vale neste mês: a exceção, se houver, senão o padrão. */
  limitInCents: number;
  /** O limite padrão; nulo quando a categoria só tem limite neste mês. */
  defaultLimitInCents: number | null;
  /** O limite deste mês é uma exceção. */
  isOverride: boolean;
  spentInCents: number;
  /** Pode ser negativo: estourou o limite. */
  remainingInCents: number;
  /** Gasto sobre o limite (1 = 100%). */
  ratio: number;
  status: BudgetStatus;
}

export interface UnbudgetedCategory {
  categoryId: string;
  categoryName: string;
  spentInCents: number;
}

function statusOf(ratio: number): BudgetStatus {
  if (ratio > 1) {
    return 'OVER';
  }

  return ratio >= WARNING_RATIO ? 'WARNING' : 'OK';
}

/** Orçamento de um mês: cada categoria de despesa com limite, quanto já gastou e como está. */
export class MonthlyBudget {
  private _month: Month;
  private _items: BudgetItem[];
  private _unbudgeted: UnbudgetedCategory[];

  /**
   * `categories`: as categorias de despesa. `overrides`: só as exceções deste
   * mês. `spentByCategory`: o gasto do mês por categoria (cartão pela fatura).
   */
  constructor(
    month: Month,
    categories: Category[],
    limits: BudgetLimit[],
    overrides: BudgetOverride[],
    spentByCategory: ReadonlyMap<string, number>,
  ) {
    const defaults = new Map(
      limits.map((limit) => [limit.categoryId, limit.amountInCents]),
    );
    const exceptions = new Map(
      overrides.map((override) => [
        override.categoryId,
        override.amountInCents,
      ]),
    );

    this._month = month;
    this._items = [];
    this._unbudgeted = [];

    for (const category of categories) {
      const spent = spentByCategory.get(category.id) ?? 0;
      const defaultLimit = defaults.get(category.id) ?? null;
      const override = exceptions.get(category.id);
      const limit = override ?? defaultLimit;

      if (limit === null) {
        this._unbudgeted.push({
          categoryId: category.id,
          categoryName: category.name,
          spentInCents: spent,
        });
        continue;
      }

      const ratio = spent / limit;

      this._items.push({
        categoryId: category.id,
        categoryName: category.name,
        limitInCents: limit,
        defaultLimitInCents: defaultLimit,
        isOverride: override !== undefined,
        spentInCents: spent,
        remainingInCents: limit - spent,
        ratio,
        status: statusOf(ratio),
      });
    }

    this._items.sort(
      (a, b) =>
        b.ratio - a.ratio ||
        a.categoryName.localeCompare(b.categoryName, 'pt-BR'),
    );
    this._unbudgeted.sort(
      (a, b) =>
        b.spentInCents - a.spentInCents ||
        a.categoryName.localeCompare(b.categoryName, 'pt-BR'),
    );
  }

  get month(): Month {
    return this._month;
  }

  /** Do mais perto de estourar para o mais folgado. */
  get items(): readonly BudgetItem[] {
    return this._items;
  }

  /** Categorias de despesa sem limite neste mês, das que mais gastaram para as que menos. */
  get unbudgeted(): readonly UnbudgetedCategory[] {
    return this._unbudgeted;
  }

  get totalLimitInCents(): number {
    return this._items.reduce((total, item) => total + item.limitInCents, 0);
  }

  /** Só o gasto das categorias que têm limite. */
  get totalSpentInCents(): number {
    return this._items.reduce((total, item) => total + item.spentInCents, 0);
  }
}
