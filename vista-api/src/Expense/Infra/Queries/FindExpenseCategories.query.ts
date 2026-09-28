import { Inject, Injectable } from '@nestjs/common';
import {
  ExpenseCategoryDto,
  FindExpenseCategoriesQuery,
} from '../../Domain/Queries/FindExpenseCategories.query';
import type { ExpenseCategoryRepository } from '../../Domain/Repositories/ExpenseCategory.repository';
import { EXPENSE_CATEGORY_REPOSITORY } from '../../Domain/Repositories/ExpenseCategory.repository';
import { ExpenseCategoryMapper } from '../Mappers/ExpenseCategory.mapper';

@Injectable()
export class FindExpenseCategoriesHandler implements FindExpenseCategoriesQuery {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly categories: ExpenseCategoryRepository,
  ) {}

  async execute(): Promise<ExpenseCategoryDto[]> {
    const categories = await this.categories.findAll();

    return categories.map((category) => ExpenseCategoryMapper.toDto(category));
  }
}
