import { formatCents, formatShare } from '@/lib/money';

export type DistributionGroup = {
  id: string;
  name: string;
  totalInCents: number;
  /** Participação no total, de 0 a 1. */
  share: number;
};

type DistributionProps = {
  title: string;
  groups: DistributionGroup[];
};

/** Partes de um único total: barra proporcional em CSS, sem biblioteca de gráfico. */
export function Distribution({ title, groups }: DistributionProps) {
  return (
    <section className="flex min-w-72 flex-1 flex-col gap-2">
      <h2 className="text-dim text-[10px] tracking-[0.22em]">{title}</h2>
      <ul className="flex flex-col gap-1">
        {groups.map((group) => (
          <li key={group.id} className="bg-item flex flex-col gap-2 p-3">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{group.name}</span>
              <span className="flex-none">
                {formatCents(group.totalInCents)}
                <span className="text-muted ml-2 text-xs">
                  {formatShare(group.share)}
                </span>
              </span>
            </div>
            <div className="bg-panel h-1.5" aria-hidden>
              <div
                className="bg-accent h-full"
                style={{ width: `${group.share * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
