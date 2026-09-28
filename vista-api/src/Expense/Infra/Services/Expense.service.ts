import { Inject, Injectable } from '@nestjs/common';
import { ExpenseCategoryNotFoundError } from '../../Domain/Errors/ExpenseCategoryNotFound.error';
import { ExpenseNotFoundError } from '../../Domain/Errors/ExpenseNotFound.error';
import { Expense } from '../../Domain/Expense';
import { ExpenseCategory } from '../../Domain/ExpenseCategory';
import { ExpenseDto } from '../../Domain/Queries/FindExpensesByMonth.query';
import type { ExpenseRepository } from '../../Domain/Repositories/Expense.repository';
import { EXPENSE_REPOSITORY } from '../../Domain/Repositories/Expense.repository';
import type { ExpenseCategoryRepository } from '../../Domain/Repositories/ExpenseCategory.repository';
import { EXPENSE_CATEGORY_REPOSITORY } from '../../Domain/Repositories/ExpenseCategory.repository';
import {
  CreateExpenseInput,
  ExpenseService,
  UpdateExpenseInput,
} from '../../Domain/Services/Expense.service';
import { ExpenseMapper } from '../Mappers/Expense.mapper';

@Injectable()
export class ExpenseServiceImpl implements ExpenseService {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenses: ExpenseRepository,
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly categories: ExpenseCategoryRepository,
  ) {}

  async create(input: CreateExpenseInput): Promise<ExpenseDto> {
    // Valida antes de consultar o banco: um id malformado nem chega à query.
    const expense = Expense.create(input);
    const category = await this.findCategory(expense.categoryId);
    await this.expenses.save(expense);

    return ExpenseMapper.toDto(expense, category.name);
  }

  async update(id: string, input: UpdateExpenseInput): Promise<ExpenseDto> {
    const expense = await this.find(id);

    if (input.description !== undefined) {
      expense.description = input.description;
    }

    if (input.amountInCents !== undefined) {
      expense.amountInCents = input.amountInCents;
    }

    if (input.date !== undefined) {
      expense.date = input.date;
    }

    if (input.categoryId !== undefined) {
      expense.categoryId = input.categoryId;
    }

    const category = await this.findCategory(expense.categoryId);
    await this.expenses.save(expense);

    return ExpenseMapper.toDto(expense, category.name);
  }

  async remove(id: string): Promise<void> {
    await this.find(id);
    await this.expenses.delete(id);
  }

  private async find(id: string): Promise<Expense> {
    const expense = await this.expenses.findById(id);

    if (!expense) {
      throw new ExpenseNotFoundError(id);
    }

    return expense;
  }

  private async findCategory(id: string): Promise<ExpenseCategory> {
    const category = await this.categories.findById(id);

    if (!category) {
      throw new ExpenseCategoryNotFoundError(id);
    }

    return category;
  }
}
