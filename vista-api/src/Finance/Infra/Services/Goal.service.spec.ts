import { Account } from '../../Domain/Account';
import type { Clock } from '../../Domain/Clock';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { Goal } from '../../Domain/Goal';
import { Month } from '../../Domain/Month';
import { Transaction } from '../../Domain/Transaction';
import { GoalServiceImpl } from './Goal.service';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '99999999-9999-4999-8999-999999999999';

const reserve = Account.create({
  userId: USER,
  name: 'Reserva viagem',
  type: 'RESERVE',
  initialBalanceInCents: 200000,
  initialBalanceDate: '2026-01-01',
});
const other = Account.create({
  userId: USER,
  name: 'Reserva carro',
  type: 'RESERVE',
  initialBalanceDate: '2026-01-01',
});
const checking = Account.create({
  userId: USER,
  name: 'Corrente',
  type: 'CHECKING',
  initialBalanceDate: '2026-01-01',
});

function setup() {
  const goals = {
    findAll: jest.fn<Promise<Goal[]>, [string]>(),
    findById: jest.fn<Promise<Goal | null>, [string, string]>(),
    findByAccount: jest.fn<Promise<Goal | null>, [string, string]>(),
    existsWithAccount: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Goal]>(),
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
  const clock: Clock = { today: () => '2026-10-11' };
  const known = [reserve, other, checking];

  accounts.findById.mockImplementation((_, id) =>
    Promise.resolve(known.find((a) => a.id === id) ?? null),
  );
  goals.findByAccount.mockResolvedValue(null);
  transactions.findByAccount.mockResolvedValue([]);

  return {
    goals,
    accounts,
    transactions,
    service: new GoalServiceImpl(goals, accounts, transactions, clock),
  };
}

const input = {
  name: 'Viagem',
  targetInCents: 1000000,
  deadline: '2026-12',
  accountId: reserve.id,
};

