import { ExportedFile } from '../Exporters/Report.exporter';
import { Month } from '../Month';

export const EXPORT_MONTHLY_REPORT_QUERY = Symbol('ExportMonthlyReportQuery');

export interface ExportMonthlyReportQuery {
  execute(userId: string, month: Month): Promise<ExportedFile>;
}
