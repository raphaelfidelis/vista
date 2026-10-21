import { randomUUID } from 'node:crypto';
import { validPositiveAmount } from './Amounts';
import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { MAX_NAME_LENGTH } from './Limits';
import { Month } from './Month';

export interface NewGoal {
  userId: string;
  name: string;
  targetInCents: number;
  /** AAAA-MM; sem prazo, nulo. */
  deadline?: string | null;
  /** Conta de reserva cujo saldo é o progresso da meta. */
  accountId: string;
}

/** Meta de economia: chegar a um valor numa conta de reserva, opcionalmente até um mês. */
export class Goal {
  private _id: string;
  private _userId: string;
  private _name: string;
  private _targetInCents: number;
  private _deadline: string | null;
  private _accountId: string;
  private _createdAt: Date;

  constructor(
    id: string,
    userId: string,
    name: string,
    targetInCents: number,
    deadline: string | null,
    accountId: string,
    createdAt: Date,
  ) {
    this._id = id;
    this._userId = userId;
    this._name = Goal.validName(name);
    this._targetInCents = validPositiveAmount(targetInCents);
    this._deadline = Goal.validDeadline(deadline);
    this._accountId = accountId;
    this._createdAt = createdAt;
  }

  static create({
    userId,
    name,
    targetInCents,
    deadline = null,
    accountId,
  }: NewGoal): Goal {
    return new Goal(
      randomUUID(),
      userId,
      name,
      targetInCents,
      deadline,
      accountId,
      new Date(),
    );
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
    this._name = Goal.validName(name);
  }

  get targetInCents(): number {
    return this._targetInCents;
  }

  set targetInCents(target: number) {
    this._targetInCents = validPositiveAmount(target);
  }

  /** AAAA-MM; nulo quando a meta não tem prazo. */
  get deadline(): string | null {
    return this._deadline;
  }

  set deadline(deadline: string | null) {
    this._deadline = Goal.validDeadline(deadline);
  }

  get accountId(): string {
    return this._accountId;
  }

  set accountId(accountId: string) {
    this._accountId = accountId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private static validName(value: string): string {
    const name = value.trim();

    if (name === '') {
      throw new FinanceValidationError('O nome da meta é obrigatório');
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new FinanceValidationError(
        `O nome da meta deve ter até ${MAX_NAME_LENGTH} caracteres`,
      );
    }

    return name;
  }

  private static validDeadline(value: string | null): string | null {
    return value === null ? null : Month.parse(value).toString();
  }
}
