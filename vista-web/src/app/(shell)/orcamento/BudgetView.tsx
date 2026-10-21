'use client';

import Link from 'next/link';
import { useState } from 'react';
import { iconButton, secondaryButton } from '@/components/buttons';
import { Drawer } from '@/components/Drawer';
import { ProgressBar, type ProgressTone } from '@/components/ProgressBar';
import { StatCard } from '@/components/StatCard';
import type { BudgetItem, BudgetStatus, MonthlyBudget } from '@/lib/finance';
import { formatCents, formatShare } from '@/lib/money';
import { formatMonth, shiftMonth } from '@/lib/month';
import { BudgetForm, type BudgetTarget } from './BudgetForm';

type BudgetViewProps = {
  budget: MonthlyBudget;
};

const TONES: Record<BudgetStatus, ProgressTone> = {
  OK: 'accent',
  WARNING: 'warn',
  OVER: 'over',
};

const STATUS_TEXT: Record<BudgetStatus, string> = {
  OK: 'text-secondary',
  WARNING: 'text-warn',
  OVER: 'text-over',
};

function monthHref(month: string): string {
  return `/orcamento?mes=${month}`;
}

function targetOf(item: BudgetItem): BudgetTarget {
  return {
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    defaultLimitInCents: item.defaultLimitInCents,
    limitInCents: item.limitInCents,
    isOverride: item.isOverride,
  };
}

export function BudgetView({ budget }: BudgetViewProps) {
  const [editing, setEditing] = useState<BudgetTarget | null>(null);
  const remaining = budget.totalLimitInCents - budget.totalSpentInCents;
  const over = budget.items.filter((item) => item.status === 'OVER').length;
  const spentRatio =
    budget.totalLimitInCents === 0
      ? null
      : budget.totalSpentInCents / budget.totalLimitInCents;
  const empty = budget.items.length === 0 && budget.unbudgeted.length === 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={monthHref(shiftMonth(budget.month, -1))}
          aria-label="Mês anterior"
          className={iconButton}
        >
          <span aria-hidden className="icon text-[20px]">
            chevron_left
          </span>
        </Link>
        <span className="font-sans w-28 text-center text-lg font-bold">
          {formatMonth(budget.month)}
        </span>
        <Link
          href={monthHref(shiftMonth(budget.month, 1))}
          aria-label="Próximo mês"
          className={iconButton}
        >
          <span aria-hidden className="icon text-[20px]">
            chevron_right
          </span>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard
          label="ORÇADO"
          value={formatCents(budget.totalLimitInCents)}
          hint="soma dos limites do mês"
        />
        <StatCard
          label="GASTO"
          value={formatCents(budget.totalSpentInCents)}
          hint={
            spentRatio === null
              ? 'nas categorias com limite'
              : `${formatShare(spentRatio)} do orçado · cartão pela fatura`
          }
        />
        <StatCard
          label="RESTANTE"
          value={formatCents(remaining)}
          hint={
            over > 0
              ? `${over} ${over === 1 ? 'categoria estourou' : 'categorias estouraram'}`
              : 'nenhuma categoria estourou'
          }
        />
      </div>

      {empty && (
        <p className="text-dim py-10 text-center text-xs tracking-[0.24em]">
          NENHUMA CATEGORIA DE DESPESA. CRIE EM LANÇAMENTOS.
        </p>
      )}

      {budget.items.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-dim text-[10px] tracking-[0.22em]">COM LIMITE</h2>
          <ul className="flex flex-col gap-1">
            {budget.items.map((item) => (
              <li
                key={item.categoryId}
                className="bg-item flex flex-col gap-2 p-3"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {item.categoryName}
                    {item.isOverride && (
                      <span className="bg-panel text-accent ml-2 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em]">
                        SÓ ESTE MÊS
                      </span>
                    )}
                  </span>
                  <span className="text-sm whitespace-nowrap">
                    {formatCents(item.spentInCents)}
                    <span className="text-muted">
                      {' '}
                      de {formatCents(item.limitInCents)}
                    </span>
                  </span>
                  <span
                    className={`w-40 text-right text-xs whitespace-nowrap ${STATUS_TEXT[item.status]}`}
                  >
                    {item.remainingInCents >= 0
                      ? `restam ${formatCents(item.remainingInCents)}`
                      : `estourou ${formatCents(-item.remainingInCents)}`}{' '}
                    · {formatShare(item.ratio)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Editar limite de ${item.categoryName}`}
                    onClick={() => setEditing(targetOf(item))}
                    className={iconButton}
                  >
                    <span aria-hidden className="icon text-[18px]">
                      edit
                    </span>
                  </button>
                </div>
                <ProgressBar
                  ratio={item.ratio}
                  tone={TONES[item.status]}
                  label={`Gasto de ${item.categoryName} sobre o limite`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {budget.unbudgeted.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-dim text-[10px] tracking-[0.22em]">
            SEM ORÇAMENTO
          </h2>
          <ul className="flex flex-col gap-1">
            {budget.unbudgeted.map((item) => (
              <li
                key={item.categoryId}
                className="bg-item flex flex-wrap items-center gap-x-4 gap-y-1 p-3"
              >
                <span className="min-w-0 flex-1 truncate text-sm">
                  {item.categoryName}
                </span>
                <span className="text-secondary text-sm whitespace-nowrap">
                  gastou {formatCents(item.spentInCents)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      categoryId: item.categoryId,
                      categoryName: item.categoryName,
                      defaultLimitInCents: null,
                      limitInCents: null,
                      isOverride: false,
                    })
                  }
                  className={secondaryButton}
                >
                  DEFINIR LIMITE
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <Drawer title="LIMITE DA CATEGORIA" onClose={() => setEditing(null)}>
          <BudgetForm
            target={editing}
            month={budget.month}
            onDone={() => setEditing(null)}
          />
        </Drawer>
      )}
    </>
  );
}
