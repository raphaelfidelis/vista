import { randomUUID } from 'node:crypto';
import { ExpenseValidationError } from './Errors/ExpenseValidation.error';
import { Month } from './Month';

/** Limite de uma coluna `integer` do Postgres: acima disso o banco falharia com 500. */
const MAX_AMOUNT_IN_CENTS = 2_147_483_647;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface NewExpense {
  description: string;
  amountInCents: number;
  /** AAAA-MM-DD, sem hora: evita que o fuso mude o dia do gasto. */
  date: string;
  categoryId: string;
}

export class Expense {
  private _id: string;
  private _description: string;
  private _amountInCents: number;
  private _date: string;
  private _categoryId: string;
  private _createdAt: Date;

  constructor(
    id: string,
    description: string,
    amountInCents: number,
    date: string,
    categoryId: string,
    createdAt: Date,
  ) {
    this._id = id;
    this._description = Expense.validDescription(description);
    this._amountInCents = Expense.validAmount(amountInCents);
    this._date = Expense.validDate(date);
    this._categoryId = Expense.validCategoryId(categoryId);
    this._createdAt = createdAt;
  }

  static create({
    description,
    amountInCents,
    date,
    categoryId,
  }: NewExpense): Expense {
    return new Expense(
      randomUUID(),
      description,
      amountInCents,
      date,
      categoryId,
      new Date(),
    );
  }

  get id(): string {
    return this._id;
  }

  get description(): string {
    return this._description;
  }

  set description(description: string) {
    this._description = Expense.validDescription(description);
  }

  get amountInCents(): number {
    return this._amountInCents;
  }

  set amountInCents(amountInCents: number) {
    this._amountInCents = Expense.validAmount(amountInCents);
  }

  get date(): string {
    return this._date;
  }

  set date(date: string) {
    this._date = Expense.validDate(date);
  }

  get categoryId(): string {
    return this._categoryId;
  }

  set categoryId(categoryId: string) {
    this._categoryId = Expense.validCategoryId(categoryId);
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // Os validadores recebem `unknown`: o corpo da requisição chega tipado só
  // em tempo de compilação, e é aqui que ele é conferido de fato.

  private static validDescription(value: unknown): string {
    const description = typeof value === 'string' ? value.trim() : '';

    if (description === '') {
      throw new ExpenseValidationError('A descrição é obrigatória');
    }

    return description;
  }

  private static validAmount(value: unknown): number {
    const valid =
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value > 0 &&
      value <= MAX_AMOUNT_IN_CENTS;

    if (!valid) {
      throw new ExpenseValidationError(
        'O valor deve ser um número inteiro de centavos maior que zero',
      );
    }

    return value;
  }

  private static validDate(value: unknown): string {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
      throw new ExpenseValidationError(
        'A data deve estar no formato AAAA-MM-DD',
      );
    }

    // 2026-02-30 passa no formato, mas não existe: o Date rola para março.
    const parsed = new Date(`${value}T00:00:00Z`);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new ExpenseValidationError(`Data inexistente: ${value}`);
    }

    // Mesma faixa do `Month`: todo gasto gravável precisa ser alcançável por
    // alguma consulta de mês. Também barra o ano 0000, que o Postgres recusa.
    if (!Month.supportsYear(parsed.getUTCFullYear())) {
      throw new ExpenseValidationError(
        `A data deve ser a partir de ${Month.MIN_YEAR}`,
      );
    }

    return value;
  }

  private static validCategoryId(value: unknown): string {
    // Um id malformado chegaria ao Postgres como erro de sintaxe de uuid (500).
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
      throw new ExpenseValidationError('Categoria inválida');
    }

    return value.toLowerCase();
  }
}
