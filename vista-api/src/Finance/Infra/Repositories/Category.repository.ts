import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryKind } from '../../Domain/Category';
import { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CategoryMapper } from '../Mappers/Category.mapper';
import { CategoryModel } from '../Models/Category.model';

@Injectable()
export class TypeOrmCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryModel)
    private readonly repository: Repository<CategoryModel>,
  ) {}

  async findAll(userId: string, kind?: CategoryKind): Promise<Category[]> {
    const models = await this.repository.find({
      where: kind === undefined ? { userId } : { userId, kind },
      order: { name: 'ASC' },
    });

    return CategoryMapper.arrayToDomain(models);
  }

  async findById(userId: string, id: string): Promise<Category | null> {
    const model = await this.repository.findOneBy({ userId, id });

    return model ? CategoryMapper.toDomain(model) : null;
  }

  async findByName(
    userId: string,
    name: string,
    kind: CategoryKind,
  ): Promise<Category | null> {
    // Igualdade com LOWER, e não ILIKE: no ILIKE, "%" e "_" no nome virariam curinga.
    const model = await this.repository
      .createQueryBuilder('category')
      .where(
        'category.userId = :userId AND LOWER(category.name) = LOWER(:name)',
        { userId, name },
      )
      .andWhere('category.kind = :kind', { kind })
      .getOne();

    return model ? CategoryMapper.toDomain(model) : null;
  }

  async save(category: Category): Promise<void> {
    await this.repository.save(CategoryMapper.toModel(category));
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }
}
