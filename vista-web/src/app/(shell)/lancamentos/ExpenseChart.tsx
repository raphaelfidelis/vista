'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryBreakdown } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { formatMonth } from '@/lib/month';

const ROW_HEIGHT = 56;
const CHROME_HEIGHT = 72;

const compact = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

type ExpenseChartProps = {
  month: string;
  previousMonth: string;
  categories: CategoryBreakdown[];
};

/** Mês atual × anterior por categoria. Valores em centavos; a formatação é só de exibição. */
export function ExpenseChart({
  month,
  previousMonth,
  categories,
}: ExpenseChartProps) {
  const current = formatMonth(month);
  const previous = formatMonth(previousMonth);
  const data = categories.map((category) => ({
    name: category.categoryName,
    [current]: category.totalInCents,
    [previous]: category.previousTotalInCents,
  }));

  return (
    <div
      role="img"
      aria-label={`Gastos por categoria: ${current} contra ${previous}`}
    >
      <ResponsiveContainer
        width="100%"
        height={categories.length * ROW_HEIGHT + CHROME_HEIGHT}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
          barGap={2}
        >
          <CartesianGrid horizontal={false} stroke="#2a2a26" />
          <XAxis
            type="number"
            tickFormatter={(value: number) =>
              `R$ ${compact.format(value / 100)}`
            }
            stroke="#57574f"
            tick={{ fill: '#8a8a80', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            stroke="#57574f"
            tick={{ fill: '#b9b9b1', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: '#161613' }}
            formatter={(value) => formatCents(Number(value))}
            contentStyle={{
              background: '#0a0a08',
              border: '1px solid #2a2a26',
              borderRadius: 0,
              fontSize: 12,
            }}
            itemStyle={{ color: '#ffffff' }}
            labelStyle={{ color: '#b9b9b1' }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#b9b9b1' }} />
          <Bar
            dataKey={current}
            fill="var(--accent)"
            isAnimationActive={false}
          />
          <Bar dataKey={previous} fill="#8a8a80" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
