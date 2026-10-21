import { Inject, Injectable } from '@nestjs/common';
import { BudgetLimit } from '../../Domain/BudgetLimit';
import { BudgetOverride } from '../../Domain/BudgetOverride';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { Month } from '../../Domain/Month';
import type { BudgetRepository } from '../../Domain/Repositories/Budget.repository';
import { BUDGET_REPOSITORY } from '../../Domain/Repositories/Budget.repository';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import { BudgetService } from '../../Domain/Services/Budget.service';

@Injectable()
export class BudgetServiceImpl implements BudgetService {
  constructor(
    @Inject(BUDGET_REPOSITORY)
    private readonly budgets: BudgetRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async setLimit(
    userId: string,
    categoryId: string,
    amountInCents: number,
  ): Promise<void> {
    const limit = new BudgetLimit(userId, categoryId, amountInCents);
    await this.ensureExpenseCategory(userId, categoryId);
    await this.budgets.saveLimit(limit);
  }

  async removeLimit(userId: string, categoryId: string): Promise<void> {
    if (!(await this.budgets.findLimit(userId, categoryId))) {
      throw new FinanceNotFoundError('Orçamento não encontrado: ' + categoryId);
    }

    await this.budgets.deleteLimit(userId, categoryId);
  }

  async setOverride(
    userId: string,
    categoryId: string,
    month: string,
    amountInCents: number,
  ): Promise<void> {
    const override = new BudgetOverride(
      userId,
      categoryId,
      month,
      amountInCents,
    );
    await this.ensureExpenseCategory(userId, categoryId);
    await this.budgets.saveOverride(override);
  }

  async removeOverride(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<void> {
    const parsed = Month.parse(month);

    if (!(await this.budgets.findOverride(userId, categoryId, parsed))) {
      throw new FinanceNotFoundError(
        'Exceção de orçamento não encontrada: ' + categoryId + ' em ' + month,
      );
    }

    await this.budgets.deleteOverride(userId, categoryId, parsed);
  }

  /** Só categoria de despesa tem orçamento. */
  private async ensureExpenseCategory(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.categories.findById(userId, categoryId);

    if (!category) {
      throw new FinanceNotFoundError('Categoria não encontrada: ' + categoryId);
    }

    if (category.kind !== 'EXPENSE') {
      throw new FinanceValidationError(
        'A categoria "' +
          category.name +
          '" é de receita: só despesa tem orçamento',
      );
    }
  }
}
