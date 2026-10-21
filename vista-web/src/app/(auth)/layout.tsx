import type { CSSProperties } from 'react';
import { cookies } from 'next/headers';
import { BRAND_ICON } from '@/lib/icons';
import { ACCENT_COOKIE, readAccent } from '@/lib/preferences';

/** Entrar e criar conta: um painel no meio da tela, com a cor de destaque escolhida. */
export default async function AuthLayout({ children }: LayoutProps<'/'>) {
  const accent = readAccent((await cookies()).get(ACCENT_COOKIE)?.value);

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ '--accent': accent } as CSSProperties}
    >
      <div className="bg-panel flex w-full max-w-sm flex-col gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span aria-hidden className="icon text-accent text-[26px]">
            {BRAND_ICON}
          </span>
          <span className="font-sans text-lg font-bold tracking-[0.2em]">
            VISTA
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}
