'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type { CashFlowMonth } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { formatMonth } from '@/lib/month';

type CashFlowChartProps = {
  months: CashFlowMonth[];
};

type Point = {
  month: string;
  closing: number;
  income: number;
  expense: number;
};

// A superfície do painel e os cinzas do tema: o gráfico não herda CSS, então
// as cores entram aqui. A linha usa o destaque escolhido no seletor de tema.
const SURFACE = '#0a0a08';
const GRID = '#2a2a26';
const AXIS_TEXT = '#8a8a80';
const LINE = 'var(--accent)';

const compact = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

type EndLabelProps = {
  x?: number | string;
  y?: number | string;
  index?: number;
  value?: unknown;
};

/** Só o último ponto leva o valor: rótulo em todos viraria ruído; o resto vive no tooltip e na lista. */
function endLabel(lastIndex: number) {
  function EndLabel({ x, y, index, value }: EndLabelProps) {
    if (index !== lastIndex || x === undefined || y === undefined) {
      return null;
    }

    return (
      <text
        x={Number(x)}
        y={Number(y) - 14}
        textAnchor="end"
        fill="#ffffff"
        fontSize={12}
        fontWeight={700}
      >
        {formatCents(Number(value))}
      </text>
    );
  }

  return EndLabel;
}

/** Leitura ao passar o mouse: o valor manda, o nome do mês e as entradas e saídas vêm depois. */
function Readout({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as Point | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="bg-panel border-line flex flex-col gap-1 border px-3 py-2 text-xs">
      <span className="text-secondary">{formatMonth(point.month)}</span>
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-0.5 w-3"
          style={{ background: LINE }}
        />
        <strong className="text-primary text-sm">
          {formatCents(point.closing)}
        </strong>
        <span className="text-muted">saldo final</span>
      </span>
      <span className="text-muted">
        + {formatCents(point.income)} · − {formatCents(point.expense)}
      </span>
    </div>
  );
}

export function CashFlowChart({ months }: CashFlowChartProps) {
  const data: Point[] = months.map((month) => ({
    month: month.month,
    closing: month.closingInCents,
    income: month.incomeInCents,
    expense: month.expenseInCents,
  }));
  const last = data.at(-1);
  const summary = `Saldo do dia a dia ao fim de cada mês, de ${formatMonth(months[0]?.month ?? '')} a ${formatMonth(last?.month ?? '')}: termina em ${formatCents(last?.closing ?? 0)}.`;

  return (
    <div role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 28, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="month"
            tickFormatter={(value: string) => formatMonth(value).slice(0, 3)}
            stroke={GRID}
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            width={64}
            tickFormatter={(value: number) =>
              `R$ ${compact.format(value / 100)}`
            }
            stroke={GRID}
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine y={0} stroke={AXIS_TEXT} strokeOpacity={0.6} />
          <Tooltip
            content={Readout}
            cursor={{ stroke: AXIS_TEXT, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="closing"
            stroke={LINE}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={{ r: 4, fill: LINE, stroke: SURFACE, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: LINE, stroke: SURFACE, strokeWidth: 2 }}
            label={endLabel(data.length - 1)}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
