import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../Domain/Clock';
import { CLOCK } from '../../Domain/Clock';
import { FindGoalsQuery, GoalDto } from '../../Domain/Queries/FindGoals.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { GoalRepository } from '../../Domain/Repositories/Goal.repository';
import { GOAL_REPOSITORY } from '../../Domain/Repositories/Goal.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import { GoalMapper } from '../Mappers/Goal.mapper';

@Injectable()
export class FindGoalsHandler implements FindGoalsQuery {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly goals: GoalRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(userId: string): Promise<GoalDto[]> {
    const [goals, accounts, transactions] = await Promise.all([
      this.goals.findAll(userId),
      this.accounts.findAll(userId),
      this.transactions.findAll(userId),
    ]);
    const today = this.clock.today();

    return goals.map((goal) => {
      const account = accounts.find((item) => item.id === goal.accountId);

      if (!account) {
        throw new Error(
          'Meta referencia conta desconhecida: ' + goal.accountId,
        );
      }

      return GoalMapper.toDto(goal, account, transactions, today);
    });
  }
}
