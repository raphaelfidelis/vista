import { Inject, Injectable } from '@nestjs/common';
import { nameResolver } from '../../Domain/NameResolver';
import {
  AccountDto,
  FindAccountsQuery,
} from '../../Domain/Queries/FindAccounts.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { BankRepository } from '../../Domain/Repositories/Bank.repository';
import { BANK_REPOSITORY } from '../../Domain/Repositories/Bank.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import { AccountMapper } from '../Mappers/Account.mapper';

@Injectable()
export class FindAccountsHandler implements FindAccountsQuery {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(BANK_REPOSITORY)
    private readonly banks: BankRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
  ) {}

  async execute(userId: string): Promise<AccountDto[]> {
    const [accounts, banks, transactions] = await Promise.all([
      this.accounts.findAll(userId),
      this.banks.findAll(userId),
      this.transactions.findAll(userId),
    ]);
    const bankName = nameResolver('banco', banks);

    return accounts.map((account) =>
      AccountMapper.toDto(
        account,
        account.bankId === null ? null : bankName(account.bankId),
        account.balance(transactions),
      ),
    );
  }
}
