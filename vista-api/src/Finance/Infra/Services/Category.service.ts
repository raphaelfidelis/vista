import { Inject, Injectable } from '@nestjs/common';
import { Category } from '../../Domain/Category';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { CategoryDto } from '../../Domain/Queries/FindCategories.query';
import type { BudgetRepository } from '../../Domain/Repositories/Budget.repository';
import { BUDGET_REPOSITORY } from '../../Domain/Repositories/Budget.repository';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import type { RecurringRepository } from '../../Domain/Repositories/Recurring.repository';
import { RECURRING_REPOSITORY } from '../../Domain/Repositories/Recurring.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import {
  CategoryService,
  CreateCategoryInput,
  RenameCategoryInput,
} from '../../Domain/Services/Category.service';
import { CategoryMapper } from '../Mappers/Category.mapper';

@Injectable()
export class CategoryServiceImpl implements CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(RECURRING_REPOSITORY)
    private readonly recurring: RecurringRepository,
    @Inject(BUDGET_REPOSITORY)
    private readonly budgets: BudgetRepository,
  ) {}

  async create(
    userId: string,
    input: CreateCategoryInput,
  ): Promise<CategoryDto> {
    const category = Category.create({ ...input, userId });
    await this.ensureNameIsFree(userId, category);
    await this.categories.save(category);

    return CategoryMapper.toDto(category);
  }

  async rename(
    userId: string,
    id: string,
    { name }: RenameCategoryInput,
  ): Promise<CategoryDto> {
    const category = await this.find(userId, id);
    category.name = name;
    await this.ensureNameIsFree(userId, category);
    await this.categories.save(category);

    return CategoryMapper.toDto(category);
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.find(userId, id);

    if (
      (await this.transactions.existsWithCategory(userId, id)) ||
      (await this.recurring.existsWithCategory(userId, id)) ||
      (await this.budgets.existsWithCategory(userId, id))
    ) {
      throw new FinanceInUseError(
        'A categoria "' +
          category.name +
          '" está em uso por lançamentos, gastos fixos ou orçamento e não pode ser removida',
      );
    }

    await this.categories.delete(userId, id);
  }

  private async find(userId: string, id: string): Promise<Category> {
    const category = await this.categories.findById(userId, id);

    if (!category) {
      throw new FinanceNotFoundError('Categoria não encontrada: ' + id);
    }

    return category;
  }

  /** A própria categoria pode manter o nome (ou mudar só maiúsculas); outra do mesmo tipo não. */
  private async ensureNameIsFree(
    userId: string,
    category: Category,
  ): Promise<void> {
    const existing = await this.categories.findByName(
      userId,
      category.name,
      category.kind,
    );

    // O nome da existente, não o digitado: tentando "mercado", o útil é saber
    // que "Mercado" já existe.
    if (existing && existing.id !== category.id) {
      throw new FinanceDuplicateError(
        'Já existe uma categoria chamada "' + existing.name + '"',
      );
    }
  }
}
