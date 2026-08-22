export const FIND_ACTIVE_FEATURES_QUERY = Symbol('FindActiveFeaturesQuery');

export interface FeatureDto {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface FindActiveFeaturesQuery {
  execute(): Promise<FeatureDto[]>;
}
