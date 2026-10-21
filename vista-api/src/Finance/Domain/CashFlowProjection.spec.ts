import { Account } from './Account';
import { Card } from './Card';
import { CashFlowProjection } from './CashFlowProjection';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Recurring } from './Recurring';
import { Transaction } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';

// Hoje é 11/10/2026.
const TODAY = '2026-10-11';
const CATEGORY = '33333333-3333-4333-8333-333333333333';

const checking = Account.create({
  userId: USER,
  name: 'Corrente',
  type: 'CHECKING',
  initialBalanceInCents: 1000000,
  initialBalanceDate: '2026-01-01',
});
// Fecha dia 25, vence dia 5: compra de 10/10 cai na fatura de novembro.
const nubank = Card.create({
  userId: USER,
  name: 'Nubank',
  closingDay: 25,
  dueDay: 5,
});

function recurring(
  overrides: Partial<{
    description: string;
    kind: 'EXPENSE' | 'INCOME';
    amountInCents: number | null;
    variableAmount: boolean;
    dueDay: number;
    cardId: string | null;
  }> = {},
): Recurring {
  const { cardId = null, ...rest } = overrides;

  return Recurring.create({
    userId: USER,
    description: 'Aluguel',
    kind: 'EXPENSE',
    categoryId: CATEGORY,
    accountId: cardId === null ? checking.id : null,
    cardId,
    amountInCents: 200000,
    variableAmount: false,
    dueDay: 5,
    ...rest,
  });
}

function project(
  options: {
    months?: number;
    accounts?: Account[];
    cards?: Card[];
    recurring?: Recurring[];
    transactions?: Transaction[];
  } = {},
) {
  return new CashFlowProjection(
    TODAY,
    options.months ?? 3,
    options.accounts ?? [checking],
    options.cards ?? [],
    options.recurring ?? [],
    options.transactions ?? [],
  ).months;
}

function cardPurchase(amountInCents: number, date: string, card = nubank) {
  return Transaction.create({
    userId: USER,
    kind: 'EXPENSE',
    description: 'Compra',
    amountInCents,
    date,
    categoryId: CATEGORY,
    cardId: card.id,
    invoiceMonth: card.invoiceMonthFor(date),
  });
}

function cardPayment(amountInCents: number, invoiceMonth: string) {
  return Transaction.create({
    userId: USER,
    kind: 'TRANSFER',
    description: 'Pagamento de fatura',
    amountInCents,
    date: '2026-10-01',
    accountId: checking.id,
    toCardId: nubank.id,
    invoiceMonth,
  });
}

