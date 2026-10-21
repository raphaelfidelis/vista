export const FIND_BANKS_QUERY = Symbol('FindBanksQuery');

export interface BankDto {
  id: string;
  name: string;
  createdAt: string;
}

export interface FindBanksQuery {
  execute(userId: string): Promise<BankDto[]>;
}
