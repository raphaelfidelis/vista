import { Inject, Injectable } from '@nestjs/common';
import {
  FeatureDto,
  FindActiveFeaturesQuery,
} from '../../Domain/Queries/FindActiveFeatures.query';
import type { FeatureRepository } from '../../Domain/Repositories/Feature.repository';
import { FEATURE_REPOSITORY } from '../../Domain/Repositories/Feature.repository';

@Injectable()
export class TypeOrmFindActiveFeaturesQuery implements FindActiveFeaturesQuery {
  constructor(
    @Inject(FEATURE_REPOSITORY)
    private readonly repository: FeatureRepository,
  ) {}

  async execute(): Promise<FeatureDto[]> {
    const features = await this.repository.findActive();

    const response: FeatureDto[] = features.map((feature) => {
      return {
        id: feature.id,
        name: feature.name,
        description: feature.description,
        icon: feature.icon,
        isActive: feature.isActive,
        createdAt: feature.createdAt.toISOString(),
      };
    });

    return response;
  }
}
