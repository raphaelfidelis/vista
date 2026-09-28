import { Inject, Injectable } from '@nestjs/common';
import { ExpenseCategory } from '../../Domain/ExpenseCategory';
import { Month } from '../../Domain/Month';
import {
  ExpenseDto,
  FindExpensesByMonthQuery,
} from '../../Domain/Queries/FindExpensesByMonth.query';
import type { ExpenseRepository } from '../../Domain/Repositories/Expense.repository';
import { EXPENSE_REPOSITORY } from '../../Domain/Repositories/Expense.repository';
import type { ExpenseCategoryRepository } from '../../Domain/Repositories/ExpenseCategory.repository';
import { EXPENSE_CATEGORY_REPOSITORY } from '../../Domain/Repositories/ExpenseCategory.repository';
import { ExpenseMapper } from '../Mappers/Expense.mapper';

@Injectable()
export class FindExpensesByMonthHandler implements FindExpensesByMonthQuery {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenses: ExpenseRepository,
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly categories: ExpenseCategoryRepository,
  ) {}

  async execute(month: Month): Promise<ExpenseDto[]> {
    const [expenses, categories] = await Promise.all([
      this.expenses.findByMonth(month),
      this.categories.findAll(),
    ]);
    const nameOf = ExpenseCategory.nameResolver(categories);

    return expenses.map((expense) =>
      ExpenseMapper.toDto(expense, nameOf(expense.categoryId)),
    );
  }
}
