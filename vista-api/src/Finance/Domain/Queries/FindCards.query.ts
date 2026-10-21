import { InvoiceStatus } from '../CardInvoice';

export const FIND_CARDS_QUERY = Symbol('FindCardsQuery');

export interface InvoiceSummaryDto {
  /** AAAA-MM do vencimento. */
  month: string;
  status: InvoiceStatus;
  /** AAAA-MM-DD */
  closingDate: string;
  /** AAAA-MM-DD */
  dueDate: string;
  totalInCents: number;
  remainingInCents: number;
}

export interface CardDto {
  id: string;
  name: string;
  bankId: string | null;
  bankName: string | null;
  closingDay: number;
  dueDay: number;
  limitInCents: number | null;
  archived: boolean;
  /** Compras ainda não pagas, de todas as faturas. */
  usedInCents: number;
  /** Nulo quando o cartão não tem limite. */
  availableInCents: number | null;
  /** A fatura que falta pagar (fechada e em aberto) ou, sem pendência, a aberta. */
  currentInvoice: InvoiceSummaryDto;
  createdAt: string;
}

export interface FindCardsQuery {
  /** Por nome, inclusive os arquivados. */
  execute(userId: string): Promise<CardDto[]>;
}
