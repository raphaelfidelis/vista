import { redirect } from 'next/navigation';
import {
  getAccounts,
  getCards,
  getCategories,
  getRecurring,
  getReport,
} from '@/lib/finance.api';
import { currentDate, currentMonth, isMonth } from '@/lib/month';
import { TransactionsView } from './TransactionsView';

export default async function TransactionsPage({
  searchParams,
}: PageProps<'/lancamentos'>) {
  const { mes, novo } = await searchParams;
  const month = typeof mes === 'string' ? mes : undefined;

  if (!isMonth(month)) {
    // O + da barra inferior chega sem mês: mantém o pedido de abrir o formulário.
    redirect(
      `/lancamentos?mes=${currentMonth()}${novo === '1' ? '&novo=1' : ''}`,
    );
  }

  const [report, categories, accounts, cards, recurring] = await Promise.all([
    getReport(month),
    getCategories(),
    getAccounts(),
    getCards(),
    getRecurring(),
  ]);
  const today = currentDate();

  return (
    <TransactionsView
      report={report}
      categories={categories}
      accounts={accounts}
      cards={cards}
      recurring={recurring}
      // Lançar num mês passado começa no dia 1 dele, não em "hoje".
      defaultDate={today.startsWith(month) ? today : `${month}-01`}
      openNew={novo === '1'}
    />
  );
}
