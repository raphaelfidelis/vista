import { Account } from './Account';
import { Bank } from './Bank';
import { Card } from './Card';
import { Category } from './Category';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Goal } from './Goal';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from './Limits';
import { Recurring } from './Recurring';
import { Transaction } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';
const CATEGORY = '22222222-2222-4222-8222-222222222222';
const ACCOUNT = '33333333-3333-4333-8333-333333333333';

const name = (length: number) => 'n'.repeat(length);

describe('limites de tamanho', () => {
  it('valem 60 caracteres para nomes e 120 para descrições', () => {
    expect(MAX_NAME_LENGTH).toBe(60);
    expect(MAX_DESCRIPTION_LENGTH).toBe(120);
  });

  describe('nomes', () => {
    const creators: [string, (name: string) => unknown][] = [
      ['banco', (n) => Bank.create(USER, n)],
      [
        'categoria',
        (n) => Category.create({ userId: USER, name: n, kind: 'EXPENSE' }),
      ],
      [
        'conta',
        (n) =>
          Account.create({
            userId: USER,
            name: n,
            type: 'CHECKING',
            initialBalanceDate: '2026-01-01',
          }),
      ],
      [
        'cartão',
        (n) =>
          Card.create({ userId: USER, name: n, closingDay: 25, dueDay: 5 }),
      ],
      [
        'meta',
        (n) =>
          Goal.create({
            userId: USER,
            name: n,
            targetInCents: 1000,
            accountId: ACCOUNT,
          }),
      ],
    ];

    it.each(creators)('%s: aceita 60 e recusa 61', (_, create) => {
      expect(() => create(name(60))).not.toThrow();
      expect(() => create(name(61))).toThrow(FinanceValidationError);
      expect(() => create(name(61))).toThrow(/até 60 caracteres/);
    });

    it.each(creators)('%s: o limite vale depois de aparar', (_, create) => {
      expect(() => create('  ' + name(60) + '  ')).not.toThrow();
    });
  });

  describe('descrições', () => {
    const description = (length: number) => 'd'.repeat(length);

    it('lançamento: aceita 120 e recusa 121', () => {
      const create = (d: string) =>
        Transaction.create({
          userId: USER,
          kind: 'EXPENSE',
          description: d,
          amountInCents: 100,
          date: '2026-10-05',
          categoryId: CATEGORY,
          accountId: ACCOUNT,
        });

      expect(() => create(description(120))).not.toThrow();
      expect(() => create(description(121))).toThrow(/até 120 caracteres/);
    });

    it('lançamento: a edição também respeita o limite', () => {
      const transaction = Transaction.create({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Mercado',
        amountInCents: 100,
        date: '2026-10-05',
        categoryId: CATEGORY,
        accountId: ACCOUNT,
      });

      expect(() =>
        transaction.change({ description: description(121) }),
      ).toThrow(/até 120 caracteres/);
      expect(transaction.description).toBe('Mercado');
    });

    it('gasto fixo: aceita 120 e recusa 121', () => {
      const create = (d: string) =>
        Recurring.create({
          userId: USER,
          description: d,
          kind: 'EXPENSE',
          categoryId: CATEGORY,
          accountId: ACCOUNT,
          amountInCents: 100,
          variableAmount: false,
          dueDay: 5,
        });

      expect(() => create(description(120))).not.toThrow();
      expect(() => create(description(121))).toThrow(/até 120 caracteres/);
    });
  });
});
