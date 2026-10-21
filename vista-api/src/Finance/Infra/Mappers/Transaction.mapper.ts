import { Account } from '../../Domain/Account';
import { Card } from '../../Domain/Card';
import { Category } from '../../Domain/Category';
import { nameResolver } from '../../Domain/NameResolver';
import { TransactionDto } from '../../Domain/Queries/FindTransactionsByMonth.query';
import { Transaction } from '../../Domain/Transaction';
import { TransactionModel } from '../Models/Transaction.model';

/** Resolve os nomes que o DTO mostra; o lançamento só conhece os ids. */
export interface TransactionNames {
  category: (id: string) => string;
  account: (id: string) => string;
  card: (id: string) => string;
}

function optional(
  resolve: (id: string) => string,
  id: string | null,
): string | null {
  return id === null ? null : resolve(id);
}

export class TransactionMapper {
  static toDomain(model: TransactionModel): Transaction {
    return new Transaction({
      id: model.id,
      userId: model.userId,
      kind: model.kind,
      description: model.description,
      amountInCents: model.amountInCents,
      date: model.date,
      categoryId: model.categoryId,
      accountId: model.accountId,
      cardId: model.cardId,
      toAccountId: model.toAccountId,
      toCardId: model.toCardId,
      invoiceMonth: model.invoiceMonth,
      purchaseId: model.purchaseId,
      installmentNumber: model.installmentNumber,
      installmentCount: model.installmentCount,
      recurringId: model.recurringId,
      createdAt: model.createdAt,
    });
  }

  static arrayToDomain(models: TransactionModel[]): Transaction[] {
    return models.map((model) => TransactionMapper.toDomain(model));
  }

  static toModel(transaction: Transaction): TransactionModel {
    const model = new TransactionModel();
    model.id = transaction.id;
    model.userId = transaction.userId;
    model.kind = transaction.kind;
    model.description = transaction.description;
    model.amountInCents = transaction.amountInCents;
    model.date = transaction.date;
    model.categoryId = transaction.categoryId;
    model.accountId = transaction.accountId;
    model.cardId = transaction.cardId;
    model.toAccountId = transaction.toAccountId;
    model.toCardId = transaction.toCardId;
    model.invoiceMonth = transaction.invoiceMonth;
    model.purchaseId = transaction.purchaseId;
    model.installmentNumber = transaction.installmentNumber;
    model.installmentCount = transaction.installmentCount;
    model.recurringId = transaction.recurringId;
    model.createdAt = transaction.createdAt;

    return model;
  }

  static names(
    categories: Category[],
    accounts: Account[],
    cards: Card[],
  ): TransactionNames {
    return {
      category: nameResolver('categoria', categories),
      account: nameResolver('conta', accounts),
      card: nameResolver('cartão', cards),
    };
  }

  static toDto(
    transaction: Transaction,
    names: TransactionNames,
  ): TransactionDto {
    return {
      id: transaction.id,
      kind: transaction.kind,
      description: transaction.description,
      amountInCents: transaction.amountInCents,
      date: transaction.date,
      categoryId: transaction.categoryId,
      categoryName: optional(names.category, transaction.categoryId),
      accountId: transaction.accountId,
      accountName: optional(names.account, transaction.accountId),
      cardId: transaction.cardId,
      cardName: optional(names.card, transaction.cardId),
      toAccountId: transaction.toAccountId,
      toAccountName: optional(names.account, transaction.toAccountId),
      toCardId: transaction.toCardId,
      toCardName: optional(names.card, transaction.toCardId),
      invoiceMonth: transaction.invoiceMonth,
      purchaseId: transaction.purchaseId,
      installmentNumber: transaction.installmentNumber,
      installmentCount: transaction.installmentCount,
      recurringId: transaction.recurringId,
      createdAt: transaction.createdAt.toISOString(),
    };
  }
}
