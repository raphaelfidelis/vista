import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../../Domain/Goal';
import { GoalRepository } from '../../Domain/Repositories/Goal.repository';
import { GoalMapper } from '../Mappers/Goal.mapper';
import { GoalModel } from '../Models/Goal.model';

@Injectable()
export class TypeOrmGoalRepository implements GoalRepository {
  constructor(
    @InjectRepository(GoalModel)
    private readonly repository: Repository<GoalModel>,
  ) {}

  async findAll(userId: string): Promise<Goal[]> {
    const models = await this.repository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    return GoalMapper.arrayToDomain(models);
  }

  async findById(userId: string, id: string): Promise<Goal | null> {
    const model = await this.repository.findOneBy({ userId, id });

    return model ? GoalMapper.toDomain(model) : null;
  }

  async findByAccount(userId: string, accountId: string): Promise<Goal | null> {
    const model = await this.repository.findOneBy({ userId, accountId });

    return model ? GoalMapper.toDomain(model) : null;
  }

  existsWithAccount(userId: string, accountId: string): Promise<boolean> {
    return this.repository.existsBy({ userId, accountId });
  }

  async save(goal: Goal): Promise<void> {
    await this.repository.save(GoalMapper.toModel(goal));
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }
}
