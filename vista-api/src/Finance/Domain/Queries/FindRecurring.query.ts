import { CategoryKind } from '../Category';

export const FIND_RECURRING_QUERY = Symbol('FindRecurringQuery');

export interface RecurringDto {
  id: string;
  description: string;
  kind: CategoryKind;
  categoryId: string;
  categoryName: string;
  /** Conta onde cai; nulo quando é no cartão. */
  accountId: string | null;
  accountName: string | null;
  /** Cartão onde cai (só despesa); nulo quando é na conta. */
  cardId: string | null;
  cardName: string | null;
  /** Nulo quando o valor varia e não há referência. */
  amountInCents: number | null;
  variableAmount: boolean;
  dueDay: number;
  active: boolean;
  createdAt: string;
}

export interface FindRecurringQuery {
  /** Por dia de vencimento e descrição; inclui os inativos. */
  execute(userId: string): Promise<RecurringDto[]>;
}
