import { Account } from './Account';
import { Goal } from './Goal';
import { Transaction } from './Transaction';

/** Quanto falta para a meta: o progresso é o saldo da conta de reserva dela. */
export class GoalProgress {
  private _balanceInCents: number;
  private _targetInCents: number;
  private _monthsLeft: number | null;

  /**
   * `transactions`: os lançamentos que movem a conta, em qualquer data.
   * `today`: AAAA-MM-DD, para contar os meses até o prazo.
   */
  constructor(
    goal: Goal,
    account: Account,
    transactions: Transaction[],
    today: string,
  ) {
    this._balanceInCents = account.balance(transactions);
    this._targetInCents = goal.targetInCents;
    this._monthsLeft =
      goal.deadline === null
        ? null
        : GoalProgress.monthsBetween(today.slice(0, 7), goal.deadline);
  }

  /** Do mês atual ao do prazo, contando os dois: no mês do prazo ainda resta 1; no mês seguinte a ele, zero. */
  private static monthsBetween(current: string, deadline: string): number {
    const index = (month: string) => {
      const [year = 0, number = 1] = month.split('-').map(Number);

      return year * 12 + number;
    };

    return index(deadline) - index(current) + 1;
  }

  get balanceInCents(): number {
    return this._balanceInCents;
  }

  /** Fração do alvo (1 = 100%); passa de 1 quando a meta é superada e nunca é negativa. */
  get progress(): number {
    return Math.max(0, this._balanceInCents / this._targetInCents);
  }

  get remainingInCents(): number {
    return Math.max(0, this._targetInCents - this._balanceInCents);
  }

  /** Meses até o prazo, contando o atual; zero ou negativo quando venceu; nulo sem prazo. */
  get monthsLeft(): number | null {
    return this._monthsLeft;
  }

  get deadlinePassed(): boolean {
    return this._monthsLeft !== null && this._monthsLeft <= 0;
  }

  /** Quanto guardar por mês para chegar a tempo; nulo sem prazo ou com o prazo vencido. */
  get monthlyNeededInCents(): number | null {
    if (this._monthsLeft === null || this._monthsLeft <= 0) {
      return null;
    }

    return Math.ceil(this.remainingInCents / this._monthsLeft);
  }
}
