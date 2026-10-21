import { Inject, Injectable } from '@nestjs/common';
import type {
  ExportedFile,
  ReportExporter,
} from '../../Domain/Exporters/Report.exporter';
import { REPORT_EXPORTER } from '../../Domain/Exporters/Report.exporter';
import { Month } from '../../Domain/Month';
import { ExportMonthlyReportQuery } from '../../Domain/Queries/ExportMonthlyReport.query';
import type { GetMonthlyReportQuery } from '../../Domain/Queries/GetMonthlyReport.query';
import { GET_MONTHLY_REPORT_QUERY } from '../../Domain/Queries/GetMonthlyReport.query';

/** O arquivo é o mesmo relatório da tela, em outro formato: reusa a query em vez de recalcular. */
@Injectable()
export class ExportMonthlyReportHandler implements ExportMonthlyReportQuery {
  constructor(
    @Inject(GET_MONTHLY_REPORT_QUERY)
    private readonly report: GetMonthlyReportQuery,
    @Inject(REPORT_EXPORTER)
    private readonly exporter: ReportExporter,
  ) {}

  async execute(userId: string, month: Month): Promise<ExportedFile> {
    return this.exporter.export(await this.report.execute(userId, month));
  }
}
