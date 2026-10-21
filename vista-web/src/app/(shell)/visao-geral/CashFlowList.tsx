import type { CashFlowMonth } from '@/lib/finance';
import { formatCents, formatSignedCents } from '@/lib/money';
import { formatMonth } from '@/lib/month';

type CashFlowListProps = {
  months: CashFlowMonth[];
};

/**
 * Mês a mês, em texto: é a versão em tabela do gráfico (cada valor dele está
 * aqui) e, aberta, mostra de onde vem cada entrada e saída prevista.
 */
export function CashFlowList({ months }: CashFlowListProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-dim grid grid-cols-[1fr_auto] gap-3 px-3 text-[10px] tracking-[0.2em] @2xl:grid-cols-[1fr_repeat(3,minmax(0,8rem))]">
        <span>MÊS</span>
        <span className="hidden text-right @2xl:inline">ENTRADAS</span>
        <span className="hidden text-right @2xl:inline">SAÍDAS</span>
        <span className="text-right">SALDO FINAL</span>
      </div>
      {months.map((month) => (
        <details key={month.month} className="bg-item group">
          <summary className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 p-3 text-sm marker:content-none @2xl:grid-cols-[1fr_repeat(3,minmax(0,8rem))]">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="icon text-muted text-[16px] transition-transform group-open:rotate-90"
              >
                chevron_right
              </span>
              {formatMonth(month.month)}
            </span>
            <span className="hidden text-right @2xl:inline">
              {formatCents(month.incomeInCents)}
            </span>
            <span className="hidden text-right @2xl:inline">
              {formatCents(month.expenseInCents)}
            </span>
            <span className="text-right font-bold">
              {formatCents(month.closingInCents)}
            </span>
          </summary>
          <div className="flex flex-col gap-1 px-3 pb-3 text-xs @2xl:pl-9">
            <span className="text-muted">
              Saldo no início do mês: {formatCents(month.openingInCents)}
            </span>
            <span className="text-muted @2xl:hidden">
              Entradas {formatCents(month.incomeInCents)} · saídas{' '}
              {formatCents(month.expenseInCents)}
            </span>
            {month.items.length === 0 ? (
              <span className="text-dim">Nada previsto.</span>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {month.items.map((item) => (
                  <li
                    key={`${item.kind}-${item.description}`}
                    className="flex justify-between gap-4"
                  >
                    <span className="text-secondary">
                      {item.description}
                      {item.estimated && (
                        <span className="text-dim"> · estimado</span>
                      )}
                    </span>
                    <span
                      className={
                        item.kind === 'INCOME' ? 'text-accent' : undefined
                      }
                    >
                      {formatSignedCents(
                        item.kind === 'INCOME'
                          ? item.amountInCents
                          : -item.amountInCents,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
