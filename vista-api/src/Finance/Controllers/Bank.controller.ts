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
  UseFilters,
} from '@nestjs/common';
import { FIND_BANKS_QUERY } from '../Domain/Queries/FindBanks.query';
import type {
  BankDto,
  FindBanksQuery,
} from '../Domain/Queries/FindBanks.query';
import { BANK_SERVICE } from '../Domain/Services/Bank.service';
import type { BankInput, BankService } from '../Domain/Services/Bank.service';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('banks')
@UseFilters(FinanceExceptionFilter)
export class BankController {
  constructor(
    @Inject(FIND_BANKS_QUERY)
    private readonly findBanks: FindBanksQuery,
    @Inject(BANK_SERVICE)
    private readonly banks: BankService,
  ) {}

  @Get()
  findAll(@CurrentUserId() userId: string): Promise<BankDto[]> {
    return this.findBanks.execute(userId);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() input: BankInput,
  ): Promise<BankDto> {
    return this.banks.create(userId, input);
  }

  @Patch(':id')
  rename(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() input: BankInput,
  ): Promise<BankDto> {
    return this.banks.rename(userId, id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.banks.remove(userId, id);
  }
}
