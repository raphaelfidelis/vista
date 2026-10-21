import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Month } from './Month';
import { Transaction, TransactionKind } from './Transaction';

/** Período máximo de uma busca: três anos. */
export const MAX_SEARCH_MONTHS = 36;
export const MAX_SEARCH_TEXT_LENGTH = 100;

export interface TransactionFilters {
  /** Parte da descrição; sem diferenciar maiúsculas nem acentos. */
  text?: string;
  fromMonth: Month;
  toMonth: Month;
  kind?: TransactionKind;
  categoryId?: string;
  /** Conta ou cartão, como origem ou destino. */
  originId?: string;
}

export interface TransactionSearchResult {
  /** Do mais novo para o mais antigo (data, depois fatura, depois criação). */
  matches: Transaction[];
  /** Somas de todos os resultados, não só de uma página. */
  incomeInCents: number;
  expenseInCents: number;
}

/** Minúsculas, sem acento e sem espaço nas pontas: "Açaí " e "acai" são iguais. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function validate(filters: TransactionFilters): void {
  const span = filters.fromMonth.monthsUntil(filters.toMonth);

  if (span < 0) {
    throw new FinanceValidationError(
      'O início do período deve vir antes do fim',
    );
  }

  if (span + 1 > MAX_SEARCH_MONTHS) {
    throw new FinanceValidationError(
      `Busque em até ${MAX_SEARCH_MONTHS} meses de cada vez`,
    );
  }

  if ((filters.text ?? '').length > MAX_SEARCH_TEXT_LENGTH) {
    throw new FinanceValidationError(
      `O texto da busca deve ter até ${MAX_SEARCH_TEXT_LENGTH} caracteres`,
    );
  }
}

/**
 * Lançamentos que casam com os filtros. O período segue a regra do
 * relatório: compra no cartão conta pelo mês da fatura (reportMonth), então
 * a busca de um mês soma o mesmo que o relatório dele.
 */
export function searchTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): TransactionSearchResult {
  validate(filters);

  const from = filters.fromMonth.toString();
  const to = filters.toMonth.toString();
  const text = normalize(filters.text ?? '');

  const matches = transactions
    .filter(
      (transaction) =>
        transaction.reportMonth >= from &&
        transaction.reportMonth <= to &&
        (filters.kind === undefined || transaction.kind === filters.kind) &&
        (filters.categoryId === undefined ||
          transaction.categoryId === filters.categoryId) &&
        (filters.originId === undefined ||
          [
            transaction.accountId,
            transaction.cardId,
            transaction.toAccountId,
            transaction.toCardId,
          ].includes(filters.originId)) &&
        (text === '' || normalize(transaction.description).includes(text)),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        // Parcelas da mesma compra têm a mesma data: a fatura mais nova primeiro.
        b.reportMonth.localeCompare(a.reportMonth) ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );

  const sum = (kind: TransactionKind) =>
    matches
      .filter((transaction) => transaction.kind === kind)
      .reduce((total, transaction) => total + transaction.amountInCents, 0);

  return {
    matches,
    incomeInCents: sum('INCOME'),
    expenseInCents: sum('EXPENSE'),
  };
}
