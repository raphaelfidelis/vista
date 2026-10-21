import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetLimit } from '../../Domain/BudgetLimit';
import { BudgetOverride } from '../../Domain/BudgetOverride';
import { Month } from '../../Domain/Month';
import { BudgetRepository } from '../../Domain/Repositories/Budget.repository';
import { BudgetMapper } from '../Mappers/Budget.mapper';
import { BudgetLimitModel } from '../Models/BudgetLimit.model';
import { BudgetOverrideModel } from '../Models/BudgetOverride.model';

@Injectable()
export class TypeOrmBudgetRepository implements BudgetRepository {
  constructor(
    @InjectRepository(BudgetLimitModel)
    private readonly limits: Repository<BudgetLimitModel>,
    @InjectRepository(BudgetOverrideModel)
    private readonly overrides: Repository<BudgetOverrideModel>,
  ) {}

  async findLimits(userId: string): Promise<BudgetLimit[]> {
    const models = await this.limits.find({ where: { userId } });

    return models.map((model) => BudgetMapper.limitToDomain(model));
  }

  async findLimit(
    userId: string,
    categoryId: string,
  ): Promise<BudgetLimit | null> {
    const model = await this.limits.findOneBy({ userId, categoryId });

    return model ? BudgetMapper.limitToDomain(model) : null;
  }

  async findOverrides(userId: string, month: Month): Promise<BudgetOverride[]> {
    const models = await this.overrides.find({
      where: { userId, month: month.toString() },
    });

    return models.map((model) => BudgetMapper.overrideToDomain(model));
  }

  async findOverride(
    userId: string,
    categoryId: string,
    month: Month,
  ): Promise<BudgetOverride | null> {
    const model = await this.overrides.findOneBy({
      userId,
      categoryId,
      month: month.toString(),
    });

    return model ? BudgetMapper.overrideToDomain(model) : null;
  }

  async existsWithCategory(
    userId: string,
    categoryId: string,
  ): Promise<boolean> {
    return (
      (await this.limits.existsBy({ userId, categoryId })) ||
      (await this.overrides.existsBy({ userId, categoryId }))
    );
  }

  async saveLimit(limit: BudgetLimit): Promise<void> {
    await this.limits.save(BudgetMapper.limitToModel(limit));
  }

  async deleteLimit(userId: string, categoryId: string): Promise<void> {
    await this.limits.delete({ userId, categoryId });
  }

  async saveOverride(override: BudgetOverride): Promise<void> {
    await this.overrides.save(BudgetMapper.overrideToModel(override));
  }

  async deleteOverride(
    userId: string,
    categoryId: string,
    month: Month,
  ): Promise<void> {
    await this.overrides.delete({
      userId,
      categoryId,
      month: month.toString(),
    });
  }
}
