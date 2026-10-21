import { BudgetLimit } from '../../Domain/BudgetLimit';
import { BudgetOverride } from '../../Domain/BudgetOverride';
import { Category, CategoryKind } from '../../Domain/Category';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { Month } from '../../Domain/Month';
import { Recurring } from '../../Domain/Recurring';
import { Transaction } from '../../Domain/Transaction';
import { CategoryServiceImpl } from './Category.service';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '99999999-9999-4999-8999-999999999999';

function budgetRepository() {
  return {
    findLimits: jest.fn<Promise<BudgetLimit[]>, [string]>(),
    findLimit: jest.fn<Promise<BudgetLimit | null>, [string, string]>(),
    findOverrides: jest.fn<Promise<BudgetOverride[]>, [string, Month]>(),
    findOverride: jest.fn<
      Promise<BudgetOverride | null>,
      [string, string, Month]
    >(),
    existsWithCategory: jest.fn<Promise<boolean>, [string, string]>(),
    saveLimit: jest.fn<Promise<void>, [BudgetLimit]>(),
    deleteLimit: jest.fn<Promise<void>, [string, string]>(),
    saveOverride: jest.fn<Promise<void>, [BudgetOverride]>(),
    deleteOverride: jest.fn<Promise<void>, [string, string, Month]>(),
  };
}

