import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Put,
  Query,
  UseFilters,
} from '@nestjs/common';
import { Month } from '../Domain/Month';
import { GET_MONTHLY_BUDGET_QUERY } from '../Domain/Queries/GetMonthlyBudget.query';
import type {
  GetMonthlyBudgetQuery,
  MonthlyBudgetDto,
} from '../Domain/Queries/GetMonthlyBudget.query';
import { BUDGET_SERVICE } from '../Domain/Services/Budget.service';
import type { BudgetService } from '../Domain/Services/Budget.service';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

interface BudgetAmountInput {
  amountInCents: number;
}

@Controller('budgets')
@UseFilters(FinanceExceptionFilter)
export class BudgetController {
  constructor(
    @Inject(GET_MONTHLY_BUDGET_QUERY)
    private readonly getBudget: GetMonthlyBudgetQuery,
    @Inject(BUDGET_SERVICE)
    private readonly budgets: BudgetService,
  ) {}

  @Get()
  findByMonth(
    @CurrentUserId() userId: string,
    @Query('month') month: string,
  ): Promise<MonthlyBudgetDto> {
    return this.getBudget.execute(userId, Month.parse(month));
  }

  @Put(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  setLimit(
    @CurrentUserId() userId: string,
    @Param('categoryId') categoryId: string,
    @Body() input: BudgetAmountInput,
  ): Promise<void> {
    return this.budgets.setLimit(userId, categoryId, input.amountInCents);
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLimit(
    @CurrentUserId() userId: string,
    @Param('categoryId') categoryId: string,
  ): Promise<void> {
    return this.budgets.removeLimit(userId, categoryId);
  }

  @Put(':categoryId/months/:month')
  @HttpCode(HttpStatus.NO_CONTENT)
  setOverride(
    @CurrentUserId() userId: string,
    @Param('categoryId') categoryId: string,
    @Param('month') month: string,
    @Body() input: BudgetAmountInput,
  ): Promise<void> {
    return this.budgets.setOverride(
      userId,
      categoryId,
      month,
      input.amountInCents,
    );
  }

  @Delete(':categoryId/months/:month')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeOverride(
    @CurrentUserId() userId: string,
    @Param('categoryId') categoryId: string,
    @Param('month') month: string,
  ): Promise<void> {
    return this.budgets.removeOverride(userId, categoryId, month);
  }
}
