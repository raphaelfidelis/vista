'use client';

import { useState, useTransition } from 'react';
import { primaryButton, secondaryButton } from '@/components/buttons';
import type { Recurring, Transaction } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { formatMonth } from '@/lib/month';
import { launchRecurring } from './actions';

type RecurringChecklistProps = {
  month: string;
  recurring: Recurring[];
  /** Lançamentos do mês: deles vem o valor lançado, quando aparece na lista. */
  transactions: Transaction[];
  /** Gastos fixos com lançamento de data neste mês (inclui os no cartão, que contam na fatura seguinte). */
  launchedIds: string[];
  /** Fixo pendente de valor: quem abre o formulário preenchido é a tela. */
  onFill: (item: Recurring) => void;
};

type RowProps = {
  month: string;
  item: Recurring;
  /** O lançamento, quando ele conta neste mês. */
  launched: Transaction | undefined;
  done: boolean;
  onFill: (item: Recurring) => void;
};

function Row({ month, item, launched, done, onFill }: RowProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Valor fixo lança direto; valor variável (ou sem valor) passa pelo formulário.
  const oneClick = !item.variableAmount && item.amountInCents !== null;

  function launch() {
    startTransition(async () => {
      const result = await launchRecurring(item.id, month);

      setError(result.error);
    });
  }

  return (
    <li className="bg-item flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
      <span className="text-muted w-12 flex-none text-xs">
        DIA {String(item.dueDay).padStart(2, '0')}
      </span>
      <span className="min-w-0 flex-1 truncate">
        {item.description}
        {item.kind === 'INCOME' && (
          <span className="bg-panel text-accent ml-2 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em]">
            RECEITA
          </span>
        )}
      </span>
      <span className="text-secondary hidden flex-none sm:inline">
        {item.categoryName} · {item.accountName ?? item.cardName}
      </span>
      <span className="w-52 flex-none text-right whitespace-nowrap">
        {launched ? (
          formatCents(launched.amountInCents)
        ) : done ? (
          <span className="text-muted">NA FATURA</span>
        ) : item.variableAmount ? (
          <span className="text-muted">
            VARIA
            {item.amountInCents !== null &&
              ` · ref. ${formatCents(item.amountInCents)}`}
          </span>
        ) : (
          formatCents(item.amountInCents ?? 0)
        )}
      </span>
      <span className="flex w-36 flex-none justify-end">
        {done ? (
          <span className="text-accent flex items-center gap-1 text-[11px] font-bold tracking-[0.1em]">
            <span aria-hidden className="icon text-[16px]">
              check
            </span>
            LANÇADO
          </span>
        ) : oneClick ? (
          <button
            type="button"
            disabled={pending}
            onClick={launch}
            className={primaryButton}
          >
            {pending ? 'LANÇANDO…' : 'LANÇAR'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFill(item)}
            className={secondaryButton}
          >
            INFORMAR VALOR
          </button>
        )}
      </span>
      {error && (
        <p role="alert" className="text-accent basis-full text-right text-xs">
          {error}
        </p>
      )}
    </li>
  );
}

/** Gastos e receitas fixos ativos do mês e o que falta lançar de cada um. */
export function RecurringChecklist({
  month,
  recurring,
  transactions,
  launchedIds,
  onFill,
}: RecurringChecklistProps) {
  const active = recurring.filter((item) => item.active);

  if (active.length === 0) {
    return null;
  }

  const launchedBy = new Map<string, Transaction>();

  for (const transaction of transactions) {
    if (transaction.recurringId !== null) {
      launchedBy.set(transaction.recurringId, transaction);
    }
  }

  const isDone = (item: Recurring) =>
    launchedBy.has(item.id) || launchedIds.includes(item.id);
  const done = active.filter(isDone).length;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-dim text-[10px] tracking-[0.22em]">
        FIXOS DE {formatMonth(month)} · {done}/{active.length} LANÇADOS
      </h2>
      <ul className="flex flex-col gap-1">
        {active.map((item) => (
          <Row
            key={item.id}
            month={month}
            item={item}
            launched={launchedBy.get(item.id)}
            done={isDone(item)}
            onFill={onFill}
          />
        ))}
      </ul>
    </section>
  );
}
