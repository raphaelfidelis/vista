import { Month } from '../Month';
import { Transaction } from '../Transaction';

export const TRANSACTION_REPOSITORY = Symbol('TransactionRepository');

export interface TransactionRepository {
  /**
   * Os lançamentos que contam no mês, em ordem cronológica: pela data, e as
   * compras no cartão pela fatura (mês do vencimento).
   */
  findByMonth(userId: string, month: Month): Promise<Transaction[]>;
  /** Todos os lançamentos, em qualquer data: base do saldo das contas. */
  findAll(userId: string): Promise<Transaction[]>;
  /** Os que movem a conta, como origem ou destino, em qualquer data. */
  findByAccount(userId: string, accountId: string): Promise<Transaction[]>;
  /** Compras e pagamentos de fatura do cartão, em qualquer fatura. */
  findByCard(userId: string, cardId: string): Promise<Transaction[]>;
  /** As parcelas de uma compra, da primeira à última. */
  findByPurchase(userId: string, purchaseId: string): Promise<Transaction[]>;
  findById(userId: string, id: string): Promise<Transaction | null>;
  existsWithCategory(userId: string, categoryId: string): Promise<boolean>;
  /** Como origem ou destino. */
  existsWithAccount(userId: string, accountId: string): Promise<boolean>;
  /** Como cartão da compra ou destino do pagamento. */
  existsWithCard(userId: string, cardId: string): Promise<boolean>;
  existsWithRecurring(userId: string, recurringId: string): Promise<boolean>;
  /** Pela data do lançamento. O parâmetro exceptId ignora um lançamento (o que está sendo editado). */
  existsForRecurringInMonth(
    userId: string,
    recurringId: string,
    month: Month,
    exceptId?: string,
  ): Promise<boolean>;
  /** Ids dos gastos fixos que têm lançamento com data no mês. */
  findLaunchedRecurringIds(userId: string, month: Month): Promise<string[]>;
  save(transaction: Transaction): Promise<void>;
  saveAll(transactions: Transaction[]): Promise<void>;
  delete(userId: string, id: string): Promise<void>;
  /** Todas as parcelas da compra. */
  deleteByPurchase(userId: string, purchaseId: string): Promise<void>;
}
