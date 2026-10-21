import {
  Controller,
  Get,
  Inject,
  Query,
  StreamableFile,
  UseFilters,
} from '@nestjs/common';
import { Month } from '../Domain/Month';
import { EXPORT_MONTHLY_REPORT_QUERY } from '../Domain/Queries/ExportMonthlyReport.query';
import type { ExportMonthlyReportQuery } from '../Domain/Queries/ExportMonthlyReport.query';
import { GET_MONTHLY_REPORT_QUERY } from '../Domain/Queries/GetMonthlyReport.query';
import type {
  GetMonthlyReportQuery,
  MonthlyReportDto,
} from '../Domain/Queries/GetMonthlyReport.query';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('reports/monthly')
@UseFilters(FinanceExceptionFilter)
export class ReportController {
  constructor(
    @Inject(GET_MONTHLY_REPORT_QUERY)
    private readonly getReport: GetMonthlyReportQuery,
    @Inject(EXPORT_MONTHLY_REPORT_QUERY)
    private readonly exportReport: ExportMonthlyReportQuery,
  ) {}

  @Get()
  report(
    @CurrentUserId() userId: string,
    @Query('month') month: string,
  ): Promise<MonthlyReportDto> {
    return this.getReport.execute(userId, Month.parse(month));
  }

  @Get('xlsx')
  async xlsx(
    @CurrentUserId() userId: string,
    @Query('month') month: string,
  ): Promise<StreamableFile> {
    const file = await this.exportReport.execute(userId, Month.parse(month));

    return new StreamableFile(file.content, {
      type: file.contentType,
      disposition: 'attachment; filename="' + file.fileName + '"',
    });
  }
}
