'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { moduleIndex, modules } from '@/lib/modules';
import { NAV_COOKIE } from '@/lib/preferences';
import { setPreference } from '@/lib/preferences.client';

function blockLayout(collapsed: boolean): string {
  return collapsed ? 'justify-center gap-0 px-0' : 'gap-3 px-3';
}

type NavProps = {
  defaultCollapsed: boolean;
};

export function Nav({ defaultCollapsed }: NavProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const pathname = usePathname();

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    setPreference(NAV_COOKIE, next ? 'collapsed' : 'expanded');
  }

  return (
    <nav
      className={`bg-panel flex flex-none flex-col gap-2 overflow-hidden py-4.5 transition-[width,padding] duration-[220ms] ease-out ${
        collapsed ? 'w-nav-collapsed px-3.5' : 'w-nav px-4.5'
      }`}
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expandir menu' : 'Minimizar menu'}
        className={`bg-accent text-on-accent flex min-h-13 cursor-pointer items-center py-3.5 ${blockLayout(collapsed)}`}
      >
        <span aria-hidden className="icon flex-none text-[26px]">
          stacks
        </span>
        {!collapsed && (
          <>
            <span className="font-sans text-[26px] leading-none font-bold tracking-[-0.01em]">
              VISTA
            </span>
            <span
              aria-hidden
              className="ml-auto text-base leading-none font-bold"
            >
              «
            </span>
          </>
        )}
      </button>

      <span
        className={`text-dim px-0.5 pt-3 pb-1 text-[10px] tracking-[0.22em] whitespace-nowrap ${
          collapsed ? 'invisible' : ''
        }`}
      >
        MÓDULOS_ATIVOS
      </span>

      {modules.map((module, position) => {
        const active = pathname === module.href;

        return (
          <Link
            key={module.href}
            href={module.href}
            aria-label={module.name}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-12 items-center py-3.5 whitespace-nowrap ${blockLayout(collapsed)} ${
              active
                ? 'bg-accent text-on-accent font-bold'
                : 'bg-item text-secondary hover:bg-item-hover hover:text-primary'
            }`}
          >
            <span aria-hidden className="icon flex-none text-[22px]">
              {module.icon}
            </span>
            {!collapsed && (
              <>
                <span className="text-sm tracking-[0.06em]">{module.name}</span>
                <span
                  className={`ml-auto text-[10px] ${active ? '' : 'text-dim'}`}
                >
                  {moduleIndex(position)}
                </span>
              </>
            )}
          </Link>
        );
      })}

      <div className="flex-1" />

      {!collapsed && <ThemeSwitcher />}
    </nav>
  );
}
