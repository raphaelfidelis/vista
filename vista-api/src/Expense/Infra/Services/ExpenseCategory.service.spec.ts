import { ExpenseCategoryAlreadyExistsError } from '../../Domain/Errors/ExpenseCategoryAlreadyExists.error';
import { ExpenseCategoryInUseError } from '../../Domain/Errors/ExpenseCategoryInUse.error';
import { ExpenseCategoryNotFoundError } from '../../Domain/Errors/ExpenseCategoryNotFound.error';
import { ExpenseValidationError } from '../../Domain/Errors/ExpenseValidation.error';
import { Expense } from '../../Domain/Expense';
import { ExpenseCategory } from '../../Domain/ExpenseCategory';
import { Month } from '../../Domain/Month';
import { ExpenseCategoryServiceImpl } from './ExpenseCategory.service';

function setup() {
  const categories = {
    findAll: jest.fn<Promise<ExpenseCategory[]>, []>(),
    findById: jest.fn<Promise<ExpenseCategory | null>, [string]>(),
    findByName: jest.fn<Promise<ExpenseCategory | null>, [string]>(),
    save: jest.fn<Promise<void>, [ExpenseCategory]>(),
    delete: jest.fn<Promise<void>, [string]>(),
  };
  const expenses = {
    findByMonth: jest.fn<Promise<Expense[]>, [Month]>(),
    findById: jest.fn<Promise<Expense | null>, [string]>(),
    existsWithCategory: jest.fn<Promise<boolean>, [string]>(),
    save: jest.fn<Promise<void>, [Expense]>(),
    delete: jest.fn<Promise<void>, [string]>(),
  };

  categories.findByName.mockResolvedValue(null);

  return {
    categories,
    expenses,
    service: new ExpenseCategoryServiceImpl(categories, expenses),
  };
}

describe('ExpenseCategoryServiceImpl', () => {
  describe('create', () => {
    it('salva e devolve a categoria', async () => {
      const { categories, service } = setup();

      const created = await service.create({ name: ' Mercado ' });

      expect(created.name).toBe('Mercado');
      expect(categories.save).toHaveBeenCalledTimes(1);
    });

    it('recusa nome já usado por outra categoria', async () => {
      const { categories, service } = setup();
      categories.findByName.mockResolvedValue(
        ExpenseCategory.create('Mercado'),
      );

      await expect(service.create({ name: 'mercado' })).rejects.toBeInstanceOf(
        ExpenseCategoryAlreadyExistsError,
      );
      expect(categories.save).not.toHaveBeenCalled();
    });

    it('informa o nome da categoria que já existe, não o digitado', async () => {
      const { categories, service } = setup();
      categories.findByName.mockResolvedValue(
        ExpenseCategory.create('Mercado'),
      );

      await expect(service.create({ name: 'mercado' })).rejects.toThrow(
        'Já existe uma categoria de gasto chamada "Mercado"',
      );
    });

    it('recusa nome vazio sem consultar o repositório', async () => {
      const { categories, service } = setup();

      await expect(service.create({ name: '  ' })).rejects.toBeInstanceOf(
        ExpenseValidationError,
      );
      expect(categories.findByName).not.toHaveBeenCalled();
    });
  });

  describe('rename', () => {
    it('permite mudar só as maiúsculas do próprio nome', async () => {
      const { categories, service } = setup();
      const mercado = ExpenseCategory.create('mercado');
      categories.findById.mockResolvedValue(mercado);
      categories.findByName.mockResolvedValue(mercado);

      const renamed = await service.rename(mercado.id, { name: 'Mercado' });

      expect(renamed.name).toBe('Mercado');
      expect(categories.save).toHaveBeenCalledTimes(1);
    });

    it('recusa o nome de outra categoria', async () => {
      const { categories, service } = setup();
      const mercado = ExpenseCategory.create('Mercado');
      categories.findById.mockResolvedValue(mercado);
      categories.findByName.mockResolvedValue(ExpenseCategory.create('Feira'));

      await expect(
        service.rename(mercado.id, { name: 'Feira' }),
      ).rejects.toBeInstanceOf(ExpenseCategoryAlreadyExistsError);
      expect(categories.save).not.toHaveBeenCalled();
    });

    it('falha quando a categoria não existe', async () => {
      const { categories, service } = setup();
      categories.findById.mockResolvedValue(null);

      await expect(
        service.rename('11111111-1111-4111-8111-111111111111', { name: 'X' }),
      ).rejects.toBeInstanceOf(ExpenseCategoryNotFoundError);
    });
  });

  describe('remove', () => {
    it('remove categoria sem gastos', async () => {
      const { categories, expenses, service } = setup();
      const mercado = ExpenseCategory.create('Mercado');
      categories.findById.mockResolvedValue(mercado);
      expenses.existsWithCategory.mockResolvedValue(false);

      await service.remove(mercado.id);

      expect(categories.delete).toHaveBeenCalledWith(mercado.id);
    });

    it('recusa remover categoria com gastos', async () => {
      const { categories, expenses, service } = setup();
      const mercado = ExpenseCategory.create('Mercado');
      categories.findById.mockResolvedValue(mercado);
      expenses.existsWithCategory.mockResolvedValue(true);

      await expect(service.remove(mercado.id)).rejects.toBeInstanceOf(
        ExpenseCategoryInUseError,
      );
      expect(categories.delete).not.toHaveBeenCalled();
    });

    it('falha quando a categoria não existe', async () => {
      const { categories, service } = setup();
      categories.findById.mockResolvedValue(null);

      await expect(
        service.remove('11111111-1111-4111-8111-111111111111'),
      ).rejects.toBeInstanceOf(ExpenseCategoryNotFoundError);
    });
  });
});
