import { randomUUID } from 'node:crypto';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { MAX_NAME_LENGTH } from './Limits';

export type CategoryKind = 'EXPENSE' | 'INCOME';

export interface NewCategory {
  userId: string;
  name: string;
  kind: CategoryKind;
}

/** Categoria de despesa ou de receita; as duas listas não se misturam. */
export class Category {
  private _id: string;
  private _userId: string;
  private _name: string;
  private _kind: CategoryKind;
  private _createdAt: Date;

  constructor(
    id: string,
    userId: string,
    name: string,
    kind: CategoryKind,
    createdAt: Date,
  ) {
    this._id = id;
    this._userId = userId;
    this._name = Category.validName(name);
    this._kind = kind;
    this._createdAt = createdAt;
  }

  static create({ userId, name, kind }: NewCategory): Category {
    return new Category(randomUUID(), userId, name, kind, new Date());
  }

  get id(): string {
    return this._id;
  }

  /** Imutável: o dono dos dados. */
  get userId(): string {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = Category.validName(name);
  }

  /** Imutável: trocar o tipo reclassificaria todos os lançamentos da categoria. */
  get kind(): CategoryKind {
    return this._kind;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private static validName(value: string): string {
    const name = value.trim();

    if (name === '') {
      throw new FinanceValidationError('O nome da categoria é obrigatório');
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new FinanceValidationError(
        `O nome da categoria deve ter até ${MAX_NAME_LENGTH} caracteres`,
      );
    }

    return name;
  }
}
