import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="bg-item flex flex-1 flex-col gap-2 p-4">
      <span className="text-dim text-[10px] tracking-[0.22em]">{label}</span>
      <span className="font-sans text-2xl font-bold">{value}</span>
      {hint && <span className="text-muted text-[11px]">{hint}</span>}
    </div>
  );
}
