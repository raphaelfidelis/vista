import { Inject, Injectable } from '@nestjs/common';
import { Month } from '../../Domain/Month';
import { MonthlyExpenseReport } from '../../Domain/MonthlyExpenseReport';
import {
  GetMonthlyExpenseReportQuery,
  MonthlyExpenseReportDto,
} from '../../Domain/Queries/GetMonthlyExpenseReport.query';
import type { ExpenseRepository } from '../../Domain/Repositories/Expense.repository';
import { EXPENSE_REPOSITORY } from '../../Domain/Repositories/Expense.repository';
import type { ExpenseCategoryRepository } from '../../Domain/Repositories/ExpenseCategory.repository';
import { EXPENSE_CATEGORY_REPOSITORY } from '../../Domain/Repositories/ExpenseCategory.repository';
import { ExpenseMapper } from '../Mappers/Expense.mapper';

@Injectable()
export class GetMonthlyExpenseReportHandler implements GetMonthlyExpenseReportQuery {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenses: ExpenseRepository,
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly categories: ExpenseCategoryRepository,
  ) {}

  async execute(month: Month): Promise<MonthlyExpenseReportDto> {
    const [expenses, previousExpenses, categories] = await Promise.all([
      this.expenses.findByMonth(month),
      this.expenses.findByMonth(month.previous()),
      this.categories.findAll(),
    ]);
    const report = new MonthlyExpenseReport(
      month,
      expenses,
      previousExpenses,
      categories,
    );

    return {
      month: report.month.toString(),
      totalInCents: report.totalInCents,
      previousTotalInCents: report.previousTotalInCents,
      differenceInCents: report.differenceInCents,
      change: report.change,
      categories: report.categories.map((category) => ({ ...category })),
      expenses: report.entries.map(({ expense, categoryName }) =>
        ExpenseMapper.toDto(expense, categoryName),
      ),
    };
  }
}
