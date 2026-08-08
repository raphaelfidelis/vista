export const FIND_ACTIVE_FEATURES_QUERY = Symbol('FindActiveFeaturesQuery');

export interface FeatureDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface FindActiveFeaturesQuery {
  execute(): Promise<FeatureDto[]>;
}
