'use client';

import { useState } from 'react';
import {
  iconButton,
  primaryButton,
  secondaryButton,
} from '@/components/buttons';
import { DeleteButton } from '@/components/DeleteButton';
import { Drawer } from '@/components/Drawer';
import type { Account, Card, Category, Recurring } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { deleteRecurring } from './actions';
import { RecurringForm } from './RecurringForm';

type RecurringDialogProps = {
  recurring: Recurring[];
  categories: Category[];
  accounts: Account[];
  cards: Card[];
  onClose: () => void;
};

/** Qual conteúdo o painel mostra: a lista ou o formulário (nulo = novo). */
type View = { kind: 'list' } | { kind: 'form'; item: Recurring | null };

function amountLabel(item: Recurring): string {
  if (item.amountInCents === null) {
    return 'VARIA';
  }

  return item.variableAmount
    ? `VARIA · ref. ${formatCents(item.amountInCents)}`
    : formatCents(item.amountInCents);
}

export function RecurringDialog({
  recurring,
  categories,
  accounts,
  cards,
  onClose,
}: RecurringDialogProps) {
  const [view, setView] = useState<View>({ kind: 'list' });
  const backToList = () => setView({ kind: 'list' });
  const canCreate =
    categories.length > 0 &&
    (accounts.some((account) => !account.archived) ||
      cards.some((card) => !card.archived));

  if (view.kind === 'form') {
    return (
      <Drawer
        title={view.item ? 'EDITAR GASTO FIXO' : 'NOVO GASTO FIXO'}
        onClose={onClose}
      >
        <button
          type="button"
          onClick={backToList}
          className="text-muted hover:text-primary flex w-fit cursor-pointer items-center gap-1 text-[11px] tracking-[0.1em]"
        >
          <span aria-hidden className="icon text-[16px]">
            chevron_left
          </span>
          VOLTAR
        </button>
        <RecurringForm
          item={view.item}
          categories={categories}
          accounts={accounts}
          cards={cards}
          onSaved={backToList}
        />
      </Drawer>
    );
  }

  return (
    <Drawer title="GASTOS FIXOS" onClose={onClose}>
      <button
        type="button"
        disabled={!canCreate}
        title={
          canCreate
            ? undefined
            : 'Crie uma conta (ou cartão) e uma categoria primeiro'
        }
        onClick={() => setView({ kind: 'form', item: null })}
        className={`${primaryButton} w-fit`}
      >
        <span aria-hidden className="icon text-[16px]">
          add
        </span>
        NOVO FIXO
      </button>
      {recurring.length === 0 ? (
        <p className="text-dim text-xs">Nenhum gasto fixo cadastrado.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {recurring.map((item) => (
            <li
              key={item.id}
              className={`bg-item flex items-center gap-2 p-2 pl-3 ${
                item.active ? '' : 'opacity-60'
              }`}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm">{item.description}</span>
                <span className="text-muted truncate text-[11px]">
                  {item.kind === 'INCOME' ? 'RECEITA' : 'DESPESA'} · DIA{' '}
                  {String(item.dueDay).padStart(2, '0')} · {item.categoryName} ·{' '}
                  {item.accountName ?? item.cardName} · {amountLabel(item)}
                  {!item.active && ' · INATIVO'}
                </span>
              </div>
              <button
                type="button"
                aria-label={`Editar ${item.description}`}
                onClick={() => setView({ kind: 'form', item })}
                className={iconButton}
              >
                <span aria-hidden className="icon text-[18px]">
                  edit
                </span>
              </button>
              <DeleteButton
                label={item.description}
                onDelete={() => deleteRecurring(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onClose} className={secondaryButton}>
        FECHAR
      </button>
    </Drawer>
  );
}
