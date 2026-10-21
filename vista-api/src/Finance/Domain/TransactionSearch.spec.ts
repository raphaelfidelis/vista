import { Card } from './Card';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Month } from './Month';
import { Transaction } from './Transaction';
import { searchTransactions, TransactionFilters } from './TransactionSearch';

const USER = '11111111-1111-4111-8111-111111111111';
const CHECKING = '22222222-2222-4222-8222-222222222222';
const RESERVE = '33333333-3333-4333-8333-333333333333';
const FOOD = '44444444-4444-4444-8444-444444444444';
const MARKET = '55555555-5555-4555-8555-555555555555';
const SALARY = '66666666-6666-4666-8666-666666666666';

// Fecha dia 25, vence dia 5: compra de 26/10 cai na fatura de dezembro.
const card = Card.create({
  userId: USER,
  name: 'Nubank',
  closingDay: 25,
  dueDay: 5,
});

const OCT = Month.parse('2026-10');
const NOV = Month.parse('2026-11');
const DEC = Month.parse('2026-12');

function expense(
  description: string,
  amountInCents: number,
  date: string,
  categoryId = FOOD,
): Transaction {
  return Transaction.create({
    userId: USER,
    kind: 'EXPENSE',
    description,
    amountInCents,
    date,
    categoryId,
    accountId: CHECKING,
  });
}

function cardPurchase(description: string, date: string): Transaction {
  return Transaction.create({
    userId: USER,
    kind: 'EXPENSE',
    description,
    amountInCents: 5000,
    date,
    categoryId: FOOD,
    cardId: card.id,
    invoiceMonth: card.invoiceMonthFor(date),
  });
}

const income = Transaction.create({
  userId: USER,
  kind: 'INCOME',
  description: 'Salário',
  amountInCents: 800000,
  date: '2026-10-05',
  categoryId: SALARY,
  accountId: CHECKING,
});
const transfer = Transaction.create({
  userId: USER,
  kind: 'TRANSFER',
  description: 'Guardar',
  amountInCents: 100000,
  date: '2026-10-07',
  accountId: CHECKING,
  toAccountId: RESERVE,
});
const invoicePayment = Transaction.create({
  userId: USER,
  kind: 'TRANSFER',
  description: 'Pagamento de fatura',
  amountInCents: 3000,
  date: '2026-10-08',
  accountId: CHECKING,
  toCardId: card.id,
  invoiceMonth: '2026-11',
});

function search(
  transactions: Transaction[],
  filters: Partial<TransactionFilters> = {},
) {
  return searchTransactions(transactions, {
    fromMonth: OCT,
    toMonth: OCT,
    ...filters,
  });
}

const descriptions = (transactions: Transaction[]) =>
  transactions.map((transaction) => transaction.description);

