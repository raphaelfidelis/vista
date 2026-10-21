import { NewCard } from '../Card';
import { CardDto } from '../Queries/FindCards.query';

export const CARD_SERVICE = Symbol('CardService');

/** O dono vem da sessão, nunca do corpo. */
export type CreateCardInput = Omit<NewCard, 'userId'>;

/** Só os campos presentes são alterados; limitInCents nulo tira o limite. */
export type UpdateCardInput = Partial<Omit<NewCard, 'userId'>> & {
  archived?: boolean;
};

export interface CardService {
  create(userId: string, input: CreateCardInput): Promise<CardDto>;
  update(userId: string, id: string, input: UpdateCardInput): Promise<CardDto>;
  /** Recusa remover cartão com compras, pagamentos ou gastos fixos: arquive-o. */
  remove(userId: string, id: string): Promise<void>;
}
