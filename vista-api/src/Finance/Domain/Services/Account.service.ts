import { NewAccount } from '../Account';
import { AccountDto } from '../Queries/FindAccounts.query';

export const ACCOUNT_SERVICE = Symbol('AccountService');

/** O dono vem da sessão, nunca do corpo. */
export type CreateAccountInput = Omit<NewAccount, 'userId'>;

/** Só os campos presentes são alterados; o tipo da conta não muda. */
export type UpdateAccountInput = Partial<
  Omit<NewAccount, 'type' | 'userId'>
> & {
  archived?: boolean;
};

export interface AdjustAccountInput {
  /** O saldo que a conta deve passar a ter. */
  balanceInCents: number;
  /** AAAA-MM-DD do ajuste. */
  date: string;
}

export interface AccountService {
  create(userId: string, input: CreateAccountInput): Promise<AccountDto>;
  update(
    userId: string,
    id: string,
    input: UpdateAccountInput,
  ): Promise<AccountDto>;
  /** Recusa remover conta com lançamentos ou gastos fixos: arquive-a. */
  remove(userId: string, id: string): Promise<void>;
  /** Lança a diferença entre o saldo atual e o informado (ex.: rendimento). */
  adjust(
    userId: string,
    id: string,
    input: AdjustAccountInput,
  ): Promise<AccountDto>;
}
