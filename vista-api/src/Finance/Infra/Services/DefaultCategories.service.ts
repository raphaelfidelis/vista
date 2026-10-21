import { Inject, Injectable } from '@nestjs/common';
import { AccountSetup } from '../../../Auth/Domain/Services/AccountSetup';
import { Category } from '../../Domain/Category';
import { DEFAULT_CATEGORIES } from '../../Domain/DefaultCategories';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';

/** Conta nova nasce com as categorias padrão. Pula as que já existirem com o mesmo nome. */
@Injectable()
export class DefaultCategoriesSetup implements AccountSetup {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
  ) {}

  async prepare(userId: string): Promise<void> {
    for (const { kind, name } of DEFAULT_CATEGORIES) {
      if (await this.categories.findByName(userId, name, kind)) {
        continue;
      }

      await this.categories.save(Category.create({ userId, name, kind }));
    }
  }
}
