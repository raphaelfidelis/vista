import { Category } from '../../Domain/Category';
import { CategoryDto } from '../../Domain/Queries/FindCategories.query';
import { CategoryModel } from '../Models/Category.model';

export class CategoryMapper {
  static toDomain(model: CategoryModel): Category {
    return new Category(
      model.id,
      model.userId,
      model.name,
      model.kind,
      model.createdAt,
    );
  }

  static arrayToDomain(models: CategoryModel[]): Category[] {
    return models.map((model) => CategoryMapper.toDomain(model));
  }

  static toModel(category: Category): CategoryModel {
    const model = new CategoryModel();
    model.id = category.id;
    model.userId = category.userId;
    model.name = category.name;
    model.kind = category.kind;
    model.createdAt = category.createdAt;

    return model;
  }

  static toDto(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      kind: category.kind,
      createdAt: category.createdAt.toISOString(),
    };
  }
}
