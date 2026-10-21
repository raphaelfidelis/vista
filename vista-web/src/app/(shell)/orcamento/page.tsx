import { redirect } from 'next/navigation';
import { getBudget } from '@/lib/finance.api';
import { currentMonth, isMonth } from '@/lib/month';
import { BudgetView } from './BudgetView';

export default async function BudgetPage({
  searchParams,
}: PageProps<'/orcamento'>) {
  const { mes } = await searchParams;
  const month = typeof mes === 'string' ? mes : undefined;

  if (!isMonth(month)) {
    redirect(`/orcamento?mes=${currentMonth()}`);
  }

  return <BudgetView budget={await getBudget(month)} />;
}
