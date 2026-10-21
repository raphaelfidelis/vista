import { Inject, Injectable } from '@nestjs/common';
import { Month } from '../../Domain/Month';
import { MonthlyBudget } from '../../Domain/MonthlyBudget';
import { MonthlyReport } from '../../Domain/MonthlyReport';
import {
  GetMonthlyBudgetQuery,
  MonthlyBudgetDto,
} from '../../Domain/Queries/GetMonthlyBudget.query';
import type { BudgetRepository } from '../../Domain/Repositories/Budget.repository';
import { BUDGET_REPOSITORY } from '../../Domain/Repositories/Budget.repository';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';

@Injectable()
export class GetMonthlyBudgetHandler implements GetMonthlyBudgetQuery {
  constructor(
    @Inject(BUDGET_REPOSITORY)
    private readonly budgets: BudgetRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
  ) {}

  async execute(userId: string, month: Month): Promise<MonthlyBudgetDto> {
    const [limits, overrides, categories, allCategories, transactions] =
      await Promise.all([
        this.budgets.findLimits(userId),
        this.budgets.findOverrides(userId, month),
        this.categories.findAll(userId, 'EXPENSE'),
        this.categories.findAll(userId),
        this.transactions.findByMonth(userId, month),
      ]);
    // O gasto do mês é o do relatório (cartão pela fatura): uma regra só.
    const report = new MonthlyReport(month, transactions, [], allCategories);
    const spent = new Map(
      report.expenseCategories.map((item) => [
        item.categoryId,
        item.totalInCents,
      ]),
    );
    const budget = new MonthlyBudget(
      month,
      categories,
      limits,
      overrides,
      spent,
    );

    return {
      month: budget.month.toString(),
      totalLimitInCents: budget.totalLimitInCents,
      totalSpentInCents: budget.totalSpentInCents,
      items: budget.items.map((item) => ({ ...item })),
      unbudgeted: budget.unbudgeted.map((item) => ({ ...item })),
    };
  }
}
