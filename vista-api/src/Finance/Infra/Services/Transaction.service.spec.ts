import { Account } from '../../Domain/Account';
import { Card } from '../../Domain/Card';
import { Category, CategoryKind } from '../../Domain/Category';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { RecurringAlreadyLaunchedError } from '../../Domain/Errors/RecurringAlreadyLaunched.error';
import { Month } from '../../Domain/Month';
import { Recurring } from '../../Domain/Recurring';
import { Transaction } from '../../Domain/Transaction';
import { TransactionServiceImpl } from './Transaction.service';

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
const lazer = Category.create({ userId: USER, name: 'Lazer', kind: 'EXPENSE' });
const checking = Account.create({
  userId: USER,
  name: 'Corrente',
  type: 'CHECKING',
  initialBalanceDate: '2026-10-01',
});
const reserve = Account.create({
  userId: USER,
  name: 'Reserva',
  type: 'RESERVE',
  initialBalanceDate: '2026-10-01',
});
const archivedAccount = Account.create({
  userId: USER,
  name: 'Antiga',
  type: 'CHECKING',
  initialBalanceDate: '2026-10-01',
});
archivedAccount.archived = true;

// Fecha dia 25, vence dia 5: compra de 15/10 cai na fatura de novembro.
const nubank = Card.create({
  userId: USER,
  name: 'Nubank',
  closingDay: 25,
  dueDay: 5,
});
const oldCard = Card.create({
  userId: USER,
  name: 'Antigo',
  closingDay: 25,
  dueDay: 5,
});
oldCard.archived = true;

const aluguel = Recurring.create({
  userId: USER,
  description: 'Aluguel',
  kind: 'EXPENSE',
  categoryId: mercado.id,
  accountId: checking.id,
  amountInCents: 200000,
  variableAmount: false,
  dueDay: 5,
});

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
  const recurring = {
    findAll: jest.fn<Promise<Recurring[]>, [string]>(),
    findById: jest.fn<Promise<Recurring | null>, [string, string]>(),
    existsWithCategory: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithAccount: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithCard: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Recurring]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };

  const knownCategories = [mercado, salario, lazer];
  const knownAccounts = [checking, reserve, archivedAccount];
  const knownCards = [nubank, oldCard];
  categories.findAll.mockResolvedValue(knownCategories);
  categories.findById.mockImplementation((_, id) =>
    Promise.resolve(knownCategories.find((c) => c.id === id) ?? null),
  );
  accounts.findAll.mockResolvedValue(knownAccounts);
  accounts.findById.mockImplementation((_, id) =>
    Promise.resolve(knownAccounts.find((a) => a.id === id) ?? null),
  );
  cards.findAll.mockResolvedValue(knownCards);
  cards.findById.mockImplementation((_, id) =>
    Promise.resolve(knownCards.find((c) => c.id === id) ?? null),
  );
  recurring.findById.mockImplementation((_, id) =>
    Promise.resolve(id === aluguel.id ? aluguel : null),
  );
  transactions.existsForRecurringInMonth.mockResolvedValue(false);

  return {
    transactions,
    categories,
    accounts,
    cards,
    recurring,
    service: new TransactionServiceImpl(
      transactions,
      categories,
      accounts,
      cards,
      recurring,
    ),
  };
}

const expense = {
  kind: 'EXPENSE' as const,
  description: 'Compras da semana',
  amountInCents: 25990,
  date: '2026-10-15',
  categoryId: mercado.id,
  accountId: checking.id,
};

const cardPurchase = {
  kind: 'EXPENSE' as const,
  description: 'Notebook',
  amountInCents: 100000,
  date: '2026-10-15',
  categoryId: lazer.id,
  cardId: nubank.id,
};

