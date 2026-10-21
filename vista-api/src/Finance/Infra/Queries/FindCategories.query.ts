import { Inject, Injectable } from '@nestjs/common';
import { CategoryKind } from '../../Domain/Category';
import {
  CategoryDto,
  FindCategoriesQuery,
} from '../../Domain/Queries/FindCategories.query';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import { CategoryMapper } from '../Mappers/Category.mapper';

@Injectable()
export class FindCategoriesHandler implements FindCategoriesQuery {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async execute(userId: string, kind?: CategoryKind): Promise<CategoryDto[]> {
    const categories = await this.categories.findAll(userId, kind);

    return categories.map((category) => CategoryMapper.toDto(category));
  }
}
