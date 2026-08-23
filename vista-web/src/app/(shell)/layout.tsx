import { cookies } from 'next/headers';
import { AccentProvider } from '@/components/AccentProvider';
import { Nav } from '@/components/Nav';
import { TopBar } from '@/components/TopBar';
import {
  ACCENT_COOKIE,
  NAV_COOKIE,
  readAccent,
  readCollapsed,
} from '@/lib/preferences';

export default async function ShellLayout({ children }: LayoutProps<'/'>) {
  const cookieStore = await cookies();

  return (
    <AccentProvider
      initialAccent={readAccent(cookieStore.get(ACCENT_COOKIE)?.value)}
    >
      <div className="flex h-screen">
        <Nav
          defaultCollapsed={readCollapsed(cookieStore.get(NAV_COOKIE)?.value)}
        />
        <div className="bg-app flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="bg-panel m-4.5 flex flex-1 items-center justify-center">
            {children}
          </main>
        </div>
      </div>
    </AccentProvider>
  );
}
