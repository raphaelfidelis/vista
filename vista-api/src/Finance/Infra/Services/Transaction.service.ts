import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../Domain/Account';
import { Card } from '../../Domain/Card';
import { Category } from '../../Domain/Category';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { RecurringAlreadyLaunchedError } from '../../Domain/Errors/RecurringAlreadyLaunched.error';
import { validIsoDate } from '../../Domain/IsoDate';
import { Month } from '../../Domain/Month';
import { TransactionDto } from '../../Domain/Queries/FindTransactionsByMonth.query';
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
import {
  CreateTransactionInput,
  MAX_RECATEGORIZE,
  TransactionService,
  UpdateTransactionInput,
} from '../../Domain/Services/Transaction.service';
import { Transaction, TransactionChanges } from '../../Domain/Transaction';
import { TransactionMapper } from '../Mappers/Transaction.mapper';

const INSTALLMENT_EDIT_MESSAGE =
  'Para mudar valor, data ou parcelas, exclua a compra e lance de novo';

/** Campos que não mudam numa compra parcelada (só descrição e categoria mudam). */
const FROZEN_INSTALLMENT_FIELDS = [
  'amountInCents',
  'date',
  'accountId',
  'cardId',
  'toAccountId',
  'toCardId',
] as const;

@Injectable()
export class TransactionServiceImpl implements TransactionService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
    @Inject(RECURRING_REPOSITORY)
    private readonly recurring: RecurringRepository,
  ) {}

  async create(
    userId: string,
    input: CreateTransactionInput,
  ): Promise<TransactionDto> {
    // Parcelamento em andamento: a fatura da parcela atual vem de quem lança.
    if (input.currentInstallment !== undefined) {
      return this.saveInstallments(
        userId,
        Transaction.continueInstallments({ ...input, userId }),
      );
    }

    const prepared = await this.withInvoice(userId, input);

    if ((input.installmentCount ?? 1) > 1) {
      return this.saveInstallments(
        userId,
        Transaction.createInstallments({ ...prepared, userId }),
      );
    }

    const transaction = Transaction.create({ ...prepared, userId });

    await this.ensureReferences(userId, transaction);
    await this.ensureRecurringIsFree(userId, transaction);
    await this.transactions.save(transaction);

    return this.toDto(userId, transaction);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateTransactionInput,
  ): Promise<TransactionDto> {
    const transaction = await this.find(userId, id);

    if (transaction.purchaseId !== null) {
      return this.updateInstallment(userId, transaction, input);
    }

    const before = {
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      cardId: transaction.cardId,
      toAccountId: transaction.toAccountId,
      toCardId: transaction.toCardId,
      date: transaction.date,
    };
    const changes: TransactionChanges = { ...input };

    if (transaction.kind === 'EXPENSE') {
      // A fatura depende do cartão e da data: recalcula quando qualquer um muda.
      const cardId =
        input.cardId === undefined ? transaction.cardId : input.cardId;
      const date = input.date ?? transaction.date;

      if (cardId === null) {
        changes.invoiceMonth = null;
      } else {
        validIsoDate(date);
        const card = await this.findCard(
          userId,
          cardId,
          cardId === before.cardId,
        );
        changes.invoiceMonth = card.invoiceMonthFor(date);
      }
    }

    transaction.change(changes);

    // Só confere o que mudou: editar a descrição de um lançamento numa conta
    // já arquivada continua permitido.
    if (
      transaction.categoryId !== null &&
      transaction.categoryId !== before.categoryId
    ) {
      await this.ensureCategory(userId, transaction.categoryId, transaction);
    }

    if (
      transaction.accountId !== null &&
      transaction.accountId !== before.accountId
    ) {
      await this.ensureAccount(userId, transaction.accountId);
    }

    if (
      transaction.toAccountId !== null &&
      transaction.toAccountId !== before.toAccountId
    ) {
      await this.ensureAccount(userId, transaction.toAccountId);
    }

    if (
      transaction.toCardId !== null &&
      transaction.toCardId !== before.toCardId
    ) {
      await this.findCard(userId, transaction.toCardId, true);
    }

    if (transaction.date !== before.date) {
      await this.ensureRecurringIsFree(userId, transaction, transaction.id);
    }

    await this.transactions.save(transaction);

    return this.toDto(userId, transaction);
  }

  async remove(userId: string, id: string): Promise<void> {
    const transaction = await this.find(userId, id);

    if (transaction.purchaseId === null) {
      await this.transactions.delete(userId, id);
    } else {
      await this.transactions.deleteByPurchase(userId, transaction.purchaseId);
    }
  }

  async recategorize(
    userId: string,
    ids: string[],
    categoryId: string,
  ): Promise<{ updated: number }> {
    if (ids.length === 0 || ids.length > MAX_RECATEGORIZE) {
      throw new FinanceValidationError(
        `Selecione de 1 a ${MAX_RECATEGORIZE} lançamentos`,
      );
    }

    if (new Set(ids).size !== ids.length) {
      throw new FinanceValidationError('Há lançamentos repetidos na seleção');
    }

    const category = await this.categories.findById(userId, categoryId);

    if (!category) {
      throw new FinanceNotFoundError('Categoria não encontrada: ' + categoryId);
    }

    // Tudo é conferido antes de mexer em qualquer um: tudo ou nada.
    const selected: Transaction[] = [];

    for (const id of ids) {
      selected.push(await this.find(userId, id));
    }

    for (const transaction of selected) {
      if (transaction.kind !== 'EXPENSE' && transaction.kind !== 'INCOME') {
        throw new FinanceValidationError(
          '"' + transaction.description + '" não tem categoria',
        );
      }

      if (transaction.kind !== category.kind) {
        throw new FinanceValidationError(
          'A categoria "' +
            category.name +
            '" é de ' +
            (category.kind === 'EXPENSE' ? 'despesa' : 'receita') +
            ', e "' +
            transaction.description +
            '" não',
        );
      }
    }

    // Parcela leva a compra inteira, contada uma vez só.
    const changing = new Map<string, Transaction>();
    const purchases = new Set<string>();

    for (const transaction of selected) {
      if (transaction.purchaseId === null) {
        changing.set(transaction.id, transaction);
      } else if (!purchases.has(transaction.purchaseId)) {
        purchases.add(transaction.purchaseId);

        for (const part of await this.transactions.findByPurchase(
          userId,
          transaction.purchaseId,
        )) {
          changing.set(part.id, part);
        }
      }
    }

    const all = [...changing.values()];

    for (const transaction of all) {
      transaction.change({ categoryId });
    }

    await this.transactions.saveAll(all);

    return { updated: all.length };
  }

  /** Grava as parcelas de uma compra e devolve a primeira lançada. */
  private async saveInstallments(
    userId: string,
    installments: Transaction[],
  ): Promise<TransactionDto> {
    const first = installments[0];

    await this.ensureReferences(userId, first);
    await this.transactions.saveAll(installments);

    return this.toDto(userId, first);
  }

  /** Numa compra parcelada só a descrição e a categoria mudam, em todas as parcelas. */
  private async updateInstallment(
    userId: string,
    transaction: Transaction,
    input: UpdateTransactionInput,
  ): Promise<TransactionDto> {
    for (const field of FROZEN_INSTALLMENT_FIELDS) {
      if (input[field] !== undefined && input[field] !== transaction[field]) {
        throw new FinanceValidationError(INSTALLMENT_EDIT_MESSAGE);
      }
    }

    // Antes de mexer nas parcelas: a categoria nova precisa existir e ser de despesa.
    if (
      input.categoryId !== undefined &&
      input.categoryId !== null &&
      input.categoryId !== transaction.categoryId
    ) {
      await this.ensureCategory(userId, input.categoryId, transaction);
    }

    const installments = await this.transactions.findByPurchase(
      userId,
      transaction.purchaseId as string,
    );

    for (const installment of installments) {
      installment.change({
        description: input.description,
        categoryId: input.categoryId,
      });
    }

    await this.transactions.saveAll(installments);

    return this.toDto(
      userId,
      installments.find((installment) => installment.id === transaction.id) ??
        transaction,
    );
  }

  /** Despesa no cartão: a fatura vem do cartão e da data da compra. */
  private async withInvoice(
    userId: string,
    input: CreateTransactionInput,
  ): Promise<CreateTransactionInput> {
    if (input.kind !== 'EXPENSE' || !input.cardId) {
      return input;
    }

    validIsoDate(input.date);
    const card = await this.findCard(userId, input.cardId, false);

    return { ...input, invoiceMonth: card.invoiceMonthFor(input.date) };
  }

  private async toDto(
    userId: string,
    transaction: Transaction,
  ): Promise<TransactionDto> {
    const [categories, accounts, cards] = await Promise.all([
      this.categories.findAll(userId),
      this.accounts.findAll(userId),
      this.cards.findAll(userId),
    ]);

    return TransactionMapper.toDto(
      transaction,
      TransactionMapper.names(categories, accounts, cards),
    );
  }

  private async find(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactions.findById(userId, id);

    if (!transaction) {
      throw new FinanceNotFoundError('Lançamento não encontrado: ' + id);
    }

    return transaction;
  }

  /** Tudo o que o lançamento aponta precisa existir; conta e cartão de origem, ativos. */
  private async ensureReferences(
    userId: string,
    transaction: Transaction,
  ): Promise<void> {
    if (transaction.categoryId !== null) {
      await this.ensureCategory(userId, transaction.categoryId, transaction);
    }

    if (transaction.accountId !== null) {
      await this.ensureAccount(userId, transaction.accountId);
    }

    if (transaction.cardId !== null) {
      await this.findCard(userId, transaction.cardId, false);
    }

    if (transaction.toAccountId !== null) {
      await this.ensureAccount(userId, transaction.toAccountId);
    }

    // Pagar a fatura de um cartão arquivado é permitido.
    if (transaction.toCardId !== null) {
      await this.findCard(userId, transaction.toCardId, true);
    }
  }

  /** A categoria precisa existir e ser do mesmo tipo do lançamento. */
  private async ensureCategory(
    userId: string,
    categoryId: string,
    transaction: Transaction,
  ): Promise<void> {
    const category: Category | null = await this.categories.findById(
      userId,
      categoryId,
    );

    if (!category) {
      throw new FinanceNotFoundError('Categoria não encontrada: ' + categoryId);
    }

    if (category.kind !== transaction.kind) {
      throw new FinanceValidationError(
        'A categoria "' +
          category.name +
          '" é de ' +
          (category.kind === 'EXPENSE' ? 'despesa' : 'receita'),
      );
    }
  }

  /** A conta precisa existir e não estar arquivada. */
  private async ensureAccount(
    userId: string,
    accountId: string,
  ): Promise<void> {
    const account: Account | null = await this.accounts.findById(
      userId,
      accountId,
    );

    if (!account) {
      throw new FinanceNotFoundError('Conta não encontrada: ' + accountId);
    }

    if (account.archived) {
      throw new FinanceValidationError(
        'A conta "' + account.name + '" está arquivada',
      );
    }
  }

  /** O cartão precisa existir; compra nova não vai para cartão arquivado. */
  private async findCard(
    userId: string,
    cardId: string,
    allowArchived: boolean,
  ): Promise<Card> {
    const card = await this.cards.findById(userId, cardId);

    if (!card) {
      throw new FinanceNotFoundError('Cartão não encontrado: ' + cardId);
    }

    if (card.archived && !allowArchived) {
      throw new FinanceValidationError(
        'O cartão "' + card.name + '" está arquivado',
      );
    }

    return card;
  }

  /** Um gasto fixo é lançado uma vez por mês (pela data); exceptId é o lançamento sendo editado. */
  private async ensureRecurringIsFree(
    userId: string,
    transaction: Transaction,
    exceptId?: string,
  ): Promise<void> {
    if (transaction.recurringId === null) {
      return;
    }

    const recurring = await this.recurring.findById(
      userId,
      transaction.recurringId,
    );

    if (!recurring) {
      throw new FinanceNotFoundError(
        'Gasto fixo não encontrado: ' + transaction.recurringId,
      );
    }

    if (recurring.kind !== transaction.kind) {
      throw new FinanceValidationError(
        'O gasto fixo "' + recurring.description + '" é de outro tipo',
      );
    }

    const month = Month.parse(transaction.date.slice(0, 7));

    if (
      await this.transactions.existsForRecurringInMonth(
        userId,
        recurring.id,
        month,
        exceptId,
      )
    ) {
      throw new RecurringAlreadyLaunchedError(
        recurring.description,
        month.toString(),
      );
    }
  }
}
