import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseCategory } from '../../Domain/ExpenseCategory';
import { ExpenseCategoryRepository } from '../../Domain/Repositories/ExpenseCategory.repository';
import { ExpenseCategoryMapper } from '../Mappers/ExpenseCategory.mapper';
import { ExpenseCategoryModel } from '../Models/ExpenseCategory.model';

@Injectable()
export class TypeOrmExpenseCategoryRepository implements ExpenseCategoryRepository {
  constructor(
    @InjectRepository(ExpenseCategoryModel)
    private readonly repository: Repository<ExpenseCategoryModel>,
  ) {}

  async findAll(): Promise<ExpenseCategory[]> {
    const models = await this.repository.find({ order: { name: 'ASC' } });

    return ExpenseCategoryMapper.arrayToDomain(models);
  }

  async findById(id: string): Promise<ExpenseCategory | null> {
    const model = await this.repository.findOneBy({ id });

    return model ? ExpenseCategoryMapper.toDomain(model) : null;
  }

  async findByName(name: string): Promise<ExpenseCategory | null> {
    // Igualdade com LOWER, e não ILIKE: no ILIKE, "%" e "_" no nome virariam curinga.
    const model = await this.repository
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name })
      .getOne();

    return model ? ExpenseCategoryMapper.toDomain(model) : null;
  }

  async save(category: ExpenseCategory): Promise<void> {
    await this.repository.save(ExpenseCategoryMapper.toModel(category));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
