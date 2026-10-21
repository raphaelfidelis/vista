import { Card } from './Card';
import { Category } from './Category';
import { Insights } from './Insights';
import { Month } from './Month';
import { Transaction } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';

const ACCOUNT = '22222222-2222-4222-8222-222222222222';
const mercado = Category.create({
  userId: USER,
  name: 'Mercado',
  kind: 'EXPENSE',
});
const lazer = Category.create({ userId: USER, name: 'Lazer', kind: 'EXPENSE' });
const categories = [mercado, lazer];

// Outubro de 2026; hoje é 11/10.
const OCTOBER = Month.parse('2026-10');
const TODAY = '2026-10-11';

function expense(
  description: string,
  amountInCents: number,
  date: string,
  category = mercado,
  extra: { recurringId?: string } = {},
): Transaction {
  return Transaction.create({
    userId: USER,
    kind: 'EXPENSE',
    description,
    amountInCents,
    date,
    categoryId: category.id,
    accountId: ACCOUNT,
    ...extra,
  });
}

function insights(transactions: Transaction[], cards: Card[] = []) {
  return new Insights(OCTOBER, TODAY, transactions, categories, cards).alerts;
}

/** Um gasto por mês nos 3 meses anteriores. */
function history(amountInCents: number, category = mercado): Transaction[] {
  // Descrição própria da categoria: a mesma em duas categorias viraria "assinatura".
  return ['2026-07-10', '2026-08-10', '2026-09-10'].map((date) =>
    expense('Compras de ' + category.name, amountInCents, date, category),
  );
}

