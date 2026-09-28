import { MonthlyExpenseReportDto } from '../Queries/GetMonthlyExpenseReport.query';

export const EXPENSE_REPORT_EXPORTER = Symbol('ExpenseReportExporter');

export interface ExportedFile {
  fileName: string;
  contentType: string;
  content: Uint8Array;
}

export interface ExpenseReportExporter {
  export(report: MonthlyExpenseReportDto): Promise<ExportedFile>;
}
