import { Account } from '../../Domain/Account';
import { Goal } from '../../Domain/Goal';
import { GoalProgress } from '../../Domain/GoalProgress';
import { GoalDto } from '../../Domain/Queries/FindGoals.query';
import { Transaction } from '../../Domain/Transaction';
import { GoalModel } from '../Models/Goal.model';

export class GoalMapper {
  static toDomain(model: GoalModel): Goal {
    return new Goal(
      model.id,
      model.userId,
      model.name,
      model.targetInCents,
      model.deadline,
      model.accountId,
      model.createdAt,
    );
  }

  static arrayToDomain(models: GoalModel[]): Goal[] {
    return models.map((model) => GoalMapper.toDomain(model));
  }

  static toModel(goal: Goal): GoalModel {
    const model = new GoalModel();
    model.id = goal.id;
    model.userId = goal.userId;
    model.name = goal.name;
    model.targetInCents = goal.targetInCents;
    model.deadline = goal.deadline;
    model.accountId = goal.accountId;
    model.createdAt = goal.createdAt;

    return model;
  }

  /**
   * O progresso depende do saldo da conta, que vem dos lançamentos: a meta só
   * conhece o id da conta. `transactions`: os que movem a conta, em qualquer data.
   */
  static toDto(
    goal: Goal,
    account: Account,
    transactions: Transaction[],
    today: string,
  ): GoalDto {
    const progress = new GoalProgress(goal, account, transactions, today);

    return {
      id: goal.id,
      name: goal.name,
      targetInCents: goal.targetInCents,
      deadline: goal.deadline,
      accountId: goal.accountId,
      accountName: account.name,
      balanceInCents: progress.balanceInCents,
      progress: progress.progress,
      remainingInCents: progress.remainingInCents,
      monthsLeft: progress.monthsLeft,
      deadlinePassed: progress.deadlinePassed,
      monthlyNeededInCents: progress.monthlyNeededInCents,
      createdAt: goal.createdAt.toISOString(),
    };
  }
}
