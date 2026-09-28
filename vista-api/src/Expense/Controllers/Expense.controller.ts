import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseFilters,
} from '@nestjs/common';
import { Month } from '../Domain/Month';
import { EXPORT_MONTHLY_EXPENSE_REPORT_QUERY } from '../Domain/Queries/ExportMonthlyExpenseReport.query';
import type { ExportMonthlyExpenseReportQuery } from '../Domain/Queries/ExportMonthlyExpenseReport.query';
import { FIND_EXPENSES_BY_MONTH_QUERY } from '../Domain/Queries/FindExpensesByMonth.query';
import type {
  ExpenseDto,
  FindExpensesByMonthQuery,
} from '../Domain/Queries/FindExpensesByMonth.query';
import { GET_MONTHLY_EXPENSE_REPORT_QUERY } from '../Domain/Queries/GetMonthlyExpenseReport.query';
import type {
  GetMonthlyExpenseReportQuery,
  MonthlyExpenseReportDto,
} from '../Domain/Queries/GetMonthlyExpenseReport.query';
import { EXPENSE_SERVICE } from '../Domain/Services/Expense.service';
import type {
  CreateExpenseInput,
  ExpenseService,
  UpdateExpenseInput,
} from '../Domain/Services/Expense.service';
import { ExpenseExceptionFilter } from './Expense.filter';
import { RequireJsonObjectPipe } from './RequireJsonObject.pipe';

@Controller('expenses')
@UseFilters(ExpenseExceptionFilter)
export class ExpenseController {
  constructor(
    @Inject(FIND_EXPENSES_BY_MONTH_QUERY)
    private readonly findExpensesByMonth: FindExpensesByMonthQuery,
    @Inject(GET_MONTHLY_EXPENSE_REPORT_QUERY)
    private readonly getMonthlyReport: GetMonthlyExpenseReportQuery,
    @Inject(EXPORT_MONTHLY_EXPENSE_REPORT_QUERY)
    private readonly exportMonthlyReport: ExportMonthlyExpenseReportQuery,
    @Inject(EXPENSE_SERVICE)
    private readonly expenses: ExpenseService,
  ) {}

  @Get()
  findByMonth(@Query('month') month: unknown): Promise<ExpenseDto[]> {
    return this.findExpensesByMonth.execute(Month.parse(month));
  }

  @Get('report')
  getReport(@Query('month') month: unknown): Promise<MonthlyExpenseReportDto> {
    return this.getMonthlyReport.execute(Month.parse(month));
  }

  @Get('report/xlsx')
  async exportReport(@Query('month') month: unknown): Promise<StreamableFile> {
    const file = await this.exportMonthlyReport.execute(Month.parse(month));

    return new StreamableFile(file.content, {
      type: file.contentType,
      disposition: `attachment; filename="${file.fileName}"`,
    });
  }

  @Post()
  create(
    @Body(RequireJsonObjectPipe) input: CreateExpenseInput,
  ): Promise<ExpenseDto> {
    return this.expenses.create(input);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(RequireJsonObjectPipe) input: UpdateExpenseInput,
  ): Promise<ExpenseDto> {
    return this.expenses.update(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.expenses.remove(id);
  }
}
