import { Account } from './Account';
import { AccountStatement } from './AccountStatement';
import { Month } from './Month';
import { Transaction } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';

const CATEGORY = '33333333-3333-4333-8333-333333333333';
const OTHER = '22222222-2222-4222-8222-222222222222';
const OCTOBER = Month.parse('2026-10');

const checking = Account.create({
  userId: USER,
  name: 'Corrente',
  type: 'CHECKING',
  initialBalanceInCents: 100000,
  initialBalanceDate: '2026-09-01',
});

function income(amountInCents: number, date: string): Transaction {
  return Transaction.create({
    userId: USER,
    kind: 'INCOME',
    description: 'Salário',
    amountInCents,
    date,
    categoryId: CATEGORY,
    accountId: checking.id,
  });
}

function expense(amountInCents: number, date: string): Transaction {
  return Transaction.create({
    userId: USER,
    kind: 'EXPENSE',
    description: 'Mercado',
    amountInCents,
    date,
    categoryId: CATEGORY,
    accountId: checking.id,
  });
}

describe('AccountStatement', () => {
  it('abre com o saldo inicial mais os lançamentos dos meses anteriores', () => {
    const statement = new AccountStatement(checking, OCTOBER, [
      expense(30000, '2026-09-10'),
      income(50000, '2026-09-20'),
    ]);

    expect(statement.openingInCents).toBe(120000);
    expect(statement.movements).toHaveLength(0);
    expect(statement.closingInCents).toBe(120000);
  });

  it('lista os movimentos do mês com saldo corrente, em ordem', () => {
    const statement = new AccountStatement(checking, OCTOBER, [
      expense(20000, '2026-10-12'),
      income(300000, '2026-10-05'),
      expense(1000, '2026-11-01'),
    ]);

    expect(statement.openingInCents).toBe(100000);
    expect(
      statement.movements.map((m) => [m.effectInCents, m.balanceInCents]),
    ).toEqual([
      [300000, 400000],
      [-20000, 380000],
    ]);
    expect(statement.closingInCents).toBe(380000);
  });

  it('mostra a transferência como saída na origem e como entrada no destino', () => {
    const reserve = Account.create({
      userId: USER,
      name: 'Reserva',
      type: 'RESERVE',
      initialBalanceDate: '2026-09-01',
    });
    const transfer = Transaction.create({
      userId: USER,
      kind: 'TRANSFER',
      description: 'Guardar',
      amountInCents: 40000,
      date: '2026-10-07',
      accountId: checking.id,
      toAccountId: reserve.id,
    });

    expect(
      new AccountStatement(checking, OCTOBER, [transfer]).closingInCents,
    ).toBe(60000);
    expect(
      new AccountStatement(reserve, OCTOBER, [transfer]).closingInCents,
    ).toBe(40000);
  });

  it('inclui o ajuste com o sinal dele', () => {
    const adjustment = Transaction.create({
      userId: USER,
      kind: 'ADJUSTMENT',
      description: 'Ajuste de saldo',
      amountInCents: -5000,
      date: '2026-10-09',
      accountId: checking.id,
    });
    const statement = new AccountStatement(checking, OCTOBER, [adjustment]);

    expect(statement.movements[0]?.effectInCents).toBe(-5000);
    expect(statement.closingInCents).toBe(95000);
  });

  it('não mostra lançamentos anteriores à data do saldo inicial', () => {
    const late = Account.create({
      userId: USER,
      name: 'Nova',
      type: 'CASH',
      initialBalanceInCents: 10000,
      initialBalanceDate: '2026-10-10',
    });
    const before = Transaction.create({
      userId: USER,
      kind: 'INCOME',
      description: 'x',
      amountInCents: 99999,
      date: '2026-10-05',
      categoryId: CATEGORY,
      accountId: late.id,
    });
    const statement = new AccountStatement(late, OCTOBER, [before]);

    expect(statement.movements).toHaveLength(0);
    expect(statement.closingInCents).toBe(10000);
  });

  it('ignora lançamentos que não envolvem a conta', () => {
    const foreign = Transaction.create({
      userId: USER,
      kind: 'INCOME',
      description: 'x',
      amountInCents: 99999,
      date: '2026-10-05',
      categoryId: CATEGORY,
      accountId: OTHER,
    });
    const statement = new AccountStatement(checking, OCTOBER, [foreign]);

    expect(statement.movements).toHaveLength(0);
    expect(statement.closingInCents).toBe(100000);
  });
});
