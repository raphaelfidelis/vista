import Link from 'next/link';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { ProgressBar, type ProgressTone } from '@/components/ProgressBar';
import { StatCard } from '@/components/StatCard';
import type { BudgetStatus, Insight, InsightKind } from '@/lib/finance';
import {
  getAccounts,
  getBudget,
  getCards,
  getCashFlow,
  getGoals,
  getInsights,
  getReport,
} from '@/lib/finance.api';
import { formatCents, formatShare, formatSignedCents } from '@/lib/money';
import { currentMonth, formatDay, formatMonth } from '@/lib/month';
import { CashFlowChart } from './CashFlowChart';
import { CashFlowList } from './CashFlowList';

const CASH_FLOW_MONTHS = 6;

const TONES: Record<BudgetStatus, ProgressTone> = {
  OK: 'accent',
  WARNING: 'warn',
  OVER: 'over',
};

const INSIGHT_ICONS: Record<InsightKind, string> = {
  OVERDUE_INVOICE: 'payments',
  SPIKE: 'arrow_upward',
  SUBSCRIPTION: 'event_repeat',
};

/** Para onde cada aviso leva: a fatura, ou os lançamentos do mês. */
function insightHref(insight: Insight, month: string): string {
  return insight.kind === 'OVERDUE_INVOICE' && insight.refId !== null
    ? `/cartoes/${insight.refId}`
    : `/lancamentos?mes=${month}`;
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-dim text-[10px] tracking-[0.22em]">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-muted hover:text-primary text-[10px] tracking-[0.15em]"
          >
            VER TUDO
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function OverviewPage() {
  const month = currentMonth();
  const [accounts, report, insights, cards, budget, goals, cashFlow] =
    await Promise.all([
      getAccounts(),
      getReport(month),
      getInsights(month),
      getCards(),
      getBudget(month),
      getGoals(),
      getCashFlow(CASH_FLOW_MONTHS),
    ]);
  const active = accounts.filter((account) => !account.archived);
  const sum = (kinds: (typeof accounts)[number]['type'][]) =>
    active
      .filter((account) => kinds.includes(account.type))
      .reduce((total, account) => total + account.balanceInCents, 0);
  const attention = budget.items.filter((item) => item.status !== 'OK');
  const activeCards = cards.filter((card) => !card.archived);

  return (
    <>
      <div className="flex flex-wrap gap-4">
        <StatCard
          label="DIA A DIA"
          value={formatCents(sum(['CHECKING', 'CASH']))}
          hint="contas correntes e dinheiro"
        />
        <StatCard label="RESERVAS" value={formatCents(sum(['RESERVE']))} />
        <StatCard
          label={`RECEITAS · ${formatMonth(month)}`}
          value={formatCents(report.incomeInCents)}
        />
        <StatCard
          label={`DESPESAS · ${formatMonth(month)}`}
          value={formatCents(report.expenseInCents)}
          hint="cartão pela fatura"
        />
        <StatCard
          label="RESULTADO DO MÊS"
          value={formatSignedCents(report.resultInCents)}
        />
      </div>

      <Section title="ALERTAS">
        {insights.alerts.length === 0 ? (
          <p className="text-muted bg-item p-3 text-xs">
            Nada fora do padrão neste mês.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {insights.alerts.map((alert) => (
              <li key={`${alert.kind}-${alert.title}`}>
                <Link
                  href={insightHref(alert, month)}
                  className="bg-item hover:bg-item-hover flex items-start gap-3 p-3"
                >
                  <span
                    aria-hidden
                    className={`icon mt-0.5 text-[18px] ${
                      alert.kind === 'OVERDUE_INVOICE'
                        ? 'text-over'
                        : alert.kind === 'SPIKE'
                          ? 'text-warn'
                          : 'text-accent'
                    }`}
                  >
                    {INSIGHT_ICONS[alert.kind]}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm">{alert.title}</span>
                    <span className="text-muted text-xs">{alert.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {activeCards.length > 0 && (
        <Section title="FATURAS" href="/cartoes">
          <ul className="flex flex-col gap-1">
            {activeCards.map((card) => {
              const invoice = card.currentInvoice;

              return (
                <li key={card.id}>
                  <Link
                    href={`/cartoes/${card.id}`}
                    className="bg-item hover:bg-item-hover flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{card.name}</span>
                    <span className="text-muted text-xs">
                      {formatMonth(invoice.month)} · vence{' '}
                      {formatDay(invoice.dueDate)}
                    </span>
                    <InvoiceStatusBadge status={invoice.status} />
                    <span className="w-28 text-right whitespace-nowrap">
                      {formatCents(invoice.totalInCents)}
                    </span>
                    <span className="text-muted w-36 text-right text-xs whitespace-nowrap">
                      {invoice.remainingInCents > 0
                        ? `restam ${formatCents(invoice.remainingInCents)}`
                        : ''}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {budget.items.length > 0 && (
        <Section title="ORÇAMENTO" href={`/orcamento?mes=${month}`}>
          {attention.length === 0 ? (
            <p className="text-muted bg-item p-3 text-xs">
              Todas as categorias estão dentro do limite.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {attention.map((item) => (
                <li
                  key={item.categoryId}
                  className="bg-item flex flex-col gap-2 p-3"
                >
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span>{item.categoryName}</span>
                    <span>
                      {formatCents(item.spentInCents)}
                      <span className="text-muted">
                        {' '}
                        de {formatCents(item.limitInCents)} ·{' '}
                        {formatShare(item.ratio)}
                      </span>
                    </span>
                  </div>
                  <ProgressBar
                    ratio={item.ratio}
                    tone={TONES[item.status]}
                    label={`Gasto de ${item.categoryName} sobre o limite`}
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {goals.length > 0 && (
        <Section title="METAS" href="/metas">
          <ul className="flex flex-col gap-1">
            {goals.map((goal) => (
              <li key={goal.id} className="bg-item flex flex-col gap-2 p-3">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span>{goal.name}</span>
                  <span>
                    {formatCents(goal.balanceInCents)}
                    <span className="text-muted">
                      {' '}
                      de {formatCents(goal.targetInCents)} ·{' '}
                      {formatShare(goal.progress)}
                    </span>
                  </span>
                </div>
                <ProgressBar
                  ratio={goal.progress}
                  label={`Progresso da meta ${goal.name}`}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`FLUXO DE CAIXA · PRÓXIMOS ${CASH_FLOW_MONTHS} MESES`}>
        <p className="text-dim text-[11px]">
          Saldo do dia a dia (contas correntes e dinheiro) ao fim de cada mês,
          somando o que está previsto: gastos e receitas fixos ainda não
          lançados e faturas dos cartões.
        </p>
        <CashFlowChart months={cashFlow.months} />
        <CashFlowList months={cashFlow.months} />
      </Section>
    </>
  );
}
