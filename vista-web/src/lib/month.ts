const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const SHORT_MONTHS = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
];

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
});

const timestamp = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
});

/** Hoje em São Paulo, AAAA-MM-DD: o servidor pode estar em outro fuso. */
export function currentDate(): string {
  return today.format(new Date());
}

export function currentMonth(): string {
  return currentDate().slice(0, 7);
}

export function isMonth(value: string | undefined): value is string {
  return value !== undefined && MONTH_PATTERN.test(value);
}

export function shiftMonth(month: string, delta: number): string {
  const [year = 0, number = 1] = month.split('-').map(Number);
  const index = year * 12 + (number - 1) + delta;

  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/** Vencimento no mês (AAAA-MM-DD); em mês mais curto, o último dia. Espelha `RecurringExpense.dueDateIn` da API. */
export function dueDateIn(month: string, dueDay: number): string {
  const [year = 0, number = 1] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, number, 0)).getUTCDate();

  return `${month}-${String(Math.min(dueDay, lastDay)).padStart(2, '0')}`;
}

/** `2026-10` → `OUT 2026` */
export function formatMonth(month: string): string {
  const [year, number = '1'] = month.split('-');

  return `${SHORT_MONTHS[Number(number) - 1]} ${year}`;
}

/** `2026-10-01` → `01/10`. Por texto: `new Date` deixaria o fuso mudar o dia. */
export function formatDay(date: string): string {
  const [, month, day] = date.split('-');

  return `${day}/${month}`;
}

/** Instante ISO → `01/10/2026`, no fuso de São Paulo. */
export function formatTimestamp(iso: string): string {
  return timestamp.format(new Date(iso));
}
