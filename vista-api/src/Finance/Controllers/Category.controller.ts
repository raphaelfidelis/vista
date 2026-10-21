import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import type { CategoryKind } from '../Domain/Category';
import { FIND_CATEGORIES_QUERY } from '../Domain/Queries/FindCategories.query';
import type {
  CategoryDto,
  FindCategoriesQuery,
} from '../Domain/Queries/FindCategories.query';
import { CATEGORY_SERVICE } from '../Domain/Services/Category.service';
import type {
  CategoryService,
  CreateCategoryInput,
  RenameCategoryInput,
} from '../Domain/Services/Category.service';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('categories')
@UseFilters(FinanceExceptionFilter)
export class CategoryController {
  constructor(
    @Inject(FIND_CATEGORIES_QUERY)
    private readonly findCategories: FindCategoriesQuery,
    @Inject(CATEGORY_SERVICE)
    private readonly categories: CategoryService,
  ) {}

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Query('kind') kind?: CategoryKind,
  ): Promise<CategoryDto[]> {
    return this.findCategories.execute(userId, kind);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() input: CreateCategoryInput,
  ): Promise<CategoryDto> {
    return this.categories.create(userId, input);
  }

  @Patch(':id')
  rename(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() input: RenameCategoryInput,
  ): Promise<CategoryDto> {
    return this.categories.rename(userId, id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.categories.remove(userId, id);
  }
}
