import { ExpenseValidationError } from './Errors/ExpenseValidation.error';
import { ExpenseCategory } from './ExpenseCategory';

describe('ExpenseCategory', () => {
  it('cria com id e nome sem espaços nas pontas', () => {
    const category = ExpenseCategory.create('  Mercado  ');

    expect(category.name).toBe('Mercado');
    expect(category.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it.each(['', '   ', undefined])('recusa nome %p', (name) => {
    expect(() => ExpenseCategory.create(name as unknown as string)).toThrow(
      ExpenseValidationError,
    );
  });

  it('mantém o nome anterior quando a renomeação é inválida', () => {
    const category = ExpenseCategory.create('Mercado');

    expect(() => {
      category.name = '  ';
    }).toThrow(ExpenseValidationError);
    expect(category.name).toBe('Mercado');
  });

  describe('nameResolver', () => {
    const mercado = ExpenseCategory.create('Mercado');
    const nameOf = ExpenseCategory.nameResolver([mercado]);

    it('resolve o nome pelo id', () => {
      expect(nameOf(mercado.id)).toBe('Mercado');
    });

    it('falha alto quando o id não existe, em vez de devolver um nome vazio', () => {
      expect(() => nameOf('11111111-1111-4111-8111-111111111111')).toThrow(
        /categoria desconhecida/,
      );
    });
  });
});
