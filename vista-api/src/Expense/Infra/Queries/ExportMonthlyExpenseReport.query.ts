import { Inject, Injectable } from '@nestjs/common';
import type {
  ExpenseReportExporter,
  ExportedFile,
} from '../../Domain/Exporters/ExpenseReport.exporter';
import { EXPENSE_REPORT_EXPORTER } from '../../Domain/Exporters/ExpenseReport.exporter';
import { Month } from '../../Domain/Month';
import { ExportMonthlyExpenseReportQuery } from '../../Domain/Queries/ExportMonthlyExpenseReport.query';
import type { GetMonthlyExpenseReportQuery } from '../../Domain/Queries/GetMonthlyExpenseReport.query';
import { GET_MONTHLY_EXPENSE_REPORT_QUERY } from '../../Domain/Queries/GetMonthlyExpenseReport.query';

/** O arquivo é o mesmo relatório da tela, em outro formato: reusa a query em vez de recalcular. */
@Injectable()
export class ExportMonthlyExpenseReportHandler implements ExportMonthlyExpenseReportQuery {
  constructor(
    @Inject(GET_MONTHLY_EXPENSE_REPORT_QUERY)
    private readonly report: GetMonthlyExpenseReportQuery,
    @Inject(EXPENSE_REPORT_EXPORTER)
    private readonly exporter: ExpenseReportExporter,
  ) {}

  async execute(month: Month): Promise<ExportedFile> {
    return this.exporter.export(await this.report.execute(month));
  }
}
