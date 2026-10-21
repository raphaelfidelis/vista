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
import { FIND_ACCOUNTS_QUERY } from '../Domain/Queries/FindAccounts.query';
import type {
  AccountDto,
  FindAccountsQuery,
} from '../Domain/Queries/FindAccounts.query';
import { GET_ACCOUNT_STATEMENT_QUERY } from '../Domain/Queries/GetAccountStatement.query';
import type {
  AccountStatementDto,
  GetAccountStatementQuery,
} from '../Domain/Queries/GetAccountStatement.query';
import { ACCOUNT_SERVICE } from '../Domain/Services/Account.service';
import type {
  AccountService,
  AdjustAccountInput,
  CreateAccountInput,
  UpdateAccountInput,
} from '../Domain/Services/Account.service';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('accounts')
@UseFilters(FinanceExceptionFilter)
export class AccountController {
  constructor(
    @Inject(FIND_ACCOUNTS_QUERY)
    private readonly findAccounts: FindAccountsQuery,
    @Inject(GET_ACCOUNT_STATEMENT_QUERY)
    private readonly getStatement: GetAccountStatementQuery,
    @Inject(ACCOUNT_SERVICE)
    private readonly accounts: AccountService,
  ) {}

  @Get()
  findAll(@CurrentUserId() userId: string): Promise<AccountDto[]> {
    return this.findAccounts.execute(userId);
  }

  @Get(':id/statement')
  statement(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Query('month') month: string,
  ): Promise<AccountStatementDto> {
    return this.getStatement.execute(userId, id, Month.parse(month));
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() input: CreateAccountInput,
  ): Promise<AccountDto> {
    return this.accounts.create(userId, input);
  }

  @Post(':id/adjust')
  adjust(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() input: AdjustAccountInput,
  ): Promise<AccountDto> {
    return this.accounts.adjust(userId, id, input);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() input: UpdateAccountInput,
  ): Promise<AccountDto> {
    return this.accounts.update(userId, id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.accounts.remove(userId, id);
  }
}
