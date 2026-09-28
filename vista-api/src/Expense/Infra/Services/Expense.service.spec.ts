import { ExpenseCategoryNotFoundError } from '../../Domain/Errors/ExpenseCategoryNotFound.error';
import { ExpenseNotFoundError } from '../../Domain/Errors/ExpenseNotFound.error';
import { ExpenseValidationError } from '../../Domain/Errors/ExpenseValidation.error';
import { Expense } from '../../Domain/Expense';
import { ExpenseCategory } from '../../Domain/ExpenseCategory';
import { Month } from '../../Domain/Month';
import { ExpenseServiceImpl } from './Expense.service';

const mercado = ExpenseCategory.create('Mercado');
const transporte = ExpenseCategory.create('Transporte');

function setup() {
  const expenses = {
    findByMonth: jest.fn<Promise<Expense[]>, [Month]>(),
    findById: jest.fn<Promise<Expense | null>, [string]>(),
    existsWithCategory: jest.fn<Promise<boolean>, [string]>(),
    save: jest.fn<Promise<void>, [Expense]>(),
    delete: jest.fn<Promise<void>, [string]>(),
  };
  const categories = {
    findAll: jest.fn<Promise<ExpenseCategory[]>, []>(),
    findById: jest.fn<Promise<ExpenseCategory | null>, [string]>(),
    findByName: jest.fn<Promise<ExpenseCategory | null>, [string]>(),
    save: jest.fn<Promise<void>, [ExpenseCategory]>(),
    delete: jest.fn<Promise<void>, [string]>(),
  };

  const known = new Map([mercado, transporte].map((c) => [c.id, c]));
  categories.findById.mockImplementation((id) =>
    Promise.resolve(known.get(id) ?? null),
  );

  return {
    expenses,
    categories,
    service: new ExpenseServiceImpl(expenses, categories),
  };
}

const input = {
  description: 'Compras da semana',
  amountInCents: 25990,
  date: '2026-09-15',
  categoryId: mercado.id,
};

describe('ExpenseServiceImpl', () => {
  describe('create', () => {
    it('salva e devolve o gasto com o nome da categoria', async () => {
      const { expenses, service } = setup();

      const created = await service.create(input);

      expect(created).toMatchObject({
        description: 'Compras da semana',
        amountInCents: 25990,
        date: '2026-09-15',
        categoryName: 'Mercado',
      });
      expect(expenses.save).toHaveBeenCalledTimes(1);
    });

    it('recusa dado inválido antes de tocar o repositório', async () => {
      const { expenses, categories, service } = setup();

      await expect(
        service.create({ ...input, amountInCents: 0 }),
      ).rejects.toBeInstanceOf(ExpenseValidationError);
      expect(categories.findById).not.toHaveBeenCalled();
      expect(expenses.save).not.toHaveBeenCalled();
    });

    it('recusa categoria inexistente', async () => {
      const { expenses, service } = setup();

      await expect(
        service.create({
          ...input,
          categoryId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(ExpenseCategoryNotFoundError);
      expect(expenses.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('altera só os campos informados', async () => {
      const { expenses, service } = setup();
      const existing = Expense.create(input);
      expenses.findById.mockResolvedValue(existing);

      const updated = await service.update(existing.id, {
        amountInCents: 30000,
        categoryId: transporte.id,
      });

      expect(updated).toMatchObject({
        description: 'Compras da semana',
        amountInCents: 30000,
        date: '2026-09-15',
        categoryName: 'Transporte',
      });
      expect(expenses.save).toHaveBeenCalledTimes(1);
    });

    it('falha quando o gasto não existe', async () => {
      const { expenses, service } = setup();
      expenses.findById.mockResolvedValue(null);

      await expect(
        service.update('11111111-1111-4111-8111-111111111111', {}),
      ).rejects.toBeInstanceOf(ExpenseNotFoundError);
    });

    it('recusa mover para categoria inexistente', async () => {
      const { expenses, service } = setup();
      const existing = Expense.create(input);
      expenses.findById.mockResolvedValue(existing);

      await expect(
        service.update(existing.id, {
          categoryId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(ExpenseCategoryNotFoundError);
      expect(expenses.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('remove o gasto existente', async () => {
      const { expenses, service } = setup();
      const existing = Expense.create(input);
      expenses.findById.mockResolvedValue(existing);

      await service.remove(existing.id);

      expect(expenses.delete).toHaveBeenCalledWith(existing.id);
    });

    it('falha quando o gasto não existe', async () => {
      const { expenses, service } = setup();
      expenses.findById.mockResolvedValue(null);

      await expect(
        service.remove('11111111-1111-4111-8111-111111111111'),
      ).rejects.toBeInstanceOf(ExpenseNotFoundError);
      expect(expenses.delete).not.toHaveBeenCalled();
    });
  });
});
