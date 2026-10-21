import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../Domain/Account';
import type { Clock } from '../../Domain/Clock';
import { CLOCK } from '../../Domain/Clock';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { Goal } from '../../Domain/Goal';
import { GoalDto } from '../../Domain/Queries/FindGoals.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { GoalRepository } from '../../Domain/Repositories/Goal.repository';
import { GOAL_REPOSITORY } from '../../Domain/Repositories/Goal.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import {
  CreateGoalInput,
  GoalService,
  UpdateGoalInput,
} from '../../Domain/Services/Goal.service';
import { GoalMapper } from '../Mappers/Goal.mapper';

@Injectable()
export class GoalServiceImpl implements GoalService {
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

  async create(userId: string, input: CreateGoalInput): Promise<GoalDto> {
    const goal = Goal.create({ ...input, userId });
    const account = await this.ensureAccount(userId, goal);
    await this.goals.save(goal);

    return this.toDto(userId, goal, account);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateGoalInput,
  ): Promise<GoalDto> {
    const goal = await this.find(userId, id);

    if (input.name !== undefined) {
      goal.name = input.name;
    }

    if (input.targetInCents !== undefined) {
      goal.targetInCents = input.targetInCents;
    }

    if (input.deadline !== undefined) {
      goal.deadline = input.deadline;
    }

    if (input.accountId !== undefined) {
      goal.accountId = input.accountId;
    }

    const account = await this.ensureAccount(userId, goal);
    await this.goals.save(goal);

    return this.toDto(userId, goal, account);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.find(userId, id);
    await this.goals.delete(userId, id);
  }

  private async toDto(
    userId: string,
    goal: Goal,
    account: Account,
  ): Promise<GoalDto> {
    return GoalMapper.toDto(
      goal,
      account,
      await this.transactions.findByAccount(userId, account.id),
      this.clock.today(),
    );
  }

  private async find(userId: string, id: string): Promise<Goal> {
    const goal = await this.goals.findById(userId, id);

    if (!goal) {
      throw new FinanceNotFoundError('Meta não encontrada: ' + id);
    }

    return goal;
  }

  /** A conta precisa existir, ser de reserva e não ter outra meta. */
  private async ensureAccount(userId: string, goal: Goal): Promise<Account> {
    const account = await this.accounts.findById(userId, goal.accountId);

    if (!account) {
      throw new FinanceNotFoundError('Conta não encontrada: ' + goal.accountId);
    }

    if (account.type !== 'RESERVE') {
      throw new FinanceValidationError(
        'A meta deve apontar para uma conta de reserva',
      );
    }

    const existing = await this.goals.findByAccount(userId, account.id);

    if (existing && existing.id !== goal.id) {
      throw new FinanceDuplicateError(
        'A conta "' + account.name + '" já tem a meta "' + existing.name + '"',
      );
    }

    return account;
  }
}
