import { Inject, Injectable } from '@nestjs/common';
import { nameResolver } from '../../Domain/NameResolver';
import {
  FindRecurringQuery,
  RecurringDto,
} from '../../Domain/Queries/FindRecurring.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import type { RecurringRepository } from '../../Domain/Repositories/Recurring.repository';
import { RECURRING_REPOSITORY } from '../../Domain/Repositories/Recurring.repository';
import { RecurringMapper } from '../Mappers/Recurring.mapper';

@Injectable()
export class FindRecurringHandler implements FindRecurringQuery {
  constructor(
    @Inject(RECURRING_REPOSITORY)
    private readonly recurring: RecurringRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
  ) {}

  async execute(userId: string): Promise<RecurringDto[]> {
    const [recurring, categories, accounts, cards] = await Promise.all([
      this.recurring.findAll(userId),
      this.categories.findAll(userId),
      this.accounts.findAll(userId),
      this.cards.findAll(userId),
    ]);
    const categoryName = nameResolver('categoria', categories);
    const accountName = nameResolver('conta', accounts);
    const cardName = nameResolver('cartão', cards);

    return recurring.map((item) =>
      RecurringMapper.toDto(item, {
        category: categoryName(item.categoryId),
        account: item.accountId === null ? null : accountName(item.accountId),
        card: item.cardId === null ? null : cardName(item.cardId),
      }),
    );
  }
}
