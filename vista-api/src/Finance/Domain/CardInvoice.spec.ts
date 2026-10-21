import { Card } from './Card';
import { CardInvoice, currentInvoiceOf } from './CardInvoice';
import { Month } from './Month';
import { Transaction } from './Transaction';

const USER = '11111111-1111-4111-8111-111111111111';

const CATEGORY = '33333333-3333-4333-8333-333333333333';
const ACCOUNT = '22222222-2222-4222-8222-222222222222';

// Fecha dia 25, vence dia 5: a fatura de novembro fecha em 25/10 e vence em 05/11.
const nubank = Card.create({
  userId: USER,
  name: 'Nubank',
  closingDay: 25,
  dueDay: 5,
});
const NOVEMBER = Month.parse('2026-11');
const DECEMBER = Month.parse('2026-12');

function charge(amountInCents: number, date: string, card = nubank) {
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

function payment(
  amountInCents: number,
  invoiceMonth: string,
  date = '2026-11-04',
) {
  return Transaction.create({
    userId: USER,
    kind: 'TRANSFER',
    description: 'Pagamento de fatura',
    amountInCents,
    date,
    accountId: ACCOUNT,
    toCardId: nubank.id,
    invoiceMonth,
  });
}

describe('CardInvoice', () => {
  const october = [charge(30000, '2026-10-10'), charge(20000, '2026-10-20')];

  it('soma as compras da fatura e informa fechamento e vencimento', () => {
    const invoice = new CardInvoice(nubank, NOVEMBER, october, '2026-10-20');

    expect(invoice.chargesInCents).toBe(50000);
    expect(invoice.previousBalanceInCents).toBe(0);
    expect(invoice.totalInCents).toBe(50000);
    expect(invoice.remainingInCents).toBe(50000);
    expect(invoice.closingDate).toBe('2026-10-25');
    expect(invoice.dueDate).toBe('2026-11-05');
    expect(invoice.charges).toHaveLength(2);
  });

  it('deixa fora da fatura as compras de outra fatura e de outro cartão', () => {
    const other = Card.create({
      userId: USER,
      name: 'Inter',
      closingDay: 10,
      dueDay: 20,
    });
    const invoice = new CardInvoice(
      nubank,
      NOVEMBER,
      [
        ...october,
        charge(7000, '2026-10-30'),
        charge(9999, '2026-10-12', other),
      ],
      '2026-10-20',
    );

    expect(invoice.chargesInCents).toBe(50000);
  });

  describe('status', () => {
    it('está aberta antes do fechamento', () => {
      expect(
        new CardInvoice(nubank, NOVEMBER, october, '2026-10-24').status,
      ).toBe('OPEN');
    });

    it('fecha no dia do fechamento e fica fechada até o vencimento', () => {
      expect(
        new CardInvoice(nubank, NOVEMBER, october, '2026-10-25').status,
      ).toBe('CLOSED');
      expect(
        new CardInvoice(nubank, NOVEMBER, october, '2026-11-05').status,
      ).toBe('CLOSED');
    });

    it('vence no dia seguinte ao vencimento, se ainda falta pagar', () => {
      expect(
        new CardInvoice(nubank, NOVEMBER, october, '2026-11-06').status,
      ).toBe('OVERDUE');
    });

    it('está paga quando não resta nada (depois do fechamento)', () => {
      const paid = [...october, payment(50000, '2026-11')];

      expect(new CardInvoice(nubank, NOVEMBER, paid, '2026-11-06').status).toBe(
        'PAID',
      );
    });

    it('com pagamento parcial segue fechada e mostra o que resta', () => {
      const partial = [...october, payment(20000, '2026-11')];
      const invoice = new CardInvoice(nubank, NOVEMBER, partial, '2026-11-01');

      expect(invoice.paymentsInCents).toBe(20000);
      expect(invoice.remainingInCents).toBe(30000);
      expect(invoice.status).toBe('CLOSED');
    });

    it('pagar a mais conta como paga e deixa o restante negativo', () => {
      const over = [...october, payment(60000, '2026-11')];
      const invoice = new CardInvoice(nubank, NOVEMBER, over, '2026-11-06');

      expect(invoice.remainingInCents).toBe(-10000);
      expect(invoice.status).toBe('PAID');
    });
  });

  describe('saldo que rola', () => {
    it('leva o que sobrou da fatura anterior para o total da seguinte', () => {
      const transactions = [
        ...october,
        payment(20000, '2026-11'),
        charge(15000, '2026-11-10'),
      ];
      const invoice = new CardInvoice(
        nubank,
        DECEMBER,
        transactions,
        '2026-11-20',
      );

      expect(invoice.previousBalanceInCents).toBe(30000);
      expect(invoice.chargesInCents).toBe(15000);
      expect(invoice.totalInCents).toBe(45000);
      expect(invoice.remainingInCents).toBe(45000);
    });

    it('pagamento a mais vira crédito na fatura seguinte', () => {
      const transactions = [
        ...october,
        payment(52000, '2026-11'),
        charge(15000, '2026-11-10'),
      ];
      const invoice = new CardInvoice(
        nubank,
        DECEMBER,
        transactions,
        '2026-11-20',
      );

      expect(invoice.previousBalanceInCents).toBe(-2000);
      expect(invoice.totalInCents).toBe(13000);
    });

    it('mostra cada parcela na sua fatura', () => {
      const installments = Transaction.createInstallments({
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

      expect(
        new CardInvoice(nubank, NOVEMBER, installments, '2026-10-20')
          .chargesInCents,
      ).toBe(30000);
      expect(
        new CardInvoice(nubank, DECEMBER, installments, '2026-10-20')
          .chargesInCents,
      ).toBe(30000);
      expect(
        new CardInvoice(nubank, DECEMBER, installments, '2026-10-20')
          .previousBalanceInCents,
      ).toBe(30000);
    });
  });

  describe('currentInvoiceOf', () => {
    it('é a aberta quando a anterior está paga ou vazia', () => {
      const invoice = currentInvoiceOf(nubank, october, '2026-10-20');

      expect(invoice.month.toString()).toBe('2026-11');
      expect(invoice.status).toBe('OPEN');
    });

    it('é a anterior enquanto ela estiver fechada e sem pagar', () => {
      const invoice = currentInvoiceOf(nubank, october, '2026-10-28');

      expect(invoice.month.toString()).toBe('2026-11');
      expect(invoice.status).toBe('CLOSED');
    });

    it('é a anterior vencida, se ninguém pagou', () => {
      const invoice = currentInvoiceOf(nubank, october, '2026-11-10');

      expect(invoice.month.toString()).toBe('2026-11');
      expect(invoice.status).toBe('OVERDUE');
    });

    it('passa para a aberta depois que a anterior é paga', () => {
      const paid = [...october, payment(50000, '2026-11')];
      const invoice = currentInvoiceOf(nubank, paid, '2026-11-10');

      expect(invoice.month.toString()).toBe('2026-12');
      expect(invoice.status).toBe('OPEN');
    });
  });
});
