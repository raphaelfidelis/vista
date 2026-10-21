import { BudgetLimit } from './BudgetLimit';
import { BudgetOverride } from './BudgetOverride';
import { Category } from './Category';
import { Month } from './Month';
import { MonthlyBudget } from './MonthlyBudget';

const USER = '11111111-1111-4111-8111-111111111111';

const mercado = Category.create({
  userId: USER,
  name: 'Mercado',
  kind: 'EXPENSE',
});
const lazer = Category.create({ userId: USER, name: 'Lazer', kind: 'EXPENSE' });
const transporte = Category.create({
  userId: USER,
  name: 'Transporte',
  kind: 'EXPENSE',
});
const categories = [mercado, lazer, transporte];
const DECEMBER = Month.parse('2026-12');

function budget(
  limits: [Category, number][],
  spent: [Category, number][],
  overrides: [Category, number][] = [],
) {
  return new MonthlyBudget(
    DECEMBER,
    categories,
    limits.map(
      ([category, amount]) => new BudgetLimit(USER, category.id, amount),
    ),
    overrides.map(
      ([category, amount]) =>
        new BudgetOverride(USER, category.id, '2026-12', amount),
    ),
    new Map(spent.map(([category, amount]) => [category.id, amount])),
  );
}

describe('MonthlyBudget', () => {
  describe('status', () => {
    it.each([
      [0, 'OK'],
      [79999, 'OK'],
      [80000, 'WARNING'],
      [95000, 'WARNING'],
      [100000, 'WARNING'],
      [100001, 'OVER'],
      [250000, 'OVER'],
    ])('gastar %p de um limite de 100000 é %s', (spent, status) => {
      const item = budget([[mercado, 100000]], [[mercado, spent]]).items[0];

      expect(item?.status).toBe(status);
    });
  });

  it('calcula gasto, restante e proporção', () => {
    const item = budget([[mercado, 80000]], [[mercado, 60000]]).items[0];

    expect(item).toMatchObject({
      categoryName: 'Mercado',
      limitInCents: 80000,
      defaultLimitInCents: 80000,
      isOverride: false,
      spentInCents: 60000,
      remainingInCents: 20000,
      ratio: 0.75,
    });
  });

  it('o restante fica negativo quando estoura', () => {
    const item = budget([[mercado, 50000]], [[mercado, 65000]]).items[0];

    expect(item?.remainingInCents).toBe(-15000);
    expect(item?.ratio).toBeCloseTo(1.3);
  });

  it('a exceção do mês vale no lugar do padrão', () => {
    const item = budget([[lazer, 30000]], [[lazer, 40000]], [[lazer, 90000]])
      .items[0];

    expect(item).toMatchObject({
      limitInCents: 90000,
      defaultLimitInCents: 30000,
      isOverride: true,
      status: 'OK',
    });
  });

  it('aceita exceção numa categoria sem limite padrão', () => {
    const result = budget([], [[lazer, 10000]], [[lazer, 50000]]);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      limitInCents: 50000,
      defaultLimitInCents: null,
      isOverride: true,
    });
  });

  it('lista à parte as categorias sem limite, das que mais gastaram para as que menos', () => {
    const result = budget(
      [[mercado, 100000]],
      [
        [lazer, 20000],
        [transporte, 35000],
      ],
    );

    expect(
      result.unbudgeted.map((c) => [c.categoryName, c.spentInCents]),
    ).toEqual([
      ['Transporte', 35000],
      ['Lazer', 20000],
    ]);
    expect(result.items.map((i) => i.categoryName)).toEqual(['Mercado']);
  });

  it('categoria sem gasto no mês gasta zero', () => {
    const result = budget([[mercado, 100000]], []);

    expect(result.items[0]?.spentInCents).toBe(0);
    expect(result.unbudgeted.every((c) => c.spentInCents === 0)).toBe(true);
  });

  it('ordena do mais perto de estourar para o mais folgado', () => {
    const result = budget(
      [
        [mercado, 100000],
        [lazer, 100000],
        [transporte, 100000],
      ],
      [
        [mercado, 20000],
        [lazer, 120000],
        [transporte, 85000],
      ],
    );

    expect(result.items.map((i) => i.categoryName)).toEqual([
      'Lazer',
      'Transporte',
      'Mercado',
    ]);
  });

  it('soma limites e gastos só das categorias com limite', () => {
    const result = budget(
      [
        [mercado, 100000],
        [lazer, 50000],
      ],
      [
        [mercado, 30000],
        [lazer, 10000],
        [transporte, 99999],
      ],
    );

    expect(result.totalLimitInCents).toBe(150000);
    expect(result.totalSpentInCents).toBe(40000);
  });

  it('a exceção entra no total do mês', () => {
    const result = budget([[mercado, 100000]], [], [[mercado, 200000]]);

    expect(result.totalLimitInCents).toBe(200000);
  });
});
