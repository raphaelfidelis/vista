import { Card } from '../Card';

export const CARD_REPOSITORY = Symbol('CardRepository');

export interface CardRepository {
  /** Por nome, inclusive os arquivados. */
  findAll(userId: string): Promise<Card[]>;
  findById(userId: string, id: string): Promise<Card | null>;
  /** Sem diferenciar maiúsculas de minúsculas. */
  findByName(userId: string, name: string): Promise<Card | null>;
  existsWithBank(userId: string, bankId: string): Promise<boolean>;
  save(card: Card): Promise<void>;
  delete(userId: string, id: string): Promise<void>;
}
