import { Account } from './Account';
import { Goal } from './Goal';
import { GoalProgress } from './GoalProgress';
import { Transaction } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';

// Hoje é 11/10/2026.
const TODAY = '2026-10-11';

const reserve = Account.create({
  userId: USER,
  name: 'Reserva viagem',
  type: 'RESERVE',
  initialBalanceInCents: 200000,
  initialBalanceDate: '2026-01-01',
});

function goal(targetInCents: number, deadline?: string) {
  return Goal.create({
    userId: USER,
    name: 'Viagem',
    targetInCents,
    deadline,
    accountId: reserve.id,
  });
}

function adjustment(amountInCents: number) {
  return Transaction.create({
    userId: USER,
    kind: 'ADJUSTMENT',
    description: 'Ajuste',
    amountInCents,
    date: '2026-09-01',
    accountId: reserve.id,
  });
}

describe('GoalProgress', () => {
  it('o progresso é o saldo da conta sobre o alvo', () => {
    const progress = new GoalProgress(goal(1000000), reserve, [], TODAY);

    expect(progress.balanceInCents).toBe(200000);
    expect(progress.progress).toBe(0.2);
    expect(progress.remainingInCents).toBe(800000);
  });

  it('considera os movimentos da conta no saldo', () => {
    const progress = new GoalProgress(
      goal(1000000),
      reserve,
      [adjustment(300000)],
      TODAY,
    );

    expect(progress.balanceInCents).toBe(500000);
    expect(progress.progress).toBe(0.5);
  });

  it('passa de 100% quando a meta é superada, sem restar nada', () => {
    const progress = new GoalProgress(goal(150000), reserve, [], TODAY);

    expect(progress.progress).toBeCloseTo(1.3333, 3);
    expect(progress.remainingInCents).toBe(0);
  });

  it('saldo negativo dá progresso zero', () => {
    const progress = new GoalProgress(
      goal(100000),
      reserve,
      [adjustment(-500000)],
      TODAY,
    );

    expect(progress.balanceInCents).toBe(-300000);
    expect(progress.progress).toBe(0);
    expect(progress.remainingInCents).toBe(400000);
  });

  describe('prazo', () => {
    it('sem prazo não há meses nem valor mensal', () => {
      const progress = new GoalProgress(goal(1000000), reserve, [], TODAY);

      expect(progress.monthsLeft).toBeNull();
      expect(progress.monthlyNeededInCents).toBeNull();
      expect(progress.deadlinePassed).toBe(false);
    });

    it.each([
      ['2026-10', 1],
      ['2026-11', 2],
      ['2026-12', 3],
      ['2027-01', 4],
      ['2027-10', 13],
    ])('prazo %s: faltam %p meses, contando o atual', (deadline, months) => {
      const progress = new GoalProgress(
        goal(1000000, deadline),
        reserve,
        [],
        TODAY,
      );

      expect(progress.monthsLeft).toBe(months);
      expect(progress.deadlinePassed).toBe(false);
    });

    it('calcula quanto guardar por mês, arredondando para cima', () => {
      // Faltam 800000 em 3 meses = 266666,67 por mês.
      const progress = new GoalProgress(
        goal(1000000, '2026-12'),
        reserve,
        [],
        TODAY,
      );

      expect(progress.monthlyNeededInCents).toBe(266667);
    });

    it('meta batida não precisa de aporte mensal', () => {
      const progress = new GoalProgress(
        goal(100000, '2026-12'),
        reserve,
        [],
        TODAY,
      );

      expect(progress.monthlyNeededInCents).toBe(0);
    });

    it.each([
      ['2026-09', 0],
      ['2026-08', -1],
      ['2025-10', -11],
    ])('prazo vencido %s: monthsLeft %p', (deadline, months) => {
      const progress = new GoalProgress(
        goal(1000000, deadline),
        reserve,
        [],
        TODAY,
      );

      expect(progress.monthsLeft).toBe(months);
      expect(progress.deadlinePassed).toBe(true);
      expect(progress.monthlyNeededInCents).toBeNull();
    });
  });
});
