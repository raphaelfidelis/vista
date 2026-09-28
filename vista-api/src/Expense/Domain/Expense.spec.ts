import { ExpenseValidationError } from './Errors/ExpenseValidation.error';
import { Expense, NewExpense } from './Expense';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

function newExpense(
  overrides: Partial<Record<keyof NewExpense, unknown>> = {},
) {
  return Expense.create({
    description: 'Mercado',
    amountInCents: 1250,
    date: '2026-09-15',
    categoryId: CATEGORY_ID,
    ...overrides,
  } as NewExpense);
}

describe('Expense', () => {
  it('cria um gasto válido', () => {
    const expense = newExpense({
      description: '  Mercado  ',
      categoryId: CATEGORY_ID.toUpperCase(),
    });

    expect(expense.description).toBe('Mercado');
    expect(expense.amountInCents).toBe(1250);
    expect(expense.date).toBe('2026-09-15');
    expect(expense.categoryId).toBe(CATEGORY_ID);
    expect(expense.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it.each([0, -100, 12.5, '1250', 2_147_483_648, NaN, Infinity])(
    'recusa o valor %p',
    (amountInCents) => {
      expect(() => newExpense({ amountInCents })).toThrow(
        ExpenseValidationError,
      );
    },
  );

  it('aceita o maior valor que cabe na coluna integer', () => {
    expect(newExpense({ amountInCents: 2_147_483_647 }).amountInCents).toBe(
      2_147_483_647,
    );
  });

  it.each(['', '   ', undefined])('recusa a descrição %p', (description) => {
    expect(() => newExpense({ description })).toThrow(ExpenseValidationError);
  });

  it.each([
    '2026-02-30',
    '2026-02-29',
    '2026-13-01',
    '2026-9-1',
    '15/09/2026',
    '',
  ])('recusa a data %p', (date) => {
    expect(() => newExpense({ date })).toThrow(ExpenseValidationError);
  });

  it('aceita 29 de fevereiro em ano bissexto', () => {
    expect(newExpense({ date: '2024-02-29' }).date).toBe('2024-02-29');
  });

  // Um gasto fora da faixa do Month seria gravado mas nunca listado, e
  // bloquearia para sempre a remoção da própria categoria.
  it.each(['1899-12-31', '1850-06-15', '0000-01-01'])(
    'recusa a data %p, que nenhuma consulta de mês alcançaria',
    (date) => {
      expect(() => newExpense({ date })).toThrow(ExpenseValidationError);
    },
  );

  it.each(['1900-01-01', '9999-12-31'])(
    'aceita a data %p, no limite da faixa',
    (date) => {
      expect(newExpense({ date }).date).toBe(date);
    },
  );

  it.each(['abc', '', 42])('recusa a categoria %p', (categoryId) => {
    expect(() => newExpense({ categoryId })).toThrow(ExpenseValidationError);
  });

  it('mantém o valor anterior quando uma alteração é inválida', () => {
    const expense = newExpense();

    expect(() => {
      expense.amountInCents = -1;
    }).toThrow(ExpenseValidationError);
    expect(() => {
      expense.date = '2026-02-30';
    }).toThrow(ExpenseValidationError);

    expect(expense.amountInCents).toBe(1250);
    expect(expense.date).toBe('2026-09-15');
  });
});
