import { Injectable } from '@nestjs/common';
import writeXlsxFile from 'write-excel-file/node';
import type { Cell, Row, SheetData } from 'write-excel-file/node';
import type {
  ExpenseReportExporter,
  ExportedFile,
} from '../../Domain/Exporters/ExpenseReport.exporter';
import type { MonthlyExpenseReportDto } from '../../Domain/Queries/GetMonthlyExpenseReport.query';

const CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Códigos de formato do Excel. Separadores de milhar e decimal são exibidos
// conforme a localidade de quem abre o arquivo.
const CURRENCY_FORMAT = '"R$" #,##0.00';
const PERCENT_FORMAT = '0.0%';
const DATE_FORMAT = 'dd/mm/yyyy';

const monthLabel = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function money(cents: number): Cell {
  return { value: cents / 100, type: Number, format: CURRENCY_FORMAT };
}

/** Sem base de comparação não há percentual: "—", como na tela. */
function percent(value: number | null): Cell {
  return value === null ? '—' : { value, type: Number, format: PERCENT_FORMAT };
}

/**
 * A biblioteca converte datas pelo `getTime()`, que é UTC. Montar a data em UTC
 * garante que o gasto do dia 15 apareça no dia 15, seja qual for o fuso do servidor.
 */
function day(isoDate: string): Cell {
  const [year, month, dayOfMonth] = isoDate.split('-').map(Number);

  return {
    value: new Date(Date.UTC(year, month - 1, dayOfMonth)),
    type: Date,
    format: DATE_FORMAT,
  };
}

function label(text: string): Cell {
  return { value: text, fontWeight: 'bold' };
}

function header(labels: string[]): Row {
  return labels.map((text) => label(text));
}

function summarySheet(report: MonthlyExpenseReportDto): SheetData {
  const [year, month] = report.month.split('-').map(Number);

  return [
    [label('Mês'), monthLabel.format(Date.UTC(year, month - 1, 1))],
    [label('Total'), money(report.totalInCents)],
    [label('Mês anterior'), money(report.previousTotalInCents)],
    [label('Diferença'), money(report.differenceInCents)],
    [label('Variação'), percent(report.change)],
    [],
    header([
      'Categoria',
      'Total',
      'Participação',
      'Mês anterior',
      'Diferença',
      'Variação',
    ]),
    ...report.categories.map((category) => [
      category.categoryName,
      money(category.totalInCents),
      percent(category.share),
      money(category.previousTotalInCents),
      money(category.differenceInCents),
      percent(category.change),
    ]),
  ];
}

function entriesSheet(report: MonthlyExpenseReportDto): SheetData {
  return [
    header(['Data', 'Descrição', 'Categoria', 'Valor']),
    ...report.expenses.map((expense) => [
      day(expense.date),
      expense.description,
      expense.categoryName,
      money(expense.amountInCents),
    ]),
  ];
}

@Injectable()
export class XlsxExpenseReportExporter implements ExpenseReportExporter {
  async export(report: MonthlyExpenseReportDto): Promise<ExportedFile> {
    const content = await writeXlsxFile([
      {
        sheet: 'Resumo',
        data: summarySheet(report),
        columns: [
          { width: 22 },
          { width: 16 },
          { width: 14 },
          { width: 16 },
          { width: 16 },
          { width: 12 },
        ],
      },
      {
        sheet: 'Lançamentos',
        data: entriesSheet(report),
        columns: [{ width: 12 }, { width: 40 }, { width: 22 }, { width: 16 }],
      },
    ]).toBuffer();

    return {
      fileName: `gastos-${report.month}.xlsx`,
      contentType: CONTENT_TYPE,
      content,
    };
  }
}
