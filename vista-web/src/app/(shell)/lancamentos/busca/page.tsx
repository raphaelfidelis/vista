import type { Metadata } from 'next';
import { ApiError } from '@/lib/api.server';
import {
  TRANSACTION_KIND_LABELS,
  type TransactionKind,
  type TransactionSearch,
  type TransactionSearchResult,
} from '@/lib/finance';
import {
  getAccounts,
  getCards,
  getCategories,
  searchTransactions,
} from '@/lib/finance.api';
import { MAX_SEARCH_TEXT_LENGTH } from '@/lib/limits';
import { currentDate, currentMonth, isMonth, shiftMonth } from '@/lib/month';
import { SearchView } from './SearchView';

export const metadata: Metadata = { title: 'Busca · Vista' };

const EMPTY: TransactionSearchResult = {
  total: 0,
  incomeInCents: 0,
  expenseInCents: 0,
  transactions: [],
};

function isKind(value: string): value is TransactionKind {
  return value in TRANSACTION_KIND_LABELS;
}

/** Os filtros vêm da URL (texto, de, ate, tipo, categoria, origem); o padrão são os últimos 12 meses. */
export default async function SearchPage({
  searchParams,
}: PageProps<'/lancamentos/busca'>) {
  const params = await searchParams;
  const read = (key: string): string => {
    const value = params[key];

    return typeof value === 'string' ? value.trim() : '';
  };
  const month = currentMonth();
  const kind = read('tipo');
  const filters: TransactionSearch = {
    text: read('texto').slice(0, MAX_SEARCH_TEXT_LENGTH) || undefined,
    from: isMonth(read('de')) ? read('de') : shiftMonth(month, -11),
    to: isMonth(read('ate')) ? read('ate') : month,
    kind: isKind(kind) ? kind : undefined,
    categoryId: read('categoria') || undefined,
    originId: read('origem') || undefined,
  };

  const [categories, accounts, cards] = await Promise.all([
    getCategories(),
    getAccounts(),
    getCards(),
  ]);
  let result = EMPTY;
  let error: string | null = null;

  try {
    result = await searchTransactions(filters, 0);
  } catch (caught) {
    // Período invertido ou longo demais: a mensagem da API vai para a tela.
    if (!(caught instanceof ApiError)) {
      throw caught;
    }

    error = caught.message;
  }

  return (
    <SearchView
      filters={filters}
      result={result}
      error={error}
      categories={categories}
      accounts={accounts}
      cards={cards}
      defaultDate={currentDate()}
    />
  );
}
