import { Controller, Get, Inject } from '@nestjs/common';
import { FIND_ACTIVE_FEATURES_QUERY } from '../Domain/Queries/FindActiveFeatures.query';
import type {
  FeatureDto,
  FindActiveFeaturesQuery,
} from '../Domain/Queries/FindActiveFeatures.query';

@Controller('features')
export class FeatureController {
  constructor(
    @Inject(FIND_ACTIVE_FEATURES_QUERY)
    private readonly findActiveFeatures: FindActiveFeaturesQuery,
  ) {}

  @Get()
  findActive(): Promise<FeatureDto[]> {
    return this.findActiveFeatures.execute();
  }
}
