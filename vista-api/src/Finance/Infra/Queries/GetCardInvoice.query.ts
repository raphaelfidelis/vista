import { Inject, Injectable } from '@nestjs/common';
import { CardInvoice } from '../../Domain/CardInvoice';
import type { Clock } from '../../Domain/Clock';
import { CLOCK } from '../../Domain/Clock';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { Month } from '../../Domain/Month';
import {
  CardInvoiceDto,
  GetCardInvoiceQuery,
} from '../../Domain/Queries/GetCardInvoice.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import { CardMapper } from '../Mappers/Card.mapper';
import { TransactionMapper } from '../Mappers/Transaction.mapper';

@Injectable()
export class GetCardInvoiceHandler implements GetCardInvoiceQuery {
  constructor(
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(
    userId: string,
    cardId: string,
    month: Month,
  ): Promise<CardInvoiceDto> {
    const [cards, categories, accounts, transactions] = await Promise.all([
      this.cards.findAll(userId),
      this.categories.findAll(userId),
      this.accounts.findAll(userId),
      this.transactions.findByCard(userId, cardId),
    ]);
    const card = cards.find((item) => item.id === cardId);

    if (!card) {
      throw new FinanceNotFoundError('Cartão não encontrado: ' + cardId);
    }

    const invoice = new CardInvoice(
      card,
      month,
      transactions,
      this.clock.today(),
    );
    const names = TransactionMapper.names(categories, accounts, cards);

    return {
      ...CardMapper.invoiceSummary(invoice),
      cardId,
      previousBalanceInCents: invoice.previousBalanceInCents,
      chargesInCents: invoice.chargesInCents,
      paymentsInCents: invoice.paymentsInCents,
      charges: invoice.charges.map((transaction) =>
        TransactionMapper.toDto(transaction, names),
      ),
      payments: invoice.payments.map((transaction) =>
        TransactionMapper.toDto(transaction, names),
      ),
    };
  }
}
