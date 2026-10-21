'use client';

import Link from 'next/link';
import { useState } from 'react';
import { iconButton, primaryButton } from '@/components/buttons';
import { DeleteButton } from '@/components/DeleteButton';
import { Drawer } from '@/components/Drawer';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { StatCard } from '@/components/StatCard';
import type { Account, Card, CardInvoice } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { formatDay, formatMonth, shiftMonth } from '@/lib/month';
import { deleteTransaction } from '@/lib/transaction.actions';
import { PayInvoiceForm } from './PayInvoiceForm';

type InvoiceViewProps = {
  card: Card;
  invoice: CardInvoice;
  accounts: Account[];
  /** AAAA-MM-DD: data padrão do pagamento. */
  today: string;
};

export function InvoiceView({
  card,
  invoice,
  accounts,
  today,
}: InvoiceViewProps) {
  const [paying, setPaying] = useState(false);
  const href = (month: string) => `/cartoes/${card.id}?fatura=${month}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/cartoes"
          className="text-muted hover:text-primary flex items-center gap-1 text-[11px] tracking-[0.1em]"
        >
          <span aria-hidden className="icon text-[16px]">
            chevron_left
          </span>
          CARTÕES
        </Link>
        <h1 className="font-sans text-lg font-bold">{card.name}</h1>
        {card.archived && (
          <span className="text-dim text-[11px] tracking-[0.1em]">
            ARQUIVADO
          </span>
        )}
        <div className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-auto">
          <Link
            href={href(shiftMonth(invoice.month, -1))}
            aria-label="Fatura anterior"
            className={iconButton}
          >
            <span aria-hidden className="icon text-[20px]">
              chevron_left
            </span>
          </Link>
          <span className="font-sans w-28 text-center text-lg font-bold">
            {formatMonth(invoice.month)}
          </span>
          <Link
            href={href(shiftMonth(invoice.month, 1))}
            aria-label="Próxima fatura"
            className={iconButton}
          >
            <span aria-hidden className="icon text-[20px]">
              chevron_right
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setPaying(true)}
            className={`${primaryButton} w-full md:ml-2 md:w-auto`}
          >
            <span aria-hidden className="icon text-[16px]">
              payments
            </span>
            PAGAR FATURA
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <InvoiceStatusBadge status={invoice.status} />
        <span className="text-secondary text-xs tracking-[0.1em]">
          FECHA {formatDay(invoice.closingDate)} · VENCE{' '}
          {formatDay(invoice.dueDate)}
        </span>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard
          label="TOTAL DA FATURA"
          value={formatCents(invoice.totalInCents)}
          hint={`saldo anterior ${formatCents(invoice.previousBalanceInCents)} · compras ${formatCents(invoice.chargesInCents)}`}
        />
        <StatCard label="PAGO" value={formatCents(invoice.paymentsInCents)} />
        <StatCard
          label="RESTANTE"
          value={formatCents(invoice.remainingInCents)}
          hint={
            invoice.remainingInCents < 0
              ? 'pagamento a mais: vira crédito na próxima fatura'
              : 'o que não for pago rola para a próxima fatura'
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-dim text-[10px] tracking-[0.22em]">COMPRAS</h2>
        {invoice.charges.length === 0 ? (
          <p className="text-dim py-4 text-center text-xs">
            Nenhuma compra nesta fatura.
          </p>
        ) : (
          <>
            <table className="hidden w-full border-separate border-spacing-y-1 text-sm @2xl:table">
              <thead>
                <tr className="text-dim text-[10px] tracking-[0.2em]">
                  <th className="px-3 text-left font-normal">DATA</th>
                  <th className="px-3 text-left font-normal">DESCRIÇÃO</th>
                  <th className="px-3 text-left font-normal">CATEGORIA</th>
                  <th className="px-3 text-right font-normal">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {invoice.charges.map((charge) => (
                  <tr key={charge.id} className="bg-item">
                    <td className="text-muted px-3 py-2">
                      {formatDay(charge.date)}
                    </td>
                    <td className="px-3">
                      {charge.description}
                      {charge.installmentNumber !== null && (
                        <span className="text-muted ml-2 text-xs">
                          {charge.installmentNumber}/{charge.installmentCount}
                        </span>
                      )}
                    </td>
                    <td className="text-secondary px-3">
                      {charge.categoryName}
                    </td>
                    <td className="px-3 text-right whitespace-nowrap">
                      {formatCents(charge.amountInCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="flex flex-col gap-1 @2xl:hidden">
              {invoice.charges.map((charge) => (
                <li
                  key={charge.id}
                  className="bg-item flex flex-col gap-1 px-3 py-2"
                >
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {charge.description}
                      {charge.installmentNumber !== null && (
                        <span className="text-muted ml-2 text-xs">
                          {charge.installmentNumber}/{charge.installmentCount}
                        </span>
                      )}
                    </span>
                    <span className="whitespace-nowrap">
                      {formatCents(charge.amountInCents)}
                    </span>
                  </div>
                  <span className="text-muted truncate text-xs">
                    {formatDay(charge.date)} · {charge.categoryName}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-dim text-[10px] tracking-[0.22em]">PAGAMENTOS</h2>
        {invoice.payments.length === 0 ? (
          <p className="text-dim py-4 text-center text-xs">
            Nenhum pagamento nesta fatura.
          </p>
        ) : (
          <>
            <table className="hidden w-full border-separate border-spacing-y-1 text-sm @2xl:table">
              <thead>
                <tr className="text-dim text-[10px] tracking-[0.2em]">
                  <th className="px-3 text-left font-normal">DATA</th>
                  <th className="px-3 text-left font-normal">CONTA</th>
                  <th className="px-3 text-right font-normal">VALOR</th>
                  <th className="w-1" />
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id} className="bg-item">
                    <td className="text-muted px-3 py-2">
                      {formatDay(payment.date)}
                    </td>
                    <td className="text-secondary px-3">
                      {payment.accountName}
                    </td>
                    <td className="px-3 text-right whitespace-nowrap">
                      {formatCents(payment.amountInCents)}
                    </td>
                    <td className="px-2">
                      <div className="flex justify-end">
                        <DeleteButton
                          label="pagamento"
                          onDelete={() => deleteTransaction(payment.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="flex flex-col gap-1 @2xl:hidden">
              {invoice.payments.map((payment) => (
                <li
                  key={payment.id}
                  className="bg-item flex items-center gap-2 py-2 pr-1 pl-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm">
                      {formatCents(payment.amountInCents)}
                    </span>
                    <span className="text-muted truncate text-xs">
                      {formatDay(payment.date)} · {payment.accountName}
                    </span>
                  </div>
                  <DeleteButton
                    label="pagamento"
                    onDelete={() => deleteTransaction(payment.id)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {paying && (
        <Drawer title="PAGAR FATURA" onClose={() => setPaying(false)}>
          <PayInvoiceForm
            cardName={card.name}
            invoice={invoice}
            accounts={accounts}
            defaultDate={today}
            onSaved={() => setPaying(false)}
          />
        </Drawer>
      )}
    </>
  );
}
