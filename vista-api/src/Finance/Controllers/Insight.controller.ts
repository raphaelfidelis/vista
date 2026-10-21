import { Controller, Get, Inject, Query, UseFilters } from '@nestjs/common';
import { Month } from '../Domain/Month';
import { GET_INSIGHTS_QUERY } from '../Domain/Queries/GetInsights.query';
import type {
  GetInsightsQuery,
  InsightsDto,
} from '../Domain/Queries/GetInsights.query';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('insights')
@UseFilters(FinanceExceptionFilter)
export class InsightController {
  constructor(
    @Inject(GET_INSIGHTS_QUERY)
    private readonly getInsights: GetInsightsQuery,
  ) {}

  @Get()
  findByMonth(
    @CurrentUserId() userId: string,
    @Query('month') month: string,
  ): Promise<InsightsDto> {
    return this.getInsights.execute(userId, Month.parse(month));
  }
}
