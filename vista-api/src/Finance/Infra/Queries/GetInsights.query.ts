import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../Domain/Clock';
import { CLOCK } from '../../Domain/Clock';
import { Insights } from '../../Domain/Insights';
import { Month } from '../../Domain/Month';
import {
  GetInsightsQuery,
  InsightsDto,
} from '../../Domain/Queries/GetInsights.query';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';

@Injectable()
export class GetInsightsHandler implements GetInsightsQuery {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, month: Month): Promise<InsightsDto> {
    const [categories, cards, transactions] = await Promise.all([
      this.categories.findAll(userId, 'EXPENSE'),
      this.cards.findAll(userId),
      this.transactions.findAll(userId),
    ]);
    const insights = new Insights(
      month,
      this.clock.today(),
      transactions,
      categories,
      cards,
    );

    return {
      month: month.toString(),
      alerts: insights.alerts.map((alert) => ({ ...alert })),
    };
  }
}
