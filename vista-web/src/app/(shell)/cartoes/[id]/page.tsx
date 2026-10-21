import { notFound, redirect } from 'next/navigation';
import { getAccounts, getCards, getInvoice } from '@/lib/finance.api';
import { currentDate, isMonth } from '@/lib/month';
import { InvoiceView } from './InvoiceView';

export default async function CardInvoicePage({
  params,
  searchParams,
}: PageProps<'/cartoes/[id]'>) {
  const { id } = await params;
  const { fatura } = await searchParams;
  const month = typeof fatura === 'string' ? fatura : undefined;
  const cards = await getCards();
  const card = cards.find((item) => item.id === id);

  if (!card) {
    notFound();
  }

  if (!isMonth(month)) {
    redirect(`/cartoes/${id}?fatura=${card.currentInvoice.month}`);
  }

  const [invoice, accounts] = await Promise.all([
    getInvoice(id, month),
    getAccounts(),
  ]);

  return (
    <InvoiceView
      card={card}
      invoice={invoice}
      accounts={accounts}
      today={currentDate()}
    />
  );
}
