import { Inject, Injectable } from '@nestjs/common';
import { ExpenseCategoryAlreadyExistsError } from '../../Domain/Errors/ExpenseCategoryAlreadyExists.error';
import { ExpenseCategoryInUseError } from '../../Domain/Errors/ExpenseCategoryInUse.error';
import { ExpenseCategoryNotFoundError } from '../../Domain/Errors/ExpenseCategoryNotFound.error';
import { ExpenseCategory } from '../../Domain/ExpenseCategory';
import { ExpenseCategoryDto } from '../../Domain/Queries/FindExpenseCategories.query';
import type { ExpenseRepository } from '../../Domain/Repositories/Expense.repository';
import { EXPENSE_REPOSITORY } from '../../Domain/Repositories/Expense.repository';
import type { ExpenseCategoryRepository } from '../../Domain/Repositories/ExpenseCategory.repository';
import { EXPENSE_CATEGORY_REPOSITORY } from '../../Domain/Repositories/ExpenseCategory.repository';
import {
  ExpenseCategoryInput,
  ExpenseCategoryService,
} from '../../Domain/Services/ExpenseCategory.service';
import { ExpenseCategoryMapper } from '../Mappers/ExpenseCategory.mapper';

@Injectable()
export class ExpenseCategoryServiceImpl implements ExpenseCategoryService {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly categories: ExpenseCategoryRepository,
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenses: ExpenseRepository,
  ) {}

  async create({ name }: ExpenseCategoryInput): Promise<ExpenseCategoryDto> {
    const category = ExpenseCategory.create(name);
    await this.ensureNameIsFree(category);
    await this.categories.save(category);

    return ExpenseCategoryMapper.toDto(category);
  }

  async rename(
    id: string,
    { name }: ExpenseCategoryInput,
  ): Promise<ExpenseCategoryDto> {
    const category = await this.find(id);
    category.name = name;
    await this.ensureNameIsFree(category);
    await this.categories.save(category);

    return ExpenseCategoryMapper.toDto(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.find(id);

    if (await this.expenses.existsWithCategory(id)) {
      throw new ExpenseCategoryInUseError(category.name);
    }

    await this.categories.delete(id);
  }

  private async find(id: string): Promise<ExpenseCategory> {
    const category = await this.categories.findById(id);

    if (!category) {
      throw new ExpenseCategoryNotFoundError(id);
    }

    return category;
  }

  /** A própria categoria pode manter o nome (ou mudar só maiúsculas); outra não. */
  private async ensureNameIsFree(category: ExpenseCategory): Promise<void> {
    const existing = await this.categories.findByName(category.name);

    // O nome da existente, não o digitado: tentando "mercado", o útil é saber
    // que "Mercado" já existe.
    if (existing && existing.id !== category.id) {
      throw new ExpenseCategoryAlreadyExistsError(existing.name);
    }
  }
}
