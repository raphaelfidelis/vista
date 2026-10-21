import { BankDto } from '../Queries/FindBanks.query';

export const BANK_SERVICE = Symbol('BankService');

export interface BankInput {
  name: string;
}

export interface BankService {
  create(userId: string, input: BankInput): Promise<BankDto>;
  rename(userId: string, id: string, input: BankInput): Promise<BankDto>;
  /** Recusa remover banco que ainda tem contas. */
  remove(userId: string, id: string): Promise<void>;
}
