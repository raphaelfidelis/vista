import { Card } from '../../Domain/Card';
import { CardInvoice, currentInvoiceOf } from '../../Domain/CardInvoice';
import {
  CardDto,
  InvoiceSummaryDto,
} from '../../Domain/Queries/FindCards.query';
import { Transaction } from '../../Domain/Transaction';
import { CardModel } from '../Models/Card.model';

export class CardMapper {
  static toDomain(model: CardModel): Card {
    return new Card(
      model.id,
      model.userId,
      model.name,
      model.bankId,
      model.closingDay,
      model.dueDay,
      model.limitInCents,
      model.archived,
      model.createdAt,
    );
  }

  static arrayToDomain(models: CardModel[]): Card[] {
    return models.map((model) => CardMapper.toDomain(model));
  }

  static toModel(card: Card): CardModel {
    const model = new CardModel();
    model.id = card.id;
    model.userId = card.userId;
    model.name = card.name;
    model.bankId = card.bankId;
    model.closingDay = card.closingDay;
    model.dueDay = card.dueDay;
    model.limitInCents = card.limitInCents;
    model.archived = card.archived;
    model.createdAt = card.createdAt;

    return model;
  }

  static invoiceSummary(invoice: CardInvoice): InvoiceSummaryDto {
    return {
      month: invoice.month.toString(),
      status: invoice.status,
      closingDate: invoice.closingDate,
      dueDate: invoice.dueDate,
      totalInCents: invoice.totalInCents,
      remainingInCents: invoice.remainingInCents,
    };
  }

  /**
   * O nome do banco e o que depende dos lançamentos (uso do limite, fatura
   * atual) vêm de fora: o cartão só conhece o id do banco.
   * `transactions`: todos os lançamentos do cartão, em qualquer fatura.
   */
  static toDto(
    card: Card,
    bankName: string | null,
    transactions: Transaction[],
    today: string,
  ): CardDto {
    const usage = card.usage(transactions);

    return {
      id: card.id,
      name: card.name,
      bankId: card.bankId,
      bankName,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      limitInCents: card.limitInCents,
      archived: card.archived,
      usedInCents: usage.usedInCents,
      availableInCents: usage.availableInCents,
      currentInvoice: CardMapper.invoiceSummary(
        currentInvoiceOf(card, transactions, today),
      ),
      createdAt: card.createdAt.toISOString(),
    };
  }
}
