import { ExportedFile } from '../Exporters/ExpenseReport.exporter';
import { Month } from '../Month';

export const EXPORT_MONTHLY_EXPENSE_REPORT_QUERY = Symbol(
  'ExportMonthlyExpenseReportQuery',
);

export interface ExportMonthlyExpenseReportQuery {
  execute(month: Month): Promise<ExportedFile>;
}
