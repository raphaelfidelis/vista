import { Recurring } from '../Recurring';

export const RECURRING_REPOSITORY = Symbol('RecurringRepository');

export interface RecurringRepository {
  /** Por dia de vencimento e descrição. */
  findAll(userId: string): Promise<Recurring[]>;
  findById(userId: string, id: string): Promise<Recurring | null>;
  existsWithCategory(userId: string, categoryId: string): Promise<boolean>;
  existsWithAccount(userId: string, accountId: string): Promise<boolean>;
  existsWithCard(userId: string, cardId: string): Promise<boolean>;
  save(recurring: Recurring): Promise<void>;
  delete(userId: string, id: string): Promise<void>;
}
