import { randomUUID } from 'node:crypto';
import { AuthValidationError } from './Errors/AuthValidation.error';

export const MAX_USER_NAME_LENGTH = 60;
export const MAX_EMAIL_LENGTH = 254;

export interface NewUser {
  name: string;
  email: string;
  /** Nulo para quem entra só com o Google. */
  passwordHash?: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Uma pessoa com conta: o dono dos dados financeiros. */
export class User {
  private _id: string;
  private _name: string;
  private _email: string;
  private _passwordHash: string | null;
  private _createdAt: Date;

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string | null,
    createdAt: Date,
  ) {
    this._id = id;
    this._name = User.validName(name);
    this._email = User.validEmail(email);
    this._passwordHash = passwordHash;
    this._createdAt = createdAt;
  }

  static create({ name, email, passwordHash = null }: NewUser): User {
    return new User(randomUUID(), name, email, passwordHash, new Date());
  }

  /** Aparado e em minúsculas: é como o e-mail é guardado e procurado. */
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = User.validName(name);
  }

  /** Imutável: é a identidade da conta. */
  get email(): string {
    return this._email;
  }

  /** Nunca sai da API. */
  get passwordHash(): string | null {
    return this._passwordHash;
  }

  get hasPassword(): boolean {
    return this._passwordHash !== null;
  }

  changePasswordHash(passwordHash: string): void {
    this._passwordHash = passwordHash;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private static validName(value: string): string {
    const name = value.trim();

    if (name === '') {
      throw new AuthValidationError('O nome é obrigatório');
    }

    if (name.length > MAX_USER_NAME_LENGTH) {
      throw new AuthValidationError(
        `O nome deve ter até ${MAX_USER_NAME_LENGTH} caracteres`,
      );
    }

    return name;
  }

  private static validEmail(value: string): string {
    const email = User.normalizeEmail(value);

    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
      throw new AuthValidationError('Informe um e-mail válido');
    }

    return email;
  }
}
