'use client';

import Link from 'next/link';
import { useState } from 'react';
import { iconButton, primaryButton } from '@/components/buttons';
import { DeleteButton } from '@/components/DeleteButton';
import { Drawer } from '@/components/Drawer';
import { ProgressBar } from '@/components/ProgressBar';
import { StatCard } from '@/components/StatCard';
import type { Account, Goal } from '@/lib/finance';
import { formatCents, formatShare } from '@/lib/money';
import { formatMonth } from '@/lib/month';
import { deleteGoal } from './actions';
import { GoalForm } from './GoalForm';

type GoalsViewProps = {
  goals: Goal[];
  accounts: Account[];
};

/** Meta e prazo numa linha: "faltam R$ X · R$ Y/mês", "prazo vencido" ou "sem prazo". */
function deadlineText(goal: Goal): string {
  if (goal.remainingInCents === 0) {
    return 'META ATINGIDA';
  }

  if (goal.deadline === null) {
    return `SEM PRAZO · FALTAM ${formatCents(goal.remainingInCents)}`;
  }

  if (goal.deadlinePassed) {
    return `PRAZO ${formatMonth(goal.deadline)} VENCIDO · FALTAM ${formatCents(goal.remainingInCents)}`;
  }

  return `ATÉ ${formatMonth(goal.deadline)} · FALTAM ${formatCents(goal.remainingInCents)} · ${formatCents(goal.monthlyNeededInCents ?? 0)}/MÊS`;
}

export function GoalsView({ goals, accounts }: GoalsViewProps) {
  // `null` = painel fechado; `{ goal: null }` = nova meta.
  const [editing, setEditing] = useState<{ goal: Goal | null } | null>(null);
  const takenAccounts = new Set(goals.map((goal) => goal.accountId));
  const reserves = accounts.filter((account) => account.type === 'RESERVE');
  const free = reserves.filter((account) => !takenAccounts.has(account.id));
  const saved = goals.reduce((total, goal) => total + goal.balanceInCents, 0);
  const target = goals.reduce((total, goal) => total + goal.targetInCents, 0);

  function formAccounts(goal: Goal | null): Account[] {
    return reserves.filter(
      (account) =>
        !takenAccounts.has(account.id) || account.id === goal?.accountId,
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="ml-auto">
          <button
            type="button"
            disabled={free.length === 0}
            title={
              free.length === 0
                ? 'Falta uma conta de reserva sem meta'
                : undefined
            }
            onClick={() => setEditing({ goal: null })}
            className={primaryButton}
          >
            <span aria-hidden className="icon text-[16px]">
              add
            </span>
            NOVA META
          </button>
        </div>
      </div>

      {reserves.length === 0 && (
        <p className="text-muted text-xs">
          Uma meta acompanha o saldo de uma conta de reserva. Crie uma em{' '}
          <Link href="/contas" className="text-accent underline">
            CONTAS
          </Link>
          .
        </p>
      )}
      {reserves.length > 0 && free.length === 0 && goals.length > 0 && (
        <p className="text-muted text-xs">
          Todas as contas de reserva já têm meta. Cada conta tem uma só.
        </p>
      )}

      {goals.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <StatCard label="GUARDADO NAS METAS" value={formatCents(saved)} />
          <StatCard label="ALVO TOTAL" value={formatCents(target)} />
        </div>
      )}

      {goals.length === 0 && (
        <p className="text-dim py-10 text-center text-xs tracking-[0.24em]">
          NENHUMA META AINDA
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {goals.map((goal) => (
          <li key={goal.id} className="bg-item flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-sans truncate text-base font-bold">
                  {goal.name}
                </span>
                <span className="text-muted truncate text-[11px] tracking-[0.1em]">
                  {goal.accountName}
                </span>
              </div>
              <span className="text-sm whitespace-nowrap">
                {formatCents(goal.balanceInCents)}
                <span className="text-muted">
                  {' '}
                  de {formatCents(goal.targetInCents)} ·{' '}
                  {formatShare(goal.progress)}
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Editar ${goal.name}`}
                  onClick={() => setEditing({ goal })}
                  className={iconButton}
                >
                  <span aria-hidden className="icon text-[18px]">
                    edit
                  </span>
                </button>
                <DeleteButton
                  label={goal.name}
                  onDelete={() => deleteGoal(goal.id)}
                />
              </div>
            </div>
            <ProgressBar
              ratio={goal.progress}
              label={`Progresso da meta ${goal.name}`}
            />
            <span
              className={`text-[11px] tracking-[0.1em] ${
                goal.remainingInCents === 0
                  ? 'text-accent'
                  : goal.deadlinePassed
                    ? 'text-over'
                    : 'text-secondary'
              }`}
            >
              {deadlineText(goal)}
            </span>
          </li>
        ))}
      </ul>

      {editing && (
        <Drawer
          title={editing.goal ? 'EDITAR META' : 'NOVA META'}
          onClose={() => setEditing(null)}
        >
          <GoalForm
            goal={editing.goal}
            accounts={formAccounts(editing.goal)}
            onSaved={() => setEditing(null)}
          />
        </Drawer>
      )}
    </>
  );
}
