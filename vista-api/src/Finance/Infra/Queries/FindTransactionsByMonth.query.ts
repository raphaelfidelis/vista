import { Inject, Injectable } from '@nestjs/common';
import { Month } from '../../Domain/Month';
import {
  FindTransactionsByMonthQuery,
  TransactionDto,
} from '../../Domain/Queries/FindTransactionsByMonth.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import { TransactionMapper } from '../Mappers/Transaction.mapper';

@Injectable()
export class FindTransactionsByMonthHandler implements FindTransactionsByMonthQuery {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
  ) {}

  async execute(userId: string, month: Month): Promise<TransactionDto[]> {
    const [transactions, categories, accounts, cards] = await Promise.all([
      this.transactions.findByMonth(userId, month),
      this.categories.findAll(userId),
      this.accounts.findAll(userId),
      this.cards.findAll(userId),
    ]);
    const names = TransactionMapper.names(categories, accounts, cards);

    return transactions.map((transaction) =>
      TransactionMapper.toDto(transaction, names),
    );
  }
}
