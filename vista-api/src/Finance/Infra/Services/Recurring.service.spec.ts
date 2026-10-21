import { Account } from '../../Domain/Account';
import { Card } from '../../Domain/Card';
import { Category, CategoryKind } from '../../Domain/Category';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { Month } from '../../Domain/Month';
import { Recurring } from '../../Domain/Recurring';
import { Transaction } from '../../Domain/Transaction';
import { RecurringServiceImpl } from './Recurring.service';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '99999999-9999-4999-8999-999999999999';

const moradia = Category.create({
  userId: USER,
  name: 'Moradia',
  kind: 'EXPENSE',
});
const contas = Category.create({
  userId: USER,
  name: 'Contas',
  kind: 'EXPENSE',
});
const salario = Category.create({
  userId: USER,
  name: 'Salário',
  kind: 'INCOME',
});
const corrente = Account.create({
  userId: USER,
  name: 'Corrente',
  type: 'CHECKING',
  initialBalanceDate: '2026-10-01',
});
const poupanca = Account.create({
  userId: USER,
  name: 'Poupança',
  type: 'RESERVE',
  initialBalanceDate: '2026-10-01',
});
const nubank = Card.create({
  userId: USER,
  name: 'Nubank',
  closingDay: 25,
  dueDay: 5,
});

