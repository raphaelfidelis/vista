import { Expense } from '../../Domain/Expense';
import { ExpenseCategory } from '../../Domain/ExpenseCategory';
import { Month } from '../../Domain/Month';
import { GetMonthlyExpenseReportHandler } from './GetMonthlyExpenseReport.query';

describe('GetMonthlyExpenseReportHandler', () => {
  it('monta o relatório com o mês pedido e o anterior', async () => {
    const mercado = ExpenseCategory.create('Mercado');
    const byMonth: Record<string, Expense[]> = {
      '2026-09': [
        Expense.create({
          description: 'Feira',
          amountInCents: 5000,
          date: '2026-09-03',
          categoryId: mercado.id,
        }),
      ],
      '2026-08': [
        Expense.create({
          description: 'Feira',
          amountInCents: 4000,
          date: '2026-08-03',
          categoryId: mercado.id,
        }),
      ],
    };

    const expenses = {
      findByMonth: jest.fn<Promise<Expense[]>, [Month]>((month) =>
        Promise.resolve(byMonth[month.toString()] ?? []),
      ),
      findById: jest.fn<Promise<Expense | null>, [string]>(),
      existsWithCategory: jest.fn<Promise<boolean>, [string]>(),
      save: jest.fn<Promise<void>, [Expense]>(),
      delete: jest.fn<Promise<void>, [string]>(),
    };
    const categories = {
      findAll: jest.fn<Promise<ExpenseCategory[]>, []>(() =>
        Promise.resolve([mercado]),
      ),
      findById: jest.fn<Promise<ExpenseCategory | null>, [string]>(),
      findByName: jest.fn<Promise<ExpenseCategory | null>, [string]>(),
      save: jest.fn<Promise<void>, [ExpenseCategory]>(),
      delete: jest.fn<Promise<void>, [string]>(),
    };

    const report = await new GetMonthlyExpenseReportHandler(
      expenses,
      categories,
    ).execute(Month.parse('2026-09'));

    expect(expenses.findByMonth.mock.calls.map(([m]) => m.toString())).toEqual([
      '2026-09',
      '2026-08',
    ]);
    expect(report).toMatchObject({
      month: '2026-09',
      totalInCents: 5000,
      previousTotalInCents: 4000,
      differenceInCents: 1000,
      change: 0.25,
    });
    expect(report.expenses).toHaveLength(1);
  });
});
