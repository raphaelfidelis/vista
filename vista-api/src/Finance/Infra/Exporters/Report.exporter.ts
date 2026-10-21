import { Injectable } from '@nestjs/common';
import writeXlsxFile from 'write-excel-file/node';
import type { Cell, Row, SheetData } from 'write-excel-file/node';
import type {
  ExportedFile,
  ReportExporter,
} from '../../Domain/Exporters/Report.exporter';
import type {
  CategoryBreakdownDto,
  MonthlyReportDto,
} from '../../Domain/Queries/GetMonthlyReport.query';
import type { TransactionDto } from '../../Domain/Queries/FindTransactionsByMonth.query';

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

const KIND_LABELS = {
  EXPENSE: 'Despesa',
  INCOME: 'Receita',
  TRANSFER: 'Transferência',
  ADJUSTMENT: 'Ajuste',
} as const;

function money(cents: number): Cell {
  return { value: cents / 100, type: Number, format: CURRENCY_FORMAT };
}

/** Sem base de comparação não há percentual: "—", como na tela. */
function percent(value: number | null): Cell {
  return value === null ? '—' : { value, type: Number, format: PERCENT_FORMAT };
}

/**
 * A biblioteca converte datas pelo getTime(), que é UTC. Montar a data em UTC
 * garante que o lançamento do dia 15 apareça no dia 15, seja qual for o fuso do servidor.
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

function breakdownRows(categories: CategoryBreakdownDto[]): SheetData {
  return categories.map((category) => [
    category.categoryName,
    money(category.totalInCents),
    percent(category.share),
    money(category.previousTotalInCents),
    money(category.differenceInCents),
    percent(category.change),
  ]);
}

const BREAKDOWN_HEADER = [
  'Categoria',
  'Total',
  'Participação',
  'Mês anterior',
  'Diferença',
  'Variação',
];

function summarySheet(report: MonthlyReportDto): SheetData {
  const [year, month] = report.month.split('-').map(Number);

  return [
    [label('Mês'), monthLabel.format(Date.UTC(year, month - 1, 1))],
    [label('Receitas'), money(report.incomeInCents)],
    [label('Despesas'), money(report.expenseInCents)],
    [label('Resultado'), money(report.resultInCents)],
    [label('Despesas do mês anterior'), money(report.previousExpenseInCents)],
    [label('Diferença'), money(report.expenseDifferenceInCents)],
    [label('Variação'), percent(report.expenseChange)],
    [label('Despesas fixas'), money(report.fixedExpenseInCents)],
    [label('Despesas variáveis'), money(report.variableExpenseInCents)],
    [],
    [label('Despesas por categoria')],
    header(BREAKDOWN_HEADER),
    ...breakdownRows(report.expenseCategories),
    [],
    [label('Receitas por categoria')],
    header(BREAKDOWN_HEADER),
    ...breakdownRows(report.incomeCategories),
  ];
}

function origin(transaction: TransactionDto): string {
  const from = transaction.accountName ?? transaction.cardName ?? '';
  const to = transaction.toAccountName ?? transaction.toCardName;

  return to === null ? from : from + ' → ' + to;
}

function installment(transaction: TransactionDto): string {
  return transaction.installmentNumber === null
    ? ''
    : transaction.installmentNumber + '/' + transaction.installmentCount;
}

/** Despesa sai (negativo); receita, transferência e ajuste mostram o valor como lançado. */
function signedAmount(transaction: TransactionDto): number {
  return transaction.kind === 'EXPENSE'
    ? -transaction.amountInCents
    : transaction.amountInCents;
}

function transactionsSheet(report: MonthlyReportDto): SheetData {
  return [
    header([
      'Data',
      'Descrição',
      'Tipo',
      'Categoria',
      'Origem',
      'Parcela',
      'Valor',
    ]),
    ...report.transactions.map((transaction) => [
      day(transaction.date),
      transaction.description,
      KIND_LABELS[transaction.kind],
      transaction.categoryName ?? '',
      origin(transaction),
      installment(transaction),
      money(signedAmount(transaction)),
    ]),
  ];
}

@Injectable()
export class XlsxReportExporter implements ReportExporter {
  async export(report: MonthlyReportDto): Promise<ExportedFile> {
    const content = await writeXlsxFile([
      {
        sheet: 'Resumo',
        data: summarySheet(report),
        columns: [
          { width: 26 },
          { width: 16 },
          { width: 14 },
          { width: 16 },
          { width: 16 },
          { width: 12 },
        ],
      },
      {
        sheet: 'Lançamentos',
        data: transactionsSheet(report),
        columns: [
          { width: 12 },
          { width: 40 },
          { width: 14 },
          { width: 22 },
          { width: 28 },
          { width: 10 },
          { width: 16 },
        ],
      },
    ]).toBuffer();

    return {
      fileName: 'financas-' + report.month + '.xlsx',
      contentType: CONTENT_TYPE,
      content,
    };
  }
}
