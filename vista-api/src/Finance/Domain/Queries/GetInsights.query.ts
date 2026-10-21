import { Month } from '../Month';
import { InsightKind } from '../Insights';

export const GET_INSIGHTS_QUERY = Symbol('GetInsightsQuery');

export interface InsightDto {
  kind: InsightKind;
  title: string;
  detail: string;
  amountInCents: number;
  /** A categoria (pico) ou o cartão (fatura vencida); nulo na assinatura. */
  refId: string | null;
}

export interface InsightsDto {
  /** AAAA-MM */
  month: string;
  alerts: InsightDto[];
}

export interface GetInsightsQuery {
  execute(userId: string, month: Month): Promise<InsightsDto>;
}
