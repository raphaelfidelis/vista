import { RecurringDto } from '../Queries/FindRecurring.query';
import { NewRecurring } from '../Recurring';

export const RECURRING_SERVICE = Symbol('RecurringService');

/** O dono vem da sessão, nunca do corpo. */
export type CreateRecurringInput = Omit<NewRecurring, 'userId'>;

/** Só os campos presentes são alterados; o tipo (despesa ou receita) não muda. */
export type UpdateRecurringInput = Partial<
  Omit<NewRecurring, 'kind' | 'userId'>
> & {
  active?: boolean;
};

export interface RecurringService {
  create(userId: string, input: CreateRecurringInput): Promise<RecurringDto>;
  update(
    userId: string,
    id: string,
    input: UpdateRecurringInput,
  ): Promise<RecurringDto>;
  /** Recusa remover gasto fixo que já tem lançamentos: desative-o. */
  remove(userId: string, id: string): Promise<void>;
}
