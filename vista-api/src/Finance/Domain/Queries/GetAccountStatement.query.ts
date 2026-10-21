import { Month } from '../Month';
import { TransactionDto } from './FindTransactionsByMonth.query';

export const GET_ACCOUNT_STATEMENT_QUERY = Symbol('GetAccountStatementQuery');

export interface StatementMovementDto {
  transaction: TransactionDto;
  /** Quanto o lançamento move o saldo desta conta (negativo = saiu). */
  effectInCents: number;
  /** Saldo logo depois do lançamento. */
  balanceInCents: number;
}

export interface AccountStatementDto {
  /** AAAA-MM */
  month: string;
  openingInCents: number;
  movements: StatementMovementDto[];
  closingInCents: number;
}

export interface GetAccountStatementQuery {
  execute(
    userId: string,
    accountId: string,
    month: Month,
  ): Promise<AccountStatementDto>;
}
