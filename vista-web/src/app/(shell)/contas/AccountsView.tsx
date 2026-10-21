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
import { Distribution } from '@/components/Distribution';
import { Drawer } from '@/components/Drawer';
import { ManageNamesDialog } from '@/components/ManageNamesDialog';
import { StatCard } from '@/components/StatCard';
import { TransactionForm } from '@/components/TransactionForm';
import { ACCOUNT_TYPE_LABELS, type Account, type Bank } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import {
  archiveAccount,
  createBank,
  deleteAccount,
  deleteBank,
  renameBank,
} from './actions';
import { AccountForm } from './AccountForm';
import { AdjustForm } from './AdjustForm';

type AccountsViewProps = {
  accounts: Account[];
  banks: Bank[];
  defaultDate: string;
};

/** O que está aberto na lateral. */
type Panel =
  | { kind: 'form'; account: Account | null }
  | { kind: 'adjust'; account: Account }
  | { kind: 'transfer'; account: Account }
  | { kind: 'banks' }
  | null;

function sum(accounts: Account[]): number {
  return accounts.reduce((total, account) => total + account.balanceInCents, 0);
}

type AccountRowProps = {
  account: Account;
  canTransfer: boolean;
  onOpen: (panel: Panel) => void;
};

function AccountRow({ account, canTransfer, onOpen }: AccountRowProps) {
  return (
    <li className="bg-item flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          href={`/contas/${account.id}`}
          className="hover:text-accent truncate text-sm"
        >
          {account.name}
        </Link>
        <span className="text-muted truncate text-[11px] tracking-[0.1em]">
          {ACCOUNT_TYPE_LABELS[account.type]}
          {account.bankName && ` · ${account.bankName}`}
        </span>
      </div>
      <span className="font-sans w-40 flex-none text-right text-base font-bold whitespace-nowrap">
        {formatCents(account.balanceInCents)}
      </span>
      <div className="flex flex-wrap items-center justify-end gap-1">
        {!account.archived && (
          <>
            <button
              type="button"
              onClick={() => onOpen({ kind: 'adjust', account })}
              className={secondaryButton}
            >
              AJUSTAR SALDO
            </button>
            {canTransfer && (
              <button
                type="button"
                onClick={() => onOpen({ kind: 'transfer', account })}
                className={secondaryButton}
              >
                <span aria-hidden className="icon text-[16px]">
                  swap_horiz
                </span>
                TRANSFERIR
              </button>
            )}
          </>
        )}
        <Link href={`/contas/${account.id}`} className={secondaryButton}>
          EXTRATO
        </Link>
        <button
          type="button"
          aria-label={`Editar ${account.name}`}
          onClick={() => onOpen({ kind: 'form', account })}
          className={iconButton}
        >
          <span aria-hidden className="icon text-[18px]">
            edit
          </span>
        </button>
        <ArchiveToggle
          label={account.name}
          archived={account.archived}
          onToggle={() => archiveAccount(account.id, !account.archived)}
        />
        <DeleteButton
          label={account.name}
          onDelete={() => deleteAccount(account.id)}
        />
      </div>
    </li>
  );
}

type AccountListProps = {
  title: string;
  accounts: Account[];
  canTransfer: boolean;
  onOpen: (panel: Panel) => void;
};

function AccountList({
  title,
  accounts,
  canTransfer,
  onOpen,
}: AccountListProps) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-dim text-[10px] tracking-[0.22em]">{title}</h2>
      <ul className="flex flex-col gap-1">
        {accounts.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            canTransfer={canTransfer}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </section>
  );
}

export function AccountsView({
  accounts,
  banks,
  defaultDate,
}: AccountsViewProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const active = accounts.filter((account) => !account.archived);
  const archived = accounts.filter((account) => account.archived);
  const daily = active.filter((account) => account.type !== 'RESERVE');
  const reserves = active.filter((account) => account.type === 'RESERVE');
  const canTransfer = active.length >= 2;

  // Reservas por banco: só saldos positivos entram na proporção.
  const reserveTotals = new Map<string, number>();

  for (const reserve of reserves) {
    if (reserve.balanceInCents > 0) {
      const key = reserve.bankName ?? 'Sem banco';

      reserveTotals.set(
        key,
        (reserveTotals.get(key) ?? 0) + reserve.balanceInCents,
      );
    }
  }

  const reserveTotal = [...reserveTotals.values()].reduce((a, b) => a + b, 0);
  const reserveGroups = [...reserveTotals]
    .map(([name, totalInCents]) => ({
      id: name,
      name,
      totalInCents,
      share: totalInCents / reserveTotal,
    }))
    .sort((a, b) => b.totalInCents - a.totalInCents);

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
            onClick={() => setPanel({ kind: 'form', account: null })}
            className={primaryButton}
          >
            <span aria-hidden className="icon text-[16px]">
              add
            </span>
            NOVA CONTA
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard label="DIA A DIA" value={formatCents(sum(daily))} />
        <StatCard label="RESERVAS" value={formatCents(sum(reserves))} />
        <StatCard label="TOTAL" value={formatCents(sum(active))} />
      </div>

      {accounts.length === 0 && (
        <p className="text-dim py-10 text-center text-xs tracking-[0.24em]">
          NENHUMA CONTA AINDA
        </p>
      )}

      <AccountList
        title="CONTAS"
        accounts={daily}
        canTransfer={canTransfer}
        onOpen={setPanel}
      />
      <AccountList
        title="RESERVAS"
        accounts={reserves}
        canTransfer={canTransfer}
        onOpen={setPanel}
      />

      {reserveGroups.length > 0 && (
        <div className="flex">
          <Distribution title="RESERVAS POR BANCO" groups={reserveGroups} />
        </div>
      )}

      {archived.length > 0 && (
        <details className="flex flex-col gap-2">
          <summary className="text-dim cursor-pointer text-[10px] tracking-[0.22em]">
            ARQUIVADAS ({archived.length})
          </summary>
          <div className="mt-2">
            <ul className="flex flex-col gap-1">
              {archived.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  canTransfer={false}
                  onOpen={setPanel}
                />
              ))}
            </ul>
          </div>
        </details>
      )}

      {panel?.kind === 'form' && (
        <Drawer
          title={panel.account ? 'EDITAR CONTA' : 'NOVA CONTA'}
          onClose={() => setPanel(null)}
        >
          <AccountForm
            account={panel.account}
            banks={banks}
            defaultDate={defaultDate}
            onSaved={() => setPanel(null)}
          />
        </Drawer>
      )}
      {panel?.kind === 'adjust' && (
        <Drawer title="AJUSTAR SALDO" onClose={() => setPanel(null)}>
          <AdjustForm
            account={panel.account}
            defaultDate={defaultDate}
            onSaved={() => setPanel(null)}
          />
        </Drawer>
      )}
      {panel?.kind === 'transfer' && (
        <Drawer title="TRANSFERIR" onClose={() => setPanel(null)}>
          <TransactionForm
            transaction={null}
            preset={{ kind: 'TRANSFER', accountId: panel.account.id }}
            categories={[]}
            accounts={accounts}
            cards={[]}
            defaultDate={defaultDate}
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
