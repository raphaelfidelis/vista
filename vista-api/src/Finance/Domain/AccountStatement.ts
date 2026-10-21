import { Account } from './Account';
import { Month } from './Month';
import { Transaction } from './Transaction';

export interface StatementMovement {
  transaction: Transaction;
  /** Quanto o lançamento move o saldo desta conta (negativo = saiu). */
  effectInCents: number;
  /** Saldo logo depois do lançamento. */
  balanceInCents: number;
}

/** Extrato de uma conta num mês: saldo de abertura, movimentos com saldo corrente e saldo final. */
export class AccountStatement {
  private _openingInCents: number;
  private _movements: StatementMovement[];

  /** `transactions`: todos os lançamentos que envolvem a conta, em qualquer data. */
  constructor(account: Account, month: Month, transactions: Transaction[]) {
    const first = month.firstDay();
    const last = month.lastDay();
    const ordered = [...transactions].sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    );

    this._openingInCents = ordered
      .filter((transaction) => transaction.date < first)
      .reduce(
        (total, transaction) => total + account.effectOf(transaction),
        account.initialBalanceInCents,
      );

    let balance = this._openingInCents;
    this._movements = [];

    for (const transaction of ordered) {
      const effect = account.effectOf(transaction);

      // Efeito 0: o lançamento não envolve a conta ou é anterior à data do
      // saldo inicial (já está dentro dele). Não é movimento.
      if (effect === 0 || transaction.date < first || transaction.date > last) {
        continue;
      }

      balance += effect;
      this._movements.push({
        transaction,
        effectInCents: effect,
        balanceInCents: balance,
      });
    }
  }

  get openingInCents(): number {
    return this._openingInCents;
  }

  get movements(): readonly StatementMovement[] {
    return this._movements;
  }

  get closingInCents(): number {
    return this._movements.at(-1)?.balanceInCents ?? this._openingInCents;
  }
}
