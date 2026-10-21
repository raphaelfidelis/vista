import { Bank } from '../Bank';

export const BANK_REPOSITORY = Symbol('BankRepository');

export interface BankRepository {
  findAll(userId: string): Promise<Bank[]>;
  findById(userId: string, id: string): Promise<Bank | null>;
  /** Sem diferenciar maiúsculas de minúsculas: "Nubank" e "nubank" são o mesmo nome. */
  findByName(userId: string, name: string): Promise<Bank | null>;
  save(bank: Bank): Promise<void>;
  delete(userId: string, id: string): Promise<void>;
}
