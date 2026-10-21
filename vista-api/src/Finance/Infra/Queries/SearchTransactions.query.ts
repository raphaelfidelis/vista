import { Inject, Injectable } from '@nestjs/common';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import {
  MAX_SEARCH_LIMIT,
  SearchPage,
  SearchTransactionsQuery,
  TransactionSearchDto,
} from '../../Domain/Queries/SearchTransactions.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import type { CategoryRepository } from '../../Domain/Repositories/Category.repository';
import { CATEGORY_REPOSITORY } from '../../Domain/Repositories/Category.repository';
import type { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../Domain/Repositories/Transaction.repository';
import {
  searchTransactions,
  TransactionFilters,
} from '../../Domain/TransactionSearch';
import { TransactionMapper } from '../Mappers/Transaction.mapper';

/**
 * Busca entre meses. Filtra em memória sobre os lançamentos do usuário (o
 * mesmo conjunto que o saldo das contas já carrega): na escala de uso
 * pessoal basta, e o domínio decide o que casa.
 */
@Injectable()
export class SearchTransactionsHandler implements SearchTransactionsQuery {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: CategoryRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
  ) {}

  async execute(
    userId: string,
    filters: TransactionFilters,
    page: SearchPage,
  ): Promise<TransactionSearchDto> {
    const { offset, limit } = page;

    if (!Number.isInteger(offset) || offset < 0) {
      throw new FinanceValidationError('Página inválida');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SEARCH_LIMIT) {
      throw new FinanceValidationError(
        `Peça de 1 a ${MAX_SEARCH_LIMIT} lançamentos por vez`,
      );
    }

    const [transactions, categories, accounts, cards] = await Promise.all([
      this.transactions.findAll(userId),
      this.categories.findAll(userId),
      this.accounts.findAll(userId),
      this.cards.findAll(userId),
    ]);
    const result = searchTransactions(transactions, filters);
    const names = TransactionMapper.names(categories, accounts, cards);

    return {
      total: result.matches.length,
      incomeInCents: result.incomeInCents,
      expenseInCents: result.expenseInCents,
      transactions: result.matches
        .slice(offset, offset + limit)
        .map((transaction) => TransactionMapper.toDto(transaction, names)),
    };
  }
}
