'use client';

import { useState } from 'react';
import { iconButton } from '@/components/buttons';
import { DeleteButton } from '@/components/DeleteButton';
import { RecategorizeBar } from '@/components/RecategorizeBar';
import {
  MAX_RECATEGORIZE,
  TRANSACTION_KIND_LABELS,
  type Category,
  type Transaction,
} from '@/lib/finance';
import { formatCents, formatSignedCents } from '@/lib/money';
import { formatDay, formatMonth } from '@/lib/month';
import { deleteTransaction } from '@/lib/transaction.actions';

type TransactionListProps = {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  /** Com as categorias, a lista permite selecionar e MUDAR CATEGORIA. */
  categories?: Category[];
};

/** Só despesa e receita têm categoria. */
function selectable(transaction: Transaction): boolean {
  return transaction.kind === 'EXPENSE' || transaction.kind === 'INCOME';
}

const checkboxClass = 'accent-accent size-5 cursor-pointer md:size-4';

function Check({
  transaction,
  checked,
  onToggle,
}: {
  transaction: Transaction;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  if (!selectable(transaction)) {
    return <span aria-hidden className="inline-block w-9 md:w-4" />;
  }

  return (
    // O label aumenta a área de toque além da caixinha.
    <label className="flex size-9 cursor-pointer items-center justify-center md:size-auto">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(transaction.id)}
        aria-label={`Selecionar ${transaction.description}`}
        className={checkboxClass}
      />
    </label>
  );
}

export function Amount({ transaction }: { transaction: Transaction }) {
  switch (transaction.kind) {
    case 'EXPENSE':
      return <>{formatSignedCents(-transaction.amountInCents)}</>;
    case 'INCOME':
      return (
        <span className="text-accent">
          {formatSignedCents(transaction.amountInCents)}
        </span>
      );
    case 'ADJUSTMENT':
      return <>{formatSignedCents(transaction.amountInCents)}</>;
    case 'TRANSFER':
      return (
        <span className="text-secondary">
          {formatCents(transaction.amountInCents)}
        </span>
      );
  }
}

/** De onde saiu; na transferência e no pagamento de fatura, "origem → destino". */
function origin(transaction: Transaction): string {
  const from = transaction.accountName ?? transaction.cardName ?? '';
  const to = transaction.toAccountName ?? transaction.toCardName;

  return to === null ? from : `${from} → ${to}`;
}

function category(transaction: Transaction): string {
  return transaction.categoryName ?? TRANSACTION_KIND_LABELS[transaction.kind];
}

function invoice(transaction: Transaction): string | null {
  return transaction.cardId !== null && transaction.invoiceMonth !== null
    ? `fatura ${formatMonth(transaction.invoiceMonth)}`
    : null;
}

function Tags({ transaction }: { transaction: Transaction }) {
  return (
    <>
      {transaction.installmentNumber !== null && (
        <span className="text-muted ml-2 text-xs whitespace-nowrap">
          {transaction.installmentNumber}/{transaction.installmentCount}
        </span>
      )}
      {transaction.recurringId !== null && (
        <span className="bg-panel text-accent ml-2 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em]">
          FIXO
        </span>
      )}
    </>
  );
}

function Actions({
  transaction,
  onEdit,
}: {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        aria-label={`Editar ${transaction.description}`}
        onClick={() => onEdit(transaction)}
        className={iconButton}
      >
        <span aria-hidden className="icon text-[18px]">
          edit
        </span>
      </button>
      <DeleteButton
        label={transaction.description}
        confirmHint={
          transaction.purchaseId === null
            ? undefined
            : 'apaga todas as parcelas'
        }
        onDelete={() => deleteTransaction(transaction.id)}
      />
    </div>
  );
}

/** Em tabela quando o conteúdo tem largura (672 px ou mais); em cartões quando não tem. */
export function TransactionList({
  transactions,
  onEdit,
  categories,
}: TransactionListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selecting = categories !== undefined;
  // Só conta o que ainda está na lista: um item excluído ou filtrado sai da seleção.
  const selected = transactions.filter((transaction) =>
    selectedIds.has(transaction.id),
  );
  const candidates = transactions.filter(selectable).slice(0, MAX_RECATEGORIZE);
  const allChecked =
    candidates.length > 0 &&
    candidates.every((transaction) => selectedIds.has(transaction.id));

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_RECATEGORIZE) {
        next.add(id);
      }

      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(
      allChecked
        ? new Set()
        : new Set(candidates.map((transaction) => transaction.id)),
    );
  }

  return (
    <>
      {selecting && candidates.length > 0 && (
        <label className="text-secondary flex cursor-pointer items-center gap-2 self-start text-xs tracking-[0.1em]">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className={checkboxClass}
          />
          SELECIONAR{' '}
          {candidates.length === transactions.length
            ? 'TODOS'
            : 'TODAS AS DESPESAS E RECEITAS'}
          {candidates.length === MAX_RECATEGORIZE
            ? ` (ATÉ ${MAX_RECATEGORIZE})`
            : ''}
        </label>
      )}
      <table className="hidden w-full border-separate border-spacing-y-1 text-sm @2xl:table">
        <thead>
          <tr className="text-dim text-[10px] tracking-[0.2em]">
            {selecting && <th className="w-1" />}
            <th className="px-3 text-left font-normal">DATA</th>
            <th className="px-3 text-left font-normal">DESCRIÇÃO</th>
            <th className="px-3 text-left font-normal">CATEGORIA</th>
            <th className="px-3 text-left font-normal">CONTA</th>
            <th className="px-3 text-right font-normal">VALOR</th>
            <th className="w-1" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="bg-item">
              {selecting && (
                <td className="pl-3">
                  <Check
                    transaction={transaction}
                    checked={selectedIds.has(transaction.id)}
                    onToggle={toggle}
                  />
                </td>
              )}
              <td className="text-muted px-3 py-2">
                {formatDay(transaction.date)}
              </td>
              <td className="px-3">
                {transaction.description}
                <Tags transaction={transaction} />
              </td>
              <td className="text-secondary px-3">{category(transaction)}</td>
              <td className="text-secondary px-3">
                {origin(transaction)}
                {invoice(transaction) && (
                  <span className="text-dim ml-2 text-xs">
                    {invoice(transaction)}
                  </span>
                )}
              </td>
              <td className="px-3 text-right whitespace-nowrap">
                <Amount transaction={transaction} />
              </td>
              <td className="px-2">
                <Actions transaction={transaction} onEdit={onEdit} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-1 @2xl:hidden">
        {transactions.map((transaction) => (
          <li
            key={transaction.id}
            className={`bg-item flex items-center gap-2 py-2 pr-1 ${selecting ? 'pl-1' : 'pl-3'}`}
          >
            {selecting && (
              <Check
                transaction={transaction}
                checked={selectedIds.has(transaction.id)}
                onToggle={toggle}
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {transaction.description}
                  <Tags transaction={transaction} />
                </span>
                <span className="whitespace-nowrap">
                  <Amount transaction={transaction} />
                </span>
              </div>
              <span className="text-muted truncate text-xs">
                {[
                  formatDay(transaction.date),
                  category(transaction),
                  origin(transaction),
                  invoice(transaction),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
            <Actions transaction={transaction} onEdit={onEdit} />
          </li>
        ))}
      </ul>

      {selecting && (
        <RecategorizeBar
          selected={selected}
          categories={categories}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </>
  );
}