describe('Insights', () => {
  describe('gasto fora do padrão', () => {
    it('avisa quando o mês passa de 1,5 vez a média dos 3 anteriores', () => {
      const alerts = insights([
        ...history(100000),
        expense('Compras', 200000, '2026-10-05'),
      ]);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        kind: 'SPIKE',
        title: 'Gasto alto em Mercado',
        amountInCents: 200000,
        refId: mercado.id,
      });
      expect(alerts[0]?.detail).toContain('R$');
    });

    it('não avisa abaixo de 1,5 vez a média', () => {
      expect(
        insights([
          ...history(100000),
          expense('Compras', 140000, '2026-10-05'),
        ]),
      ).toEqual([]);
    });

    it('no limite exato de 1,5 vez não avisa', () => {
      expect(
        insights([
          ...history(100000),
          expense('Compras', 150000, '2026-10-05'),
        ]),
      ).toEqual([]);
    });

    it('não avisa quando a diferença é pequena em reais', () => {
      // 4× a média, mas só R$ 30,00 acima: abaixo do piso de R$ 50,00.
      expect(
        insights([...history(1000), expense('Compras', 4000, '2026-10-05')]),
      ).toEqual([]);
    });

    it('sem histórico não há padrão: a primeira vez não é pico', () => {
      expect(insights([expense('Compras', 500000, '2026-10-05')])).toEqual([]);
    });

    it('a média conta os meses sem gasto como zero', () => {
      // Só julho teve gasto (300000): média 100000; outubro 160000 passa de 1,5×.
      expect(
        insights([
          expense('Compras', 300000, '2026-07-10'),
          expense('Compras', 160000, '2026-10-05'),
        ]),
      ).toHaveLength(1);
    });

    it('compra no cartão conta pela fatura, não pela data', () => {
      const card = Card.create({
        userId: USER,
        name: 'Nubank',
        closingDay: 25,
        dueDay: 5,
      });
      // 12/09 cai na fatura de outubro: é gasto de outubro.
      const purchase = Transaction.create({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Notebook',
        amountInCents: 250000,
        date: '2026-09-12',
        categoryId: mercado.id,
        cardId: card.id,
        invoiceMonth: card.invoiceMonthFor('2026-09-12'),
      });

      expect(purchase.reportMonth).toBe('2026-10');
      expect(
        insights([
          expense('Compras', 100000, '2026-07-10'),
          expense('Compras', 100000, '2026-08-10'),
          expense('Compras', 100000, '2026-09-01'),
          purchase,
        ]),
      ).toHaveLength(1);
    });

    it('ordena pelo maior excesso', () => {
      const alerts = insights([
        ...history(100000, mercado),
        ...history(100000, lazer),
        expense('Compras', 200000, '2026-10-05', mercado),
        expense('Cinema', 400000, '2026-10-05', lazer),
      ]);

      expect(alerts.map((a) => a.title)).toEqual([
        'Gasto alto em Lazer',
        'Gasto alto em Mercado',
      ]);
    });

    it('receita e transferência não entram', () => {
      const income = Transaction.create({
        userId: USER,
        kind: 'INCOME',
        description: 'Salário',
        amountInCents: 900000,
        date: '2026-10-05',
        categoryId: mercado.id,
        accountId: ACCOUNT,
      });

      expect(insights([...history(100000), income])).toEqual([]);
    });
  });

  describe('possível assinatura', () => {
    const monthly = (description: string, amounts: number[]) =>
      ['2026-08-15', '2026-09-15', '2026-10-05'].map((date, index) =>
        expense(description, amounts[index] ?? 0, date, lazer),
      );

    it('avisa a despesa avulsa que se repete com valor parecido', () => {
      const alerts = insights(monthly('Netflix', [3990, 3990, 3990]));

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        kind: 'SUBSCRIPTION',
        title: 'Possível assinatura: Netflix',
        amountInCents: 3990,
        refId: null,
      });
    });

    it('tolera variação de até 10% em torno da média', () => {
      expect(insights(monthly('Netflix', [3900, 4000, 4100]))).toHaveLength(1);
    });

    it('não avisa quando o valor varia mais de 10%', () => {
      expect(insights(monthly('Mercado', [3000, 3600, 4000]))).toEqual([]);
    });

    it('exige os 3 últimos meses', () => {
      expect(insights(monthly('Netflix', [3990, 3990, 3990]).slice(1))).toEqual(
        [],
      );
    });

    it('ignora maiúsculas e espaços ao comparar as descrições', () => {
      const alerts = insights([
        expense('Netflix', 3990, '2026-08-15', lazer),
        expense('  netflix ', 3990, '2026-09-15', lazer),
        expense('NETFLIX', 3990, '2026-10-05', lazer),
      ]);

      expect(alerts).toHaveLength(1);
    });

    it('soma o que se repete dentro do mesmo mês', () => {
      expect(
        insights([
          expense('Uber', 1000, '2026-08-10', lazer),
          expense('Uber', 1000, '2026-08-20', lazer),
          expense('Uber', 2000, '2026-09-15', lazer),
          expense('Uber', 2000, '2026-10-05', lazer),
        ]),
      ).toHaveLength(1);
    });

    it('não avisa o que já é gasto fixo', () => {
      const recurringId = '44444444-4444-4444-8444-444444444444';

      expect(
        insights(
          ['2026-08-15', '2026-09-15', '2026-10-05'].map((date) =>
            expense('Netflix', 3990, date, lazer, { recurringId }),
          ),
        ),
      ).toEqual([]);
    });

    it('não confunde compra parcelada com assinatura', () => {
      const card = Card.create({
        userId: USER,
        name: 'Nubank',
        closingDay: 25,
        dueDay: 5,
      });
      const parts = Transaction.createInstallments({
        userId: USER,
        kind: 'EXPENSE',
        description: 'Notebook',
        amountInCents: 300000,
        date: '2026-08-10',
        categoryId: lazer.id,
        cardId: card.id,
        invoiceMonth: card.invoiceMonthFor('2026-08-10'),
        installmentCount: 6,
      });

      // A parcela se repete todo mês, mas só o gasto alto pode avisar: assinatura não.
      expect(
        insights(parts, [card]).filter((a) => a.kind === 'SUBSCRIPTION'),
      ).toEqual([]);
    });

    it('ordena pelo maior valor', () => {
      const alerts = insights([
        ...monthly('Netflix', [3990, 3990, 3990]),
        ...monthly('Academia', [12000, 12000, 12000]),
      ]);

      expect(alerts.map((a) => a.title)).toEqual([
        'Possível assinatura: Academia',
        'Possível assinatura: Netflix',
      ]);
    });
  });

  describe('fatura vencida', () => {
    // Fecha dia 25, vence dia 5: a compra de 10/09 cai na fatura de outubro (venceu 05/10).
    const nubank = Card.create({
      userId: USER,
      name: 'Nubank',
      closingDay: 25,
      dueDay: 5,
    });
    const purchase = Transaction.create({
      userId: USER,
      kind: 'EXPENSE',
      description: 'Notebook',
      amountInCents: 150000,
      date: '2026-09-10',
      categoryId: mercado.id,
      cardId: nubank.id,
      invoiceMonth: nubank.invoiceMonthFor('2026-09-10'),
    });

    it('avisa a fatura que passou do vencimento sem ser paga', () => {
      const alerts = insights([purchase], [nubank]);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        kind: 'OVERDUE_INVOICE',
        title: 'Fatura vencida: Nubank',
        amountInCents: 150000,
        refId: nubank.id,
      });
      expect(alerts[0]?.detail).toContain('10/2026');
      expect(alerts[0]?.detail).toContain('05/10');
    });

    it('não avisa quando a fatura foi paga', () => {
      const payment = Transaction.create({
        userId: USER,
        kind: 'TRANSFER',
        description: 'Pagamento de fatura',
        amountInCents: 150000,
        date: '2026-10-04',
        accountId: ACCOUNT,
        toCardId: nubank.id,
        invoiceMonth: '2026-10',
      });

      expect(insights([purchase, payment], [nubank])).toEqual([]);
    });

    it('só o que falta pagar entra no aviso', () => {
      const payment = Transaction.create({
        userId: USER,
        kind: 'TRANSFER',
        description: 'Pagamento de fatura',
        amountInCents: 50000,
        date: '2026-10-04',
        accountId: ACCOUNT,
        toCardId: nubank.id,
        invoiceMonth: '2026-10',
      });

      expect(insights([purchase, payment], [nubank])[0]?.amountInCents).toBe(
        100000,
      );
    });

    it('as vencidas vêm antes dos outros avisos', () => {
      const alerts = insights(
        [
          purchase,
          ...history(100000),
          expense('Compras', 300000, '2026-10-05'),
        ],
        [nubank],
      );

      expect(alerts.map((a) => a.kind)).toEqual(['OVERDUE_INVOICE', 'SPIKE']);
    });
  });
});
