import { Account } from '../../Domain/Account';
import { Card } from '../../Domain/Card';
import { Category, CategoryKind } from '../../Domain/Category';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { Month } from '../../Domain/Month';
import { Transaction } from '../../Domain/Transaction';
import { SearchTransactionsHandler } from './SearchTransactions.query';

const USER = '11111111-1111-4111-8111-111111111111';
const OCT = Month.parse('2026-10');

const food = Category.create({ userId: USER, name: 'Comida', kind: 'EXPENSE' });
const checking = Account.create({
  userId: USER,
  name: 'Corrente',
  type: 'CHECKING',
  initialBalanceDate: '2026-01-01',
});

/** 7 lançamentos de outubro, do dia 1 ao 7. */
const october = Array.from({ length: 7 }, (_, index) =>
  Transaction.create({
    userId: USER,
    kind: 'EXPENSE',
    description: `iFood ${index + 1}`,
    amountInCents: 1000,
    date: `2026-10-0${index + 1}`,
    categoryId: food.id,
    accountId: checking.id,
  }),
);

function setup() {
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

  transactions.findAll.mockResolvedValue(october);
  categories.findAll.mockResolvedValue([food]);
  accounts.findAll.mockResolvedValue([checking]);
  cards.findAll.mockResolvedValue([]);

  return {
    transactions,
    categories,
    accounts,
    cards,
    handler: new SearchTransactionsHandler(
      transactions,
      categories,
      accounts,
      cards,
    ),
  };
}

const filters = { fromMonth: OCT, toMonth: OCT };

describe('SearchTransactionsHandler', () => {
  it('busca só os lançamentos do dono e resolve os nomes', async () => {
    const { handler, transactions, categories, accounts, cards } = setup();

    const result = await handler.execute(USER, filters, {
      offset: 0,
      limit: 50,
    });

    expect(transactions.findAll).toHaveBeenCalledWith(USER);
    expect(categories.findAll).toHaveBeenCalledWith(USER);
    expect(accounts.findAll).toHaveBeenCalledWith(USER);
    expect(cards.findAll).toHaveBeenCalledWith(USER);
    expect(result.transactions[0]).toMatchObject({
      description: 'iFood 7',
      categoryName: 'Comida',
      accountName: 'Corrente',
    });
  });

  it('pagina sem repetir nem pular, e os totais valem para todas as páginas', async () => {
    const { handler } = setup();

    const first = await handler.execute(USER, filters, { offset: 0, limit: 3 });
    const second = await handler.execute(USER, filters, {
      offset: 3,
      limit: 3,
    });
    const third = await handler.execute(USER, filters, {
      offset: 6,
      limit: 3,
    });
    const pages = [first, second, third].flatMap((page) =>
      page.transactions.map((transaction) => transaction.description),
    );

    expect(pages).toEqual([
      'iFood 7',
      'iFood 6',
      'iFood 5',
      'iFood 4',
      'iFood 3',
      'iFood 2',
      'iFood 1',
    ]);
    expect(first.total).toBe(7);
    expect(third.total).toBe(7);
    expect(first.expenseInCents).toBe(7000);
    expect(third.expenseInCents).toBe(7000);
  });

  it('página depois do fim vem vazia', async () => {
    const { handler } = setup();

    const result = await handler.execute(USER, filters, {
      offset: 50,
      limit: 50,
    });

    expect(result.transactions).toEqual([]);
    expect(result.total).toBe(7);
  });

  it.each([
    [{ offset: -1, limit: 10 }],
    [{ offset: 1.5, limit: 10 }],
    [{ offset: 0, limit: 0 }],
    [{ offset: 0, limit: 101 }],
    [{ offset: 0, limit: Number.NaN }],
  ])('recusa a página %p', async (page) => {
    const { handler, transactions } = setup();

    await expect(handler.execute(USER, filters, page)).rejects.toBeInstanceOf(
      FinanceValidationError,
    );
    expect(transactions.findAll).not.toHaveBeenCalled();
  });

  it('aceita até 100 por página', async () => {
    const { handler } = setup();

    await expect(
      handler.execute(USER, filters, { offset: 0, limit: 100 }),
    ).resolves.toHaveProperty('total', 7);
  });
});
