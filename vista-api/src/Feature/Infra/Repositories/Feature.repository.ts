import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feature } from '../../Domain/Feature';
import { FeatureRepository } from '../../Domain/Repositories/Feature.repository';
import { FeatureMapper } from '../Mappers/Feature.mapper';
import { FeatureModel } from '../Models/Feature.model';

@Injectable()
export class TypeOrmFeatureRepository implements FeatureRepository {
  constructor(
    @InjectRepository(FeatureModel)
    private readonly repository: Repository<FeatureModel>,
  ) {}

  async findActive(): Promise<Feature[]> {
    const models = await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return FeatureMapper.arrayToDomain(models);
  }
}