describe('TransactionServiceImpl', () => {
  describe('create', () => {
    it('salva e devolve o lançamento com os nomes resolvidos', async () => {
      const { transactions, service } = setup();

      const created = await service.create(USER, expense);

      expect(created).toMatchObject({
        kind: 'EXPENSE',
        description: 'Compras da semana',
        amountInCents: 25990,
        categoryName: 'Mercado',
        accountName: 'Corrente',
        cardName: null,
        toAccountName: null,
      });
      expect(transactions.save).toHaveBeenCalledTimes(1);
    });

    it('cria receita e transferência', async () => {
      const { transactions, service } = setup();

      const income = await service.create(USER, {
        kind: 'INCOME',
        description: 'Salário',
        amountInCents: 500000,
        date: '2026-10-05',
        categoryId: salario.id,
        accountId: checking.id,
      });
      const transfer = await service.create(USER, {
        kind: 'TRANSFER',
        description: 'Guardar',
        amountInCents: 100000,
        date: '2026-10-06',
        accountId: checking.id,
        toAccountId: reserve.id,
      });

      expect(income.categoryName).toBe('Salário');
      expect(transfer).toMatchObject({
        categoryName: null,
        toAccountName: 'Reserva',
      });
      expect(transactions.save).toHaveBeenCalledTimes(2);
    });

    it('recusa dado inválido antes de tocar os repositórios', async () => {
      const { transactions, categories, service } = setup();

      await expect(
        service.create(USER, { ...expense, amountInCents: 0 }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(categories.findById).not.toHaveBeenCalled();
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa categoria de outro tipo', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, { ...expense, categoryId: salario.id }),
      ).rejects.toThrow('"Salário" é de receita');
      await expect(
        service.create(USER, {
          ...expense,
          kind: 'INCOME',
          categoryId: mercado.id,
        }),
      ).rejects.toThrow('"Mercado" é de despesa');
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa categoria e conta inexistentes', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, {
          ...expense,
          categoryId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.create(USER, {
          ...expense,
          accountId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa conta arquivada, de origem ou de destino', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, { ...expense, accountId: archivedAccount.id }),
      ).rejects.toThrow('"Antiga" está arquivada');
      await expect(
        service.create(USER, {
          kind: 'TRANSFER',
          description: 'x',
          amountInCents: 100,
          date: '2026-10-06',
          accountId: checking.id,
          toAccountId: archivedAccount.id,
        }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.save).not.toHaveBeenCalled();
    });
  });

  describe('compra no cartão', () => {
    it('calcula a fatura pelo cartão e pela data da compra', async () => {
      const { transactions, service } = setup();

      const created = await service.create(USER, cardPurchase);

      expect(created).toMatchObject({
        cardName: 'Nubank',
        accountId: null,
        accountName: null,
        invoiceMonth: '2026-11',
        installmentNumber: null,
      });
      expect(transactions.save).toHaveBeenCalledTimes(1);
    });

    it('a compra no dia do fechamento cai na fatura seguinte', async () => {
      const { service } = setup();

      const created = await service.create(USER, {
        ...cardPurchase,
        date: '2026-10-25',
      });

      expect(created.invoiceMonth).toBe('2026-12');
    });

    it('ignora o invoiceMonth que vier de fora', async () => {
      const { service } = setup();

      const created = await service.create(USER, {
        ...cardPurchase,
        invoiceMonth: '2030-01',
      });

      expect(created.invoiceMonth).toBe('2026-11');
    });

    it('recusa cartão arquivado e cartão inexistente', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, { ...cardPurchase, cardId: oldCard.id }),
      ).rejects.toThrow('"Antigo" está arquivado');
      await expect(
        service.create(USER, {
          ...cardPurchase,
          cardId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa conta e cartão ao mesmo tempo, e data inválida', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, { ...cardPurchase, accountId: checking.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      await expect(
        service.create(USER, { ...cardPurchase, date: '2026-02-30' }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('lança o gasto fixo no cartão conferindo o mês pela data, não pela fatura', async () => {
      const { transactions, recurring, service } = setup();
      const streaming = Recurring.create({
        userId: USER,
        description: 'Streaming',
        kind: 'EXPENSE',
        categoryId: lazer.id,
        cardId: nubank.id,
        amountInCents: 4990,
        variableAmount: false,
        dueDay: 10,
      });
      recurring.findById.mockResolvedValue(streaming);

      // 10/10 cai na fatura de novembro, mas o gasto fixo conta como de outubro.
      await service.create(USER, {
        ...cardPurchase,
        description: 'Streaming',
        amountInCents: 4990,
        date: '2026-10-10',
        recurringId: streaming.id,
      });

      expect(transactions.existsForRecurringInMonth).toHaveBeenCalledWith(
        USER,
        streaming.id,
        Month.parse('2026-10'),
        undefined,
      );
    });
  });

  describe('compra parcelada', () => {
    it('cria uma parcela por fatura e devolve a primeira', async () => {
      const { transactions, service } = setup();

      const first = await service.create(USER, {
        ...cardPurchase,
        installmentCount: 3,
      });

      expect(transactions.saveAll).toHaveBeenCalledTimes(1);
      expect(transactions.save).not.toHaveBeenCalled();
      const saved = transactions.saveAll.mock.calls[0]?.[0] ?? [];
      expect(saved.map((t) => t.amountInCents)).toEqual([33334, 33333, 33333]);
      expect(saved.map((t) => t.invoiceMonth)).toEqual([
        '2026-11',
        '2026-12',
        '2027-01',
      ]);
      expect(new Set(saved.map((t) => t.purchaseId)).size).toBe(1);
      expect(first).toMatchObject({
        installmentNumber: 1,
        installmentCount: 3,
        amountInCents: 33334,
      });
    });

    it('uma parcela só é compra à vista', async () => {
      const { transactions, service } = setup();

      const created = await service.create(USER, {
        ...cardPurchase,
        installmentCount: 1,
      });

      expect(transactions.save).toHaveBeenCalledTimes(1);
      expect(transactions.saveAll).not.toHaveBeenCalled();
      expect(created.installmentNumber).toBeNull();
    });

    it('recusa parcelar fora do cartão', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, { ...expense, installmentCount: 3 }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.saveAll).not.toHaveBeenCalled();
    });

    it('recusa número de parcelas fora de 2 a 48', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, { ...cardPurchase, installmentCount: 49 }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.saveAll).not.toHaveBeenCalled();
    });
  });

  describe('parcelamento em andamento', () => {
    // 12x de R$ 250,00; a 10ª parcela cai na fatura de outubro.
    const ongoing = {
      ...cardPurchase,
      amountInCents: 25000,
      installmentCount: 12,
      currentInstallment: 10,
      invoiceMonth: '2026-10',
    };

    it('usa a fatura informada, não a da data, e lança só o que falta', async () => {
      const { transactions, service } = setup();

      // Pela data (15/10) a compra cairia em novembro.
      const first = await service.create(USER, ongoing);

      const saved = transactions.saveAll.mock.calls[0]?.[0] ?? [];
      expect(saved.map((t) => t.installmentNumber)).toEqual([10, 11, 12]);
      expect(saved.map((t) => t.invoiceMonth)).toEqual([
        '2026-10',
        '2026-11',
        '2026-12',
      ]);
      expect(saved.every((t) => t.amountInCents === 25000)).toBe(true);
      expect(first).toMatchObject({
        installmentNumber: 10,
        installmentCount: 12,
        cardName: 'Nubank',
      });
    });

    it('recusa cartão arquivado e categoria de receita', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, { ...ongoing, cardId: oldCard.id }),
      ).rejects.toThrow(/arquivado/);
      await expect(
        service.create(USER, { ...ongoing, categoryId: salario.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.saveAll).not.toHaveBeenCalled();
    });

    it('recusa parcela atual além do número de parcelas', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, { ...ongoing, currentInstallment: 13 }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.saveAll).not.toHaveBeenCalled();
    });
  });

  describe('pagamento de fatura', () => {
    const payment = {
      kind: 'TRANSFER' as const,
      description: 'Pagamento de fatura',
      amountInCents: 30000,
      date: '2026-11-04',
      accountId: checking.id,
      toCardId: nubank.id,
      invoiceMonth: '2026-11',
    };

    it('salva a transferência para o cartão com a fatura quitada', async () => {
      const { transactions, service } = setup();

      const created = await service.create(USER, payment);

      expect(created).toMatchObject({
        toCardName: 'Nubank',
        invoiceMonth: '2026-11',
        accountName: 'Corrente',
      });
      expect(transactions.save).toHaveBeenCalledTimes(1);
    });

    it('aceita pagar a fatura de um cartão arquivado', async () => {
      const { transactions, service } = setup();

      await service.create(USER, { ...payment, toCardId: oldCard.id });

      expect(transactions.save).toHaveBeenCalledTimes(1);
    });

    it('recusa pagamento sem a fatura e cartão inexistente', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, { ...payment, invoiceMonth: undefined }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      await expect(
        service.create(USER, {
          ...payment,
          toCardId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa pagar de conta arquivada', async () => {
      const { service } = setup();

      await expect(
        service.create(USER, { ...payment, accountId: archivedAccount.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
    });
  });

  describe('lançamento de gasto fixo', () => {
    it('liga o lançamento ao gasto fixo e consulta o mês da data', async () => {
      const { transactions, service } = setup();

      const created = await service.create(USER, {
        ...expense,
        date: '2026-10-05',
        recurringId: aluguel.id,
      });

      expect(created.recurringId).toBe(aluguel.id);
      expect(transactions.existsForRecurringInMonth).toHaveBeenCalledWith(
        USER,
        aluguel.id,
        Month.parse('2026-10'),
        undefined,
      );
      expect(transactions.save).toHaveBeenCalledTimes(1);
    });

    it('recusa gasto fixo inexistente', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, {
          ...expense,
          recurringId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa lançar o mesmo gasto fixo duas vezes no mês', async () => {
      const { transactions, service } = setup();
      transactions.existsForRecurringInMonth.mockResolvedValue(true);

      await expect(
        service.create(USER, { ...expense, recurringId: aluguel.id }),
      ).rejects.toBeInstanceOf(RecurringAlreadyLaunchedError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa lançar como receita um gasto fixo de despesa', async () => {
      const { transactions, service } = setup();

      await expect(
        service.create(USER, {
          kind: 'INCOME',
          description: 'x',
          amountInCents: 100,
          date: '2026-10-05',
          categoryId: salario.id,
          accountId: checking.id,
          recurringId: aluguel.id,
        }),
      ).rejects.toThrow('é de outro tipo');
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('não consulta gasto fixo quando o lançamento é avulso', async () => {
      const { transactions, recurring, service } = setup();

      await service.create(USER, expense);

      expect(recurring.findById).not.toHaveBeenCalled();
      expect(transactions.existsForRecurringInMonth).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('altera só os campos informados', async () => {
      const { transactions, service } = setup();
      const existing = Transaction.create({ ...expense, userId: USER });
      transactions.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        amountInCents: 30000,
      });

      expect(updated).toMatchObject({
        description: 'Compras da semana',
        amountInCents: 30000,
        date: '2026-10-15',
        categoryName: 'Mercado',
      });
      expect(transactions.save).toHaveBeenCalledTimes(1);
    });

    it('recusa mover para categoria de outro tipo', async () => {
      const { transactions, service } = setup();
      const existing = Transaction.create({ ...expense, userId: USER });
      transactions.findById.mockResolvedValue(existing);

      await expect(
        service.update(USER, existing.id, { categoryId: salario.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa mover para conta arquivada, mas edita lançamento que já estava nela', async () => {
      const { transactions, service } = setup();
      const onArchived = Transaction.create({
        userId: USER,
        ...expense,
        accountId: archivedAccount.id,
      });
      const onChecking = Transaction.create({ ...expense, userId: USER });

      transactions.findById.mockResolvedValue(onChecking);
      await expect(
        service.update(USER, onChecking.id, { accountId: archivedAccount.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);

      transactions.findById.mockResolvedValue(onArchived);
      await expect(
        service.update(USER, onArchived.id, { description: 'Corrigido' }),
      ).resolves.toMatchObject({ description: 'Corrigido' });
    });

    it('confere de novo o gasto fixo ao mudar a data, ignorando o próprio lançamento', async () => {
      const { transactions, service } = setup();
      const existing = Transaction.create({
        userId: USER,
        ...expense,
        recurringId: aluguel.id,
      });
      transactions.findById.mockResolvedValue(existing);
      transactions.existsForRecurringInMonth.mockResolvedValue(true);

      await expect(
        service.update(USER, existing.id, { date: '2026-11-05' }),
      ).rejects.toBeInstanceOf(RecurringAlreadyLaunchedError);
      expect(transactions.existsForRecurringInMonth).toHaveBeenCalledWith(
        USER,
        aluguel.id,
        Month.parse('2026-11'),
        existing.id,
      );
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('não confere o gasto fixo quando a data não muda', async () => {
      const { transactions, service } = setup();
      const existing = Transaction.create({
        userId: USER,
        ...expense,
        recurringId: aluguel.id,
      });
      transactions.findById.mockResolvedValue(existing);

      await service.update(USER, existing.id, { amountInCents: 210000 });

      expect(transactions.existsForRecurringInMonth).not.toHaveBeenCalled();
      expect(transactions.save).toHaveBeenCalledTimes(1);
    });

    it('recusa a combinação inválida que a mudança produziria', async () => {
      const { transactions, service } = setup();
      const transfer = Transaction.create({
        userId: USER,
        kind: 'TRANSFER',
        description: 'Guardar',
        amountInCents: 1000,
        date: '2026-10-06',
        accountId: checking.id,
        toAccountId: reserve.id,
      });
      transactions.findById.mockResolvedValue(transfer);

      await expect(
        service.update(USER, transfer.id, { toAccountId: checking.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('falha quando o lançamento não existe', async () => {
      const { transactions, service } = setup();
      transactions.findById.mockResolvedValue(null);

      await expect(
        service.update(USER, '11111111-1111-4111-8111-111111111111', {}),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('update de compra no cartão', () => {
    function onCard(date = '2026-10-15') {
      return Transaction.create({
        userId: USER,
        ...cardPurchase,
        date,
        invoiceMonth: nubank.invoiceMonthFor(date),
      });
    }

    it('recalcula a fatura quando a data muda', async () => {
      const { transactions, service } = setup();
      const existing = onCard('2026-10-15');
      transactions.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        date: '2026-10-26',
      });

      expect(updated.invoiceMonth).toBe('2026-12');
    });

    it('passa a compra do cartão para a conta, limpando a fatura', async () => {
      const { transactions, service } = setup();
      const existing = onCard();
      transactions.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        cardId: null,
        accountId: checking.id,
      });

      expect(updated).toMatchObject({
        cardId: null,
        accountId: checking.id,
        invoiceMonth: null,
      });
    });

    it('passa a despesa da conta para o cartão, calculando a fatura', async () => {
      const { transactions, service } = setup();
      const existing = Transaction.create({ ...expense, userId: USER });
      transactions.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        accountId: null,
        cardId: nubank.id,
      });

      expect(updated).toMatchObject({
        cardName: 'Nubank',
        accountId: null,
        invoiceMonth: '2026-11',
      });
    });

    it('recusa mover a compra para cartão arquivado', async () => {
      const { transactions, service } = setup();
      const existing = onCard();
      transactions.findById.mockResolvedValue(existing);

      await expect(
        service.update(USER, existing.id, { cardId: oldCard.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('edita compra de cartão que foi arquivado depois', async () => {
      const { transactions, service } = setup();
      const existing = Transaction.create({
        userId: USER,
        ...cardPurchase,
        cardId: oldCard.id,
        invoiceMonth: '2026-11',
      });
      transactions.findById.mockResolvedValue(existing);

      await expect(
        service.update(USER, existing.id, { description: 'Corrigido' }),
      ).resolves.toMatchObject({ description: 'Corrigido' });
    });
  });

  describe('compra parcelada: edição e exclusão', () => {
    function installments() {
      return Transaction.createInstallments({
        userId: USER,
        ...cardPurchase,
        invoiceMonth: '2026-11',
        installmentCount: 3,
      });
    }

    it('muda descrição e categoria em todas as parcelas', async () => {
      const { transactions, service } = setup();
      const parts = installments();
      transactions.findById.mockResolvedValue(parts[1]);
      transactions.findByPurchase.mockResolvedValue(parts);

      const updated = await service.update(USER, parts[1].id, {
        description: 'Notebook novo',
        categoryId: mercado.id,
      });

      expect(transactions.saveAll).toHaveBeenCalledTimes(1);
      expect(parts.map((p) => p.description)).toEqual([
        'Notebook novo',
        'Notebook novo',
        'Notebook novo',
      ]);
      expect(parts.every((p) => p.categoryId === mercado.id)).toBe(true);
      expect(updated).toMatchObject({
        installmentNumber: 2,
        description: 'Notebook novo',
      });
    });

    it.each([
      ['valor', { amountInCents: 1 }],
      ['data', { date: '2026-10-20' }],
      ['cartão', { cardId: oldCard.id }],
      ['conta', { cardId: null, accountId: checking.id }],
    ])('recusa mudar %s', async (_, change) => {
      const { transactions, service } = setup();
      const parts = installments();
      transactions.findById.mockResolvedValue(parts[0]);

      await expect(service.update(USER, parts[0].id, change)).rejects.toThrow(
        'exclua a compra e lance de novo',
      );
      expect(transactions.saveAll).not.toHaveBeenCalled();
    });

    it('aceita receber o valor e a data que já são os da parcela', async () => {
      const { transactions, service } = setup();
      const parts = installments();
      const first = parts[0];
      transactions.findById.mockResolvedValue(first);
      transactions.findByPurchase.mockResolvedValue(parts);

      await expect(
        service.update(USER, first.id, {
          amountInCents: first.amountInCents,
          date: first.date,
          description: 'Só o nome',
        }),
      ).resolves.toMatchObject({ description: 'Só o nome' });
    });

    it('recusa categoria de receita numa compra parcelada', async () => {
      const { transactions, service } = setup();
      const parts = installments();
      transactions.findById.mockResolvedValue(parts[0]);
      transactions.findByPurchase.mockResolvedValue(parts);

      await expect(
        service.update(USER, parts[0].id, {
          categoryId: salario.id,
        }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.saveAll).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('remove o lançamento existente', async () => {
      const { transactions, service } = setup();
      const existing = Transaction.create({ ...expense, userId: USER });
      transactions.findById.mockResolvedValue(existing);

      await service.remove(USER, existing.id);

      expect(transactions.delete).toHaveBeenCalledWith(USER, existing.id);
      expect(transactions.deleteByPurchase).not.toHaveBeenCalled();
    });

    it('remove todas as parcelas ao remover uma', async () => {
      const { transactions, service } = setup();
      const parts = Transaction.createInstallments({
        userId: USER,
        ...cardPurchase,
        invoiceMonth: '2026-11',
        installmentCount: 3,
      });
      transactions.findById.mockResolvedValue(parts[2]);

      await service.remove(USER, parts[2].id);

      expect(transactions.deleteByPurchase).toHaveBeenCalledWith(
        USER,
        parts[2].purchaseId,
      );
      expect(transactions.delete).not.toHaveBeenCalled();
    });

    it('falha quando o lançamento não existe', async () => {
      const { transactions, service } = setup();
      transactions.findById.mockResolvedValue(null);

      await expect(
        service.remove(USER, '11111111-1111-4111-8111-111111111111'),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(transactions.delete).not.toHaveBeenCalled();
    });
  });

  describe('recategorize', () => {
    /** Repositório que só enxerga os lançamentos do USER. */
    function withStore(
      ctx: ReturnType<typeof setup>,
      store: Transaction[],
    ): void {
      ctx.transactions.findById.mockImplementation((userId, id) =>
        Promise.resolve(
          userId === USER ? (store.find((t) => t.id === id) ?? null) : null,
        ),
      );
      ctx.transactions.findByPurchase.mockImplementation((userId, purchaseId) =>
        Promise.resolve(
          userId === USER
            ? store.filter((t) => t.purchaseId === purchaseId)
            : [],
        ),
      );
    }

    const spend = (description: string) =>
      Transaction.create({ ...expense, userId: USER, description });
    const purchase = () =>
      Transaction.createInstallments({
        ...cardPurchase,
        userId: USER,
        invoiceMonth: '2026-11',
        installmentCount: 3,
      });

    it('troca a categoria de vários lançamentos, procurando cada um com o dono', async () => {
      const ctx = setup();
      const a = spend('Padaria');
      const b = spend('Feira');
      withStore(ctx, [a, b]);

      const result = await ctx.service.recategorize(
        USER,
        [a.id, b.id],
        lazer.id,
      );

      expect(result).toEqual({ updated: 2 });
      expect(ctx.transactions.findById).toHaveBeenCalledWith(USER, a.id);
      expect(ctx.transactions.findById).toHaveBeenCalledWith(USER, b.id);
      expect(ctx.categories.findById).toHaveBeenCalledWith(USER, lazer.id);
      const saved = ctx.transactions.saveAll.mock.calls[0]?.[0] ?? [];
      expect(saved.map((t) => t.categoryId)).toEqual([lazer.id, lazer.id]);
    });

    it('uma parcela leva a compra inteira', async () => {
      const ctx = setup();
      const parts = purchase();
      const single = spend('Padaria');
      withStore(ctx, [...parts, single]);

      const result = await ctx.service.recategorize(
        USER,
        [parts[1].id, single.id],
        mercado.id,
      );

      expect(result).toEqual({ updated: 4 });
      expect(ctx.transactions.findByPurchase).toHaveBeenCalledWith(
        USER,
        parts[0].purchaseId,
      );
      const saved = ctx.transactions.saveAll.mock.calls[0]?.[0] ?? [];
      expect(saved.every((t) => t.categoryId === mercado.id)).toBe(true);
      expect(new Set(saved.map((t) => t.id)).size).toBe(4);
    });

    it('duas parcelas da mesma compra contam a compra uma vez', async () => {
      const ctx = setup();
      const parts = purchase();
      withStore(ctx, parts);

      const result = await ctx.service.recategorize(
        USER,
        [parts[0].id, parts[2].id],
        mercado.id,
      );

      expect(result).toEqual({ updated: 3 });
      expect(ctx.transactions.findByPurchase).toHaveBeenCalledTimes(1);
    });

    it('categoria de outro tipo: recusa citando o lançamento, sem gravar nada', async () => {
      const ctx = setup();
      const a = spend('Padaria');
      withStore(ctx, [a]);

      await expect(
        ctx.service.recategorize(USER, [a.id], salario.id),
      ).rejects.toThrow(/Padaria/);
      expect(ctx.transactions.saveAll).not.toHaveBeenCalled();
    });

    it('transferência não tem categoria', async () => {
      const ctx = setup();
      const move = Transaction.create({
        userId: USER,
        kind: 'TRANSFER',
        description: 'Guardar',
        amountInCents: 100,
        date: '2026-10-15',
        accountId: checking.id,
        toAccountId: reserve.id,
      });
      withStore(ctx, [move]);

      await expect(
        ctx.service.recategorize(USER, [move.id], mercado.id),
      ).rejects.toThrow(/não tem categoria/);
      expect(ctx.transactions.saveAll).not.toHaveBeenCalled();
    });

    it('tudo ou nada: um id que não é do usuário recusa a lista inteira', async () => {
      const ctx = setup();
      const mine = spend('Padaria');
      withStore(ctx, [mine]);

      await expect(
        ctx.service.recategorize(USER, [mine.id, 'de-outra-pessoa'], lazer.id),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(ctx.transactions.saveAll).not.toHaveBeenCalled();
      expect(mine.categoryId).toBe(mercado.id);
    });

    it('lançamentos de outro usuário não existem para ele', async () => {
      const ctx = setup();
      const mine = spend('Padaria');
      withStore(ctx, [mine]);

      // Controle positivo: o dono consegue.
      await expect(
        ctx.service.recategorize(USER, [mine.id], lazer.id),
      ).resolves.toEqual({ updated: 1 });
      ctx.transactions.saveAll.mockClear();

      await expect(
        ctx.service.recategorize(OTHER, [mine.id], mercado.id),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(ctx.transactions.saveAll).not.toHaveBeenCalled();
    });

    it('categoria de outro usuário não existe', async () => {
      const ctx = setup();
      const mine = spend('Padaria');
      withStore(ctx, [mine]);
      ctx.categories.findById.mockImplementation((userId, id) =>
        Promise.resolve(userId === OTHER && id === lazer.id ? lazer : null),
      );

      await expect(
        ctx.service.recategorize(USER, [mine.id], lazer.id),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(ctx.transactions.saveAll).not.toHaveBeenCalled();
    });

    it.each([
      ['vazia', []],
      ['com 201 ids', Array.from({ length: 201 }, (_, i) => 'id-' + i)],
      ['com ids repetidos', ['a', 'a']],
    ])('recusa lista %s antes de procurar qualquer coisa', async (_, ids) => {
      const ctx = setup();

      await expect(
        ctx.service.recategorize(USER, ids, mercado.id),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(ctx.categories.findById).not.toHaveBeenCalled();
      expect(ctx.transactions.findById).not.toHaveBeenCalled();
    });

    it('aceita 200 ids', async () => {
      const ctx = setup();
      const many = Array.from({ length: 200 }, (_, i) => spend('Item ' + i));
      withStore(ctx, many);

      await expect(
        ctx.service.recategorize(
          USER,
          many.map((t) => t.id),
          lazer.id,
        ),
      ).resolves.toEqual({ updated: 200 });
    });
  });

  describe('isolamento por usuário', () => {
    function visibleOnlyToUser() {
      const ctx = setup();
      const categories = [mercado, salario, lazer];
      const accounts = [checking, reserve];
      const cards = [nubank];
      ctx.categories.findById.mockImplementation((userId, id) =>
        Promise.resolve(
          userId === USER
            ? (categories.find((x) => x.id === id) ?? null)
            : null,
        ),
      );
      ctx.accounts.findById.mockImplementation((userId, id) =>
        Promise.resolve(
          userId === USER ? (accounts.find((x) => x.id === id) ?? null) : null,
        ),
      );
      ctx.cards.findById.mockImplementation((userId, id) =>
        Promise.resolve(
          userId === USER ? (cards.find((x) => x.id === id) ?? null) : null,
        ),
      );

      return ctx;
    }

    it('o lançamento nasce do dono da sessão, mesmo que o corpo diga outro', async () => {
      const { service, transactions, categories, accounts } = setup();
      const mine = Account.create({
        userId: OTHER,
        name: 'Minha',
        type: 'CHECKING',
        initialBalanceDate: '2026-01-01',
      });
      const myCategory = Category.create({
        userId: OTHER,
        name: 'Minha categoria',
        kind: 'EXPENSE',
      });
      accounts.findById.mockResolvedValue(mine);
      categories.findById.mockResolvedValue(myCategory);
      accounts.findAll.mockResolvedValue([mine]);
      categories.findAll.mockResolvedValue([myCategory]);

      await service.create(OTHER, {
        ...expense,
        categoryId: myCategory.id,
        accountId: mine.id,
        userId: USER,
      } as never);

      expect(transactions.save.mock.calls[0]?.[0].userId).toBe(OTHER);
    });

    it('conta, categoria, cartão, destino e gasto fixo de outro usuário não existem', async () => {
      const { service, transactions, accounts, categories, cards } =
        visibleOnlyToUser();

      // Controle positivo: o dono enxerga as próprias referências, e é por ele que o service procura.
      await expect(service.create(USER, { ...expense })).resolves.toBeDefined();
      await expect(
        service.create(USER, { ...cardPurchase }),
      ).resolves.toBeDefined();
      expect(accounts.findById).toHaveBeenCalledWith(USER, expense.accountId);
      expect(categories.findById).toHaveBeenCalledWith(
        USER,
        expense.categoryId,
      );
      expect(cards.findById).toHaveBeenCalledWith(USER, cardPurchase.cardId);
      transactions.save.mockClear();

      await expect(
        service.create(OTHER, { ...expense }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.create(OTHER, { ...cardPurchase }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.create(OTHER, {
          kind: 'TRANSFER',
          description: 'Transferência',
          amountInCents: 100,
          date: '2026-10-15',
          accountId: checking.id,
          toAccountId: reserve.id,
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.create(OTHER, {
          kind: 'TRANSFER',
          description: 'Pagamento de fatura',
          amountInCents: 100,
          date: '2026-10-15',
          accountId: checking.id,
          toCardId: nubank.id,
          invoiceMonth: '2026-11',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.create(OTHER, { ...cardPurchase, installmentCount: 3 }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.create(OTHER, {
          ...cardPurchase,
          installmentCount: 12,
          currentInstallment: 5,
          invoiceMonth: '2026-10',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(transactions.save).not.toHaveBeenCalled();
      expect(transactions.saveAll).not.toHaveBeenCalled();
    });

    it('o lançamento de outro usuário não existe: não edita nem remove', async () => {
      const { service, transactions } = setup();
      const known = [Transaction.create({ ...expense, userId: USER })];
      transactions.findById.mockImplementation((userId: string, id: string) =>
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
      expect(transactions.save).not.toHaveBeenCalled();
      expect(transactions.delete).not.toHaveBeenCalled();
      expect(transactions.deleteByPurchase).not.toHaveBeenCalled();
    });

    it('as parcelas são procuradas só entre as do dono', async () => {
      const { service, transactions } = setup();
      const parts = Transaction.createInstallments({
        ...cardPurchase,
        userId: USER,
        invoiceMonth: '2026-11',
        installmentCount: 3,
      });
      transactions.findById.mockResolvedValue(parts[0]);
      transactions.findByPurchase.mockResolvedValue(parts);

      await service.update(USER, parts[0].id, { description: 'Nova' });
      await service.remove(USER, parts[0].id);

      expect(transactions.findByPurchase).toHaveBeenCalledWith(
        USER,
        parts[0].purchaseId,
      );
      expect(transactions.deleteByPurchase).toHaveBeenCalledWith(
        USER,
        parts[0].purchaseId,
      );
    });

    it('o corpo não consegue trocar o dono nem o tipo na edição', async () => {
      const { service, transactions } = setup();
      const mine = Transaction.create({ ...expense, userId: USER });
      transactions.findById.mockResolvedValue(mine);

      await service.update(USER, mine.id, {
        description: 'Nova',
        userId: OTHER,
        kind: 'INCOME',
      } as never);

      const saved = transactions.save.mock.calls[0]?.[0];
      expect(saved?.userId).toBe(USER);
      expect(saved?.kind).toBe('EXPENSE');
    });
  });
});
