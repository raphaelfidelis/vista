import { Inject, Injectable } from '@nestjs/common';
import { Month } from '../../Domain/Month';
import { MonthlyReport } from '../../Domain/MonthlyReport';
import {
  GetMonthlyReportQuery,
  MonthlyReportDto,
} from '../../Domain/Queries/GetMonthlyReport.query';
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
export class GetMonthlyReportHandler implements GetMonthlyReportQuery {
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

  async execute(userId: string, month: Month): Promise<MonthlyReportDto> {
    const [
      transactions,
      previousTransactions,
      launchedRecurringIds,
      categories,
      accounts,
      cards,
    ] = await Promise.all([
      this.transactions.findByMonth(userId, month),
      this.transactions.findByMonth(userId, month.previous()),
      this.transactions.findLaunchedRecurringIds(userId, month),
      this.categories.findAll(userId),
      this.accounts.findAll(userId),
      this.cards.findAll(userId),
    ]);
    const report = new MonthlyReport(
      month,
      transactions,
      previousTransactions,
      categories,
    );
    const names = TransactionMapper.names(categories, accounts, cards);

    return {
      month: report.month.toString(),
      incomeInCents: report.incomeInCents,
      expenseInCents: report.expenseInCents,
      resultInCents: report.resultInCents,
      previousExpenseInCents: report.previousExpenseInCents,
      expenseDifferenceInCents: report.expenseDifferenceInCents,
      expenseChange: report.expenseChange,
      fixedExpenseInCents: report.fixedExpenseInCents,
      variableExpenseInCents: report.variableExpenseInCents,
      expenseCategories: report.expenseCategories.map((item) => ({ ...item })),
      incomeCategories: report.incomeCategories.map((item) => ({ ...item })),
      transactions: report.transactions.map((transaction) =>
        TransactionMapper.toDto(transaction, names),
      ),
      launchedRecurringIds,
    };
  }
}
