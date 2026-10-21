import { Category } from './Category';
import { FinanceValidationError } from './Errors/FinanceValidation.error';

const USER = '11111111-1111-4111-8111-111111111111';

describe('Category', () => {
  it('nasce com id próprio, nome aparado e o tipo informado', () => {
    const category = Category.create({
      userId: USER,
      name: ' Mercado ',
      kind: 'EXPENSE',
    });

    expect(category.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(category.name).toBe('Mercado');
    expect(category.kind).toBe('EXPENSE');
  });

  it('recusa nome vazio ao criar e ao renomear, mantendo o nome', () => {
    expect(() =>
      Category.create({ userId: USER, name: '  ', kind: 'INCOME' }),
    ).toThrow(FinanceValidationError);

    const category = Category.create({
      userId: USER,
      name: 'Salário',
      kind: 'INCOME',
    });

    expect(() => {
      category.name = ' ';
    }).toThrow(FinanceValidationError);
    expect(category.name).toBe('Salário');
  });

  it('renomeia sem mudar o tipo', () => {
    const category = Category.create({
      userId: USER,
      name: 'Freela',
      kind: 'INCOME',
    });

    category.name = 'Bicos';

    expect(category.name).toBe('Bicos');
    expect(category.kind).toBe('INCOME');
  });
});
