import { randomUUID } from 'node:crypto';
import { ExpenseValidationError } from './Errors/ExpenseValidation.error';

export class ExpenseCategory {
  private _id: string;
  private _name: string;
  private _createdAt: Date;

  constructor(id: string, name: string, createdAt: Date) {
    this._id = id;
    this._name = ExpenseCategory.validName(name);
    this._createdAt = createdAt;
  }

  static create(name: string): ExpenseCategory {
    return new ExpenseCategory(randomUUID(), name, new Date());
  }

  /**
   * Resolve o nome da categoria de cada gasto. Um gasto apontando para uma
   * categoria fora da lista é inconsistência de dados, não caso de uso.
   */
  static nameResolver(
    categories: ExpenseCategory[],
  ): (categoryId: string) => string {
    const names = new Map(
      categories.map((category) => [category.id, category.name]),
    );

    return (categoryId) => {
      const name = names.get(categoryId);

      if (name === undefined) {
        throw new Error(
          `Gasto referencia categoria desconhecida: ${categoryId}`,
        );
      }

      return name;
    };
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = ExpenseCategory.validName(name);
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private static validName(value: unknown): string {
    const name = typeof value === 'string' ? value.trim() : '';

    if (name === '') {
      throw new ExpenseValidationError('O nome da categoria é obrigatório');
    }

    return name;
  }
}
