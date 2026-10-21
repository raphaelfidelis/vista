import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { iconButton } from '@/components/buttons';
import { StatCard } from '@/components/StatCard';
import { TRANSACTION_KIND_LABELS } from '@/lib/finance';
import { getAccounts, getStatement } from '@/lib/finance.api';
import { formatCents, formatSignedCents } from '@/lib/money';
import {
  currentMonth,
  formatDay,
  formatMonth,
  isMonth,
  shiftMonth,
} from '@/lib/month';

export default async function AccountStatementPage({
  params,
  searchParams,
}: PageProps<'/contas/[id]'>) {
  const { id } = await params;
  const { mes } = await searchParams;
  const month = typeof mes === 'string' ? mes : undefined;

  if (!isMonth(month)) {
    redirect(`/contas/${id}?mes=${currentMonth()}`);
  }

  const accounts = await getAccounts();
  const account = accounts.find((item) => item.id === id);

  if (!account) {
    notFound();
  }

  const statement = await getStatement(id, month);
  const href = (target: string) => `/contas/${id}?mes=${target}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/contas"
          className="text-muted hover:text-primary flex items-center gap-1 text-[11px] tracking-[0.1em]"
        >
          <span aria-hidden className="icon text-[16px]">
            chevron_left
          </span>
          CONTAS
        </Link>
        <h1 className="font-sans text-lg font-bold">{account.name}</h1>
        {account.archived && (
          <span className="text-dim text-[11px] tracking-[0.1em]">
            ARQUIVADA
          </span>
        )}
        <div className="flex items-center gap-2 md:ml-auto">
          <Link
            href={href(shiftMonth(month, -1))}
            aria-label="Mês anterior"
            className={iconButton}
          >
            <span aria-hidden className="icon text-[20px]">
              chevron_left
            </span>
          </Link>
          <span className="font-sans w-28 text-center text-lg font-bold">
            {formatMonth(month)}
          </span>
          <Link
            href={href(shiftMonth(month, 1))}
            aria-label="Próximo mês"
            className={iconButton}
          >
            <span aria-hidden className="icon text-[20px]">
              chevron_right
            </span>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard
          label="SALDO DE ABERTURA"
          value={formatCents(statement.openingInCents)}
        />
        <StatCard
          label="SALDO FINAL"
          value={formatCents(statement.closingInCents)}
        />
        <StatCard
          label="SALDO ATUAL"
          value={formatCents(account.balanceInCents)}
          hint="com todos os lançamentos, em qualquer mês"
        />
      </div>

      {statement.movements.length === 0 ? (
        <p className="text-dim py-10 text-center text-xs tracking-[0.24em]">
          NENHUM MOVIMENTO EM {formatMonth(month)}
        </p>
      ) : (
        <>
          <table className="hidden w-full border-separate border-spacing-y-1 text-sm @2xl:table">
            <thead>
              <tr className="text-dim text-[10px] tracking-[0.2em]">
                <th className="px-3 text-left font-normal">DATA</th>
                <th className="px-3 text-left font-normal">DESCRIÇÃO</th>
                <th className="px-3 text-left font-normal">CATEGORIA</th>
                <th className="px-3 text-right font-normal">MOVIMENTO</th>
                <th className="px-3 text-right font-normal">SALDO</th>
              </tr>
            </thead>
            <tbody>
              {statement.movements.map(
                ({ transaction, effectInCents, balanceInCents }) => (
                  <tr key={transaction.id} className="bg-item">
                    <td className="text-muted px-3 py-2">
                      {formatDay(transaction.date)}
                    </td>
                    <td className="px-3">
                      {transaction.description}
                      {(transaction.toAccountName ?? transaction.toCardName) !==
                        null && (
                        <span className="text-muted ml-2 text-xs">
                          {transaction.accountName} →{' '}
                          {transaction.toAccountName ?? transaction.toCardName}
                        </span>
                      )}
                    </td>
                    <td className="text-secondary px-3">
                      {transaction.categoryName ??
                        TRANSACTION_KIND_LABELS[transaction.kind]}
                    </td>
                    <td className="px-3 text-right whitespace-nowrap">
                      {formatSignedCents(effectInCents)}
                    </td>
                    <td className="text-secondary px-3 text-right whitespace-nowrap">
                      {formatCents(balanceInCents)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          <ul className="flex flex-col gap-1 @2xl:hidden">
            {statement.movements.map(
              ({ transaction, effectInCents, balanceInCents }) => (
                <li
                  key={transaction.id}
                  className="bg-item flex flex-col gap-1 px-3 py-2"
                >
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {transaction.description}
                    </span>
                    <span className="whitespace-nowrap">
                      {formatSignedCents(effectInCents)}
                    </span>
                  </div>
                  <div className="text-muted flex justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate">
                      {[
                        formatDay(transaction.date),
                        transaction.categoryName ??
                          TRANSACTION_KIND_LABELS[transaction.kind],
                        (transaction.toAccountName ??
                          transaction.toCardName) === null
                          ? null
                          : `${transaction.accountName} → ${transaction.toAccountName ?? transaction.toCardName}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className="whitespace-nowrap">
                      saldo {formatCents(balanceInCents)}
                    </span>
                  </div>
                </li>
              ),
            )}
          </ul>
        </>
      )}
    </>
  );
}
