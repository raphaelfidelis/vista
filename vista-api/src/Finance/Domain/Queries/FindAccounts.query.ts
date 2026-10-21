import { AccountType } from '../Account';

export const FIND_ACCOUNTS_QUERY = Symbol('FindAccountsQuery');

export interface AccountDto {
  id: string;
  name: string;
  type: AccountType;
  bankId: string | null;
  bankName: string | null;
  initialBalanceInCents: number;
  /** AAAA-MM-DD */
  initialBalanceDate: string;
  archived: boolean;
  /** Saldo inicial + todos os movimentos da conta. */
  balanceInCents: number;
  createdAt: string;
}

export interface FindAccountsQuery {
  /** Por nome, inclusive as arquivadas. */
  execute(userId: string): Promise<AccountDto[]>;
}
