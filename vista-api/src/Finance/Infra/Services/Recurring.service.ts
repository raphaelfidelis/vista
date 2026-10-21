import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../Domain/Account';
import { Card } from '../../Domain/Card';
import { Category, CategoryKind } from '../../Domain/Category';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { RecurringDto } from '../../Domain/Queries/FindRecurring.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import type { RecurringRepository } from '../../Domain/Repositories/Recurring.repository';
import { RECURRING_REPOSITORY } from '../../Domain/Repositories/Recurring.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import { Recurring } from '../../Domain/Recurring';
import {
  CreateRecurringInput,
  RecurringService,
  UpdateRecurringInput,
} from '../../Domain/Services/Recurring.service';
import { RecurringMapper } from '../Mappers/Recurring.mapper';

@Injectable()
export class RecurringServiceImpl implements RecurringService {
  constructor(
    @Inject(RECURRING_REPOSITORY)
    private readonly recurring: RecurringRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
  ) {}

  async create(
    userId: string,
    input: CreateRecurringInput,
  ): Promise<RecurringDto> {
    const recurring = Recurring.create({ ...input, userId });

    return this.saveAndDescribe(userId, recurring);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateRecurringInput,
  ): Promise<RecurringDto> {
    const recurring = await this.find(userId, id);

    if (input.description !== undefined) {
      recurring.description = input.description;
    }

    if (input.categoryId !== undefined) {
      recurring.categoryId = input.categoryId;
    }

    if (input.accountId !== undefined || input.cardId !== undefined) {
      recurring.defineOrigin(
        input.accountId === undefined ? recurring.accountId : input.accountId,
        input.cardId === undefined ? recurring.cardId : input.cardId,
      );
    }

    if (
      input.amountInCents !== undefined ||
      input.variableAmount !== undefined
    ) {
      recurring.defineAmount(
        input.amountInCents === undefined
          ? recurring.amountInCents
          : input.amountInCents,
        input.variableAmount ?? recurring.variableAmount,
      );
    }

    if (input.dueDay !== undefined) {
      recurring.dueDay = input.dueDay;
    }

    if (input.active !== undefined) {
      recurring.active = input.active;
    }

    return this.saveAndDescribe(userId, recurring);
  }

  async remove(userId: string, id: string): Promise<void> {
    const recurring = await this.find(userId, id);

    if (await this.transactions.existsWithRecurring(userId, id)) {
      throw new FinanceInUseError(
        'O gasto fixo "' +
          recurring.description +
          '" já tem lançamentos e não pode ser removido. Desative-o.',
      );
    }

    await this.recurring.delete(userId, id);
  }

  /** Confere as referências, grava e devolve o DTO com os nomes. */
  private async saveAndDescribe(
    userId: string,
    recurring: Recurring,
  ): Promise<RecurringDto> {
    const category = await this.findCategory(
      userId,
      recurring.categoryId,
      recurring.kind,
    );
    const account =
      recurring.accountId === null
        ? null
        : await this.findAccount(userId, recurring.accountId);
    const card =
      recurring.cardId === null
        ? null
        : await this.findCard(userId, recurring.cardId);
    await this.recurring.save(recurring);

    return RecurringMapper.toDto(recurring, {
      category: category.name,
      account: account?.name ?? null,
      card: card?.name ?? null,
    });
  }

  private async find(userId: string, id: string): Promise<Recurring> {
    const recurring = await this.recurring.findById(userId, id);

    if (!recurring) {
      throw new FinanceNotFoundError('Gasto fixo não encontrado: ' + id);
    }

    return recurring;
  }

  /** A categoria precisa existir e ser do mesmo tipo do gasto fixo. */
  private async findCategory(
    userId: string,
    id: string,
    kind: CategoryKind,
  ): Promise<Category> {
    const category = await this.categories.findById(userId, id);

    if (!category) {
      throw new FinanceNotFoundError('Categoria não encontrada: ' + id);
    }

    if (category.kind !== kind) {
      throw new FinanceValidationError(
        'A categoria "' +
          category.name +
          '" é de ' +
          (category.kind === 'EXPENSE' ? 'despesa' : 'receita'),
      );
    }

    return category;
  }

  private async findAccount(userId: string, id: string): Promise<Account> {
    const account = await this.accounts.findById(userId, id);

    if (!account) {
      throw new FinanceNotFoundError('Conta não encontrada: ' + id);
    }

    return account;
  }

  private async findCard(userId: string, id: string): Promise<Card> {
    const card = await this.cards.findById(userId, id);

    if (!card) {
      throw new FinanceNotFoundError('Cartão não encontrado: ' + id);
    }

    return card;
  }
}
