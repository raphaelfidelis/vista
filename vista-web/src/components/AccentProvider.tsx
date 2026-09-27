'use client';

import {
  createContext,
  useContext,
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

  function selectAccent(value: string) {
    setAccent(value);
    setPreference(ACCENT_COOKIE, value);
  }

  return (
    <AccentContext value={{ accent, selectAccent }}>
      <div className="contents" style={{ '--accent': accent } as CSSProperties}>
        {children}
      </div>
    </AccentContext>
  );
}
