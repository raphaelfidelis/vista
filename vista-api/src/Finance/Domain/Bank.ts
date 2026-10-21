import { randomUUID } from 'node:crypto';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { MAX_NAME_LENGTH } from './Limits';

export class Bank {
  private _id: string;
  private _userId: string;
  private _name: string;
  private _createdAt: Date;

  constructor(id: string, userId: string, name: string, createdAt: Date) {
    this._id = id;
    this._userId = userId;
    this._name = Bank.validName(name);
    this._createdAt = createdAt;
  }

  static create(userId: string, name: string): Bank {
    return new Bank(randomUUID(), userId, name, new Date());
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
    this._name = Bank.validName(name);
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private static validName(value: string): string {
    const name = value.trim();

    if (name === '') {
      throw new FinanceValidationError('O nome do banco é obrigatório');
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new FinanceValidationError(
        `O nome do banco deve ter até ${MAX_NAME_LENGTH} caracteres`,
      );
    }

    return name;
  }
}
