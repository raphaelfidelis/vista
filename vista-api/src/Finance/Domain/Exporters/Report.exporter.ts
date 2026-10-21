import { MonthlyReportDto } from '../Queries/GetMonthlyReport.query';

export const REPORT_EXPORTER = Symbol('ReportExporter');

export interface ExportedFile {
  fileName: string;
  contentType: string;
  content: Uint8Array;
}

export interface ReportExporter {
  export(report: MonthlyReportDto): Promise<ExportedFile>;
}
