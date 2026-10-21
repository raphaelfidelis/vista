import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './Controllers/Account.controller';
import { BudgetController } from './Controllers/Budget.controller';
import { CardController } from './Controllers/Card.controller';
import { CashFlowController } from './Controllers/CashFlow.controller';
import { BankController } from './Controllers/Bank.controller';
import { CategoryController } from './Controllers/Category.controller';
import { GoalController } from './Controllers/Goal.controller';
import { InsightController } from './Controllers/Insight.controller';
import { RecurringController } from './Controllers/Recurring.controller';
import { ReportController } from './Controllers/Report.controller';
import { TransactionController } from './Controllers/Transaction.controller';
import { ACCOUNT_SETUP } from '../Auth/Domain/Services/AccountSetup';
import { CLOCK } from './Domain/Clock';
import { REPORT_EXPORTER } from './Domain/Exporters/Report.exporter';
import { EXPORT_MONTHLY_REPORT_QUERY } from './Domain/Queries/ExportMonthlyReport.query';
import { FIND_ACCOUNTS_QUERY } from './Domain/Queries/FindAccounts.query';
import { FIND_BANKS_QUERY } from './Domain/Queries/FindBanks.query';
import { FIND_CARDS_QUERY } from './Domain/Queries/FindCards.query';
import { FIND_GOALS_QUERY } from './Domain/Queries/FindGoals.query';
import { FIND_CATEGORIES_QUERY } from './Domain/Queries/FindCategories.query';
import { FIND_RECURRING_QUERY } from './Domain/Queries/FindRecurring.query';
import { FIND_TRANSACTIONS_BY_MONTH_QUERY } from './Domain/Queries/FindTransactionsByMonth.query';
import { GET_ACCOUNT_STATEMENT_QUERY } from './Domain/Queries/GetAccountStatement.query';
import { GET_CARD_INVOICE_QUERY } from './Domain/Queries/GetCardInvoice.query';
import { GET_CASH_FLOW_QUERY } from './Domain/Queries/GetCashFlow.query';
import { GET_INSIGHTS_QUERY } from './Domain/Queries/GetInsights.query';
import { GET_MONTHLY_BUDGET_QUERY } from './Domain/Queries/GetMonthlyBudget.query';
import { GET_MONTHLY_REPORT_QUERY } from './Domain/Queries/GetMonthlyReport.query';
import { SEARCH_TRANSACTIONS_QUERY } from './Domain/Queries/SearchTransactions.query';
import { ACCOUNT_REPOSITORY } from './Domain/Repositories/Account.repository';
import { BUDGET_REPOSITORY } from './Domain/Repositories/Budget.repository';
import { CARD_REPOSITORY } from './Domain/Repositories/Card.repository';
import { GOAL_REPOSITORY } from './Domain/Repositories/Goal.repository';
import { BANK_REPOSITORY } from './Domain/Repositories/Bank.repository';
import { CATEGORY_REPOSITORY } from './Domain/Repositories/Category.repository';
import { RECURRING_REPOSITORY } from './Domain/Repositories/Recurring.repository';
import { TRANSACTION_REPOSITORY } from './Domain/Repositories/Transaction.repository';
import { ACCOUNT_SERVICE } from './Domain/Services/Account.service';
import { BUDGET_SERVICE } from './Domain/Services/Budget.service';
import { CARD_SERVICE } from './Domain/Services/Card.service';
import { GOAL_SERVICE } from './Domain/Services/Goal.service';
import { BANK_SERVICE } from './Domain/Services/Bank.service';
import { CATEGORY_SERVICE } from './Domain/Services/Category.service';
import { RECURRING_SERVICE } from './Domain/Services/Recurring.service';
import { TRANSACTION_SERVICE } from './Domain/Services/Transaction.service';
import { XlsxReportExporter } from './Infra/Exporters/Report.exporter';
import { SystemClock } from './Infra/SystemClock';
import { AccountModel } from './Infra/Models/Account.model';
import { BankModel } from './Infra/Models/Bank.model';
import { BudgetLimitModel } from './Infra/Models/BudgetLimit.model';
import { BudgetOverrideModel } from './Infra/Models/BudgetOverride.model';
import { CardModel } from './Infra/Models/Card.model';
import { GoalModel } from './Infra/Models/Goal.model';
import { CategoryModel } from './Infra/Models/Category.model';
import { RecurringModel } from './Infra/Models/Recurring.model';
import { TransactionModel } from './Infra/Models/Transaction.model';
import { ExportMonthlyReportHandler } from './Infra/Queries/ExportMonthlyReport.query';
import { FindAccountsHandler } from './Infra/Queries/FindAccounts.query';
import { FindBanksHandler } from './Infra/Queries/FindBanks.query';
import { FindCardsHandler } from './Infra/Queries/FindCards.query';
import { FindGoalsHandler } from './Infra/Queries/FindGoals.query';
import { FindCategoriesHandler } from './Infra/Queries/FindCategories.query';
import { FindRecurringHandler } from './Infra/Queries/FindRecurring.query';
import { FindTransactionsByMonthHandler } from './Infra/Queries/FindTransactionsByMonth.query';
import { GetAccountStatementHandler } from './Infra/Queries/GetAccountStatement.query';
import { GetCardInvoiceHandler } from './Infra/Queries/GetCardInvoice.query';
import { GetCashFlowHandler } from './Infra/Queries/GetCashFlow.query';
import { GetInsightsHandler } from './Infra/Queries/GetInsights.query';
import { GetMonthlyBudgetHandler } from './Infra/Queries/GetMonthlyBudget.query';
import { GetMonthlyReportHandler } from './Infra/Queries/GetMonthlyReport.query';
import { SearchTransactionsHandler } from './Infra/Queries/SearchTransactions.query';
import { TypeOrmAccountRepository } from './Infra/Repositories/Account.repository';
import { TypeOrmBankRepository } from './Infra/Repositories/Bank.repository';
import { TypeOrmBudgetRepository } from './Infra/Repositories/Budget.repository';
import { TypeOrmCardRepository } from './Infra/Repositories/Card.repository';
import { TypeOrmGoalRepository } from './Infra/Repositories/Goal.repository';
import { TypeOrmCategoryRepository } from './Infra/Repositories/Category.repository';
import { TypeOrmRecurringRepository } from './Infra/Repositories/Recurring.repository';
import { TypeOrmTransactionRepository } from './Infra/Repositories/Transaction.repository';
import { AccountServiceImpl } from './Infra/Services/Account.service';
import { BankServiceImpl } from './Infra/Services/Bank.service';
import { BudgetServiceImpl } from './Infra/Services/Budget.service';
import { CardServiceImpl } from './Infra/Services/Card.service';
import { GoalServiceImpl } from './Infra/Services/Goal.service';
import { CategoryServiceImpl } from './Infra/Services/Category.service';
import { DefaultCategoriesSetup } from './Infra/Services/DefaultCategories.service';
import { RecurringServiceImpl } from './Infra/Services/Recurring.service';
import { TransactionServiceImpl } from './Infra/Services/Transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankModel,
      BudgetLimitModel,
      BudgetOverrideModel,
      GoalModel,
      CardModel,
      CategoryModel,
      AccountModel,
      TransactionModel,
      RecurringModel,
    ]),
  ],
  controllers: [
    BankController,
    BudgetController,
    GoalController,
    CashFlowController,
    InsightController,
    CardController,
    CategoryController,
    AccountController,
    TransactionController,
    RecurringController,
    ReportController,
  ],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: BANK_REPOSITORY, useClass: TypeOrmBankRepository },
    { provide: CARD_REPOSITORY, useClass: TypeOrmCardRepository },
    { provide: BUDGET_REPOSITORY, useClass: TypeOrmBudgetRepository },
    { provide: GOAL_REPOSITORY, useClass: TypeOrmGoalRepository },
    { provide: CATEGORY_REPOSITORY, useClass: TypeOrmCategoryRepository },
    { provide: ACCOUNT_REPOSITORY, useClass: TypeOrmAccountRepository },
    { provide: TRANSACTION_REPOSITORY, useClass: TypeOrmTransactionRepository },
    { provide: RECURRING_REPOSITORY, useClass: TypeOrmRecurringRepository },
    { provide: FIND_BANKS_QUERY, useClass: FindBanksHandler },
    { provide: FIND_CARDS_QUERY, useClass: FindCardsHandler },
    { provide: FIND_GOALS_QUERY, useClass: FindGoalsHandler },
    { provide: GET_MONTHLY_BUDGET_QUERY, useClass: GetMonthlyBudgetHandler },
    { provide: GET_CASH_FLOW_QUERY, useClass: GetCashFlowHandler },
    { provide: GET_INSIGHTS_QUERY, useClass: GetInsightsHandler },
    { provide: GET_CARD_INVOICE_QUERY, useClass: GetCardInvoiceHandler },
    { provide: FIND_CATEGORIES_QUERY, useClass: FindCategoriesHandler },
    { provide: FIND_ACCOUNTS_QUERY, useClass: FindAccountsHandler },
    {
      provide: FIND_TRANSACTIONS_BY_MONTH_QUERY,
      useClass: FindTransactionsByMonthHandler,
    },
    {
      provide: GET_ACCOUNT_STATEMENT_QUERY,
      useClass: GetAccountStatementHandler,
    },
    { provide: GET_MONTHLY_REPORT_QUERY, useClass: GetMonthlyReportHandler },
    { provide: SEARCH_TRANSACTIONS_QUERY, useClass: SearchTransactionsHandler },
    {
      provide: EXPORT_MONTHLY_REPORT_QUERY,
      useClass: ExportMonthlyReportHandler,
    },
    { provide: FIND_RECURRING_QUERY, useClass: FindRecurringHandler },
    { provide: BANK_SERVICE, useClass: BankServiceImpl },
    { provide: CARD_SERVICE, useClass: CardServiceImpl },
    { provide: BUDGET_SERVICE, useClass: BudgetServiceImpl },
    { provide: GOAL_SERVICE, useClass: GoalServiceImpl },
    { provide: CATEGORY_SERVICE, useClass: CategoryServiceImpl },
    { provide: ACCOUNT_SERVICE, useClass: AccountServiceImpl },
    { provide: TRANSACTION_SERVICE, useClass: TransactionServiceImpl },
    { provide: RECURRING_SERVICE, useClass: RecurringServiceImpl },
    { provide: REPORT_EXPORTER, useClass: XlsxReportExporter },
    { provide: ACCOUNT_SETUP, useClass: DefaultCategoriesSetup },
  ],
  exports: [ACCOUNT_SETUP],
})
export class FinanceModule {}
