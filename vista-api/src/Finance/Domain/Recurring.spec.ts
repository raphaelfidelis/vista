import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Month } from './Month';
import { Recurring } from './Recurring';

const USER = '11111111-1111-4111-8111-111111111111';

const CATEGORY = '11111111-1111-4111-8111-111111111111';
const ACCOUNT = '22222222-2222-4222-8222-222222222222';

const rent = {
  userId: USER,
  description: 'Aluguel',
  kind: 'EXPENSE' as const,
  categoryId: CATEGORY,
  accountId: ACCOUNT,
  amountInCents: 200000,
  variableAmount: false,
  dueDay: 5,
};

describe('Recurring', () => {
  describe('create', () => {
    it('nasce ativo, com id próprio e descrição aparada', () => {
      const recurring = Recurring.create({
        ...rent,
        description: '  Aluguel ',
      });

      expect(recurring.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(recurring.description).toBe('Aluguel');
      expect(recurring.active).toBe(true);
      expect(recurring.kind).toBe('EXPENSE');
      expect(recurring.accountId).toBe(ACCOUNT);
    });

    it('aceita receita fixa', () => {
      expect(Recurring.create({ ...rent, kind: 'INCOME' }).kind).toBe('INCOME');
    });

    it('aceita valor variável sem referência ou com ela', () => {
      const energy = Recurring.create({
        ...rent,
        variableAmount: true,
        amountInCents: null,
      });
      const withReference = Recurring.create({
        ...rent,
        variableAmount: true,
        amountInCents: 25000,
      });

      expect(energy.amountInCents).toBeNull();
      expect(withReference.amountInCents).toBe(25000);
    });

    it('exige valor quando ele não varia', () => {
      expect(() => Recurring.create({ ...rent, amountInCents: null })).toThrow(
        FinanceValidationError,
      );
      expect(() =>
        Recurring.create({ ...rent, amountInCents: undefined }),
      ).toThrow(/Informe o valor/);
    });

    it.each([0, -1, 10.5, 2_147_483_648])('recusa o valor %p', (amount) => {
      expect(() =>
        Recurring.create({ ...rent, amountInCents: amount }),
      ).toThrow(FinanceValidationError);
    });

    it.each([0, 32, 1.5, -3])('recusa o dia de vencimento %p', (dueDay) => {
      expect(() => Recurring.create({ ...rent, dueDay })).toThrow(
        FinanceValidationError,
      );
    });

    it('recusa descrição vazia', () => {
      expect(() => Recurring.create({ ...rent, description: '   ' })).toThrow(
        FinanceValidationError,
      );
    });
  });

  describe('defineAmount', () => {
    it('troca valor e "varia" juntos', () => {
      const recurring = Recurring.create(rent);

      recurring.defineAmount(null, true);

      expect(recurring.amountInCents).toBeNull();
      expect(recurring.variableAmount).toBe(true);
    });

    it('recusa ficar sem valor e sem variar, mantendo o estado anterior', () => {
      const recurring = Recurring.create(rent);

      expect(() => recurring.defineAmount(null, false)).toThrow(
        FinanceValidationError,
      );
      expect(recurring.amountInCents).toBe(200000);
      expect(recurring.variableAmount).toBe(false);
    });
  });

  describe('setters', () => {
    it('validam o dia e a descrição e permitem desativar e trocar a conta', () => {
      const recurring = Recurring.create(rent);

      expect(() => {
        recurring.dueDay = 40;
      }).toThrow(FinanceValidationError);
      expect(() => {
        recurring.description = ' ';
      }).toThrow(FinanceValidationError);

      recurring.dueDay = 10;
      recurring.active = false;
      recurring.defineOrigin(CATEGORY, null);

      expect(recurring.dueDay).toBe(10);
      expect(recurring.active).toBe(false);
      expect(recurring.accountId).toBe(CATEGORY);
    });
  });

  describe('origem', () => {
    const CARD = '33333333-3333-4333-8333-333333333333';

    it('aceita despesa no cartão, sem conta', () => {
      const recurring = Recurring.create({
        ...rent,
        accountId: null,
        cardId: CARD,
      });

      expect(recurring.cardId).toBe(CARD);
      expect(recurring.accountId).toBeNull();
    });

    it('exige exatamente uma origem: conta ou cartão', () => {
      expect(() =>
        Recurring.create({
          ...rent,
          accountId: null,
          cardId: null,
        }),
      ).toThrow(/conta ou o cartão/);
      expect(() => Recurring.create({ ...rent, cardId: CARD })).toThrow(
        /conta ou o cartão/,
      );
    });

    it('recusa receita no cartão', () => {
      expect(() =>
        Recurring.create({
          ...rent,
          kind: 'INCOME',
          accountId: null,
          cardId: CARD,
        }),
      ).toThrow(/Só a despesa/);
    });

    it('troca a origem de uma vez e mantém a anterior ao recusar', () => {
      const recurring = Recurring.create(rent);

      recurring.defineOrigin(null, CARD);

      expect(recurring.cardId).toBe(CARD);
      expect(recurring.accountId).toBeNull();
      expect(() => recurring.defineOrigin(null, null)).toThrow(
        FinanceValidationError,
      );
      expect(recurring.cardId).toBe(CARD);
    });
  });

  describe('dueDateIn', () => {
    it('usa o dia do vencimento', () => {
      expect(Recurring.create(rent).dueDateIn(Month.parse('2026-10'))).toBe(
        '2026-10-05',
      );
    });

    it.each([
      ['2026-02', '2026-02-28'],
      ['2028-02', '2028-02-29'],
      ['2026-04', '2026-04-30'],
      ['2026-12', '2026-12-31'],
    ])('dia 31 em %s cai em %s', (month, expected) => {
      const recurring = Recurring.create({ ...rent, dueDay: 31 });

      expect(recurring.dueDateIn(Month.parse(month))).toBe(expected);
    });
  });
});
