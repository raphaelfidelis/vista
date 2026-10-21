import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Transaction, TransactionChanges } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';

const CHECKING = '11111111-1111-4111-8111-111111111111';
const RESERVE = '22222222-2222-4222-8222-222222222222';
const GROCERIES = '33333333-3333-4333-8333-333333333333';
const RECURRING = '44444444-4444-4444-8444-444444444444';

const expense = {
  userId: USER,
  kind: 'EXPENSE' as const,
  description: 'Mercado',
  amountInCents: 5000,
  date: '2026-10-05',
  categoryId: GROCERIES,
  accountId: CHECKING,
};

const transfer = {
  userId: USER,
  kind: 'TRANSFER' as const,
  description: 'Guardar',
  amountInCents: 10000,
  date: '2026-10-05',
  accountId: CHECKING,
  toAccountId: RESERVE,
};

describe('Transaction', () => {
  describe('create', () => {
    it('cria despesa com id próprio e descrição aparada', () => {
      const transaction = Transaction.create({
        ...expense,
        description: '  Mercado ',
      });

      expect(transaction.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(transaction.description).toBe('Mercado');
      expect(transaction.reportMonth).toBe('2026-10');
      expect(transaction.recurringId).toBeNull();
    });

    it('cria receita, transferência e ajuste', () => {
      expect(Transaction.create({ ...expense, kind: 'INCOME' }).kind).toBe(
        'INCOME',
      );
      expect(Transaction.create(transfer).toAccountId).toBe(RESERVE);
      expect(
        Transaction.create({
          userId: USER,
          kind: 'ADJUSTMENT',
          description: 'Rendimento',
          amountInCents: -250,
          date: '2026-10-05',
          accountId: RESERVE,
        }).amountInCents,
      ).toBe(-250);
    });

    it.each(['EXPENSE', 'INCOME'] as const)('exige categoria em %s', (kind) => {
      expect(() =>
        Transaction.create({
          ...expense,
          kind,
          categoryId: null,
        }),
      ).toThrow(FinanceValidationError);
    });

    it('recusa categoria em transferência e em ajuste', () => {
      expect(() =>
        Transaction.create({
          ...transfer,
          categoryId: GROCERIES,
        }),
      ).toThrow(/não têm categoria/);
      expect(() =>
        Transaction.create({
          userId: USER,
          kind: 'ADJUSTMENT',
          description: 'x',
          amountInCents: 10,
          date: '2026-10-05',
          accountId: CHECKING,
          categoryId: GROCERIES,
        }),
      ).toThrow(FinanceValidationError);
    });

    it('exige conta de destino diferente da origem na transferência', () => {
      expect(() =>
        Transaction.create({ ...transfer, toAccountId: null }),
      ).toThrow(/destino/);
      expect(() =>
        Transaction.create({
          ...transfer,
          toAccountId: CHECKING,
        }),
      ).toThrow(/diferente/);
    });

    it('recusa conta de destino fora da transferência', () => {
      expect(() =>
        Transaction.create({ ...expense, toAccountId: RESERVE }),
      ).toThrow(FinanceValidationError);
    });

    it.each([0, -1, 10.5, 2_147_483_648])(
      'recusa o valor %p numa despesa',
      (amountInCents) => {
        expect(() => Transaction.create({ ...expense, amountInCents })).toThrow(
          FinanceValidationError,
        );
      },
    );

    it('recusa ajuste zero ou fracionado', () => {
      const adjustment = {
        kind: 'ADJUSTMENT' as const,
        description: 'Ajuste',
        date: '2026-10-05',
        accountId: CHECKING,
      };

      expect(() =>
        Transaction.create({ userId: USER, ...adjustment, amountInCents: 0 }),
      ).toThrow(/zero/);
      expect(() =>
        Transaction.create({ userId: USER, ...adjustment, amountInCents: 1.5 }),
      ).toThrow(FinanceValidationError);
    });

    it('só despesa e receita vêm de um gasto fixo', () => {
      expect(
        Transaction.create({ ...expense, recurringId: RECURRING }).recurringId,
      ).toBe(RECURRING);
      expect(() =>
        Transaction.create({
          ...transfer,
          recurringId: RECURRING,
        }),
      ).toThrow(FinanceValidationError);
    });

    it('recusa descrição vazia e data inválida', () => {
      expect(() =>
        Transaction.create({ ...expense, description: '  ' }),
      ).toThrow(FinanceValidationError);
      expect(() =>
        Transaction.create({ ...expense, date: '2026-02-30' }),
      ).toThrow(/inexistente/);
      expect(() =>
        Transaction.create({ ...expense, date: '05/10/2026' }),
      ).toThrow(/formato/);
      expect(() =>
        Transaction.create({ ...expense, date: '1899-12-31' }),
      ).toThrow(/a partir de/);
    });
  });

  describe('change', () => {
    it('altera só os campos informados', () => {
      const transaction = Transaction.create(expense);

      transaction.change({ amountInCents: 7000, description: undefined });

      expect(transaction.amountInCents).toBe(7000);
      expect(transaction.description).toBe('Mercado');
      expect(transaction.date).toBe('2026-10-05');
    });

    it('ignora tudo que não é editável: id, dono, tipo, parcelas, gasto fixo e criação', () => {
      const transaction = Transaction.create(expense);
      const { id, createdAt } = transaction;
      // Um corpo de requisição não é tipado: tem que ser inofensivo.
      const hostile = {
        id: 'outro-id',
        userId: 'outro-usuario',
        kind: 'INCOME',
        purchaseId: 'compra',
        installmentNumber: 3,
        installmentCount: 12,
        recurringId: 'fixo',
        createdAt: new Date(0),
        description: 'Descrição nova',
      } as TransactionChanges;

      transaction.change(hostile);

      expect(transaction.description).toBe('Descrição nova');
      expect(transaction.id).toBe(id);
      expect(transaction.userId).toBe(USER);
      expect(transaction.kind).toBe('EXPENSE');
      expect(transaction.purchaseId).toBeNull();
      expect(transaction.installmentNumber).toBeNull();
      expect(transaction.installmentCount).toBeNull();
      expect(transaction.recurringId).toBeNull();
      expect(transaction.createdAt).toBe(createdAt);
    });

    it('o dono não muda nem na hidratação de uma parcela', () => {
      const [part] = Transaction.createInstallments({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Notebook',
        amountInCents: 90000,
        date: '2026-10-05',
        categoryId: GROCERIES,
        cardId: '55555555-5555-4555-8555-555555555555',
        invoiceMonth: '2026-11',
        installmentCount: 3,
      });

      part.change({ userId: 'outro' } as TransactionChanges);

      expect(part.userId).toBe(USER);
    });

    it('revalida a combinação inteira e mantém o estado anterior ao recusar', () => {
      const transaction = Transaction.create(transfer);

      expect(() => transaction.change({ toAccountId: CHECKING })).toThrow(
        FinanceValidationError,
      );
      expect(transaction.toAccountId).toBe(RESERVE);

      expect(() => transaction.change({ amountInCents: 0 })).toThrow(
        FinanceValidationError,
      );
      expect(transaction.amountInCents).toBe(10000);
    });

    it('não troca o tipo nem o gasto fixo de origem', () => {
      const transaction = Transaction.create({
        ...expense,
        recurringId: RECURRING,
      });

      transaction.change({ date: '2026-11-05' });

      expect(transaction.kind).toBe('EXPENSE');
      expect(transaction.recurringId).toBe(RECURRING);
      expect(transaction.reportMonth).toBe('2026-11');
    });
  });

  describe('cartão de crédito', () => {
    const CARD = '55555555-5555-4555-8555-555555555555';
    const purchase = {
      userId: USER,
      kind: 'EXPENSE' as const,
      description: 'Notebook',
      amountInCents: 100000,
      date: '2026-10-15',
      categoryId: GROCERIES,
      cardId: CARD,
      invoiceMonth: '2026-11',
    };

    it('cria despesa no cartão, sem conta, e conta pela fatura', () => {
      const transaction = Transaction.create(purchase);

      expect(transaction.accountId).toBeNull();
      expect(transaction.cardId).toBe(CARD);
      expect(transaction.invoiceMonth).toBe('2026-11');
      expect(transaction.reportMonth).toBe('2026-11');
    });

    it('despesa na conta conta pelo mês da data', () => {
      expect(Transaction.create(expense).reportMonth).toBe('2026-10');
    });

    it('exige a fatura na compra no cartão', () => {
      expect(() =>
        Transaction.create({ ...purchase, invoiceMonth: null }),
      ).toThrow(/Informe a fatura/);
      expect(() =>
        Transaction.create({
          ...purchase,
          invoiceMonth: '2026-13',
        }),
      ).toThrow(FinanceValidationError);
    });

    it('exige exatamente uma origem na despesa: conta ou cartão', () => {
      expect(() =>
        Transaction.create({ ...purchase, accountId: CHECKING }),
      ).toThrow(/conta ou o cartão/);
      expect(() =>
        Transaction.create({
          ...purchase,
          cardId: null,
          invoiceMonth: null,
        }),
      ).toThrow(/conta ou o cartão/);
    });

    it('só a despesa pode ser no cartão', () => {
      expect(() =>
        Transaction.create({
          ...purchase,
          kind: 'INCOME',
          accountId: CHECKING,
        }),
      ).toThrow(/Só a despesa/);
    });

    it('recusa fatura em lançamento que não é compra nem pagamento', () => {
      expect(() =>
        Transaction.create({
          ...expense,
          invoiceMonth: '2026-11',
        }),
      ).toThrow(/Só compra no cartão/);
    });

    it('cria o pagamento de fatura: transferência para o cartão com a fatura quitada', () => {
      const payment = Transaction.create({
        userId: USER,
        kind: 'TRANSFER',
        description: 'Pagamento de fatura',
        amountInCents: 30000,
        date: '2026-11-04',
        accountId: CHECKING,
        toCardId: CARD,
        invoiceMonth: '2026-11',
      });

      expect(payment.toCardId).toBe(CARD);
      expect(payment.toAccountId).toBeNull();
      // Transferência conta pela data, não pela fatura.
      expect(payment.reportMonth).toBe('2026-11');
    });

    it('exige a fatura no pagamento e um só destino', () => {
      const payment = {
        kind: 'TRANSFER' as const,
        description: 'Pagamento',
        amountInCents: 30000,
        date: '2026-11-04',
        accountId: CHECKING,
        toCardId: CARD,
        invoiceMonth: '2026-11',
      };

      expect(() =>
        Transaction.create({ userId: USER, ...payment, invoiceMonth: null }),
      ).toThrow(/Informe a fatura/);
      expect(() =>
        Transaction.create({ userId: USER, ...payment, toAccountId: RESERVE }),
      ).toThrow(/destino/);
    });

    it('o pagamento sai de uma conta, não de um cartão', () => {
      expect(() =>
        Transaction.create({
          userId: USER,
          kind: 'TRANSFER',
          description: 'x',
          amountInCents: 100,
          date: '2026-11-04',
          cardId: CARD,
          toAccountId: RESERVE,
        }),
      ).toThrow(FinanceValidationError);
    });
  });

  describe('createInstallments', () => {
    const CARD = '55555555-5555-4555-8555-555555555555';
    const purchase = {
      userId: USER,
      kind: 'EXPENSE' as const,
      description: 'Notebook',
      amountInCents: 100000,
      date: '2026-10-15',
      categoryId: GROCERIES,
      cardId: CARD,
      invoiceMonth: '2026-11',
      installmentCount: 3,
    };

    it('divide o total e põe os centavos que sobram na primeira parcela', () => {
      const parts = Transaction.createInstallments(purchase);

      expect(parts.map((p) => p.amountInCents)).toEqual([33334, 33333, 33333]);
      expect(parts.reduce((sum, p) => sum + p.amountInCents, 0)).toBe(100000);
    });

    it('espalha as parcelas pelas faturas seguintes, virando o ano', () => {
      const parts = Transaction.createInstallments({
        ...purchase,
        invoiceMonth: '2026-11',
      });

      expect(parts.map((p) => p.invoiceMonth)).toEqual([
        '2026-11',
        '2026-12',
        '2027-01',
      ]);
      expect(parts.map((p) => p.reportMonth)).toEqual([
        '2026-11',
        '2026-12',
        '2027-01',
      ]);
    });

    it('numera as parcelas e liga todas à mesma compra, com a mesma data', () => {
      const parts = Transaction.createInstallments(purchase);

      expect(parts.map((p) => p.installmentNumber)).toEqual([1, 2, 3]);
      expect(parts.every((p) => p.installmentCount === 3)).toBe(true);
      expect(new Set(parts.map((p) => p.purchaseId)).size).toBe(1);
      expect(parts[0]?.purchaseId).toMatch(/^[0-9a-f-]{36}$/);
      expect(parts.every((p) => p.date === '2026-10-15')).toBe(true);
      expect(new Set(parts.map((p) => p.id)).size).toBe(3);
    });

    it('12 parcelas de R$ 1.000,00', () => {
      const parts = Transaction.createInstallments({
        ...purchase,
        amountInCents: 100000,
        installmentCount: 12,
      });

      expect(parts).toHaveLength(12);
      expect(parts[0]?.amountInCents).toBe(8337);
      expect(parts[11]?.amountInCents).toBe(8333);
      expect(parts[11]?.invoiceMonth).toBe('2027-10');
    });

    it('recusa total menor que o número de parcelas', () => {
      expect(() =>
        Transaction.createInstallments({
          ...purchase,
          amountInCents: 2,
          installmentCount: 3,
        }),
      ).toThrow(/ao menos um centavo/);
    });

    it.each([1, 49, 2.5, 0, undefined])(
      'recusa %p parcelas',
      (installmentCount) => {
        expect(() =>
          Transaction.createInstallments({
            ...purchase,
            installmentCount,
          }),
        ).toThrow(FinanceValidationError);
      },
    );

    it('só parcela despesa no cartão', () => {
      expect(() =>
        Transaction.createInstallments({
          ...purchase,
          cardId: null,
          accountId: CHECKING,
          invoiceMonth: null,
        }),
      ).toThrow(/Só compra no cartão/);
      expect(() =>
        Transaction.createInstallments({
          ...purchase,
          kind: 'INCOME',
        }),
      ).toThrow(FinanceValidationError);
    });

    it('a parcela não deixa de ser do cartão', () => {
      const part = Transaction.createInstallments(purchase)[0];

      expect(() =>
        part.change({ cardId: null, accountId: CHECKING, invoiceMonth: null }),
      ).toThrow(/Parcelas inválidas/);
      expect(part.cardId).toBe(CARD);
    });
  });

  describe('continueInstallments', () => {
    const CARD = '55555555-5555-4555-8555-555555555555';
    // Comprado em março em 12x de R$ 250,00; a 5ª parcela cai na fatura de outubro.
    const ongoing = {
      userId: USER,
      kind: 'EXPENSE' as const,
      description: 'Geladeira',
      amountInCents: 25000,
      date: '2026-03-20',
      categoryId: GROCERIES,
      cardId: CARD,
      invoiceMonth: '2026-10',
      installmentCount: 12,
      currentInstallment: 5,
    };

    it('lança só o que falta, da parcela atual até a última', () => {
      const parts = Transaction.continueInstallments(ongoing);

      expect(parts.map((p) => p.installmentNumber)).toEqual([
        5, 6, 7, 8, 9, 10, 11, 12,
      ]);
      expect(parts.every((p) => p.installmentCount === 12)).toBe(true);
    });

    it('a parcela atual cai na fatura informada e as outras nas seguintes', () => {
      const parts = Transaction.continueInstallments(ongoing);

      expect(parts[0]?.invoiceMonth).toBe('2026-10');
      expect(parts[2]?.invoiceMonth).toBe('2026-12');
      expect(parts[7]?.invoiceMonth).toBe('2027-05');
      expect(parts[7]?.reportMonth).toBe('2027-05');
    });

    it('o valor informado é o de cada parcela, sem dividir', () => {
      const parts = Transaction.continueInstallments(ongoing);

      expect(parts.every((p) => p.amountInCents === 25000)).toBe(true);
    });

    it('liga as parcelas à mesma compra, com a data original', () => {
      const parts = Transaction.continueInstallments(ongoing);

      expect(new Set(parts.map((p) => p.purchaseId)).size).toBe(1);
      expect(parts[0]?.purchaseId).toMatch(/^[0-9a-f-]{36}$/);
      expect(parts.every((p) => p.date === '2026-03-20')).toBe(true);
      expect(new Set(parts.map((p) => p.id)).size).toBe(8);
    });

    it('na última parcela lança só ela', () => {
      const parts = Transaction.continueInstallments({
        ...ongoing,
        currentInstallment: 12,
      });

      expect(parts).toHaveLength(1);
      expect(parts[0]?.installmentNumber).toBe(12);
    });

    it.each([0, 13, 2.5, undefined])(
      'recusa a parcela atual %p',
      (currentInstallment) => {
        expect(() =>
          Transaction.continueInstallments({
            ...ongoing,
            currentInstallment,
          }),
        ).toThrow(/A parcela atual deve ser de 1 a 12/);
      },
    );

    it('recusa valor da parcela inválido', () => {
      expect(() =>
        Transaction.continueInstallments({
          ...ongoing,
          amountInCents: 0,
        }),
      ).toThrow(FinanceValidationError);
    });

    it('segue as regras da compra parcelada: de 2 a 48 parcelas, só no cartão', () => {
      expect(() =>
        Transaction.continueInstallments({
          ...ongoing,
          installmentCount: 1,
          currentInstallment: 1,
        }),
      ).toThrow(/de 2 a 48/);
      expect(() =>
        Transaction.continueInstallments({
          ...ongoing,
          cardId: null,
          accountId: CHECKING,
          invoiceMonth: null,
        }),
      ).toThrow(/Só compra no cartão/);
    });
  });
});
