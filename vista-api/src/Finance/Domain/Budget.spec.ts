import { BudgetLimit } from './BudgetLimit';
import { BudgetOverride } from './BudgetOverride';
import { FinanceValidationError } from './Errors/FinanceValidation.error';

const USER = '11111111-1111-4111-8111-111111111111';

const CATEGORY = '11111111-1111-4111-8111-111111111111';

describe('BudgetLimit', () => {
  it('guarda a categoria e o valor', () => {
    const limit = new BudgetLimit(USER, CATEGORY, 80000);

    expect(limit.categoryId).toBe(CATEGORY);
    expect(limit.amountInCents).toBe(80000);
  });

  it.each([0, -1, 10.5, 2_147_483_648])('recusa o valor %p', (amount) => {
    expect(() => new BudgetLimit(USER, CATEGORY, amount)).toThrow(
      FinanceValidationError,
    );
  });
});

describe('BudgetOverride', () => {
  it('guarda a categoria, o mês e o valor', () => {
    const override = new BudgetOverride(USER, CATEGORY, '2026-12', 150000);

    expect(override.month).toBe('2026-12');
    expect(override.amountInCents).toBe(150000);
  });

  it.each(['2026-13', '2026-1', 'dezembro', '2026-12-01'])(
    'recusa o mês %p',
    (month) => {
      expect(() => new BudgetOverride(USER, CATEGORY, month, 100)).toThrow(
        FinanceValidationError,
      );
    },
  );

  it('recusa valor inválido', () => {
    expect(() => new BudgetOverride(USER, CATEGORY, '2026-12', 0)).toThrow(
      FinanceValidationError,
    );
  });
});
