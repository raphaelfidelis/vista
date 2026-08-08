import { Feature } from '../Feature';

export const FEATURE_REPOSITORY = Symbol('FeatureRepository');

export interface FeatureRepository {
  findActive(): Promise<Feature[]>;
}
