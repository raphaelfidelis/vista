import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Goal } from './Goal';

const USER = '11111111-1111-4111-8111-111111111111';

const ACCOUNT = '22222222-2222-4222-8222-222222222222';

describe('Goal', () => {
  it('nasce com id próprio, nome aparado e sem prazo por padrão', () => {
    const goal = Goal.create({
      userId: USER,
      name: '  Viagem ',
      targetInCents: 1000000,
      accountId: ACCOUNT,
    });

    expect(goal.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(goal.name).toBe('Viagem');
    expect(goal.deadline).toBeNull();
    expect(goal.accountId).toBe(ACCOUNT);
  });

  it('aceita prazo no formato AAAA-MM', () => {
    expect(
      Goal.create({
        userId: USER,
        name: 'Viagem',
        targetInCents: 100,
        deadline: '2026-12',
        accountId: ACCOUNT,
      }).deadline,
    ).toBe('2026-12');
  });

  it.each(['2026-13', 'dezembro', '2026-12-31'])(
    'recusa o prazo %p',
    (deadline) => {
      expect(() =>
        Goal.create({
          userId: USER,
          name: 'Viagem',
          targetInCents: 100,
          deadline,
          accountId: ACCOUNT,
        }),
      ).toThrow(FinanceValidationError);
    },
  );

  it.each([0, -1, 10.5, 2_147_483_648])('recusa o alvo %p', (target) => {
    expect(() =>
      Goal.create({
        userId: USER,
        name: 'x',
        targetInCents: target,
        accountId: ACCOUNT,
      }),
    ).toThrow(FinanceValidationError);
  });

  it('recusa nome vazio', () => {
    expect(() =>
      Goal.create({
        userId: USER,
        name: ' ',
        targetInCents: 100,
        accountId: ACCOUNT,
      }),
    ).toThrow(FinanceValidationError);
  });

  it('os setters validam e o prazo pode ser tirado', () => {
    const goal = Goal.create({
      userId: USER,
      name: 'Viagem',
      targetInCents: 100,
      deadline: '2026-12',
      accountId: ACCOUNT,
    });

    expect(() => {
      goal.targetInCents = 0;
    }).toThrow(FinanceValidationError);
    expect(() => {
      goal.name = '';
    }).toThrow(FinanceValidationError);
    expect(goal.targetInCents).toBe(100);

    goal.deadline = null;
    goal.targetInCents = 500;
    goal.name = 'Europa';

    expect(goal.deadline).toBeNull();
    expect(goal.targetInCents).toBe(500);
    expect(goal.name).toBe('Europa');
  });
});
