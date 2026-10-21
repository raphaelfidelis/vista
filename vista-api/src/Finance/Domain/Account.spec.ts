import { Account } from './Account';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Transaction } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';

const OTHER = '22222222-2222-4222-8222-222222222222';
const CATEGORY = '33333333-3333-4333-8333-333333333333';

function account(
  initialBalanceInCents = 100000,
  initialBalanceDate = '2026-10-01',
) {
  return Account.create({
    userId: USER,
    name: 'Nubank',
    type: 'CHECKING',
    initialBalanceInCents,
    initialBalanceDate,
  });
}

function income(accountId: string, amountInCents: number, date = '2026-10-05') {
  return Transaction.create({
    userId: USER,
    kind: 'INCOME',
    description: 'Salário',
    amountInCents,
    date,
    categoryId: CATEGORY,
    accountId,
  });
}

function expense(
  accountId: string,
  amountInCents: number,
  date = '2026-10-06',
) {
  return Transaction.create({
    userId: USER,
    kind: 'EXPENSE',
    description: 'Mercado',
    amountInCents,
    date,
    categoryId: CATEGORY,
    accountId,
  });
}

describe('Account', () => {
  describe('create', () => {
    it('nasce ativa, com saldo inicial zero por padrão e nome aparado', () => {
      const created = Account.create({
        userId: USER,
        name: '  Carteira ',
        type: 'CASH',
        initialBalanceDate: '2026-10-01',
      });

      expect(created.name).toBe('Carteira');
      expect(created.initialBalanceInCents).toBe(0);
      expect(created.archived).toBe(false);
      expect(created.bankId).toBeNull();
    });

    it('aceita saldo inicial negativo', () => {
      expect(account(-5000).initialBalanceInCents).toBe(-5000);
    });

    it('recusa nome vazio, data inválida e saldo fora do limite', () => {
      expect(() =>
        Account.create({
          userId: USER,
          name: ' ',
          type: 'CASH',
          initialBalanceDate: '2026-10-01',
        }),
      ).toThrow(FinanceValidationError);
      expect(() => account(0, '2026-13-01')).toThrow(FinanceValidationError);
      expect(() => account(2_147_483_648)).toThrow(FinanceValidationError);
      expect(() => account(1.5)).toThrow(FinanceValidationError);
    });
  });

  describe('balance', () => {
    it('é o saldo inicial sem movimentos', () => {
      expect(account().balance([])).toBe(100000);
    });

    it('soma receitas e subtrai despesas da conta', () => {
      const checking = account();

      expect(
        checking.balance([
          income(checking.id, 50000),
          expense(checking.id, 20000),
        ]),
      ).toBe(130000);
    });

    it('subtrai a transferência enviada e soma a recebida', () => {
      const checking = account();
      const reserve = Account.create({
        userId: USER,
        name: 'Reserva',
        type: 'RESERVE',
        initialBalanceDate: '2026-10-01',
      });
      const transfer = Transaction.create({
        userId: USER,
        kind: 'TRANSFER',
        description: 'Guardar',
        amountInCents: 30000,
        date: '2026-10-07',
        accountId: checking.id,
        toAccountId: reserve.id,
      });

      expect(checking.balance([transfer])).toBe(70000);
      expect(reserve.balance([transfer])).toBe(30000);
    });

    it('aplica o ajuste com o sinal que ele tem', () => {
      const checking = account();
      const gain = Transaction.create({
        userId: USER,
        kind: 'ADJUSTMENT',
        description: 'Rendimento',
        amountInCents: 1234,
        date: '2026-10-08',
        accountId: checking.id,
      });
      const loss = Transaction.create({
        userId: USER,
        kind: 'ADJUSTMENT',
        description: 'Correção',
        amountInCents: -234,
        date: '2026-10-09',
        accountId: checking.id,
      });

      expect(checking.balance([gain, loss])).toBe(101000);
    });

    it('ignora lançamentos de outras contas', () => {
      const checking = account();

      expect(checking.balance([income(OTHER, 99999)])).toBe(100000);
    });

    it('ignora lançamentos anteriores à data do saldo inicial', () => {
      const checking = account(100000, '2026-10-10');

      expect(
        checking.balance([
          income(checking.id, 50000, '2026-10-09'),
          income(checking.id, 7000, '2026-10-10'),
        ]),
      ).toBe(107000);
    });
  });

  describe('cartão', () => {
    it('não move a conta uma compra no cartão, mas o pagamento da fatura sim', () => {
      const checking = account();
      const purchase = Transaction.create({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Notebook',
        amountInCents: 90000,
        date: '2026-10-06',
        categoryId: CATEGORY,
        cardId: OTHER,
        invoiceMonth: '2026-11',
      });
      const payment = Transaction.create({
        userId: USER,
        kind: 'TRANSFER',
        description: 'Pagamento de fatura',
        amountInCents: 30000,
        date: '2026-11-05',
        accountId: checking.id,
        toCardId: OTHER,
        invoiceMonth: '2026-11',
      });

      expect(checking.balance([purchase])).toBe(100000);
      expect(checking.balance([purchase, payment])).toBe(70000);
    });
  });

  describe('setters', () => {
    it('validam e permitem arquivar', () => {
      const checking = account();

      expect(() => {
        checking.name = '  ';
      }).toThrow(FinanceValidationError);
      expect(() => {
        checking.initialBalanceDate = 'ontem';
      }).toThrow(FinanceValidationError);

      checking.archived = true;
      checking.bankId = OTHER;

      expect(checking.archived).toBe(true);
      expect(checking.bankId).toBe(OTHER);
    });
  });
});
