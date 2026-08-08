import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureController } from './Controllers/Feature.controller';
import { FIND_ACTIVE_FEATURES_QUERY } from './Domain/Queries/FindActiveFeatures.query';
import { FEATURE_REPOSITORY } from './Domain/Repositories/Feature.repository';
import { FeatureModel } from './Infra/Models/Feature.model';
import { TypeOrmFindActiveFeaturesQuery } from './Infra/Queries/FindActiveFeatures.query';
import { TypeOrmFeatureRepository } from './Infra/Repositories/Feature.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureModel])],
  controllers: [FeatureController],
  providers: [
    {
      provide: FEATURE_REPOSITORY,
      useClass: TypeOrmFeatureRepository,
    },
    {
      provide: FIND_ACTIVE_FEATURES_QUERY,
      useClass: TypeOrmFindActiveFeaturesQuery,
    },
  ],
})
export class FeatureModule {}
