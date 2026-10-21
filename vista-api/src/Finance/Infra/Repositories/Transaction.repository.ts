import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Not, Repository } from 'typeorm';
import { Month } from '../../Domain/Month';
import { TransactionRepository } from '../../Domain/Repositories/Transaction.repository';
import { Transaction } from '../../Domain/Transaction';
import { TransactionMapper } from '../Mappers/Transaction.mapper';
import { TransactionModel } from '../Models/Transaction.model';

const CHRONOLOGICAL = { date: 'ASC', createdAt: 'ASC' } as const;

/**
 * Toda consulta filtra por userId, inclusive cada ramo de um where com OR:
 * um ramo sem ele devolveria lançamentos de outras pessoas.
 */
@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionModel)
    private readonly repository: Repository<TransactionModel>,
  ) {}

  async findByMonth(userId: string, month: Month): Promise<Transaction[]> {
    // Array no where = OR: sem cartão conta pela data; no cartão, pela fatura.
    const models = await this.repository.find({
      where: [
        {
          userId,
          cardId: IsNull(),
          date: Between(month.firstDay(), month.lastDay()),
        },
        {
          userId,
          cardId: Not(IsNull()),
          invoiceMonth: month.toString(),
        },
      ],
      order: CHRONOLOGICAL,
    });

    return TransactionMapper.arrayToDomain(models);
  }

  async findAll(userId: string): Promise<Transaction[]> {
    const models = await this.repository.find({
      where: { userId },
      order: CHRONOLOGICAL,
    });

    return TransactionMapper.arrayToDomain(models);
  }

  async findByAccount(
    userId: string,
    accountId: string,
  ): Promise<Transaction[]> {
    const models = await this.repository.find({
      where: [
        { userId, accountId },
        { userId, toAccountId: accountId },
      ],
      order: CHRONOLOGICAL,
    });

    return TransactionMapper.arrayToDomain(models);
  }

  async findByCard(userId: string, cardId: string): Promise<Transaction[]> {
    const models = await this.repository.find({
      where: [
        { userId, cardId },
        { userId, toCardId: cardId },
      ],
      order: CHRONOLOGICAL,
    });

    return TransactionMapper.arrayToDomain(models);
  }

  async findByPurchase(
    userId: string,
    purchaseId: string,
  ): Promise<Transaction[]> {
    const models = await this.repository.find({
      where: { userId, purchaseId },
      order: { installmentNumber: 'ASC' },
    });

    return TransactionMapper.arrayToDomain(models);
  }

  async findById(userId: string, id: string): Promise<Transaction | null> {
    const model = await this.repository.findOneBy({ userId, id });

    return model ? TransactionMapper.toDomain(model) : null;
  }

  existsWithCategory(userId: string, categoryId: string): Promise<boolean> {
    return this.repository.existsBy({ userId, categoryId });
  }

  existsWithAccount(userId: string, accountId: string): Promise<boolean> {
    return this.repository.existsBy([
      { userId, accountId },
      { userId, toAccountId: accountId },
    ]);
  }

  existsWithCard(userId: string, cardId: string): Promise<boolean> {
    return this.repository.existsBy([
      { userId, cardId },
      { userId, toCardId: cardId },
    ]);
  }

  existsWithRecurring(userId: string, recurringId: string): Promise<boolean> {
    return this.repository.existsBy({ userId, recurringId });
  }

  existsForRecurringInMonth(
    userId: string,
    recurringId: string,
    month: Month,
    exceptId?: string,
  ): Promise<boolean> {
    return this.repository.existsBy({
      userId,
      recurringId,
      date: Between(month.firstDay(), month.lastDay()),
      ...(exceptId === undefined ? {} : { id: Not(exceptId) }),
    });
  }

  async findLaunchedRecurringIds(
    userId: string,
    month: Month,
  ): Promise<string[]> {
    const models = await this.repository.find({
      select: { recurringId: true },
      where: {
        userId,
        recurringId: Not(IsNull()),
        date: Between(month.firstDay(), month.lastDay()),
      },
    });

    return [
      ...new Set(
        models.flatMap((model) =>
          model.recurringId === null ? [] : [model.recurringId],
        ),
      ),
    ];
  }

  async save(transaction: Transaction): Promise<void> {
    await this.repository.save(TransactionMapper.toModel(transaction));
  }

  async saveAll(transactions: Transaction[]): Promise<void> {
    await this.repository.save(
      transactions.map((transaction) => TransactionMapper.toModel(transaction)),
    );
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }

  async deleteByPurchase(userId: string, purchaseId: string): Promise<void> {
    await this.repository.delete({ userId, purchaseId });
  }
}
