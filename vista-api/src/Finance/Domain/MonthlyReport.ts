import { Category } from './Category';
import { Month } from './Month';
import { nameResolver } from './NameResolver';
import { Transaction, TransactionKind } from './Transaction';

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalInCents: number;
  previousTotalInCents: number;
  differenceInCents: number;
  /** Variação sobre o mês anterior; `null` quando o mês anterior foi zero. */
  change: number | null;
  /** Participação no total do mês; `null` quando o mês não teve movimento do tipo. */
  share: number | null;
}

/** Divisão por zero não tem resposta numérica honesta: vira `null`, e a tela mostra "—". */
function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function ofKind(
  transactions: Transaction[],
  kind: TransactionKind,
): Transaction[] {
  return transactions.filter((transaction) => transaction.kind === kind);
}

function sum(transactions: Transaction[]): number {
  return transactions.reduce(
    (total, transaction) => total + transaction.amountInCents,
    0,
  );
}

function totalsByCategory(transactions: Transaction[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    const categoryId = transaction.categoryId;

    if (categoryId !== null) {
      totals.set(
        categoryId,
        (totals.get(categoryId) ?? 0) + transaction.amountInCents,
      );
    }
  }

  return totals;
}

export class MonthlyReport {
  private _month: Month;
  private _incomeInCents: number;
  private _expenseInCents: number;
  private _previousExpenseInCents: number;
  private _fixedExpenseInCents: number;
  private _expenseCategories: CategoryBreakdown[];
  private _incomeCategories: CategoryBreakdown[];
  private _transactions: Transaction[];

  /**
   * `transactions` e `previousTransactions` são o que conta em cada mês (a
   * consulta já decide); só despesa e receita entram nos totais — transferência
   * e ajuste apenas movem dinheiro entre contas.
   */
  constructor(
    month: Month,
    transactions: Transaction[],
    previousTransactions: Transaction[],
    categories: Category[],
  ) {
    const nameOf = nameResolver('categoria', categories);
    const expenses = ofKind(transactions, 'EXPENSE');
    const incomes = ofKind(transactions, 'INCOME');
    const previousExpenses = ofKind(previousTransactions, 'EXPENSE');
    const previousIncomes = ofKind(previousTransactions, 'INCOME');

    this._month = month;
    this._incomeInCents = sum(incomes);
    this._expenseInCents = sum(expenses);
    this._previousExpenseInCents = sum(previousExpenses);
    this._fixedExpenseInCents = sum(
      expenses.filter((expense) => expense.recurringId !== null),
    );
    this._expenseCategories = MonthlyReport.breakdown(
      expenses,
      previousExpenses,
      nameOf,
    );
    this._incomeCategories = MonthlyReport.breakdown(
      incomes,
      previousIncomes,
      nameOf,
    );
    this._transactions = [...transactions].sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  /**
   * Entra toda categoria com movimento em qualquer um dos dois meses: sem isso,
   * uma despesa que zerou neste mês sumiria da comparação.
   */
  private static breakdown(
    current: Transaction[],
    previous: Transaction[],
    nameOf: (id: string) => string,
  ): CategoryBreakdown[] {
    const currentTotals = totalsByCategory(current);
    const previousTotals = totalsByCategory(previous);
    const monthTotal = sum(current);
    const categoryIds = new Set([
      ...currentTotals.keys(),
      ...previousTotals.keys(),
    ]);

    return [...categoryIds]
      .map((categoryId) => {
        const total = currentTotals.get(categoryId) ?? 0;
        const previousTotal = previousTotals.get(categoryId) ?? 0;

        return {
          categoryId,
          categoryName: nameOf(categoryId),
          totalInCents: total,
          previousTotalInCents: previousTotal,
          differenceInCents: total - previousTotal,
          change: ratio(total - previousTotal, previousTotal),
          share: ratio(total, monthTotal),
        };
      })
      .sort(
        (a, b) =>
          b.totalInCents - a.totalInCents ||
          b.previousTotalInCents - a.previousTotalInCents ||
          a.categoryName.localeCompare(b.categoryName, 'pt-BR'),
      );
  }

  get month(): Month {
    return this._month;
  }

  get incomeInCents(): number {
    return this._incomeInCents;
  }

  get expenseInCents(): number {
    return this._expenseInCents;
  }

  get resultInCents(): number {
    return this._incomeInCents - this._expenseInCents;
  }

  get previousExpenseInCents(): number {
    return this._previousExpenseInCents;
  }

  get expenseDifferenceInCents(): number {
    return this._expenseInCents - this._previousExpenseInCents;
  }

  get expenseChange(): number | null {
    return ratio(this.expenseDifferenceInCents, this._previousExpenseInCents);
  }

  get fixedExpenseInCents(): number {
    return this._fixedExpenseInCents;
  }

  get variableExpenseInCents(): number {
    return this._expenseInCents - this._fixedExpenseInCents;
  }

  /** Do maior para o menor gasto no mês. */
  get expenseCategories(): readonly CategoryBreakdown[] {
    return this._expenseCategories;
  }

  /** Da maior para a menor receita no mês. */
  get incomeCategories(): readonly CategoryBreakdown[] {
    return this._incomeCategories;
  }

  /** Em ordem cronológica. */
  get transactions(): readonly Transaction[] {
    return this._transactions;
  }
}
