'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
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
    <span className="text-muted hidden text-[11px] tracking-[0.1em] sm:inline">
      {minute === null ? '' : format(minute * MINUTE_MS)}
    </span>
  );
}

type TopBarProps = {
  userName: string;
};

const ACCOUNT_PATH = '/minha-conta';

export function TopBar({ userName }: TopBarProps) {
  const pathname = usePathname();
  const active = findActiveModule(pathname);
  const onAccount = pathname === ACCOUNT_PATH;

  return (
    <header className="border-line flex h-14 flex-none items-center gap-3 border-b px-4 md:h-16 md:gap-4 md:px-6">
      {active && (
        <>
          <span aria-hidden className="icon text-accent text-[22px]">
            {active.icon}
          </span>
          <span className="truncate font-sans text-base font-bold tracking-[0.03em]">
            {active.name}
          </span>
          <span className="text-dim hidden text-[11px] tracking-[0.12em] md:inline">
            / {active.description}
          </span>
        </>
      )}
      {onAccount && (
        <span className="font-sans text-base font-bold tracking-[0.03em]">
          MINHA CONTA
        </span>
      )}
      <div className="ml-auto flex items-center gap-4">
        <Clock />
        <Link
          href={ACCOUNT_PATH}
          aria-current={onAccount ? 'page' : undefined}
          className="text-secondary hover:text-primary flex max-w-32 min-w-0 items-center gap-1.5 text-[11px] tracking-[0.1em] md:max-w-48"
        >
          <span aria-hidden className="icon text-[18px]">
            person
          </span>
          <span className="truncate">{userName}</span>
        </Link>
      </div>
    </header>
  );
}
