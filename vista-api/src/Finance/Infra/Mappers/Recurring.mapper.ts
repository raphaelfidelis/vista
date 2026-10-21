import { RecurringDto } from '../../Domain/Queries/FindRecurring.query';
import { Recurring } from '../../Domain/Recurring';
import { RecurringModel } from '../Models/Recurring.model';

export class RecurringMapper {
  static toDomain(model: RecurringModel): Recurring {
    return new Recurring(
      model.id,
      model.userId,
      model.description,
      model.kind,
      model.categoryId,
      model.accountId,
      model.cardId,
      model.amountInCents,
      model.variableAmount,
      model.dueDay,
      model.active,
      model.createdAt,
    );
  }

  static arrayToDomain(models: RecurringModel[]): Recurring[] {
    return models.map((model) => RecurringMapper.toDomain(model));
  }

  static toModel(recurring: Recurring): RecurringModel {
    const model = new RecurringModel();
    model.id = recurring.id;
    model.userId = recurring.userId;
    model.description = recurring.description;
    model.kind = recurring.kind;
    model.categoryId = recurring.categoryId;
    model.accountId = recurring.accountId;
    model.cardId = recurring.cardId;
    model.amountInCents = recurring.amountInCents;
    model.variableAmount = recurring.variableAmount;
    model.dueDay = recurring.dueDay;
    model.active = recurring.active;
    model.createdAt = recurring.createdAt;

    return model;
  }

  /** Os nomes vêm de fora: o gasto fixo só conhece os ids. */
  static toDto(
    recurring: Recurring,
    names: {
      category: string;
      account: string | null;
      card: string | null;
    },
  ): RecurringDto {
    return {
      id: recurring.id,
      description: recurring.description,
      kind: recurring.kind,
      categoryId: recurring.categoryId,
      categoryName: names.category,
      accountId: recurring.accountId,
      accountName: names.account,
      cardId: recurring.cardId,
      cardName: names.card,
      amountInCents: recurring.amountInCents,
      variableAmount: recurring.variableAmount,
      dueDay: recurring.dueDay,
      active: recurring.active,
      createdAt: recurring.createdAt.toISOString(),
    };
  }
}
