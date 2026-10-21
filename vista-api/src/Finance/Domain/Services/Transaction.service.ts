import { TransactionDto } from '../Queries/FindTransactionsByMonth.query';
import { NewTransaction, TransactionChanges } from '../Transaction';

export const TRANSACTION_SERVICE = Symbol('TransactionService');

/** Lançamentos por vez no MUDAR CATEGORIA. */
export const MAX_RECATEGORIZE = 200;

/**
 * Na despesa no cartão a fatura é calculada pelo cartão (o invoiceMonth
 * informado é ignorado). No pagamento de fatura (transferência para um
 * cartão) o invoiceMonth é a fatura que está sendo quitada. No parcelamento
 * em andamento (com currentInstallment) o invoiceMonth é a fatura da parcela
 * atual, informada por quem lança, e o valor é o de cada parcela.
 */
export type CreateTransactionInput = Omit<NewTransaction, 'userId'>;

/**
 * Só os campos presentes são alterados; o tipo, o gasto fixo e as parcelas
 * ficam. Numa compra parcelada só a descrição e a categoria mudam, em todas
 * as parcelas.
 */
export type UpdateTransactionInput = Omit<TransactionChanges, 'invoiceMonth'>;

export interface TransactionService {
  /** Compra parcelada devolve a primeira parcela lançada. */
  create(
    userId: string,
    input: CreateTransactionInput,
  ): Promise<TransactionDto>;
  update(
    userId: string,
    id: string,
    input: UpdateTransactionInput,
  ): Promise<TransactionDto>;
  /** Numa compra parcelada, remove todas as parcelas. */
  remove(userId: string, id: string): Promise<void>;
  /**
   * Troca a categoria de vários lançamentos de uma vez, tudo ou nada: se um
   * não puder mudar, nenhum muda. Numa compra parcelada, mudam todas as
   * parcelas. Devolve quantos lançamentos mudaram.
   */
  recategorize(
    userId: string,
    ids: string[],
    categoryId: string,
  ): Promise<{ updated: number }>;
}
