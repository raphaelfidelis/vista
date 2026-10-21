import { Inject, Injectable } from '@nestjs/common';
import { AccountStatement } from '../../Domain/AccountStatement';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { Month } from '../../Domain/Month';
import {
  AccountStatementDto,
  GetAccountStatementQuery,
} from '../../Domain/Queries/GetAccountStatement.query';
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
export class GetAccountStatementHandler implements GetAccountStatementQuery {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
  ) {}

  async execute(
    userId: string,
    accountId: string,
    month: Month,
  ): Promise<AccountStatementDto> {
    const [accounts, categories, cards, transactions] = await Promise.all([
      this.accounts.findAll(userId),
      this.categories.findAll(userId),
      this.cards.findAll(userId),
      this.transactions.findByAccount(userId, accountId),
    ]);
    const account = accounts.find((item) => item.id === accountId);

    if (!account) {
      throw new FinanceNotFoundError('Conta não encontrada: ' + accountId);
    }

    const statement = new AccountStatement(account, month, transactions);
    const names = TransactionMapper.names(categories, accounts, cards);

    return {
      month: month.toString(),
      openingInCents: statement.openingInCents,
      movements: statement.movements.map((movement) => ({
        transaction: TransactionMapper.toDto(movement.transaction, names),
        effectInCents: movement.effectInCents,
        balanceInCents: movement.balanceInCents,
      })),
      closingInCents: statement.closingInCents,
    };
  }
}
