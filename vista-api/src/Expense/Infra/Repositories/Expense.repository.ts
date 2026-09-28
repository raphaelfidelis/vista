import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Expense } from '../../Domain/Expense';
import { Month } from '../../Domain/Month';
import { ExpenseRepository } from '../../Domain/Repositories/Expense.repository';
import { ExpenseMapper } from '../Mappers/Expense.mapper';
import { ExpenseModel } from '../Models/Expense.model';

@Injectable()
export class TypeOrmExpenseRepository implements ExpenseRepository {
  constructor(
    @InjectRepository(ExpenseModel)
    private readonly repository: Repository<ExpenseModel>,
  ) {}

  async findByMonth(month: Month): Promise<Expense[]> {
    const models = await this.repository.find({
      where: { date: Between(month.firstDay(), month.lastDay()) },
      order: { date: 'ASC', createdAt: 'ASC' },
    });

    return ExpenseMapper.arrayToDomain(models);
  }

  async findById(id: string): Promise<Expense | null> {
    const model = await this.repository.findOneBy({ id });

    return model ? ExpenseMapper.toDomain(model) : null;
  }

  existsWithCategory(categoryId: string): Promise<boolean> {
    return this.repository.existsBy({ categoryId });
  }

  async save(expense: Expense): Promise<void> {
    await this.repository.save(ExpenseMapper.toModel(expense));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
