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
import { FIND_RECURRING_QUERY } from '../Domain/Queries/FindRecurring.query';
import type {
  FindRecurringQuery,
  RecurringDto,
} from '../Domain/Queries/FindRecurring.query';
import { RECURRING_SERVICE } from '../Domain/Services/Recurring.service';
import type {
  CreateRecurringInput,
  RecurringService,
  UpdateRecurringInput,
} from '../Domain/Services/Recurring.service';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('recurring')
@UseFilters(FinanceExceptionFilter)
export class RecurringController {
  constructor(
    @Inject(FIND_RECURRING_QUERY)
    private readonly findRecurring: FindRecurringQuery,
    @Inject(RECURRING_SERVICE)
    private readonly recurring: RecurringService,
  ) {}

  @Get()
  findAll(@CurrentUserId() userId: string): Promise<RecurringDto[]> {
    return this.findRecurring.execute(userId);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() input: CreateRecurringInput,
  ): Promise<RecurringDto> {
    return this.recurring.create(userId, input);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() input: UpdateRecurringInput,
  ): Promise<RecurringDto> {
    return this.recurring.update(userId, id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.recurring.remove(userId, id);
  }
}
