import { Account } from '../Account';

export const ACCOUNT_REPOSITORY = Symbol('AccountRepository');

export interface AccountRepository {
  /** Por nome, inclusive as arquivadas. */
  findAll(userId: string): Promise<Account[]>;
  findById(userId: string, id: string): Promise<Account | null>;
  /** Sem diferenciar maiúsculas de minúsculas. */
  findByName(userId: string, name: string): Promise<Account | null>;
  existsWithBank(userId: string, bankId: string): Promise<boolean>;
  save(account: Account): Promise<void>;
  delete(userId: string, id: string): Promise<void>;
}
