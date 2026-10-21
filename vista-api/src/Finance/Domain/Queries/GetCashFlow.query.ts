import { CategoryKind } from '../Category';

export const GET_CASH_FLOW_QUERY = Symbol('GetCashFlowQuery');

export interface CashFlowItemDto {
  description: string;
  kind: CategoryKind;
  amountInCents: number;
  /** O valor é uma estimativa (gasto fixo que muda todo mês). */
  estimated: boolean;
}

export interface CashFlowMonthDto {
  /** AAAA-MM */
  month: string;
  openingInCents: number;
  incomeInCents: number;
  expenseInCents: number;
  closingInCents: number;
  items: CashFlowItemDto[];
}

export interface CashFlowDto {
  months: CashFlowMonthDto[];
}

export interface GetCashFlowQuery {
  /** Do mês atual em diante, de 1 a 12 meses. */
  execute(userId: string, months: number): Promise<CashFlowDto>;
}