describe('searchTransactions', () => {
  describe('texto', () => {
    const all = [
      expense('iFood', 4290, '2026-10-18'),
      expense('IFOOD pedido', 3850, '2026-10-11'),
      expense('Açaí da praça', 1500, '2026-10-12'),
      expense('Mercado', 25000, '2026-10-10', MARKET),
    ];

    it('não diferencia maiúsculas', () => {
      expect(descriptions(search(all, { text: 'ifood' }).matches)).toEqual([
        'iFood',
        'IFOOD pedido',
      ]);
    });

    it('não diferencia acentos, nos dois sentidos', () => {
      expect(descriptions(search(all, { text: 'acai' }).matches)).toEqual([
        'Açaí da praça',
      ]);
      expect(descriptions(search(all, { text: 'PRAÇA' }).matches)).toEqual([
        'Açaí da praça',
      ]);
    });

    it('acha parte da descrição e ignora espaços nas pontas', () => {
      expect(search(all, { text: '  pedi ' }).matches).toHaveLength(1);
    });

    it('texto vazio não filtra', () => {
      expect(search(all, { text: '' }).matches).toHaveLength(4);
    });

    it('nada casa: lista vazia e totais zerados', () => {
      expect(search(all, { text: 'uber' })).toEqual({
        matches: [],
        incomeInCents: 0,
        expenseInCents: 0,
      });
    });
  });

  describe('período', () => {
    it('inclui o primeiro e o último mês', () => {
      const all = [
        expense('setembro', 100, '2026-09-30'),
        expense('outubro', 100, '2026-10-01'),
        expense('novembro', 100, '2026-11-30'),
        expense('dezembro', 100, '2026-12-01'),
      ];

      expect(
        descriptions(search(all, { fromMonth: OCT, toMonth: NOV }).matches),
      ).toEqual(['novembro', 'outubro']);
    });

    it('compra no cartão conta pelo mês da fatura, como no relatório', () => {
      const late = cardPurchase('Depois do fechamento', '2026-10-26');

      expect(late.reportMonth).toBe('2026-12');
      expect(search([late], { fromMonth: OCT, toMonth: NOV }).matches).toEqual(
        [],
      );
      expect(search([late], { fromMonth: DEC, toMonth: DEC }).matches).toEqual([
        late,
      ]);
    });
  });

  describe('filtros', () => {
    const food = expense('Restaurante', 5000, '2026-10-10');
    const market = expense('Feira', 3000, '2026-10-11', MARKET);
    const onCard = cardPurchase('Livro', '2026-09-10');
    const all = [food, market, income, transfer, invoicePayment, onCard];

    it('por tipo', () => {
      expect(search(all, { kind: 'INCOME' }).matches).toEqual([income]);
      expect(descriptions(search(all, { kind: 'TRANSFER' }).matches)).toEqual([
        'Pagamento de fatura',
        'Guardar',
      ]);
    });

    it('por categoria', () => {
      expect(search(all, { categoryId: MARKET }).matches).toEqual([market]);
    });

    it('por conta: como origem e como destino de transferência', () => {
      expect(search(all, { originId: RESERVE }).matches).toEqual([transfer]);
      expect(search(all, { originId: CHECKING }).matches).toHaveLength(5);
    });

    it('por cartão: as compras e o pagamento da fatura', () => {
      expect(descriptions(search(all, { originId: card.id }).matches)).toEqual([
        'Pagamento de fatura',
        'Livro',
      ]);
    });

    it('os filtros se somam', () => {
      expect(
        search(all, { kind: 'EXPENSE', originId: CHECKING, text: 'feira' })
          .matches,
      ).toEqual([market]);
    });
  });

  describe('ordem e totais', () => {
    it('do mais novo para o mais antigo; no mesmo dia, o criado por último primeiro', () => {
      const first = new Transaction({
        ...propsOf(expense('primeiro', 100, '2026-10-10')),
        createdAt: new Date('2026-10-10T10:00:00Z'),
      });
      const second = new Transaction({
        ...propsOf(expense('segundo', 100, '2026-10-10')),
        createdAt: new Date('2026-10-10T11:00:00Z'),
      });
      const older = expense('antes', 100, '2026-10-02');

      expect(descriptions(search([older, first, second]).matches)).toEqual([
        'segundo',
        'primeiro',
        'antes',
      ]);
    });

    it('parcelas da mesma compra: a fatura mais nova primeiro', () => {
      const parts = Transaction.createInstallments({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Televisão',
        amountInCents: 36000,
        date: '2026-10-10',
        categoryId: FOOD,
        cardId: card.id,
        invoiceMonth: '2026-11',
        installmentCount: 3,
      });

      expect(
        search([parts[1], parts[0], parts[2]], {
          fromMonth: NOV,
          toMonth: Month.parse('2027-01'),
        }).matches.map((p) => p.installmentNumber),
      ).toEqual([3, 2, 1]);
    });

    it('receitas e despesas somam todos os resultados; transferência fica de fora', () => {
      const result = search([
        expense('a', 1000, '2026-10-01'),
        expense('b', 2500, '2026-10-02'),
        income,
        transfer,
        invoicePayment,
      ]);

      expect(result.expenseInCents).toBe(3500);
      expect(result.incomeInCents).toBe(800000);
    });
  });

  describe('validação', () => {
    it('recusa início depois do fim', () => {
      expect(() => search([], { fromMonth: NOV, toMonth: OCT })).toThrow(
        /antes do fim/,
      );
    });

    it('aceita 36 meses e recusa 37', () => {
      expect(() =>
        search([], {
          fromMonth: Month.parse('2024-01'),
          toMonth: Month.parse('2026-12'),
        }),
      ).not.toThrow();
      expect(() =>
        search([], {
          fromMonth: Month.parse('2023-12'),
          toMonth: Month.parse('2026-12'),
        }),
      ).toThrow(FinanceValidationError);
    });

    it('aceita texto de 100 caracteres e recusa 101', () => {
      expect(() => search([], { text: 'a'.repeat(100) })).not.toThrow();
      expect(() => search([], { text: 'a'.repeat(101) })).toThrow(
        /até 100 caracteres/,
      );
    });
  });
});

function propsOf(transaction: Transaction) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    kind: transaction.kind,
    description: transaction.description,
    amountInCents: transaction.amountInCents,
    date: transaction.date,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId,
    cardId: transaction.cardId,
    toAccountId: transaction.toAccountId,
    toCardId: transaction.toCardId,
    invoiceMonth: transaction.invoiceMonth,
    purchaseId: transaction.purchaseId,
    installmentNumber: transaction.installmentNumber,
    installmentCount: transaction.installmentCount,
    recurringId: transaction.recurringId,
    createdAt: transaction.createdAt,
  };
}