function setup() {
  const recurring = {
    findAll: jest.fn<Promise<Recurring[]>, [string]>(),
    findById: jest.fn<Promise<Recurring | null>, [string, string]>(),
    existsWithCategory: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithAccount: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithCard: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Recurring]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
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
  const accounts = {
    findAll: jest.fn<Promise<Account[]>, [string]>(),
    findById: jest.fn<Promise<Account | null>, [string, string]>(),
    findByName: jest.fn<Promise<Account | null>, [string, string]>(),
    existsWithBank: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Account]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
  const cards = {
    findAll: jest.fn<Promise<Card[]>, [string]>(),
    findById: jest.fn<Promise<Card | null>, [string, string]>(),
    findByName: jest.fn<Promise<Card | null>, [string, string]>(),
    existsWithBank: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Card]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
  const transactions = {
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

  const knownCategories = [moradia, contas, salario];
  const knownAccounts = [corrente, poupanca];
  categories.findById.mockImplementation((_, id) =>
    Promise.resolve(knownCategories.find((c) => c.id === id) ?? null),
  );
  accounts.findById.mockImplementation((_, id) =>
    Promise.resolve(knownAccounts.find((a) => a.id === id) ?? null),
  );
  cards.findById.mockImplementation((_, id) =>
    Promise.resolve(id === nubank.id ? nubank : null),
  );
  transactions.existsWithRecurring.mockResolvedValue(false);

  return {
    recurring,
    categories,
    accounts,
    cards,
    transactions,
    service: new RecurringServiceImpl(
      recurring,
      categories,
      accounts,
      cards,
      transactions,
    ),
  };
}

const rent = {
  description: 'Aluguel',
  kind: 'EXPENSE' as const,
  categoryId: moradia.id,
  accountId: corrente.id,
  amountInCents: 200000,
  variableAmount: false,
  dueDay: 5,
};

describe('RecurringServiceImpl', () => {
  describe('create', () => {
    it('salva e devolve o gasto fixo com os nomes da categoria e da conta', async () => {
      const { recurring, service } = setup();

      const created = await service.create(USER, rent);

      expect(created).toMatchObject({
        description: 'Aluguel',
        kind: 'EXPENSE',
        categoryName: 'Moradia',
        accountName: 'Corrente',
        cardId: null,
        cardName: null,
        amountInCents: 200000,
        variableAmount: false,
        dueDay: 5,
        active: true,
      });
      expect(recurring.save).toHaveBeenCalledTimes(1);
    });

    it('cria despesa fixa no cartão', async () => {
      const { service } = setup();

      const created = await service.create(USER, {
        ...rent,
        accountId: null,
        cardId: nubank.id,
      });

      expect(created).toMatchObject({
        accountId: null,
        accountName: null,
        cardName: 'Nubank',
      });
    });

    it('cria receita fixa com categoria de receita', async () => {
      const { service } = setup();

      const created = await service.create(USER, {
        ...rent,
        description: 'Salário',
        kind: 'INCOME',
        categoryId: salario.id,
      });

      expect(created).toMatchObject({
        kind: 'INCOME',
        categoryName: 'Salário',
      });
    });

    it('recusa categoria de outro tipo', async () => {
      const { recurring, service } = setup();

      await expect(
        service.create(USER, { ...rent, kind: 'INCOME' }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(recurring.save).not.toHaveBeenCalled();
    });

    it('recusa receita no cartão', async () => {
      const { recurring, service } = setup();

      await expect(
        service.create(USER, {
          ...rent,
          kind: 'INCOME',
          categoryId: salario.id,
          accountId: null,
          cardId: nubank.id,
        }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(recurring.save).not.toHaveBeenCalled();
    });

    it('recusa dado inválido antes de tocar o repositório', async () => {
      const { recurring, categories, service } = setup();

      await expect(
        service.create(USER, { ...rent, amountInCents: null }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(categories.findById).not.toHaveBeenCalled();
      expect(recurring.save).not.toHaveBeenCalled();
    });

    it('recusa categoria, conta e cartão inexistentes', async () => {
      const { recurring, service } = setup();
      const missing = '11111111-1111-4111-8111-111111111111';

      await expect(
        service.create(USER, { ...rent, categoryId: missing }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.create(USER, { ...rent, accountId: missing }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.create(USER, { ...rent, accountId: null, cardId: missing }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(recurring.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('altera só os campos informados', async () => {
      const { recurring, service } = setup();
      const existing = Recurring.create({ ...rent, userId: USER });
      recurring.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        dueDay: 10,
        categoryId: contas.id,
        accountId: poupanca.id,
      });

      expect(updated).toMatchObject({
        description: 'Aluguel',
        amountInCents: 200000,
        dueDay: 10,
        categoryName: 'Contas',
        accountName: 'Poupança',
      });
      expect(recurring.save).toHaveBeenCalledTimes(1);
    });

    it('passa a origem da conta para o cartão', async () => {
      const { recurring, service } = setup();
      const existing = Recurring.create({ ...rent, userId: USER });
      recurring.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        accountId: null,
        cardId: nubank.id,
      });

      expect(updated).toMatchObject({
        accountId: null,
        cardId: nubank.id,
        cardName: 'Nubank',
      });
    });

    it('recusa ficar sem origem ou com as duas', async () => {
      const { recurring, service } = setup();
      const existing = Recurring.create({ ...rent, userId: USER });
      recurring.findById.mockResolvedValue(existing);

      await expect(
        service.update(USER, existing.id, { accountId: null }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      await expect(
        service.update(USER, existing.id, { cardId: nubank.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(recurring.save).not.toHaveBeenCalled();
    });

    it('passa para valor variável apagando a referência', async () => {
      const { recurring, service } = setup();
      const existing = Recurring.create({ ...rent, userId: USER });
      recurring.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        variableAmount: true,
        amountInCents: null,
      });

      expect(updated).toMatchObject({
        variableAmount: true,
        amountInCents: null,
      });
    });

    it('recusa deixar de variar sem informar o valor', async () => {
      const { recurring, service } = setup();
      const existing = Recurring.create({
        userId: USER,
        ...rent,
        variableAmount: true,
        amountInCents: null,
      });
      recurring.findById.mockResolvedValue(existing);

      await expect(
        service.update(USER, existing.id, { variableAmount: false }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(recurring.save).not.toHaveBeenCalled();
    });

    it('desativa o gasto fixo', async () => {
      const { recurring, service } = setup();
      const existing = Recurring.create({ ...rent, userId: USER });
      recurring.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        active: false,
      });

      expect(updated.active).toBe(false);
    });

    it('recusa mover para categoria de outro tipo', async () => {
      const { recurring, service } = setup();
      const existing = Recurring.create({ ...rent, userId: USER });
      recurring.findById.mockResolvedValue(existing);

      await expect(
        service.update(USER, existing.id, { categoryId: salario.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(recurring.save).not.toHaveBeenCalled();
    });

    it('falha quando o gasto fixo não existe', async () => {
      const { recurring, service } = setup();
      recurring.findById.mockResolvedValue(null);

      await expect(
        service.update(USER, '11111111-1111-4111-8111-111111111111', {}),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('remove', () => {
    it('remove gasto fixo sem lançamentos', async () => {
      const { recurring, service } = setup();
      const existing = Recurring.create({ ...rent, userId: USER });
      recurring.findById.mockResolvedValue(existing);

      await service.remove(USER, existing.id);

      expect(recurring.delete).toHaveBeenCalledWith(USER, existing.id);
    });

    it('recusa remover gasto fixo com lançamentos', async () => {
      const { recurring, transactions, service } = setup();
      const existing = Recurring.create({ ...rent, userId: USER });
      recurring.findById.mockResolvedValue(existing);
      transactions.existsWithRecurring.mockResolvedValue(true);

      await expect(service.remove(USER, existing.id)).rejects.toBeInstanceOf(
        FinanceInUseError,
      );
      expect(recurring.delete).not.toHaveBeenCalled();
    });

    it('falha quando o gasto fixo não existe', async () => {
      const { recurring, service } = setup();
      recurring.findById.mockResolvedValue(null);

      await expect(
        service.remove(USER, '11111111-1111-4111-8111-111111111111'),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(recurring.delete).not.toHaveBeenCalled();
    });
  });

  describe('isolamento por usuário', () => {
    const input = {
      description: 'Aluguel',
      kind: 'EXPENSE' as const,
      categoryId: moradia.id,
      accountId: corrente.id,
      amountInCents: 100000,
      variableAmount: false,
      dueDay: 5,
    };

    it('o gasto fixo nasce do dono da sessão, mesmo que o corpo diga outro', async () => {
      const { recurring, categories, accounts, service } = setup();
      categories.findById.mockResolvedValue(moradia);
      accounts.findById.mockResolvedValue(corrente);

      await service.create(OTHER, { ...input, userId: USER } as never);

      expect(recurring.save.mock.calls[0]?.[0].userId).toBe(OTHER);
    });

    it('categoria, conta e cartão de outro usuário não existem para o gasto fixo', async () => {
      const { recurring, categories, accounts, cards, service } = setup();
      categories.findById.mockImplementation((userId, id) =>
        Promise.resolve(userId === USER && id === moradia.id ? moradia : null),
      );
      accounts.findById.mockImplementation((userId, id) =>
        Promise.resolve(
          userId === USER && id === corrente.id ? corrente : null,
        ),
      );
      cards.findById.mockImplementation((userId, id) =>
        Promise.resolve(userId === USER && id === nubank.id ? nubank : null),
      );

      await expect(service.create(OTHER, input)).rejects.toBeInstanceOf(
        FinanceNotFoundError,
      );
      await expect(service.create(USER, input)).resolves.toMatchObject({
        description: 'Aluguel',
      });
      recurring.save.mockClear();
      await expect(
        service.create(OTHER, {
          ...input,
          accountId: undefined,
          cardId: nubank.id,
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(recurring.save).not.toHaveBeenCalled();
    });

    it('o gasto fixo de outro usuário não existe: não edita nem remove', async () => {
      const { recurring, service } = setup();
      const known = [Recurring.create({ userId: USER, ...input })];
      recurring.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );

      await expect(
        service.update(OTHER, known[0].id, { description: 'Hackeado' }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(service.remove(OTHER, known[0].id)).rejects.toBeInstanceOf(
        FinanceNotFoundError,
      );
      expect(recurring.save).not.toHaveBeenCalled();
      expect(recurring.delete).not.toHaveBeenCalled();
    });
  });
});
