import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { Month } from '../Domain/Month';
import {
  DEFAULT_SEARCH_LIMIT,
  SEARCH_TRANSACTIONS_QUERY,
} from '../Domain/Queries/SearchTransactions.query';
import type {
  SearchTransactionsQuery,
  TransactionSearchDto,
} from '../Domain/Queries/SearchTransactions.query';
import type { TransactionKind } from '../Domain/Transaction';
import { FIND_TRANSACTIONS_BY_MONTH_QUERY } from '../Domain/Queries/FindTransactionsByMonth.query';
import type {
  FindTransactionsByMonthQuery,
  TransactionDto,
} from '../Domain/Queries/FindTransactionsByMonth.query';
import { TRANSACTION_SERVICE } from '../Domain/Services/Transaction.service';
import type {
  CreateTransactionInput,
  TransactionService,
  UpdateTransactionInput,
} from '../Domain/Services/Transaction.service';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('transactions')
@UseFilters(FinanceExceptionFilter)
export class TransactionController {
  constructor(
    @Inject(FIND_TRANSACTIONS_BY_MONTH_QUERY)
    private readonly findByMonth: FindTransactionsByMonthQuery,
    @Inject(SEARCH_TRANSACTIONS_QUERY)
    private readonly searchTransactions: SearchTransactionsQuery,
    @Inject(TRANSACTION_SERVICE)
    private readonly transactions: TransactionService,
  ) {}

  /** Antes das rotas com :id. Parâmetro vazio vale como "sem esse filtro". */
  @Get('search')
  search(
    @CurrentUserId() userId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('text') text?: string,
    @Query('kind') kind?: string,
    @Query('categoryId') categoryId?: string,
    @Query('originId') originId?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ): Promise<TransactionSearchDto> {
    return this.searchTransactions.execute(
      userId,
      {
        text: text || undefined,
        fromMonth: Month.parse(from ?? ''),
        toMonth: Month.parse(to ?? ''),
        kind: (kind || undefined) as TransactionKind | undefined,
        categoryId: categoryId || undefined,
        originId: originId || undefined,
      },
      {
        offset: offset ? Number(offset) : 0,
        limit: limit ? Number(limit) : DEFAULT_SEARCH_LIMIT,
      },
    );
  }

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Query('month') month: string,
  ): Promise<TransactionDto[]> {
    return this.findByMonth.execute(userId, Month.parse(month));
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() input: CreateTransactionInput,
  ): Promise<TransactionDto> {
    return this.transactions.create(userId, input);
  }

  /** Antes de PATCH :id, senão "category" seria lido como id. */
  @Patch('category')
  recategorize(
    @CurrentUserId() userId: string,
    @Body() body: { ids: string[]; categoryId: string },
  ): Promise<{ updated: number }> {
    // Só os dois campos: o corpo nunca vai inteiro para o service.
    return this.transactions.recategorize(userId, body.ids, body.categoryId);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() input: UpdateTransactionInput,
  ): Promise<TransactionDto> {
    return this.transactions.update(userId, id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.transactions.remove(userId, id);
  }
}
