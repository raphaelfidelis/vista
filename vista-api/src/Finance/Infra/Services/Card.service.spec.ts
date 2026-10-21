import { Bank } from '../../Domain/Bank';
import { Card } from '../../Domain/Card';
import type { Clock } from '../../Domain/Clock';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { Month } from '../../Domain/Month';
import { Recurring } from '../../Domain/Recurring';
import { Transaction } from '../../Domain/Transaction';
import { CardServiceImpl } from './Card.service';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '99999999-9999-4999-8999-999999999999';

function setup() {
  const cards = {
    findAll: jest.fn<Promise<Card[]>, [string]>(),
    findById: jest.fn<Promise<Card | null>, [string, string]>(),
    findByName: jest.fn<Promise<Card | null>, [string, string]>(),
    existsWithBank: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Card]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
  const banks = {
    findAll: jest.fn<Promise<Bank[]>, [string]>(),
    findById: jest.fn<Promise<Bank | null>, [string, string]>(),
    findByName: jest.fn<Promise<Bank | null>, [string, string]>(),
    save: jest.fn<Promise<void>, [Bank]>(),
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
  const recurring = {
    findAll: jest.fn<Promise<Recurring[]>, [string]>(),
    findById: jest.fn<Promise<Recurring | null>, [string, string]>(),
    existsWithCategory: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithAccount: jest.fn<Promise<boolean>, [string, string]>(),
    existsWithCard: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Recurring]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
  const clock: Clock = { today: () => '2026-10-11' };

  cards.findByName.mockResolvedValue(null);
  banks.findById.mockResolvedValue(null);
  transactions.findByCard.mockResolvedValue([]);
  transactions.existsWithCard.mockResolvedValue(false);
  recurring.existsWithCard.mockResolvedValue(false);

  return {
    cards,
    banks,
    transactions,
    recurring,
    service: new CardServiceImpl(cards, banks, transactions, recurring, clock),
  };
}

const input = {
  name: 'Nubank',
  closingDay: 25,
  dueDay: 5,
  limitInCents: 500000,
};

describe('CardServiceImpl', () => {
  describe('create', () => {
    it('salva e devolve o cartão sem uso e com a fatura aberta', async () => {
      const { cards, service } = setup();

      const created = await service.create(USER, input);

      expect(created).toMatchObject({
        name: 'Nubank',
        closingDay: 25,
        dueDay: 5,
        limitInCents: 500000,
        usedInCents: 0,
        availableInCents: 500000,
        archived: false,
        bankName: null,
      });
      // Hoje é 11/10 e o cartão fecha dia 25: a compra de hoje vence em 05/11.
      expect(created.currentInvoice).toMatchObject({
        month: '2026-11',
        status: 'OPEN',
        closingDate: '2026-10-25',
        dueDate: '2026-11-05',
      });
      expect(cards.save).toHaveBeenCalledTimes(1);
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
      const { cards, service } = setup();

      await expect(
        service.create(USER, {
          ...input,
          bankId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(cards.save).not.toHaveBeenCalled();
    });

    it('recusa nome já usado, citando o nome que existe', async () => {
      const { cards, service } = setup();
      cards.findByName.mockResolvedValue(
        Card.create({ userId: USER, ...input, name: 'Nubank' }),
      );

      await expect(
        service.create(USER, { ...input, name: 'nubank' }),
      ).rejects.toThrow('Já existe um cartão chamado "Nubank"');
      await expect(
        service.create(USER, { ...input, name: 'nubank' }),
      ).rejects.toBeInstanceOf(FinanceDuplicateError);
    });

    it('recusa dado inválido antes de tocar o repositório', async () => {
      const { cards, banks, service } = setup();

      await expect(
        service.create(USER, { ...input, closingDay: 40 }),
      ).rejects.toBeInstanceOf(FinanceValidationError);
      expect(banks.findById).not.toHaveBeenCalled();
      expect(cards.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('altera só os campos informados e devolve o uso do limite', async () => {
      const { cards, transactions, service } = setup();
      const existing = Card.create({ ...input, userId: USER });
      cards.findById.mockResolvedValue(existing);
      transactions.findByCard.mockResolvedValue([
        Transaction.create({
          userId: USER,
          kind: 'EXPENSE',
          description: 'Compra',
          amountInCents: 120000,
          date: '2026-10-05',
          categoryId: '33333333-3333-4333-8333-333333333333',
          cardId: existing.id,
          invoiceMonth: '2026-11',
        }),
      ]);

      const updated = await service.update(USER, existing.id, { dueDay: 10 });

      expect(updated).toMatchObject({
        name: 'Nubank',
        closingDay: 25,
        dueDay: 10,
        usedInCents: 120000,
        availableInCents: 380000,
      });
      expect(cards.save).toHaveBeenCalledTimes(1);
    });

    it('tira o limite com nulo e arquiva', async () => {
      const { cards, service } = setup();
      const existing = Card.create({ ...input, userId: USER });
      cards.findById.mockResolvedValue(existing);

      const updated = await service.update(USER, existing.id, {
        limitInCents: null,
        archived: true,
      });

      expect(updated).toMatchObject({
        limitInCents: null,
        availableInCents: null,
        archived: true,
      });
    });

    it('permite manter o nome do próprio cartão e recusa o de outro', async () => {
      const { cards, service } = setup();
      const existing = Card.create({ ...input, userId: USER });
      cards.findById.mockResolvedValue(existing);
      cards.findByName.mockResolvedValue(existing);

      await expect(
        service.update(USER, existing.id, { name: 'NUBANK' }),
      ).resolves.toMatchObject({ name: 'NUBANK' });

      cards.findByName.mockResolvedValue(
        Card.create({ userId: USER, ...input, name: 'Inter' }),
      );

      await expect(
        service.update(USER, existing.id, { name: 'inter' }),
      ).rejects.toBeInstanceOf(FinanceDuplicateError);
    });

    it('falha quando o cartão não existe', async () => {
      const { cards, service } = setup();
      cards.findById.mockResolvedValue(null);

      await expect(
        service.update(USER, '11111111-1111-4111-8111-111111111111', {}),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('remove', () => {
    it('remove cartão sem uso', async () => {
      const { cards, service } = setup();
      const existing = Card.create({ ...input, userId: USER });
      cards.findById.mockResolvedValue(existing);

      await service.remove(USER, existing.id);

      expect(cards.delete).toHaveBeenCalledWith(USER, existing.id);
    });

    it('recusa remover cartão com compras ou pagamentos', async () => {
      const { cards, transactions, service } = setup();
      const existing = Card.create({ ...input, userId: USER });
      cards.findById.mockResolvedValue(existing);
      transactions.existsWithCard.mockResolvedValue(true);

      await expect(service.remove(USER, existing.id)).rejects.toBeInstanceOf(
        FinanceInUseError,
      );
      expect(cards.delete).not.toHaveBeenCalled();
    });

    it('recusa remover cartão usado por um gasto fixo', async () => {
      const { cards, recurring, service } = setup();
      const existing = Card.create({ ...input, userId: USER });
      cards.findById.mockResolvedValue(existing);
      recurring.existsWithCard.mockResolvedValue(true);

      await expect(service.remove(USER, existing.id)).rejects.toBeInstanceOf(
        FinanceInUseError,
      );
      expect(cards.delete).not.toHaveBeenCalled();
    });

    it('falha quando o cartão não existe', async () => {
      const { cards, service } = setup();
      cards.findById.mockResolvedValue(null);

      await expect(
        service.remove(USER, '11111111-1111-4111-8111-111111111111'),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('isolamento por usuário', () => {
    const input = { name: 'Nubank', closingDay: 25, dueDay: 5 };

    it('o cartão nasce do dono da sessão, mesmo que o corpo diga outro', async () => {
      const { cards, service } = setup();
      cards.findByName.mockResolvedValue(null);

      await service.create(OTHER, { ...input, userId: USER } as never);

      expect(cards.save.mock.calls[0]?.[0].userId).toBe(OTHER);
      expect(cards.findByName).toHaveBeenCalledWith(OTHER, 'Nubank');
    });

    it('o cartão de outro usuário não existe: não edita nem remove', async () => {
      const { cards, service } = setup();
      const known = [Card.create({ userId: USER, ...input })];
      cards.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );

      await expect(
        service.update(OTHER, known[0].id, { name: 'Hackeado' }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(service.remove(OTHER, known[0].id)).rejects.toBeInstanceOf(
        FinanceNotFoundError,
      );
      expect(cards.save).not.toHaveBeenCalled();
      expect(cards.delete).not.toHaveBeenCalled();
    });

    it('não aponta para o banco de outro usuário', async () => {
      const { cards, banks, service } = setup();
      const known = [Bank.create(USER, 'Nubank')];
      cards.findByName.mockResolvedValue(null);
      banks.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );

      await expect(
        service.create(OTHER, { ...input, bankId: known[0].id }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      expect(cards.save).not.toHaveBeenCalled();
    });
  });
});
