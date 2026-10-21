import { BudgetLimit } from '../../Domain/BudgetLimit';
import { BudgetOverride } from '../../Domain/BudgetOverride';
import { Category, CategoryKind } from '../../Domain/Category';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { Month } from '../../Domain/Month';
import { BudgetServiceImpl } from './Budget.service';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '99999999-9999-4999-8999-999999999999';

const mercado = Category.create({
  userId: USER,
  name: 'Mercado',
  kind: 'EXPENSE',
});
const salario = Category.create({
  userId: USER,
  name: 'Salário',
  kind: 'INCOME',
});

function setup() {
  const budgets = {
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
  const categories = {
    findAll: jest.fn<Promise<Category[]>, [string, CategoryKind?]>(),
    findById: jest.fn<Promise<Category | null>, [string, string]>(),
    findByName: jest.fn<
      Promise<Category | null>,
      [string, string, CategoryKind]
    >(),
    save: jest.fn<Promise<void>, [Category]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
  const known = [mercado, salario];

  categories.findById.mockImplementation((_, id) =>
    Promise.resolve(known.find((c) => c.id === id) ?? null),
  );

  return {
    budgets,
    categories,
    service: new BudgetServiceImpl(budgets, categories),
  };
}

describe('BudgetServiceImpl', () => {
  describe('setLimit', () => {
    it('salva o limite padrão da categoria de despesa', async () => {
      const { budgets, service } = setup();

      await service.setLimit(USER, mercado.id, 80000);

      expect(budgets.saveLimit).toHaveBeenCalledTimes(1);
      const saved = budgets.saveLimit.mock.calls[0]?.[0];
      expect(saved).toMatchObject({
        categoryId: mercado.id,
        amountInCents: 80000,
      });
    });

    it('recusa valor inválido antes de tocar os repositórios', async () => {
      const { budgets, categories, service } = setup();

      await expect(
        service.setLimit(USER, mercado.id, 0),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(categories.findById).not.toHaveBeenCalled();
      expect(budgets.saveLimit).not.toHaveBeenCalled();
    });

    it('recusa categoria de receita e categoria inexistente', async () => {
      const { budgets, service } = setup();

      await expect(service.setLimit(USER, salario.id, 1000)).rejects.toThrow(
        'só despesa tem orçamento',
      );
      await expect(
        service.setLimit(USER, '11111111-1111-4111-8111-111111111111', 1000),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(budgets.saveLimit).not.toHaveBeenCalled();
    });
  });

  describe('removeLimit', () => {
    it('remove o limite existente', async () => {
      const { budgets, service } = setup();
      budgets.findLimit.mockResolvedValue(
        new BudgetLimit(USER, mercado.id, 1000),
      );

      await service.removeLimit(USER, mercado.id);

      expect(budgets.deleteLimit).toHaveBeenCalledWith(USER, mercado.id);
    });

    it('falha quando não há limite', async () => {
      const { budgets, service } = setup();
      budgets.findLimit.mockResolvedValue(null);

      await expect(
        service.removeLimit(USER, mercado.id),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(budgets.deleteLimit).not.toHaveBeenCalled();
    });
  });

  describe('setOverride', () => {
    it('salva a exceção do mês', async () => {
      const { budgets, service } = setup();

      await service.setOverride(USER, mercado.id, '2026-12', 150000);

      const saved = budgets.saveOverride.mock.calls[0]?.[0];
      expect(saved).toMatchObject({
        categoryId: mercado.id,
        month: '2026-12',
        amountInCents: 150000,
      });
    });

    it('recusa mês inválido, valor inválido e categoria de receita', async () => {
      const { budgets, service } = setup();

      await expect(
        service.setOverride(USER, mercado.id, '2026-13', 1000),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      await expect(
        service.setOverride(USER, mercado.id, '2026-12', -5),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      await expect(
        service.setOverride(USER, salario.id, '2026-12', 1000),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(budgets.saveOverride).not.toHaveBeenCalled();
    });
  });

  describe('removeOverride', () => {
    it('remove a exceção do mês', async () => {
      const { budgets, service } = setup();
      budgets.findOverride.mockResolvedValue(
        new BudgetOverride(USER, mercado.id, '2026-12', 1000),
      );

      await service.removeOverride(USER, mercado.id, '2026-12');

      expect(budgets.deleteOverride).toHaveBeenCalledWith(
        USER,
        mercado.id,
        Month.parse('2026-12'),
      );
    });

    it('falha quando não há exceção naquele mês', async () => {
      const { budgets, service } = setup();
      budgets.findOverride.mockResolvedValue(null);

      await expect(
        service.removeOverride(USER, mercado.id, '2026-12'),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(budgets.deleteOverride).not.toHaveBeenCalled();
    });

    it('recusa mês inválido', async () => {
      const { service } = setup();

      await expect(
        service.removeOverride(USER, mercado.id, 'dezembro'),
      ).rejects.toBeInstanceOf(FinanceValidationError);
    });
  });

  describe('isolamento por usuário', () => {
    it('o limite e a exceção nascem do dono da sessão', async () => {
      const { budgets, categories, service } = setup();
      categories.findById.mockResolvedValue(mercado);

      await service.setLimit(OTHER, mercado.id, 1000);
      await service.setOverride(OTHER, mercado.id, '2026-10', 2000);

      expect(budgets.saveLimit.mock.calls[0]?.[0].userId).toBe(OTHER);
      expect(budgets.saveOverride.mock.calls[0]?.[0].userId).toBe(OTHER);
    });

    it('a categoria de outro usuário não existe: não dá para orçá-la', async () => {
      const { budgets, categories, service } = setup();
      const known = [mercado];
      categories.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );

      await expect(
        service.setLimit(OTHER, mercado.id, 1000),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.setOverride(OTHER, mercado.id, '2026-10', 1000),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(budgets.saveLimit).not.toHaveBeenCalled();
      expect(budgets.saveOverride).not.toHaveBeenCalled();
    });

    it('o orçamento de outro usuário não existe: não remove', async () => {
      const { budgets, service } = setup();
      budgets.findLimit.mockImplementation((userId) =>
        Promise.resolve(
          userId === USER ? new BudgetLimit(USER, mercado.id, 1) : null,
        ),
      );
      budgets.findOverride.mockImplementation((userId) =>
        Promise.resolve(
          userId === USER
            ? new BudgetOverride(USER, mercado.id, '2026-10', 1)
            : null,
        ),
      );

      await expect(
        service.removeLimit(OTHER, mercado.id),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.removeOverride(OTHER, mercado.id, '2026-10'),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(budgets.deleteLimit).not.toHaveBeenCalled();
      expect(budgets.deleteOverride).not.toHaveBeenCalled();
    });
  });
});
