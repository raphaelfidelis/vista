import { FinanceValidationError } from './Errors/FinanceValidation.error';

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

/** Value object de um mês do calendário, no formato AAAA-MM. */
export class Month {
  /**
   * Primeiro ano suportado — escolha de produto: gasto pessoal não é anterior
   * a 1900. O `Expense` usa o mesmo limite, porque um gasto fora dele seria
   * gravado mas nenhuma consulta de mês chegaria até ele. Não há limite
   * superior a checar: o formato de 4 dígitos já para em 9999.
   */
  static readonly MIN_YEAR = 1900;

  private _year: number;
  private _month: number;

  constructor(year: number, month: number) {
    if (!Month.supportsYear(year) || month < 1 || month > 12) {
      throw new FinanceValidationError(
        `Mês fora do intervalo suportado: ${year}-${String(month).padStart(2, '0')}`,
      );
    }

    this._year = year;
    this._month = month;
  }

  static supportsYear(year: number): boolean {
    return year >= Month.MIN_YEAR;
  }

  static parse(value: string): Month {
    const match = MONTH_PATTERN.exec(value);

    if (!match) {
      throw new FinanceValidationError('Mês inválido. Use o formato AAAA-MM.');
    }

    return new Month(Number(match[1]), Number(match[2]));
  }

  previous(): Month {
    return this._month === 1
      ? new Month(this._year - 1, 12)
      : new Month(this._year, this._month - 1);
  }

  /** O mês daqui a `months` meses (negativo volta no tempo). */
  plus(months: number): Month {
    const index = this._year * 12 + (this._month - 1) + months;

    return new Month(Math.floor(index / 12), (index % 12) + 1);
  }

  /** Quantos meses daqui até `other` (negativo se `other` vem antes). */
  monthsUntil(other: Month): number {
    return other._year * 12 + other._month - (this._year * 12 + this._month);
  }

  /** AAAA-MM-DD do dia pedido, ou do último dia do mês se ele for mais curto. */
  dateOn(day: number): string {
    const lastDay = Number(this.lastDay().slice(-2));

    return `${this.toString()}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
  }

  /** AAAA-MM-DD */
  firstDay(): string {
    return `${this.toString()}-01`;
  }

  /** AAAA-MM-DD. O dia 0 do mês seguinte é o último dia deste. */
  lastDay(): string {
    const days = new Date(Date.UTC(this._year, this._month, 0)).getUTCDate();

    return `${this.toString()}-${String(days).padStart(2, '0')}`;
  }

  toString(): string {
    return `${this._year}-${String(this._month).padStart(2, '0')}`;
  }
}
