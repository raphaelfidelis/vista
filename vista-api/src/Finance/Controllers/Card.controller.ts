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
import { Month } from '../Domain/Month';
import { FIND_CARDS_QUERY } from '../Domain/Queries/FindCards.query';
import type {
  CardDto,
  FindCardsQuery,
} from '../Domain/Queries/FindCards.query';
import { GET_CARD_INVOICE_QUERY } from '../Domain/Queries/GetCardInvoice.query';
import type {
  CardInvoiceDto,
  GetCardInvoiceQuery,
} from '../Domain/Queries/GetCardInvoice.query';
import { CARD_SERVICE } from '../Domain/Services/Card.service';
import type {
  CardService,
  CreateCardInput,
  UpdateCardInput,
} from '../Domain/Services/Card.service';
import { FinanceExceptionFilter } from './Finance.filter';
import { CurrentUserId } from '../../Auth/Controllers/Request.decorators';

@Controller('cards')
@UseFilters(FinanceExceptionFilter)
export class CardController {
  constructor(
    @Inject(FIND_CARDS_QUERY)
    private readonly findCards: FindCardsQuery,
    @Inject(GET_CARD_INVOICE_QUERY)
    private readonly getInvoice: GetCardInvoiceQuery,
    @Inject(CARD_SERVICE)
    private readonly cards: CardService,
  ) {}

  @Get()
  findAll(@CurrentUserId() userId: string): Promise<CardDto[]> {
    return this.findCards.execute(userId);
  }

  @Get(':id/invoices/:month')
  invoice(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Param('month') month: string,
  ): Promise<CardInvoiceDto> {
    return this.getInvoice.execute(userId, id, Month.parse(month));
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() input: CreateCardInput,
  ): Promise<CardDto> {
    return this.cards.create(userId, input);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() input: UpdateCardInput,
  ): Promise<CardDto> {
    return this.cards.update(userId, id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.cards.remove(userId, id);
  }
}
