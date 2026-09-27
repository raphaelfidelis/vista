'use client';

import { ErrorState } from '@/components/ErrorState';

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * O `(shell)/error.tsx` não cobre o layout do próprio segmento — um erro no
 * menu ou na top bar sobe até aqui. Sem este arquivo, a aplicação ficaria em
 * branco.
 */
export default function RootError({ error, retry }: ErrorProps) {
  return (
    <main className="flex flex-1 items-center justify-center">
      <ErrorState
        title="FALHA AO CARREGAR O VISTA"
        message={error.message}
        onRetry={retry}
      />
    </main>
  );
}
