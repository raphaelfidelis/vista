'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ACCENT_COOKIE } from '@/lib/preferences';
import { setPreference } from '@/lib/preferences.client';

type AccentContextValue = {
  accent: string;
  selectAccent: (accent: string) => void;
};

const AccentContext = createContext<AccentContextValue | null>(null);

export function useAccent(): AccentContextValue {
  const value = useContext(AccentContext);

  if (value === null) {
    throw new Error('useAccent precisa estar dentro de <AccentProvider>');
  }

  return value;
}

type AccentProviderProps = {
  initialAccent: string;
  children: ReactNode;
};

export function AccentProvider({
  initialAccent,
  children,
}: AccentProviderProps) {
  const [accent, setAccent] = useState(initialAccent);

  const selectAccent = useCallback((value: string) => {
    setAccent(value);
    setPreference(ACCENT_COOKIE, value);
  }, []);

  const value = useMemo(
    () => ({ accent, selectAccent }),
    [accent, selectAccent],
  );

  return (
    <AccentContext value={value}>
      <div className="contents" style={{ '--accent': accent } as CSSProperties}>
        {children}
      </div>
    </AccentContext>
  );
}
