import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringRepository } from '../../Domain/Repositories/Recurring.repository';
import { Recurring } from '../../Domain/Recurring';
import { RecurringMapper } from '../Mappers/Recurring.mapper';
import { RecurringModel } from '../Models/Recurring.model';

@Injectable()
export class TypeOrmRecurringRepository implements RecurringRepository {
  constructor(
    @InjectRepository(RecurringModel)
    private readonly repository: Repository<RecurringModel>,
  ) {}

  async findAll(userId: string): Promise<Recurring[]> {
    const models = await this.repository.find({
      where: { userId },
      order: { dueDay: 'ASC', description: 'ASC' },
    });

    return RecurringMapper.arrayToDomain(models);
  }

  async findById(userId: string, id: string): Promise<Recurring | null> {
    const model = await this.repository.findOneBy({ userId, id });

    return model ? RecurringMapper.toDomain(model) : null;
  }

  existsWithCategory(userId: string, categoryId: string): Promise<boolean> {
    return this.repository.existsBy({ userId, categoryId });
  }

  existsWithAccount(userId: string, accountId: string): Promise<boolean> {
    return this.repository.existsBy({ userId, accountId });
  }

  existsWithCard(userId: string, cardId: string): Promise<boolean> {
    return this.repository.existsBy({ userId, cardId });
  }

  async save(recurring: Recurring): Promise<void> {
    await this.repository.save(RecurringMapper.toModel(recurring));
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }
}