function categoryRepository() {
  return {
    findAll: jest.fn<Promise<Category[]>, [string, CategoryKind?]>(),
    findById: jest.fn<Promise<Category | null>, [string, string]>(),
    findByName: jest.fn<
      Promise<Category | null>,
      [string, string, CategoryKind]
    >(),
    save: jest.fn<Promise<void>, [Category]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
}

function transactionRepository() {
  return {
    findByMonth: jest.fn<Promise<Transaction[]>, [string, Month]>(),
    findAll: jest.fn<Promise<Transaction[]>, [string]>(),
    findByAccount: jest.fn<Promise<Transaction[]>, [string, string]>(),
    findByCard: jest.fn<Promise<Transaction[]>, [string, string]>(),
    findByPurchase: jest.fn<Promise<Transaction[]>, [string, string]>(),
    findById: jest.fn<Promise<Transaction | null>, [string, string]>(),
    existsWithCategory: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithAccount: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithCard: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithRecurring: jest.fn<Promise<boolean>, [string, string]>(),
    existsForRecurringInMonth: jest.fn<
      Promise<boolean>,
      [string, string, Month, string?]
    >(),
    findLaunchedRecurringIds: jest.fn<Promise<string[]>, [string, Month]>(),
    save: jest.fn<Promise<void>, [Transaction]>(),
    saveAll: jest.fn<Promise<void>, [Transaction[]]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
    deleteByPurchase: jest.fn<Promise<void>, [string, string]>(),
  };
}

function recurringRepository() {
  return {
    findAll: jest.fn<Promise<Recurring[]>, [string]>(),
    findById: jest.fn<Promise<Recurring | null>, [string, string]>(),
    existsWithCategory: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithAccount: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithCard: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Recurring]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
}

function setup() {
  const categories = categoryRepository();
  const transactions = transactionRepository();
  const recurring = recurringRepository();
  const budgets = budgetRepository();

  budgets.existsWithCategory.mockResolvedValue(false);
  categories.findByName.mockResolvedValue(null);
  transactions.existsWithCategory.mockResolvedValue(false);
  recurring.existsWithCategory.mockResolvedValue(false);

  return {
    categories,
    transactions,
    recurring,
    budgets,
    service: new CategoryServiceImpl(
      categories,
      transactions,
      recurring,
      budgets,
    ),
  };
}

describe('CategoryServiceImpl', () => {
  describe('create', () => {
    it('salva com o tipo e devolve a categoria', async () => {
      const { categories, service } = setup();

      const created = await service.create(USER, {
        name: ' Salário ',
        kind: 'INCOME',
      });

      expect(created).toMatchObject({ name: 'Salário', kind: 'INCOME' });
      expect(categories.save).toHaveBeenCalledTimes(1);
    });

    it('confere o nome dentro do mesmo tipo', async () => {
      const { categories, service } = setup();

      await service.create(USER, { name: 'Mercado', kind: 'EXPENSE' });

      expect(categories.findByName).toHaveBeenCalledWith(
        USER,
        'Mercado',
        'EXPENSE',
      );
    });

    it('recusa nome já usado no tipo, citando o nome que existe', async () => {
      const { categories, service } = setup();
      categories.findByName.mockResolvedValue(
        Category.create({ userId: USER, name: 'Mercado', kind: 'EXPENSE' }),
      );

      await expect(
        service.create(USER, { name: 'mercado', kind: 'EXPENSE' }),
      ).rejects.toThrow('Já existe uma categoria chamada "Mercado"');
      await expect(
        service.create(USER, { name: 'mercado', kind: 'EXPENSE' }),
      ).rejects.toBeInstanceOf(FinanceDuplicateError);
      expect(categories.save).not.toHaveBeenCalled();
    });
  });

  describe('rename', () => {
    it('renomeia sem mudar o tipo', async () => {
      const { categories, service } = setup();
      const freela = Category.create({
        userId: USER,
        name: 'Freela',
        kind: 'INCOME',
      });
      categories.findById.mockResolvedValue(freela);

      const renamed = await service.rename(USER, freela.id, { name: 'Bicos' });

      expect(renamed).toMatchObject({ name: 'Bicos', kind: 'INCOME' });
      expect(categories.findByName).toHaveBeenCalledWith(
        USER,
        'Bicos',
        'INCOME',
      );
    });

    it('permite manter o nome, mudando só as maiúsculas', async () => {
      const { categories, service } = setup();
      const mercado = Category.create({
        userId: USER,
        name: 'Mercado',
        kind: 'EXPENSE',
      });
      categories.findById.mockResolvedValue(mercado);
      categories.findByName.mockResolvedValue(mercado);

      const renamed = await service.rename(USER, mercado.id, {
        name: 'MERCADO',
      });

      expect(renamed.name).toBe('MERCADO');
    });

    it('recusa o nome de outra categoria do mesmo tipo', async () => {
      const { categories, service } = setup();
      const mercado = Category.create({
        userId: USER,
        name: 'Mercado',
        kind: 'EXPENSE',
      });
      categories.findById.mockResolvedValue(mercado);
      categories.findByName.mockResolvedValue(
        Category.create({ userId: USER, name: 'Lazer', kind: 'EXPENSE' }),
      );

      await expect(
        service.rename(USER, mercado.id, { name: 'lazer' }),
      ).rejects.toBeInstanceOf(FinanceDuplicateError);
      expect(categories.save).not.toHaveBeenCalled();
    });

    it('falha quando a categoria não existe', async () => {
      const { categories, service } = setup();
      categories.findById.mockResolvedValue(null);

      await expect(
        service.rename(USER, '11111111-1111-4111-8111-111111111111', {
          name: 'X',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('remove', () => {
    it('remove categoria sem uso', async () => {
      const { categories, service } = setup();
      const mercado = Category.create({
        userId: USER,
        name: 'Mercado',
        kind: 'EXPENSE',
      });
      categories.findById.mockResolvedValue(mercado);

      await service.remove(USER, mercado.id);

      expect(categories.delete).toHaveBeenCalledWith(USER, mercado.id);
    });

    it('recusa remover categoria com lançamentos', async () => {
      const { categories, transactions, service } = setup();
      const mercado = Category.create({
        userId: USER,
        name: 'Mercado',
        kind: 'EXPENSE',
      });
      categories.findById.mockResolvedValue(mercado);
      transactions.existsWithCategory.mockResolvedValue(true);

      await expect(service.remove(USER, mercado.id)).rejects.toBeInstanceOf(
        FinanceInUseError,
      );
      expect(categories.delete).not.toHaveBeenCalled();
    });

    it('recusa remover categoria com orçamento', async () => {
      const { categories, budgets, service } = setup();
      const mercado = Category.create({
        userId: USER,
        name: 'Mercado',
        kind: 'EXPENSE',
      });
      categories.findById.mockResolvedValue(mercado);
      budgets.existsWithCategory.mockResolvedValue(true);

      await expect(service.remove(USER, mercado.id)).rejects.toThrow(
        'orçamento',
      );
      expect(categories.delete).not.toHaveBeenCalled();
    });

    it('recusa remover categoria usada por um gasto fixo', async () => {
      const { categories, recurring, service } = setup();
      const mercado = Category.create({
        userId: USER,
        name: 'Mercado',
        kind: 'EXPENSE',
      });
      categories.findById.mockResolvedValue(mercado);
      recurring.existsWithCategory.mockResolvedValue(true);

      await expect(service.remove(USER, mercado.id)).rejects.toBeInstanceOf(
        FinanceInUseError,
      );
      expect(categories.delete).not.toHaveBeenCalled();
    });

    it('falha quando a categoria não existe', async () => {
      const { categories, service } = setup();
      categories.findById.mockResolvedValue(null);

      await expect(
        service.remove(USER, '11111111-1111-4111-8111-111111111111'),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('isolamento por usuário', () => {
    it('a categoria nasce do dono da sessão, mesmo que o corpo diga outro', async () => {
      const { categories, service } = setup();
      categories.findByName.mockResolvedValue(null);

      await service.create(OTHER, {
        name: 'Mercado',
        kind: 'EXPENSE',
        userId: USER,
      } as never);

      expect(categories.save.mock.calls[0]?.[0].userId).toBe(OTHER);
      expect(categories.findByName).toHaveBeenCalledWith(
        OTHER,
        'Mercado',
        'EXPENSE',
      );
    });

    it('a categoria de outro usuário não existe: não renomeia nem remove', async () => {
      const { categories, service } = setup();
      const known = [
        Category.create({ userId: USER, name: 'Lazer', kind: 'EXPENSE' }),
      ];
      categories.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );

      await expect(
        service.rename(OTHER, known[0].id, { name: 'Hackeada' }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(service.remove(OTHER, known[0].id)).rejects.toBeInstanceOf(
        FinanceNotFoundError,
      );
      expect(categories.save).not.toHaveBeenCalled();
      expect(categories.delete).not.toHaveBeenCalled();
    });
  });
});
