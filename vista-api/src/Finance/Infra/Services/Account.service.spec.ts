import { Account } from '../../Domain/Account';
import { Bank } from '../../Domain/Bank';
import { Goal } from '../../Domain/Goal';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { Month } from '../../Domain/Month';
import { Recurring } from '../../Domain/Recurring';
import { Transaction } from '../../Domain/Transaction';
import { AccountServiceImpl } from './Account.service';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '99999999-9999-4999-8999-999999999999';

function goalRepository() {
  return {
    findAll: jest.fn<Promise<Goal[]>, [string]>(),
    findById: jest.fn<Promise<Goal | null>, [string, string]>(),
    findByAccount: jest.fn<Promise<Goal | null>, [string, string]>(),
    existsWithAccount: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Goal]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
}

function bankRepository() {
  return {
    findAll: jest.fn<Promise<Bank[]>, [string]>(),
    findById: jest.fn<Promise<Bank | null>, [string, string]>(),
    findByName: jest.fn<Promise<Bank | null>, [string, string]>(),
    save: jest.fn<Promise<void>, [Bank]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
}

function accountRepository() {
  return {
    findAll: jest.fn<Promise<Account[]>, [string]>(),
    findById: jest.fn<Promise<Account | null>, [string, string]>(),
    findByName: jest.fn<Promise<Account | null>, [string, string]>(),
    existsWithBank: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Account]>(),
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

const CATEGORY = '33333333-3333-4333-8333-333333333333';

function setup() {
  const accounts = accountRepository();
  const banks = bankRepository();
  const transactions = transactionRepository();
  const recurring = recurringRepository();
  const goals = goalRepository();

  goals.existsWithAccount.mockResolvedValue(false);
  accounts.findByName.mockResolvedValue(null);
  banks.findById.mockResolvedValue(null);
  transactions.findByAccount.mockResolvedValue([]);
  transactions.existsWithAccount.mockResolvedValue(false);
  recurring.existsWithAccount.mockResolvedValue(false);

  return {
    accounts,
    banks,
    transactions,
    recurring,
    goals,
    service: new AccountServiceImpl(
      accounts,
      banks,
      transactions,
      recurring,
      goals,
    ),
  };
}

function checking(initialBalanceInCents = 100000) {
  return Account.create({
    userId: USER,
    name: 'Corrente',
    type: 'CHECKING',
    initialBalanceInCents,
    initialBalanceDate: '2026-10-01',
  });
}

const input = {
  name: 'Nubank',
  type: 'CHECKING' as const,
  initialBalanceInCents: 50000,
  initialBalanceDate: '2026-10-01',
};

describe('AccountServiceImpl', () => {
  describe('create', () => {
    it('salva e devolve a conta com o saldo inicial como saldo', async () => {
      const { accounts, service } = setup();

      const created = await service.create(USER, input);

      expect(created).toMatchObject({
        name: 'Nubank',
        type: 'CHECKING',
        balanceInCents: 50000,
        bankName: null,
        archived: false,
      });
      expect(accounts.save).toHaveBeenCalledTimes(1);
    });

    it('devolve o nome do banco quando há banco', async () => {
      const { banks, service } = setup();
      const nubank = Bank.create(USER, 'Nubank');
      banks.findById.mockResolvedValue(nubank);

      const created = await service.create(USER, {
        ...input,
        bankId: nubank.id,
      });

      expect(created).toMatchObject({ bankId: nubank.id, bankName: 'Nubank' });
    });

    it('recusa banco inexistente', async () => {
      const { accounts, service } = setup();

      await expect(
        service.create(USER, {
          ...input,
          bankId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(accounts.save).not.toHaveBeenCalled();
    });

    it('recusa nome já usado, citando o nome que existe', async () => {
      const { accounts, service } = setup();
      accounts.findByName.mockResolvedValue(checking());

      await expect(
        service.create(USER, { ...input, name: 'corrente' }),
      ).rejects.toThrow('Já existe uma conta chamada "Corrente"');
      await expect(
        service.create(USER, { ...input, name: 'corrente' }),
      ).rejects.toBeInstanceOf(FinanceDuplicateError);
    });

    it('recusa dado inválido antes de tocar o repositório', async () => {
      const { accounts, banks, service } = setup();

      await expect(
        service.create(USER, { ...input, name: ' ' }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(banks.findById).not.toHaveBeenCalled();
      expect(accounts.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('altera só os campos informados e devolve o saldo', async () => {
      const { accounts, transactions, service } = setup();
      const existing = checking();
      accounts.findById.mockResolvedValue(existing);
      transactions.findByAccount.mockResolvedValue([
        Transaction.create({
          userId: USER,
          kind: 'INCOME',
          description: 'Salário',
          amountInCents: 20000,
          date: '2026-10-05',
          categoryId: CATEGORY,
          accountId: existing.id,
        }),
      ]);

      const updated = await service.update(USER, existing.id, {
        name: 'Principal',
      });

      expect(updated).toMatchObject({
        name: 'Principal',
        initialBalanceInCents: 100000,
        balanceInCents: 120000,
      });
      expect(accounts.save).toHaveBeenCalledTimes(1);
    });

    it('arquiva a conta', async () => {
      const { accounts, service } = setup();
      const existing = checking();
      accounts.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        archived: true,
      });

      expect(updated.archived).toBe(true);
    });

    it('permite manter o nome da própria conta', async () => {
      const { accounts, service } = setup();
      const existing = checking();
      accounts.findById.mockResolvedValue(existing);
      accounts.findByName.mockResolvedValue(existing);

      await expect(
        service.update(USER, existing.id, { name: 'CORRENTE' }),
      ).resolves.toMatchObject({ name: 'CORRENTE' });
    });

    it('recusa o nome de outra conta', async () => {
      const { accounts, service } = setup();
      const existing = checking();
      accounts.findById.mockResolvedValue(existing);
      accounts.findByName.mockResolvedValue(checking());

      await expect(
        service.update(USER, existing.id, { name: 'Outra' }),
      ).rejects.toBeInstanceOf(FinanceDuplicateError);
      expect(accounts.save).not.toHaveBeenCalled();
    });

    it('falha quando a conta não existe', async () => {
      const { accounts, service } = setup();
      accounts.findById.mockResolvedValue(null);

      await expect(
        service.update(USER, '11111111-1111-4111-8111-111111111111', {}),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('remove', () => {
    it('remove conta sem uso', async () => {
      const { accounts, service } = setup();
      const existing = checking();
      accounts.findById.mockResolvedValue(existing);

      await service.remove(USER, existing.id);

      expect(accounts.delete).toHaveBeenCalledWith(USER, existing.id);
    });

    it('recusa remover conta com lançamentos', async () => {
      const { accounts, transactions, service } = setup();
      const existing = checking();
      accounts.findById.mockResolvedValue(existing);
      transactions.existsWithAccount.mockResolvedValue(true);

      await expect(service.remove(USER, existing.id)).rejects.toBeInstanceOf(
        FinanceInUseError,
      );
      expect(accounts.delete).not.toHaveBeenCalled();
    });

    it('recusa remover conta com meta', async () => {
      const { accounts, goals, service } = setup();
      const existing = checking();
      accounts.findById.mockResolvedValue(existing);
      goals.existsWithAccount.mockResolvedValue(true);

      await expect(service.remove(USER, existing.id)).rejects.toBeInstanceOf(
        FinanceInUseError,
      );
      expect(accounts.delete).not.toHaveBeenCalled();
    });

    it('recusa remover conta usada por um gasto fixo', async () => {
      const { accounts, recurring, service } = setup();
      const existing = checking();
      accounts.findById.mockResolvedValue(existing);
      recurring.existsWithAccount.mockResolvedValue(true);

      await expect(service.remove(USER, existing.id)).rejects.toBeInstanceOf(
        FinanceInUseError,
      );
      expect(accounts.delete).not.toHaveBeenCalled();
    });
  });

  describe('adjust', () => {
    it('lança a diferença entre o saldo atual e o informado', async () => {
      const { accounts, transactions, service } = setup();
      const existing = checking(100000);
      accounts.findById.mockResolvedValue(existing);

      const adjusted = await service.adjust(USER, existing.id, {
        balanceInCents: 150000,
        date: '2026-10-10',
      });

      expect(transactions.save).toHaveBeenCalledTimes(1);
      const saved = transactions.save.mock.calls[0]?.[0];
      expect(saved).toMatchObject({
        kind: 'ADJUSTMENT',
        amountInCents: 50000,
        date: '2026-10-10',
        accountId: existing.id,
      });
      expect(adjusted.balanceInCents).toBe(150000);
    });

    it('lança ajuste negativo quando o saldo informado é menor', async () => {
      const { accounts, transactions, service } = setup();
      const existing = checking(100000);
      accounts.findById.mockResolvedValue(existing);

      const adjusted = await service.adjust(USER, existing.id, {
        balanceInCents: 98000,
        date: '2026-10-10',
      });

      expect(transactions.save.mock.calls[0]?.[0]).toMatchObject({
        amountInCents: -2000,
      });
      expect(adjusted.balanceInCents).toBe(98000);
    });

    it('considera os movimentos que a conta já tem', async () => {
      const { accounts, transactions, service } = setup();
      const existing = checking(100000);
      accounts.findById.mockResolvedValue(existing);
      transactions.findByAccount.mockResolvedValue([
        Transaction.create({
          userId: USER,
          kind: 'EXPENSE',
          description: 'Mercado',
          amountInCents: 30000,
          date: '2026-10-05',
          categoryId: CATEGORY,
          accountId: existing.id,
        }),
      ]);

      await service.adjust(USER, existing.id, {
        balanceInCents: 70500,
        date: '2026-10-10',
      });

      expect(transactions.save.mock.calls[0]?.[0]).toMatchObject({
        amountInCents: 500,
      });
    });

    it('recusa quando o saldo já é o informado', async () => {
      const { accounts, transactions, service } = setup();
      const existing = checking(100000);
      accounts.findById.mockResolvedValue(existing);

      await expect(
        service.adjust(USER, existing.id, {
          balanceInCents: 100000,
          date: '2026-10-10',
        }),
      ).rejects.toThrow('O saldo da conta já é esse');
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa ajustar conta arquivada', async () => {
      const { accounts, transactions, service } = setup();
      const existing = checking();
      existing.archived = true;
      accounts.findById.mockResolvedValue(existing);

      await expect(
        service.adjust(USER, existing.id, {
          balanceInCents: 5,
          date: '2026-10-10',
        }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('recusa data anterior à do saldo inicial', async () => {
      const { accounts, transactions, service } = setup();
      const existing = checking();
      accounts.findById.mockResolvedValue(existing);

      await expect(
        service.adjust(USER, existing.id, {
          balanceInCents: 5,
          date: '2026-09-30',
        }),
      ).rejects.toThrow(/anterior à data do saldo inicial/);
      expect(transactions.save).not.toHaveBeenCalled();
    });

    it('falha quando a conta não existe', async () => {
      const { accounts, service } = setup();
      accounts.findById.mockResolvedValue(null);

      await expect(
        service.adjust(USER, '11111111-1111-4111-8111-111111111111', {
          balanceInCents: 5,
          date: '2026-10-10',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('isolamento por usuário', () => {
    const input = {
      name: 'Nova',
      type: 'CHECKING' as const,
      initialBalanceDate: '2026-01-01',
    };

    it('a conta nasce do dono da sessão, mesmo que o corpo diga outro', async () => {
      const { accounts, service } = setup();
      accounts.findByName.mockResolvedValue(null);

      await service.create(OTHER, { ...input, userId: USER } as never);

      expect(accounts.save.mock.calls[0]?.[0].userId).toBe(OTHER);
      expect(accounts.findByName).toHaveBeenCalledWith(OTHER, 'Nova');
    });

    it('a conta de outro usuário não existe: não edita, não ajusta nem remove', async () => {
      const { accounts, service } = setup();
      const known = [Account.create({ userId: USER, ...input })];
      accounts.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );

      await expect(
        service.update(OTHER, known[0].id, { name: 'Hackeada' }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(
        service.adjust(OTHER, known[0].id, {
          balanceInCents: 999999,
          date: '2026-10-01',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(service.remove(OTHER, known[0].id)).rejects.toBeInstanceOf(
        FinanceNotFoundError,
      );
      expect(accounts.save).not.toHaveBeenCalled();
      expect(accounts.delete).not.toHaveBeenCalled();
    });

    it('não aponta para o banco de outro usuário', async () => {
      const { accounts, banks, service } = setup();
      const known = [Bank.create(USER, 'Nubank')];
      accounts.findByName.mockResolvedValue(null);
      banks.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );

      await expect(
        service.create(OTHER, { ...input, bankId: known[0].id }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(accounts.save).not.toHaveBeenCalled();
    });
  });
});
