import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../Domain/Account';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { AccountDto } from '../../Domain/Queries/FindAccounts.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { BankRepository } from '../../Domain/Repositories/Bank.repository';
import { BANK_REPOSITORY } from '../../Domain/Repositories/Bank.repository';
import type { GoalRepository } from '../../Domain/Repositories/Goal.repository';
import { GOAL_REPOSITORY } from '../../Domain/Repositories/Goal.repository';
import type { RecurringRepository } from '../../Domain/Repositories/Recurring.repository';
import { RECURRING_REPOSITORY } from '../../Domain/Repositories/Recurring.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import {
  AccountService,
  AdjustAccountInput,
  CreateAccountInput,
  UpdateAccountInput,
} from '../../Domain/Services/Account.service';
import { Transaction } from '../../Domain/Transaction';
import { AccountMapper } from '../Mappers/Account.mapper';

@Injectable()
export class AccountServiceImpl implements AccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(BANK_REPOSITORY)
    private readonly banks: BankRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(RECURRING_REPOSITORY)
    private readonly recurring: RecurringRepository,
    @Inject(GOAL_REPOSITORY)
    private readonly goals: GoalRepository,
  ) {}

  async create(userId: string, input: CreateAccountInput): Promise<AccountDto> {
    const account = Account.create({ ...input, userId });
    await this.ensureBankExists(userId, account.bankId);
    await this.ensureNameIsFree(userId, account);
    await this.accounts.save(account);

    return this.toDto(userId, account, []);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateAccountInput,
  ): Promise<AccountDto> {
    const account = await this.find(userId, id);

    if (input.name !== undefined) {
      account.name = input.name;
    }

    if (input.bankId !== undefined) {
      account.bankId = input.bankId;
    }

    if (input.initialBalanceInCents !== undefined) {
      account.initialBalanceInCents = input.initialBalanceInCents;
    }

    if (input.initialBalanceDate !== undefined) {
      account.initialBalanceDate = input.initialBalanceDate;
    }

    if (input.archived !== undefined) {
      account.archived = input.archived;
    }

    await this.ensureBankExists(userId, account.bankId);
    await this.ensureNameIsFree(userId, account);
    await this.accounts.save(account);

    return this.toDto(
      userId,
      account,
      await this.transactions.findByAccount(userId, id),
    );
  }

  async remove(userId: string, id: string): Promise<void> {
    const account = await this.find(userId, id);

    if (
      (await this.transactions.existsWithAccount(userId, id)) ||
      (await this.recurring.existsWithAccount(userId, id)) ||
      (await this.goals.existsWithAccount(userId, id))
    ) {
      throw new FinanceInUseError(
        'A conta "' +
          account.name +
          '" tem lançamentos, gastos fixos ou meta e não pode ser removida. Arquive-a.',
      );
    }

    await this.accounts.delete(userId, id);
  }

  async adjust(
    userId: string,
    id: string,
    input: AdjustAccountInput,
  ): Promise<AccountDto> {
    const account = await this.find(userId, id);

    if (account.archived) {
      throw new FinanceValidationError(
        'A conta "' + account.name + '" está arquivada',
      );
    }

    if (input.date < account.initialBalanceDate) {
      throw new FinanceValidationError(
        'O ajuste não pode ser anterior à data do saldo inicial (' +
          account.initialBalanceDate +
          ')',
      );
    }

    const transactions = await this.transactions.findByAccount(userId, id);
    const difference = input.balanceInCents - account.balance(transactions);

    if (difference === 0) {
      throw new FinanceValidationError('O saldo da conta já é esse');
    }

    const adjustment = Transaction.create({
      userId,
      kind: 'ADJUSTMENT',
      description: 'Ajuste de saldo',
      amountInCents: difference,
      date: input.date,
      accountId: id,
    });
    await this.transactions.save(adjustment);

    return this.toDto(userId, account, [...transactions, adjustment]);
  }

  private async toDto(
    userId: string,
    account: Account,
    transactions: Transaction[],
  ): Promise<AccountDto> {
    const bank =
      account.bankId === null
        ? null
        : await this.banks.findById(userId, account.bankId);

    return AccountMapper.toDto(
      account,
      bank?.name ?? null,
      account.balance(transactions),
    );
  }

  private async find(userId: string, id: string): Promise<Account> {
    const account = await this.accounts.findById(userId, id);

    if (!account) {
      throw new FinanceNotFoundError('Conta não encontrada: ' + id);
    }

    return account;
  }

  private async ensureBankExists(
    userId: string,
    bankId: string | null,
  ): Promise<void> {
    if (bankId !== null && !(await this.banks.findById(userId, bankId))) {
      throw new FinanceNotFoundError('Banco não encontrado: ' + bankId);
    }
  }

  /** A própria conta pode manter o nome (ou mudar só maiúsculas); outra não. */
  private async ensureNameIsFree(
    userId: string,
    account: Account,
  ): Promise<void> {
    const existing = await this.accounts.findByName(userId, account.name);

    if (existing && existing.id !== account.id) {
      throw new FinanceDuplicateError(
        'Já existe uma conta chamada "' + existing.name + '"',
      );
    }
  }
}
