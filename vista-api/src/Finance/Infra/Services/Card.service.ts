import { Inject, Injectable } from '@nestjs/common';
import { Card } from '../../Domain/Card';
import type { Clock } from '../../Domain/Clock';
import { CLOCK } from '../../Domain/Clock';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { CardDto } from '../../Domain/Queries/FindCards.query';
import type { BankRepository } from '../../Domain/Repositories/Bank.repository';
import { BANK_REPOSITORY } from '../../Domain/Repositories/Bank.repository';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import type { RecurringRepository } from '../../Domain/Repositories/Recurring.repository';
import { RECURRING_REPOSITORY } from '../../Domain/Repositories/Recurring.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import {
  CardService,
  CreateCardInput,
  UpdateCardInput,
} from '../../Domain/Services/Card.service';
import { CardMapper } from '../Mappers/Card.mapper';

@Injectable()
export class CardServiceImpl implements CardService {
  constructor(
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
    @Inject(BANK_REPOSITORY)
    private readonly banks: BankRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(RECURRING_REPOSITORY)
    private readonly recurring: RecurringRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async create(userId: string, input: CreateCardInput): Promise<CardDto> {
    const card = Card.create({ ...input, userId });
    await this.ensureBankExists(userId, card.bankId);
    await this.ensureNameIsFree(userId, card);
    await this.cards.save(card);

    return this.toDto(userId, card);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateCardInput,
  ): Promise<CardDto> {
    const card = await this.find(userId, id);

    if (input.name !== undefined) {
      card.name = input.name;
    }

    if (input.bankId !== undefined) {
      card.bankId = input.bankId;
    }

    if (input.closingDay !== undefined) {
      card.closingDay = input.closingDay;
    }

    if (input.dueDay !== undefined) {
      card.dueDay = input.dueDay;
    }

    if (input.limitInCents !== undefined) {
      card.limitInCents = input.limitInCents;
    }

    if (input.archived !== undefined) {
      card.archived = input.archived;
    }

    await this.ensureBankExists(userId, card.bankId);
    await this.ensureNameIsFree(userId, card);
    await this.cards.save(card);

    return this.toDto(userId, card);
  }

  async remove(userId: string, id: string): Promise<void> {
    const card = await this.find(userId, id);

    if (
      (await this.transactions.existsWithCard(userId, id)) ||
      (await this.recurring.existsWithCard(userId, id))
    ) {
      throw new FinanceInUseError(
        'O cartão "' +
          card.name +
          '" tem compras, pagamentos ou gastos fixos e não pode ser removido. Arquive-o.',
      );
    }

    await this.cards.delete(userId, id);
  }

  private async toDto(userId: string, card: Card): Promise<CardDto> {
    const [bank, transactions] = await Promise.all([
      card.bankId === null ? null : this.banks.findById(userId, card.bankId),
      this.transactions.findByCard(userId, card.id),
    ]);

    return CardMapper.toDto(
      card,
      bank?.name ?? null,
      transactions,
      this.clock.today(),
    );
  }

  private async find(userId: string, id: string): Promise<Card> {
    const card = await this.cards.findById(userId, id);

    if (!card) {
      throw new FinanceNotFoundError('Cartão não encontrado: ' + id);
    }

    return card;
  }

  private async ensureBankExists(
    userId: string,
    bankId: string | null,
  ): Promise<void> {
    if (bankId !== null && !(await this.banks.findById(userId, bankId))) {
      throw new FinanceNotFoundError('Banco não encontrado: ' + bankId);
    }
  }

  /** O próprio cartão pode manter o nome (ou mudar só maiúsculas); outro não. */
  private async ensureNameIsFree(userId: string, card: Card): Promise<void> {
    const existing = await this.cards.findByName(userId, card.name);

    if (existing && existing.id !== card.id) {
      throw new FinanceDuplicateError(
        'Já existe um cartão chamado "' + existing.name + '"',
      );
    }
  }
}
