'use client';

import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { Weather } from '@/components/Weather';
import { findActiveModule } from '@/lib/modules';

const MINUTE_MS = 60_000;

const formatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function format(timestamp: number): string {
  const parts = formatter.formatToParts(new Date(timestamp));
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  const month = read('month').replace('.', '').toUpperCase();

  return `${read('day')} ${month} ${read('year')} · ${read('hour')}:${read('minute')}`;
}

function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, MINUTE_MS);

  return () => clearInterval(id);
}
const getSnapshot = () => Math.floor(Date.now() / MINUTE_MS);

const getServerSnapshot = () => null;

function Clock() {
  const minute = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <span className="text-muted text-[11px] tracking-[0.1em]">
      {minute === null ? '' : format(minute * MINUTE_MS)}
    </span>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const active = findActiveModule(pathname);

  return (
    <header className="border-line flex h-16 flex-none items-center gap-4 border-b px-6">
      {active && (
        <>
          <span aria-hidden className="icon text-accent text-[22px]">
            {active.icon}
          </span>
          <span className="font-sans text-base font-bold tracking-[0.03em]">
            {active.name}
          </span>
          <span className="text-dim text-[11px] tracking-[0.12em]">
            / {active.description}
          </span>
        </>
      )}
      <div className="ml-auto flex items-center gap-4">
        <Weather />
        <Clock />
      </div>
    </header>
  );
}
