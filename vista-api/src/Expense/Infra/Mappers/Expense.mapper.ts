import { Expense } from '../../Domain/Expense';
import { ExpenseDto } from '../../Domain/Queries/FindExpensesByMonth.query';
import { ExpenseModel } from '../Models/Expense.model';

export class ExpenseMapper {
  static toDomain(model: ExpenseModel): Expense {
    return new Expense(
      model.id,
      model.description,
      model.amountInCents,
      model.date,
      model.categoryId,
      model.createdAt,
    );
  }

  static arrayToDomain(models: ExpenseModel[]): Expense[] {
    return models.map((model) => ExpenseMapper.toDomain(model));
  }

  static toModel(expense: Expense): ExpenseModel {
    const model = new ExpenseModel();
    model.id = expense.id;
    model.description = expense.description;
    model.amountInCents = expense.amountInCents;
    model.date = expense.date;
    model.categoryId = expense.categoryId;
    model.createdAt = expense.createdAt;

    return model;
  }

  /** O nome da categoria vem de fora: o gasto só conhece o id dela. */
  static toDto(expense: Expense, categoryName: string): ExpenseDto {
    return {
      id: expense.id,
      description: expense.description,
      amountInCents: expense.amountInCents,
      date: expense.date,
      categoryId: expense.categoryId,
      categoryName,
      createdAt: expense.createdAt.toISOString(),
    };
  }
}
