import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseController } from './Controllers/Expense.controller';
import { ExpenseCategoryController } from './Controllers/ExpenseCategory.controller';
import { EXPENSE_REPORT_EXPORTER } from './Domain/Exporters/ExpenseReport.exporter';
import { EXPORT_MONTHLY_EXPENSE_REPORT_QUERY } from './Domain/Queries/ExportMonthlyExpenseReport.query';
import { FIND_EXPENSE_CATEGORIES_QUERY } from './Domain/Queries/FindExpenseCategories.query';
import { FIND_EXPENSES_BY_MONTH_QUERY } from './Domain/Queries/FindExpensesByMonth.query';
import { GET_MONTHLY_EXPENSE_REPORT_QUERY } from './Domain/Queries/GetMonthlyExpenseReport.query';
import { EXPENSE_REPOSITORY } from './Domain/Repositories/Expense.repository';
import { EXPENSE_CATEGORY_REPOSITORY } from './Domain/Repositories/ExpenseCategory.repository';
import { EXPENSE_SERVICE } from './Domain/Services/Expense.service';
import { EXPENSE_CATEGORY_SERVICE } from './Domain/Services/ExpenseCategory.service';
import { XlsxExpenseReportExporter } from './Infra/Exporters/ExpenseReport.exporter';
import { ExpenseModel } from './Infra/Models/Expense.model';
import { ExpenseCategoryModel } from './Infra/Models/ExpenseCategory.model';
import { ExportMonthlyExpenseReportHandler } from './Infra/Queries/ExportMonthlyExpenseReport.query';
import { FindExpenseCategoriesHandler } from './Infra/Queries/FindExpenseCategories.query';
import { FindExpensesByMonthHandler } from './Infra/Queries/FindExpensesByMonth.query';
import { GetMonthlyExpenseReportHandler } from './Infra/Queries/GetMonthlyExpenseReport.query';
import { TypeOrmExpenseRepository } from './Infra/Repositories/Expense.repository';
import { TypeOrmExpenseCategoryRepository } from './Infra/Repositories/ExpenseCategory.repository';
import { ExpenseServiceImpl } from './Infra/Services/Expense.service';
import { ExpenseCategoryServiceImpl } from './Infra/Services/ExpenseCategory.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseModel, ExpenseCategoryModel])],
  // Categorias primeiro: `/expenses/categories` não pode ser engolido por uma rota de `/expenses`.
  controllers: [ExpenseCategoryController, ExpenseController],
  providers: [
    { provide: EXPENSE_REPOSITORY, useClass: TypeOrmExpenseRepository },
    {
      provide: EXPENSE_CATEGORY_REPOSITORY,
      useClass: TypeOrmExpenseCategoryRepository,
    },
    {
      provide: FIND_EXPENSE_CATEGORIES_QUERY,
      useClass: FindExpenseCategoriesHandler,
    },
    {
      provide: FIND_EXPENSES_BY_MONTH_QUERY,
      useClass: FindExpensesByMonthHandler,
    },
    {
      provide: GET_MONTHLY_EXPENSE_REPORT_QUERY,
      useClass: GetMonthlyExpenseReportHandler,
    },
    {
      provide: EXPORT_MONTHLY_EXPENSE_REPORT_QUERY,
      useClass: ExportMonthlyExpenseReportHandler,
    },
    { provide: EXPENSE_CATEGORY_SERVICE, useClass: ExpenseCategoryServiceImpl },
    { provide: EXPENSE_SERVICE, useClass: ExpenseServiceImpl },
    { provide: EXPENSE_REPORT_EXPORTER, useClass: XlsxExpenseReportExporter },
  ],
})
export class ExpenseModule {}