describe('GoalServiceImpl', () => {
  describe('create', () => {
    it('salva e devolve a meta com o progresso da conta', async () => {
      const { goals, service } = setup();

      const created = await service.create(USER, input);

      expect(created).toMatchObject({
        name: 'Viagem',
        accountName: 'Reserva viagem',
        balanceInCents: 200000,
        progress: 0.2,
        remainingInCents: 800000,
        monthsLeft: 3,
        monthlyNeededInCents: 266667,
        deadlinePassed: false,
      });
      expect(goals.save).toHaveBeenCalledTimes(1);
    });

    it('aceita meta sem prazo', async () => {
      const { service } = setup();

      const created = await service.create(USER, {
        ...input,
        deadline: undefined,
      });

      expect(created).toMatchObject({
        deadline: null,
        monthsLeft: null,
        monthlyNeededInCents: null,
      });
    });

    it('recusa conta que não é de reserva', async () => {
      const { goals, service } = setup();

      await expect(
        service.create(USER, { ...input, accountId: checking.id }),
      ).rejects.toThrow('conta de reserva');
      expect(goals.save).not.toHaveBeenCalled();
    });

    it('recusa conta inexistente', async () => {
      const { service } = setup();

      await expect(
        service.create(USER, {
          ...input,
          accountId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });

    it('recusa uma segunda meta na mesma conta, citando a que existe', async () => {
      const { goals, service } = setup();
      goals.findByAccount.mockResolvedValue(
        Goal.create({ userId: USER, ...input, name: 'Europa' }),
      );

      await expect(service.create(USER, input)).rejects.toThrow('"Europa"');
      await expect(service.create(USER, input)).rejects.toBeInstanceOf(
        FinanceDuplicateError,
      );
      expect(goals.save).not.toHaveBeenCalled();
    });

    it('recusa dado inválido antes de tocar os repositórios', async () => {
      const { accounts, service } = setup();

      await expect(
        service.create(USER, { ...input, targetInCents: 0 }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(accounts.findById).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('altera só os campos informados', async () => {
      const { goals, service } = setup();
      const existing = Goal.create({ ...input, userId: USER });
      goals.findById.mockResolvedValue(existing);
      goals.findByAccount.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        targetInCents: 500000,
      });

      expect(updated).toMatchObject({
        name: 'Viagem',
        targetInCents: 500000,
        deadline: '2026-12',
        progress: 0.4,
      });
      expect(goals.save).toHaveBeenCalledTimes(1);
    });

    it('tira o prazo com nulo', async () => {
      const { goals, service } = setup();
      const existing = Goal.create({ ...input, userId: USER });
      goals.findById.mockResolvedValue(existing);
      goals.findByAccount.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        deadline: null,
      });

      expect(updated.deadline).toBeNull();
      expect(updated.monthsLeft).toBeNull();
    });

    it('muda para outra reserva sem meta', async () => {
      const { goals, service } = setup();
      const existing = Goal.create({ ...input, userId: USER });
      goals.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        accountId: other.id,
      });

      expect(updated).toMatchObject({
        accountName: 'Reserva carro',
        balanceInCents: 0,
      });
    });

    it('recusa mudar para conta que já tem outra meta', async () => {
      const { goals, service } = setup();
      const existing = Goal.create({ ...input, userId: USER });
      goals.findById.mockResolvedValue(existing);
      goals.findByAccount.mockResolvedValue(
        Goal.create({
          userId: USER,
          ...input,
          accountId: other.id,
          name: 'Carro',
        }),
      );

      await expect(
        service.update(USER, existing.id, { accountId: other.id }),
      ).rejects.toBeInstanceOf(FinanceDuplicateError);
      expect(goals.save).not.toHaveBeenCalled();
    });

    it('recusa mudar para conta que não é de reserva', async () => {
      const { goals, service } = setup();
      const existing = Goal.create({ ...input, userId: USER });
      goals.findById.mockResolvedValue(existing);

      await expect(
        service.update(USER, existing.id, { accountId: checking.id }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(goals.save).not.toHaveBeenCalled();
    });

    it('falha quando a meta não existe', async () => {
      const { goals, service } = setup();
      goals.findById.mockResolvedValue(null);

      await expect(
        service.update(USER, '11111111-1111-4111-8111-111111111111', {}),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('remove', () => {
    it('remove a meta existente', async () => {
      const { goals, service } = setup();
      const existing = Goal.create({ ...input, userId: USER });
      goals.findById.mockResolvedValue(existing);

      await service.remove(USER, existing.id);

      expect(goals.delete).toHaveBeenCalledWith(USER, existing.id);
    });

    it('falha quando a meta não existe', async () => {
      const { goals, service } = setup();
      goals.findById.mockResolvedValue(null);

      await expect(
        service.remove(USER, '11111111-1111-4111-8111-111111111111'),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(goals.delete).not.toHaveBeenCalled();
    });
  });

  describe('isolamento por usuário', () => {
    it('a meta nasce do dono da sessão, mesmo que o corpo diga outro', async () => {
      const { goals, accounts, service } = setup();
      const mine = Account.create({
        userId: OTHER,
        name: 'Reserva',
        type: 'RESERVE',
        initialBalanceDate: '2026-01-01',
      });
      accounts.findById.mockResolvedValue(mine);
      goals.findByAccount.mockResolvedValue(null);

      await service.create(OTHER, {
        name: 'Viagem',
        targetInCents: 1000,
        accountId: mine.id,
        userId: USER,
      } as never);

      expect(goals.save.mock.calls[0]?.[0].userId).toBe(OTHER);
    });

    it('a reserva de outro usuário não existe: não dá para criar meta nela', async () => {
      const { goals, accounts, service } = setup();
      const known = [reserve];
      accounts.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );
      goals.findByAccount.mockResolvedValue(null);

      // Controle positivo: o dono cria a meta na própria reserva.
      await expect(
        service.create(USER, {
          name: 'Minha',
          targetInCents: 1000,
          accountId: reserve.id,
        }),
      ).resolves.toMatchObject({ name: 'Minha' });
      expect(accounts.findById).toHaveBeenCalledWith(USER, reserve.id);
      goals.save.mockClear();

      await expect(
        service.create(OTHER, {
          name: 'Roubada',
          targetInCents: 1000,
          accountId: reserve.id,
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(goals.save).not.toHaveBeenCalled();
    });

    it('a meta de outro usuário não existe: não edita nem remove', async () => {
      const { goals, service } = setup();
      const known = [
        Goal.create({
          userId: USER,
          name: 'Viagem',
          targetInCents: 1000,
          accountId: reserve.id,
        }),
      ];
      goals.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );

      await expect(
        service.update(OTHER, known[0].id, { name: 'Hackeada' }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(service.remove(OTHER, known[0].id)).rejects.toBeInstanceOf(
        FinanceNotFoundError,
      );
      expect(goals.save).not.toHaveBeenCalled();
      expect(goals.delete).not.toHaveBeenCalled();
    });
  });
});
