import { randomUUID } from 'node:crypto';
import { Category } from './Category';
import { Month } from './Month';
import { MonthlyReport } from './MonthlyReport';
import { Transaction } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';

const mercado = Category.create({
  userId: USER,
  name: 'Mercado',
  kind: 'EXPENSE',
});
const transporte = Category.create({
  userId: USER,
  name: 'Transporte',
  kind: 'EXPENSE',
});
const viagem = Category.create({
  userId: USER,
  name: 'Viagem',
  kind: 'EXPENSE',
});
const salario = Category.create({
  userId: USER,
  name: 'Salário',
  kind: 'INCOME',
});
const freela = Category.create({
  userId: USER,
  name: 'Freela',
  kind: 'INCOME',
});
const categories = [mercado, transporte, viagem, salario, freela];

const CHECKING = '11111111-1111-4111-8111-111111111111';
const RESERVE = '22222222-2222-4222-8222-222222222222';
const SEPTEMBER = Month.parse('2026-09');

function expense(
  amountInCents: number,
  date: string,
  category: Category,
  recurringId: string | null = null,
): Transaction {
  return Transaction.create({
    userId: USER,
    kind: 'EXPENSE',
    description: 'gasto',
    amountInCents,
    date,
    categoryId: category.id,
    accountId: CHECKING,
    recurringId,
  });
}

function income(
  amountInCents: number,
  date: string,
  category: Category,
): Transaction {
  return Transaction.create({
    userId: USER,
    kind: 'INCOME',
    description: 'entrada',
    amountInCents,
    date,
    categoryId: category.id,
    accountId: CHECKING,
  });
}

describe('MonthlyReport', () => {
  // Setembro: despesas Mercado 400 + Transporte 100 = 500; receitas Salário 1000
  // Agosto:   despesas Mercado 200 + Viagem 200 = 400; receitas Salário 900 + Freela 50
  const current = [
    expense(30000, '2026-09-10', mercado),
    expense(10000, '2026-09-02', mercado),
    expense(10000, '2026-09-05', transporte),
    income(100000, '2026-09-05', salario),
  ];
  const previous = [
    expense(20000, '2026-08-15', mercado),
    expense(20000, '2026-08-20', viagem),
    income(90000, '2026-08-05', salario),
    income(5000, '2026-08-20', freela),
  ];
  const report = new MonthlyReport(SEPTEMBER, current, previous, categories);

  it('soma receitas, despesas e o resultado', () => {
    expect(report.incomeInCents).toBe(100000);
    expect(report.expenseInCents).toBe(50000);
    expect(report.resultInCents).toBe(50000);
  });

  it('compara as despesas com o mês anterior', () => {
    expect(report.previousExpenseInCents).toBe(40000);
    expect(report.expenseDifferenceInCents).toBe(10000);
    expect(report.expenseChange).toBe(0.25);
  });

  it('não conta transferência nem ajuste como receita ou despesa', () => {
    const transfer = Transaction.create({
      userId: USER,
      kind: 'TRANSFER',
      description: 'Guardar',
      amountInCents: 99999,
      date: '2026-09-15',
      accountId: CHECKING,
      toAccountId: RESERVE,
    });
    const adjustment = Transaction.create({
      userId: USER,
      kind: 'ADJUSTMENT',
      description: 'Rendimento',
      amountInCents: 77777,
      date: '2026-09-16',
      accountId: RESERVE,
    });
    const withMovements = new MonthlyReport(
      SEPTEMBER,
      [...current, transfer, adjustment],
      previous,
      categories,
    );

    expect(withMovements.incomeInCents).toBe(100000);
    expect(withMovements.expenseInCents).toBe(50000);
    expect(withMovements.transactions).toHaveLength(6);
  });

  it('separa as despesas fixas das variáveis', () => {
    const mixed = new MonthlyReport(
      SEPTEMBER,
      [...current, expense(200000, '2026-09-05', mercado, randomUUID())],
      previous,
      categories,
    );

    expect(mixed.expenseInCents).toBe(250000);
    expect(mixed.fixedExpenseInCents).toBe(200000);
    expect(mixed.variableExpenseInCents).toBe(50000);
    expect(report.fixedExpenseInCents).toBe(0);
    expect(report.variableExpenseInCents).toBe(50000);
  });

  it('inclui categorias de despesa dos dois meses, do maior para o menor', () => {
    expect(report.expenseCategories).toEqual([
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

  it('mantém as categorias de receita numa lista própria', () => {
    expect(report.incomeCategories.map((c) => c.categoryName)).toEqual([
      'Salário',
      'Freela',
    ]);
    expect(report.incomeCategories[0]).toMatchObject({
      totalInCents: 100000,
      previousTotalInCents: 90000,
      share: 1,
    });
    expect(
      report.expenseCategories.some((c) => c.categoryId === salario.id),
    ).toBe(false);
  });

  it('ordena os lançamentos por data e, no empate, por criação', () => {
    // Datas de criação explícitas: dois create() no mesmo milissegundo empatariam.
    const sameDay = (description: string, createdAt: Date) =>
      new Transaction({
        id: randomUUID(),
        userId: USER,
        kind: 'EXPENSE',
        description,
        amountInCents: 100,
        date: '2026-09-20',
        categoryId: mercado.id,
        accountId: CHECKING,
        cardId: null,
        toAccountId: null,
        toCardId: null,
        invoiceMonth: null,
        purchaseId: null,
        installmentNumber: null,
        installmentCount: null,
        recurringId: null,
        createdAt,
      });
    const first = sameDay('a', new Date('2026-09-20T10:00:00Z'));
    const second = sameDay('b', new Date('2026-09-20T11:00:00Z'));
    const early = expense(100, '2026-09-01', mercado);
    const sorted = new MonthlyReport(
      SEPTEMBER,
      [second, early, first],
      [],
      categories,
    );

    expect(sorted.transactions.map((t) => t.id)).toEqual([
      early.id,
      first.id,
      second.id,
    ]);
  });

  it('não calcula variação quando o mês anterior foi zero', () => {
    const empty = new MonthlyReport(SEPTEMBER, current, [], categories);

    expect(empty.expenseChange).toBeNull();
    expect(empty.expenseCategories.every((c) => c.change === null)).toBe(true);
  });

  it('não calcula participação quando o mês não teve movimento do tipo', () => {
    const quiet = new MonthlyReport(SEPTEMBER, [], previous, categories);

    expect(quiet.expenseInCents).toBe(0);
    expect(quiet.expenseChange).toBe(-1);
    expect(quiet.expenseCategories.every((c) => c.share === null)).toBe(true);
    expect(quiet.incomeCategories.every((c) => c.share === null)).toBe(true);
  });

  it('falha quando um lançamento aponta para uma categoria desconhecida', () => {
    const orphan = Transaction.create({
      userId: USER,
      kind: 'EXPENSE',
      description: 'gasto',
      amountInCents: 100,
      date: '2026-09-01',
      categoryId: randomUUID(),
      accountId: CHECKING,
    });

    expect(
      () => new MonthlyReport(SEPTEMBER, [orphan], [], categories),
    ).toThrow(/categoria desconhecido/);
  });
});
