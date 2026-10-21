'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Drawer } from '@/components/Drawer';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { isActiveModule, modules } from '@/lib/modules';

/** Os três que ficam à mão; o resto vai no MAIS. */
const PRIMARY = ['/visao-geral', '/lancamentos', '/cartoes'];
const ACCOUNT_PATH = '/minha-conta';

const SHORT_NAMES: Record<string, string> = {
  '/visao-geral': 'GERAL',
  '/lancamentos': 'LANÇAM.',
  '/cartoes': 'CARTÕES',
};

const itemClass =
  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] tracking-[0.08em]';

/**
 * Navegação do celular: fixa embaixo, com o + no meio para lançar na hora do
 * gasto, de qualquer tela. No computador quem navega é o menu lateral.
 */
export function BottomBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = modules.filter((module) => PRIMARY.includes(module.href));
  const more = modules.filter((module) => !PRIMARY.includes(module.href));
  const moreActive =
    pathname === ACCOUNT_PATH ||
    more.some((module) => isActiveModule(pathname, module.href));
  // Na lista de um mês, o novo lançamento nasce naquele mês.
  const month = pathname === '/lancamentos' ? searchParams.get('mes') : null;
  const newHref = `/lancamentos?${month ? `mes=${month}&` : ''}novo=1`;

  function item(href: string, icon: string, label: string) {
    const active = isActiveModule(pathname, href);

    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`${itemClass} ${active ? 'text-accent font-bold' : 'text-secondary'}`}
      >
        <span aria-hidden className="icon text-[22px]">
          {icon}
        </span>
        {label}
      </Link>
    );
  }

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="bg-panel border-line fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {primary
          .slice(0, 2)
          .map((module) =>
            item(
              module.href,
              module.icon,
              SHORT_NAMES[module.href] ?? module.name,
            ),
          )}
        <Link
          href={newHref}
          aria-label="Novo lançamento"
          className="flex items-center justify-center"
        >
          <span className="bg-accent text-on-accent flex size-12 items-center justify-center">
            <span aria-hidden className="icon text-[28px]">
              add
            </span>
          </span>
        </Link>
        {primary
          .slice(2)
          .map((module) =>
            item(
              module.href,
              module.icon,
              SHORT_NAMES[module.href] ?? module.name,
            ),
          )}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          className={`${itemClass} cursor-pointer ${moreActive ? 'text-accent font-bold' : 'text-secondary'}`}
        >
          <span aria-hidden className="icon text-[22px]">
            more_horiz
          </span>
          MAIS
        </button>
      </nav>

      {moreOpen && (
        <Drawer title="MAIS" onClose={() => setMoreOpen(false)}>
          <ul className="flex flex-col gap-1">
            {[
              ...more.map((module) => ({
                href: module.href,
                icon: module.icon,
                name: module.name,
              })),
              { href: ACCOUNT_PATH, icon: 'person', name: 'MINHA CONTA' },
            ].map((link) => {
              const active =
                link.href === ACCOUNT_PATH
                  ? pathname === ACCOUNT_PATH
                  : isActiveModule(pathname, link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-12 items-center gap-3 px-3 text-sm tracking-[0.06em] ${
                      active
                        ? 'bg-accent text-on-accent font-bold'
                        : 'bg-item text-secondary'
                    }`}
                  >
                    <span aria-hidden className="icon text-[22px]">
                      {link.icon}
                    </span>
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ThemeSwitcher />
        </Drawer>
      )}
    </>
  );
}
