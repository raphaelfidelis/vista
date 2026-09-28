import { ExpenseCategory } from '../../Domain/ExpenseCategory';
import { ExpenseCategoryDto } from '../../Domain/Queries/FindExpenseCategories.query';
import { ExpenseCategoryModel } from '../Models/ExpenseCategory.model';

export class ExpenseCategoryMapper {
  static toDomain(model: ExpenseCategoryModel): ExpenseCategory {
    return new ExpenseCategory(model.id, model.name, model.createdAt);
  }

  static arrayToDomain(models: ExpenseCategoryModel[]): ExpenseCategory[] {
    return models.map((model) => ExpenseCategoryMapper.toDomain(model));
  }

  static toModel(category: ExpenseCategory): ExpenseCategoryModel {
    const model = new ExpenseCategoryModel();
    model.id = category.id;
    model.name = category.name;
    model.createdAt = category.createdAt;

    return model;
  }

  static toDto(category: ExpenseCategory): ExpenseCategoryDto {
    return {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt.toISOString(),
    };
  }
}
