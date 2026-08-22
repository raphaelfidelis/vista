import { Feature } from '../../Domain/Feature';
import { FeatureModel } from '../Models/Feature.model';

export class FeatureMapper {
  static toDomain(model: FeatureModel): Feature {
    return new Feature(
      model.id,
      model.name,
      model.description,
      model.icon,
      model.isActive,
      model.createdAt,
    );
  }

  static arrayToDomain(models: FeatureModel[]): Feature[] {
    return models.map((model) => FeatureMapper.toDomain(model));
  }
}
