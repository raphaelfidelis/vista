import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { AccentProvider } from '@/components/AccentProvider';
import { BottomBar } from '@/components/BottomBar';
import { Nav } from '@/components/Nav';
import { TopBar } from '@/components/TopBar';
import { getMe } from '@/lib/auth.api';
import {
  ACCENT_COOKIE,
  NAV_COOKIE,
  readAccent,
  readCollapsed,
} from '@/lib/preferences';

export default async function ShellLayout({ children }: LayoutProps<'/'>) {
  // Também valida a sessão: vencida, a API responde 401 e vai para /entrar.
  const [cookieStore, user] = await Promise.all([cookies(), getMe()]);

  return (
    <AccentProvider
      initialAccent={readAccent(cookieStore.get(ACCENT_COOKIE)?.value)}
    >
      <div className="flex h-dvh">
        <Nav
          defaultCollapsed={readCollapsed(cookieStore.get(NAV_COOKIE)?.value)}
        />
        <div className="bg-app flex min-w-0 flex-1 flex-col">
          <TopBar userName={user.name} />
          <main className="bg-panel flex min-h-0 flex-1 flex-col overflow-y-auto md:m-4.5">
            {/* No celular, espaço para a barra inferior não cobrir o fim da tela. */}
            <div className="@container flex flex-1 flex-col gap-6 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-6">
              {children}
            </div>
          </main>
        </div>
        {/* useSearchParams pede um Suspense acima. */}
        <Suspense>
          <BottomBar />
        </Suspense>
      </div>
    </AccentProvider>
  );
}
