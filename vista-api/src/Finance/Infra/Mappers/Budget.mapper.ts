import { BudgetLimit } from '../../Domain/BudgetLimit';
import { BudgetOverride } from '../../Domain/BudgetOverride';
import { BudgetLimitModel } from '../Models/BudgetLimit.model';
import { BudgetOverrideModel } from '../Models/BudgetOverride.model';

export class BudgetMapper {
  static limitToDomain(model: BudgetLimitModel): BudgetLimit {
    return new BudgetLimit(model.userId, model.categoryId, model.amountInCents);
  }

  static limitToModel(limit: BudgetLimit): BudgetLimitModel {
    const model = new BudgetLimitModel();
    model.userId = limit.userId;
    model.categoryId = limit.categoryId;
    model.amountInCents = limit.amountInCents;

    return model;
  }

  static overrideToDomain(model: BudgetOverrideModel): BudgetOverride {
    return new BudgetOverride(
      model.userId,
      model.categoryId,
      model.month,
      model.amountInCents,
    );
  }

  static overrideToModel(override: BudgetOverride): BudgetOverrideModel {
    const model = new BudgetOverrideModel();
    model.userId = override.userId;
    model.categoryId = override.categoryId;
    model.month = override.month;
    model.amountInCents = override.amountInCents;

    return model;
  }
}