describe('CashFlowProjection', () => {
  describe('janela', () => {
    it('começa no mês atual e vai adiante, virando o ano', () => {
      expect(project({ months: 4 }).map((m) => m.month)).toEqual([
        '2026-10',
        '2026-11',
        '2026-12',
        '2027-01',
      ]);
    });

    it.each([0, 13, 1.5, -1])('recusa %p meses', (months) => {
      expect(() => project({ months })).toThrow(FinanceValidationError);
    });
  });

  describe('saldo de partida', () => {
    it('soma contas correntes e de dinheiro ativas, com os lançamentos', () => {
      const cash = Account.create({
        userId: USER,
        name: 'Carteira',
        type: 'CASH',
        initialBalanceInCents: 50000,
        initialBalanceDate: '2026-01-01',
      });
      const salary = Transaction.create({
        userId: USER,
        kind: 'INCOME',
        description: 'Salário',
        amountInCents: 300000,
        date: '2026-10-05',
        categoryId: CATEGORY,
        accountId: checking.id,
      });

      expect(
        project({ accounts: [checking, cash], transactions: [salary] })[0]
          ?.openingInCents,
      ).toBe(1350000);
    });

    it('deixa de fora reservas e contas arquivadas', () => {
      const reserve = Account.create({
        userId: USER,
        name: 'Reserva',
        type: 'RESERVE',
        initialBalanceInCents: 999999,
        initialBalanceDate: '2026-01-01',
      });
      const old = Account.create({
        userId: USER,
        name: 'Antiga',
        type: 'CHECKING',
        initialBalanceInCents: 888888,
        initialBalanceDate: '2026-01-01',
      });
      old.archived = true;

      expect(
        project({ accounts: [checking, reserve, old] })[0]?.openingInCents,
      ).toBe(1000000);
    });

    it('sem lançamentos nem gastos fixos o saldo fica parado', () => {
      const months = project();

      expect(months.map((m) => m.closingInCents)).toEqual([
        1000000, 1000000, 1000000,
      ]);
    });
  });

  describe('gastos fixos', () => {
    it('entram em todos os meses em que ainda não foram lançados', () => {
      const months = project({
        recurring: [
          recurring(),
          recurring({
            description: 'Salário',
            kind: 'INCOME',
            amountInCents: 600000,
          }),
        ],
      });

      expect(months[0]).toMatchObject({
        incomeInCents: 600000,
        expenseInCents: 200000,
        closingInCents: 1400000,
      });
      expect(months[1]).toMatchObject({
        openingInCents: 1400000,
        closingInCents: 1800000,
      });
      expect(months[2]?.closingInCents).toBe(2200000);
    });

    it('não repete o que já foi lançado no mês (pela data), mas conta nos outros', () => {
      const rent = recurring();
      const launched = Transaction.create({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Aluguel',
        amountInCents: 200000,
        date: '2026-10-05',
        categoryId: CATEGORY,
        accountId: checking.id,
        recurringId: rent.id,
      });
      const months = project({ recurring: [rent], transactions: [launched] });

      expect(months[0]?.expenseInCents).toBe(0);
      expect(months[1]?.expenseInCents).toBe(200000);
      expect(months[2]?.expenseInCents).toBe(200000);
    });

    it('o lançamento já feito está no saldo de partida, sem descontar de novo', () => {
      const rent = recurring();
      const launched = Transaction.create({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Aluguel',
        amountInCents: 200000,
        date: '2026-10-05',
        categoryId: CATEGORY,
        accountId: checking.id,
        recurringId: rent.id,
      });
      const months = project({ recurring: [rent], transactions: [launched] });

      expect(months[0]?.openingInCents).toBe(800000);
      expect(months[0]?.closingInCents).toBe(800000);
    });

    it('ignora os inativos', () => {
      const rent = recurring();
      rent.active = false;

      expect(project({ recurring: [rent] })[0]?.expenseInCents).toBe(0);
    });

    it('valor variável vale a referência e fica marcado como estimativa', () => {
      const energy = recurring({
        description: 'Energia',
        variableAmount: true,
        amountInCents: 25000,
      });
      const item = project({ recurring: [energy] })[0]?.items[0];

      expect(item).toMatchObject({
        description: 'Energia',
        amountInCents: 25000,
        estimated: true,
      });
    });

    it('valor variável sem referência vale zero e é estimativa', () => {
      const energy = recurring({
        variableAmount: true,
        amountInCents: null,
      });
      const first = project({ recurring: [energy] })[0];

      expect(first?.items[0]).toMatchObject({
        amountInCents: 0,
        estimated: true,
      });
      expect(first?.expenseInCents).toBe(0);
    });

    it('lista as entradas antes das saídas e do maior para o menor valor', () => {
      const first = project({
        recurring: [
          recurring({ description: 'Condomínio', amountInCents: 80000 }),
          recurring({ description: 'Aluguel', amountInCents: 200000 }),
          recurring({
            description: 'Freela',
            kind: 'INCOME',
            amountInCents: 30000,
          }),
        ],
      })[0];

      expect(first?.items.map((i) => i.description)).toEqual([
        'Freela',
        'Aluguel',
        'Condomínio',
      ]);
    });
  });

  describe('faturas de cartão', () => {
    it('a fatura sai da conta no mês do vencimento', () => {
      const months = project({
        cards: [nubank],
        transactions: [cardPurchase(100000, '2026-10-10')],
      });

      expect(months[0]?.expenseInCents).toBe(0);
      expect(months[1]?.items).toEqual([
        {
          description: 'Fatura Nubank',
          kind: 'EXPENSE',
          amountInCents: 100000,
          estimated: false,
        },
      ]);
      expect(months[1]?.closingInCents).toBe(900000);
    });

    it('não conta duas vezes a dívida que a fatura seguinte herda', () => {
      // Fatura de novembro (100000) sem pagar: a de dezembro herda esse saldo,
      // mas ele já saiu em novembro.
      const months = project({
        cards: [nubank],
        transactions: [cardPurchase(100000, '2026-10-10')],
      });

      expect(months[1]?.expenseInCents).toBe(100000);
      expect(months[2]?.expenseInCents).toBe(0);
    });

    it('no primeiro mês vale o restante inteiro, com faturas antigas em aberto', () => {
      // Compra de setembro cai na fatura de outubro (venceu 05/10) e ninguém pagou.
      const months = project({
        cards: [nubank],
        transactions: [
          cardPurchase(50000, '2026-09-10'),
          cardPurchase(100000, '2026-10-10'),
        ],
      });

      expect(months[0]?.expenseInCents).toBe(50000);
      expect(months[1]?.expenseInCents).toBe(100000);
    });

    it('desconta o que já foi pago da fatura', () => {
      const months = project({
        cards: [nubank],
        transactions: [
          cardPurchase(100000, '2026-10-10'),
          cardPayment(40000, '2026-11'),
        ],
      });

      expect(months[1]?.expenseInCents).toBe(60000);
    });

    it('fatura paga ou vazia não aparece', () => {
      const months = project({
        cards: [nubank],
        transactions: [
          cardPurchase(100000, '2026-10-10'),
          cardPayment(100000, '2026-11'),
        ],
      });

      expect(months.every((m) => m.items.length === 0)).toBe(true);
    });

    it('as parcelas caem uma em cada fatura', () => {
      const parts = Transaction.createInstallments({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Notebook',
        amountInCents: 90000,
        date: '2026-10-10',
        categoryId: CATEGORY,
        cardId: nubank.id,
        invoiceMonth: nubank.invoiceMonthFor('2026-10-10'),
        installmentCount: 3,
      });
      const months = project({ cards: [nubank], transactions: parts });

      expect(months.map((m) => m.expenseInCents)).toEqual([0, 30000, 30000]);
    });
  });

  describe('gastos fixos no cartão', () => {
    const streaming = () =>
      recurring({
        description: 'Streaming',
        amountInCents: 5000,
        dueDay: 10,
        cardId: nubank.id,
      });

    it('entram na fatura em que a compra cairia, não no mês do vencimento do fixo', () => {
      const months = project({
        months: 3,
        cards: [nubank],
        recurring: [streaming()],
      });

      // 10/10 cai na fatura de novembro; 10/11, na de dezembro; 10/12, na de janeiro (fora da janela).
      expect(months[0]?.expenseInCents).toBe(0);
      expect(months[1]?.items).toEqual([
        {
          description: 'Streaming (Nubank)',
          kind: 'EXPENSE',
          amountInCents: 5000,
          estimated: false,
        },
      ]);
      expect(months[2]?.expenseInCents).toBe(5000);
    });

    it('não entra de novo quando já foi lançado naquele mês', () => {
      const item = streaming();
      const launched = Transaction.create({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Streaming',
        amountInCents: 5000,
        date: '2026-10-10',
        categoryId: CATEGORY,
        cardId: nubank.id,
        invoiceMonth: nubank.invoiceMonthFor('2026-10-10'),
        recurringId: item.id,
      });
      const months = project({
        cards: [nubank],
        recurring: [item],
        transactions: [launched],
      });

      // O de outubro está na fatura de novembro (lançamento); só falta o de novembro.
      expect(months[1]?.expenseInCents).toBe(5000);
      expect(months[2]?.expenseInCents).toBe(5000);
    });
  });
});
