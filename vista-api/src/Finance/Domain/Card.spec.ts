import { Card } from './Card';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Transaction } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';

const CATEGORY = '33333333-3333-4333-8333-333333333333';
const ACCOUNT = '22222222-2222-4222-8222-222222222222';

function card(closingDay: number, dueDay: number, limitInCents?: number) {
  return Card.create({
    userId: USER,
    name: 'Nubank',
    closingDay,
    dueDay,
    limitInCents,
  });
}

describe('Card', () => {
  describe('create', () => {
    it('nasce ativo, sem banco e sem limite por padrão, com nome aparado', () => {
      const created = Card.create({
        userId: USER,
        name: '  Nubank ',
        closingDay: 25,
        dueDay: 5,
      });

      expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(created.name).toBe('Nubank');
      expect(created.archived).toBe(false);
      expect(created.bankId).toBeNull();
      expect(created.limitInCents).toBeNull();
    });

    it.each([0, 32, 1.5, -1])('recusa o dia %p', (day) => {
      expect(() => card(day, 5)).toThrow(FinanceValidationError);
      expect(() => card(5, day)).toThrow(FinanceValidationError);
    });

    it.each([0, -100, 10.5, 2_147_483_648])('recusa o limite %p', (limit) => {
      expect(() => card(25, 5, limit)).toThrow(FinanceValidationError);
    });

    it('recusa nome vazio', () => {
      expect(() =>
        Card.create({ userId: USER, name: ' ', closingDay: 25, dueDay: 5 }),
      ).toThrow(FinanceValidationError);
    });
  });

  describe('invoiceMonthFor', () => {
    it.each([
      // fecha dia 25, vence dia 5 (o vencimento vem depois da virada do mês)
      ['2026-10-10', '2026-11'],
      ['2026-10-24', '2026-11'],
      ['2026-10-25', '2026-12'],
      ['2026-10-31', '2026-12'],
      ['2026-12-28', '2027-02'],
    ])('fecha 25, vence 5: compra de %s cai na fatura %s', (date, expected) => {
      expect(card(25, 5).invoiceMonthFor(date)).toBe(expected);
    });

    it.each([
      // fecha dia 5, vence dia 15 (vence no mesmo mês do fechamento)
      ['2026-10-03', '2026-10'],
      ['2026-10-04', '2026-10'],
      ['2026-10-05', '2026-11'],
      ['2026-12-20', '2027-01'],
    ])('fecha 5, vence 15: compra de %s cai na fatura %s', (date, expected) => {
      expect(card(5, 15).invoiceMonthFor(date)).toBe(expected);
    });

    it.each([
      // fecha dia 31: em mês curto fecha no último dia
      ['2026-02-27', '2026-03'],
      ['2026-02-28', '2026-04'],
      ['2026-10-30', '2026-11'],
      ['2026-10-31', '2026-12'],
    ])(
      'fecha 31, vence 10: compra de %s cai na fatura %s',
      (date, expected) => {
        expect(card(31, 10).invoiceMonthFor(date)).toBe(expected);
      },
    );

    it('no ano bissexto o fechamento 31 cai no dia 29', () => {
      expect(card(31, 10).invoiceMonthFor('2028-02-28')).toBe('2028-03');
      expect(card(31, 10).invoiceMonthFor('2028-02-29')).toBe('2028-04');
    });
  });

  describe('closingDateOf e dueDateOf', () => {
    it('acha o fechamento no mês anterior quando o vencimento vem antes dele', () => {
      expect(card(25, 5).closingDateOf('2026-11')).toBe('2026-10-25');
      expect(card(25, 5).closingDateOf('2027-01')).toBe('2026-12-25');
    });

    it('fecha no mesmo mês quando o vencimento vem depois', () => {
      expect(card(5, 15).closingDateOf('2026-10')).toBe('2026-10-05');
    });

    it('limita o dia ao fim do mês', () => {
      expect(card(31, 10).closingDateOf('2026-03')).toBe('2026-02-28');
      expect(card(25, 31).dueDateOf('2026-02')).toBe('2026-02-28');
      expect(card(25, 5).dueDateOf('2026-11')).toBe('2026-11-05');
    });
  });

  describe('usage', () => {
    function purchase(cardId: string, amountInCents: number) {
      return Transaction.create({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Compra',
        amountInCents,
        date: '2026-10-05',
        categoryId: CATEGORY,
        cardId,
        invoiceMonth: '2026-11',
      });
    }

    function payment(cardId: string, amountInCents: number) {
      return Transaction.create({
        userId: USER,
        kind: 'TRANSFER',
        description: 'Pagamento de fatura',
        amountInCents,
        date: '2026-11-05',
        accountId: ACCOUNT,
        toCardId: cardId,
        invoiceMonth: '2026-11',
      });
    }

    it('é o que foi comprado menos o que foi pago, em qualquer fatura', () => {
      const nubank = card(25, 5, 500000);

      expect(
        nubank.usage([
          purchase(nubank.id, 80000),
          purchase(nubank.id, 20000),
          payment(nubank.id, 30000),
        ]),
      ).toEqual({ usedInCents: 70000, availableInCents: 430000 });
    });

    it('sem limite, o disponível é nulo', () => {
      const nubank = card(25, 5);

      expect(nubank.usage([purchase(nubank.id, 1000)])).toEqual({
        usedInCents: 1000,
        availableInCents: null,
      });
    });

    it('ignora movimentos de outros cartões', () => {
      const nubank = card(25, 5, 100000);
      const other = card(10, 20);

      expect(nubank.usage([purchase(other.id, 99999)]).usedInCents).toBe(0);
    });

    it('pagar a mais deixa o uso negativo e o disponível acima do limite', () => {
      const nubank = card(25, 5, 100000);

      expect(
        nubank.usage([purchase(nubank.id, 1000), payment(nubank.id, 1500)]),
      ).toEqual({ usedInCents: -500, availableInCents: 100500 });
    });
  });
});
