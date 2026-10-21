import { Controller, Get, Inject, Query, UseFilters } from '@nestjs/common';
import { DEFAULT_MONTHS } from '../Domain/CashFlowProjection';
import { GET_CASH_FLOW_QUERY } from '../Domain/Queries/GetCashFlow.query';
import type {
  CashFlowDto,
  GetCashFlowQuery,
} from '../Domain/Queries/GetCashFlow.query';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('cash-flow')
@UseFilters(FinanceExceptionFilter)
export class CashFlowController {
  constructor(
    @Inject(GET_CASH_FLOW_QUERY)
    private readonly getCashFlow: GetCashFlowQuery,
  ) {}

  @Get()
  project(
    @CurrentUserId() userId: string,
    @Query('months') months?: string,
  ): Promise<CashFlowDto> {
    return this.getCashFlow.execute(
      userId,
      months === undefined ? DEFAULT_MONTHS : Number(months),
    );
  }
}
