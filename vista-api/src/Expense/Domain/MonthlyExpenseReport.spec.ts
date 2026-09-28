import { randomUUID } from 'node:crypto';
import { Expense } from './Expense';
import { ExpenseCategory } from './ExpenseCategory';
import { Month } from './Month';
import { MonthlyExpenseReport } from './MonthlyExpenseReport';

const mercado = ExpenseCategory.create('Mercado');
const transporte = ExpenseCategory.create('Transporte');
const viagem = ExpenseCategory.create('Viagem');
const categories = [mercado, transporte, viagem];

const SEPTEMBER = Month.parse('2026-09');

function expense(
  amountInCents: number,
  date: string,
  category: ExpenseCategory,
  createdAt = new Date('2026-01-01T00:00:00Z'),
): Expense {
  return new Expense(
    randomUUID(),
    'gasto',
    amountInCents,
    date,
    category.id,
    createdAt,
  );
}

describe('MonthlyExpenseReport', () => {
  // Setembro: Mercado 400, Transporte 100 → 500
  // Agosto:   Mercado 200, Viagem 200     → 400
  const current = [
    expense(30000, '2026-09-10', mercado),
    expense(10000, '2026-09-02', mercado),
    expense(10000, '2026-09-05', transporte),
  ];
  const previous = [
    expense(20000, '2026-08-15', mercado),
    expense(20000, '2026-08-20', viagem),
  ];
  const report = new MonthlyExpenseReport(
    SEPTEMBER,
    current,
    previous,
    categories,
  );

  it('compara o total com o mês anterior', () => {
    expect(report.totalInCents).toBe(50000);
    expect(report.previousTotalInCents).toBe(40000);
    expect(report.differenceInCents).toBe(10000);
    expect(report.change).toBe(0.25);
  });

  it('inclui categorias com gasto em qualquer um dos dois meses, do maior para o menor', () => {
    expect(report.categories).toEqual([
      {
        categoryId: mercado.id,
        categoryName: 'Mercado',
        totalInCents: 40000,
        previousTotalInCents: 20000,
        differenceInCents: 20000,
        change: 1,
        share: 0.8,
      },
      {
        categoryId: transporte.id,
        categoryName: 'Transporte',
        totalInCents: 10000,
        previousTotalInCents: 0,
        differenceInCents: 10000,
        change: null,
        share: 0.2,
      },
      {
        categoryId: viagem.id,
        categoryName: 'Viagem',
        totalInCents: 0,
        previousTotalInCents: 20000,
        differenceInCents: -20000,
        change: -1,
        share: 0,
      },
    ]);
  });

  it('lista os lançamentos em ordem cronológica, com o nome da categoria', () => {
    expect(
      report.entries.map(({ expense: e, categoryName }) => [
        e.date,
        categoryName,
      ]),
    ).toEqual([
      ['2026-09-02', 'Mercado'],
      ['2026-09-05', 'Transporte'],
      ['2026-09-10', 'Mercado'],
    ]);
  });

  it('desempata lançamentos do mesmo dia pela ordem de criação', () => {
    const first = expense(
      100,
      '2026-09-10',
      mercado,
      new Date('2026-09-10T08:00:00Z'),
    );
    const second = expense(
      200,
      '2026-09-10',
      mercado,
      new Date('2026-09-10T09:00:00Z'),
    );

    const { entries } = new MonthlyExpenseReport(
      SEPTEMBER,
      [second, first],
      [],
      categories,
    );

    expect(entries.map(({ expense: e }) => e.id)).toEqual([
      first.id,
      second.id,
    ]);
  });

  it('não calcula variação quando o mês anterior foi zero', () => {
    const empty = new MonthlyExpenseReport(SEPTEMBER, current, [], categories);

    expect(empty.change).toBeNull();
    expect(empty.categories.every((c) => c.change === null)).toBe(true);
  });

  it('não calcula participação quando o mês não teve gasto', () => {
    const quiet = new MonthlyExpenseReport(SEPTEMBER, [], previous, categories);

    expect(quiet.totalInCents).toBe(0);
    expect(quiet.change).toBe(-1);
    expect(quiet.categories.every((c) => c.share === null)).toBe(true);
  });

  it('falha quando um gasto aponta para uma categoria desconhecida', () => {
    const orphan = new Expense(
      randomUUID(),
      'gasto',
      100,
      '2026-09-01',
      randomUUID(),
      new Date(),
    );

    expect(
      () => new MonthlyExpenseReport(SEPTEMBER, [orphan], [], categories),
    ).toThrow(/categoria desconhecida/);
  });
});
