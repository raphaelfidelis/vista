import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import { FIND_EXPENSE_CATEGORIES_QUERY } from '../Domain/Queries/FindExpenseCategories.query';
import type {
  ExpenseCategoryDto,
  FindExpenseCategoriesQuery,
} from '../Domain/Queries/FindExpenseCategories.query';
import { EXPENSE_CATEGORY_SERVICE } from '../Domain/Services/ExpenseCategory.service';
import type {
  ExpenseCategoryInput,
  ExpenseCategoryService,
} from '../Domain/Services/ExpenseCategory.service';
import { ExpenseExceptionFilter } from './Expense.filter';
import { RequireJsonObjectPipe } from './RequireJsonObject.pipe';

@Controller('expenses/categories')
@UseFilters(ExpenseExceptionFilter)
export class ExpenseCategoryController {
  constructor(
    @Inject(FIND_EXPENSE_CATEGORIES_QUERY)
    private readonly findCategories: FindExpenseCategoriesQuery,
    @Inject(EXPENSE_CATEGORY_SERVICE)
    private readonly categories: ExpenseCategoryService,
  ) {}

  @Get()
  findAll(): Promise<ExpenseCategoryDto[]> {
    return this.findCategories.execute();
  }

  @Post()
  create(
    @Body(RequireJsonObjectPipe) input: ExpenseCategoryInput,
  ): Promise<ExpenseCategoryDto> {
    return this.categories.create(input);
  }

  @Patch(':id')
  rename(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(RequireJsonObjectPipe) input: ExpenseCategoryInput,
  ): Promise<ExpenseCategoryDto> {
    return this.categories.rename(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categories.remove(id);
  }
}
