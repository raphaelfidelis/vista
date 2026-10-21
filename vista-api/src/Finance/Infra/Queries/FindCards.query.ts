import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../Domain/Clock';
import { CLOCK } from '../../Domain/Clock';
import { nameResolver } from '../../Domain/NameResolver';
import { CardDto, FindCardsQuery } from '../../Domain/Queries/FindCards.query';
import type { BankRepository } from '../../Domain/Repositories/Bank.repository';
import { BANK_REPOSITORY } from '../../Domain/Repositories/Bank.repository';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import { CardMapper } from '../Mappers/Card.mapper';

@Injectable()
export class FindCardsHandler implements FindCardsQuery {
  constructor(
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
    @Inject(BANK_REPOSITORY)
    private readonly banks: BankRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(userId: string): Promise<CardDto[]> {
    const [cards, banks, transactions] = await Promise.all([
      this.cards.findAll(userId),
      this.banks.findAll(userId),
      this.transactions.findAll(userId),
    ]);
    const bankName = nameResolver('banco', banks);
    const today = this.clock.today();

    return cards.map((card) =>
      CardMapper.toDto(
        card,
        card.bankId === null ? null : bankName(card.bankId),
        transactions,
        today,
      ),
    );
  }
}
