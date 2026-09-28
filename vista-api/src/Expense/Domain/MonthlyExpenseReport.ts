import { Expense } from './Expense';
import { ExpenseCategory } from './ExpenseCategory';
import { Month } from './Month';

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalInCents: number;
  previousTotalInCents: number;
  differenceInCents: number;
  /** Variação sobre o mês anterior; `null` quando o mês anterior foi zero. */
  change: number | null;
  /** Participação no total do mês; `null` quando o mês não teve gasto. */
  share: number | null;
}

export interface ReportEntry {
  expense: Expense;
  categoryName: string;
}

/** Divisão por zero não tem resposta numérica honesta: vira `null`, e a tela mostra "—". */
function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function sum(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amountInCents, 0);
}

function totalsByCategory(expenses: Expense[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    totals.set(
      expense.categoryId,
      (totals.get(expense.categoryId) ?? 0) + expense.amountInCents,
    );
  }

  return totals;
}

export class MonthlyExpenseReport {
  private _month: Month;
  private _totalInCents: number;
  private _previousTotalInCents: number;
  private _categories: CategoryBreakdown[];
  private _entries: ReportEntry[];

  constructor(
    month: Month,
    expenses: Expense[],
    previousExpenses: Expense[],
    categories: ExpenseCategory[],
  ) {
    const nameOf = ExpenseCategory.nameResolver(categories);
    const current = totalsByCategory(expenses);
    const previous = totalsByCategory(previousExpenses);

    this._month = month;
    this._totalInCents = sum(expenses);
    this._previousTotalInCents = sum(previousExpenses);

    // Entra toda categoria com gasto em qualquer um dos dois meses: sem isso,
    // uma despesa que zerou neste mês sumiria da comparação.
    const categoryIds = new Set([...current.keys(), ...previous.keys()]);

    this._categories = [...categoryIds]
      .map((categoryId) => {
        const total = current.get(categoryId) ?? 0;
        const previousTotal = previous.get(categoryId) ?? 0;

        return {
          categoryId,
          categoryName: nameOf(categoryId),
          totalInCents: total,
          previousTotalInCents: previousTotal,
          differenceInCents: total - previousTotal,
          change: ratio(total - previousTotal, previousTotal),
          share: ratio(total, this._totalInCents),
        };
      })
      .sort(
        (a, b) =>
          b.totalInCents - a.totalInCents ||
          b.previousTotalInCents - a.previousTotalInCents ||
          a.categoryName.localeCompare(b.categoryName, 'pt-BR'),
      );

    this._entries = [...expenses]
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      )
      .map((expense) => ({
        expense,
        categoryName: nameOf(expense.categoryId),
      }));
  }

  get month(): Month {
    return this._month;
  }

  get totalInCents(): number {
    return this._totalInCents;
  }

  get previousTotalInCents(): number {
    return this._previousTotalInCents;
  }

  get differenceInCents(): number {
    return this._totalInCents - this._previousTotalInCents;
  }

  get change(): number | null {
    return ratio(this.differenceInCents, this._previousTotalInCents);
  }

  /** Ordenadas do maior para o menor gasto no mês. */
  get categories(): readonly CategoryBreakdown[] {
    return this._categories;
  }

  /** Em ordem cronológica. */
  get entries(): readonly ReportEntry[] {
    return this._entries;
  }
}
