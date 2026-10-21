'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  iconButton,
  primaryButton,
  secondaryButton,
} from '@/components/buttons';
import { ArchiveToggle } from '@/components/ArchiveToggle';
import { DeleteButton } from '@/components/DeleteButton';
import { Drawer } from '@/components/Drawer';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { ManageNamesDialog } from '@/components/ManageNamesDialog';
import { StatCard } from '@/components/StatCard';
import type { Bank, Card } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { formatDay, formatMonth } from '@/lib/month';
import { createBank, deleteBank, renameBank } from '../contas/actions';
import { archiveCard, deleteCard } from './actions';
import { CardForm } from './CardForm';

type CardsViewProps = {
  cards: Card[];
  banks: Bank[];
};

/** O que está aberto na lateral. */
type Panel = { kind: 'form'; card: Card | null } | { kind: 'banks' } | null;

type CardRowProps = {
  card: Card;
  onEdit: (card: Card) => void;
};

function CardRow({ card, onEdit }: CardRowProps) {
  const { currentInvoice } = card;
  const ratio =
    card.limitInCents === null
      ? null
      : Math.min(1, Math.max(0, card.usedInCents / card.limitInCents));

  return (
    <li className="bg-item flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Link
            href={`/cartoes/${card.id}`}
            className="hover:text-accent font-sans truncate text-base font-bold"
          >
            {card.name}
          </Link>
          <span className="text-muted truncate text-[11px] tracking-[0.1em]">
            {card.bankName && `${card.bankName} · `}FECHA DIA{' '}
            {String(card.closingDay).padStart(2, '0')} · VENCE DIA{' '}
            {String(card.dueDay).padStart(2, '0')}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Link href={`/cartoes/${card.id}`} className={secondaryButton}>
            <span aria-hidden className="icon text-[16px]">
              payments
            </span>
            FATURA
          </Link>
          <button
            type="button"
            aria-label={`Editar ${card.name}`}
            onClick={() => onEdit(card)}
            className={iconButton}
          >
            <span aria-hidden className="icon text-[18px]">
              edit
            </span>
          </button>
          <ArchiveToggle
            label={card.name}
            archived={card.archived}
            onToggle={() => archiveCard(card.id, !card.archived)}
          />
          <DeleteButton
            label={card.name}
            onDelete={() => deleteCard(card.id)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {ratio !== null && (
          <div className="bg-panel h-1.5" aria-hidden>
            <div
              className="bg-accent h-full"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        )}
        <div className="text-secondary flex flex-wrap justify-between gap-2 text-xs">
          <span>USADO {formatCents(card.usedInCents)}</span>
          <span>
            {card.limitInCents === null || card.availableInCents === null
              ? 'SEM LIMITE'
              : `DISPONÍVEL ${formatCents(card.availableInCents)} DE ${formatCents(card.limitInCents)}`}
          </span>
        </div>
      </div>

      <div className="text-secondary flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-dim text-[10px] tracking-[0.2em]">
          FATURA {formatMonth(currentInvoice.month)}
        </span>
        <InvoiceStatusBadge status={currentInvoice.status} />
        <span>{formatCents(currentInvoice.totalInCents)}</span>
        {currentInvoice.remainingInCents > 0 && (
          <span className="text-muted">
            restam {formatCents(currentInvoice.remainingInCents)}
          </span>
        )}
        <span className="text-muted ml-auto">
          fecha {formatDay(currentInvoice.closingDate)} · vence{' '}
          {formatDay(currentInvoice.dueDate)}
        </span>
      </div>
    </li>
  );
}

export function CardsView({ cards, banks }: CardsViewProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const active = cards.filter((card) => !card.archived);
  const archived = cards.filter((card) => card.archived);
  const used = active.reduce((total, card) => total + card.usedInCents, 0);
  const withLimit = active.filter((card) => card.limitInCents !== null);
  const available = withLimit.reduce(
    (total, card) => total + (card.availableInCents ?? 0),
    0,
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel({ kind: 'banks' })}
            className={secondaryButton}
          >
            <span aria-hidden className="icon text-[16px]">
              tune
            </span>
            GERENCIAR BANCOS
          </button>
          <button
            type="button"
            onClick={() => setPanel({ kind: 'form', card: null })}
            className={primaryButton}
          >
            <span aria-hidden className="icon text-[16px]">
              add
            </span>
            NOVO CARTÃO
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard label="USADO NOS CARTÕES" value={formatCents(used)} />
        <StatCard
          label="DISPONÍVEL"
          value={formatCents(available)}
          hint={
            withLimit.length === active.length
              ? 'soma dos limites livres'
              : 'só dos cartões com limite'
          }
        />
      </div>

      {cards.length === 0 && (
        <p className="text-dim py-10 text-center text-xs tracking-[0.24em]">
          NENHUM CARTÃO AINDA
        </p>
      )}

      {active.length > 0 && (
        <ul className="flex flex-col gap-2">
          {active.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              onEdit={(item) => setPanel({ kind: 'form', card: item })}
            />
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <details>
          <summary className="text-dim cursor-pointer text-[10px] tracking-[0.22em]">
            ARQUIVADOS ({archived.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {archived.map((card) => (
              <CardRow
                key={card.id}
                card={card}
                onEdit={(item) => setPanel({ kind: 'form', card: item })}
              />
            ))}
          </ul>
        </details>
      )}

      {panel?.kind === 'form' && (
        <Drawer
          title={panel.card ? 'EDITAR CARTÃO' : 'NOVO CARTÃO'}
          onClose={() => setPanel(null)}
        >
          <CardForm
            card={panel.card}
            banks={banks}
            onSaved={() => setPanel(null)}
          />
        </Drawer>
      )}
      {panel?.kind === 'banks' && (
        <ManageNamesDialog
          title="BANCOS"
          noun="banco"
          items={banks}
          create={createBank}
          rename={renameBank}
          remove={deleteBank}
          onClose={() => setPanel(null)}
        />
      )}
    </>
  );
}
