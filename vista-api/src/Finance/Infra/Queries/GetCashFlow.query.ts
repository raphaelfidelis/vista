import { Inject, Injectable } from '@nestjs/common';
import { CashFlowProjection } from '../../Domain/CashFlowProjection';
import type { Clock } from '../../Domain/Clock';
import { CLOCK } from '../../Domain/Clock';
import {
  CashFlowDto,
  GetCashFlowQuery,
} from '../../Domain/Queries/GetCashFlow.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import type { RecurringRepository } from '../../Domain/Repositories/Recurring.repository';
import { RECURRING_REPOSITORY } from '../../Domain/Repositories/Recurring.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';

@Injectable()
export class GetCashFlowHandler implements GetCashFlowQuery {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
    @Inject(RECURRING_REPOSITORY)
    private readonly recurring: RecurringRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, months: number): Promise<CashFlowDto> {
    const [accounts, cards, recurring, transactions] = await Promise.all([
      this.accounts.findAll(userId),
      this.cards.findAll(userId),
      this.recurring.findAll(userId),
      this.transactions.findAll(userId),
    ]);
    const projection = new CashFlowProjection(
      this.clock.today(),
      months,
      accounts,
      cards,
      recurring,
      transactions,
    );

    return {
      months: projection.months.map((month) => ({
        ...month,
        items: month.items.map((item) => ({ ...item })),
      })),
    };
  }
}
