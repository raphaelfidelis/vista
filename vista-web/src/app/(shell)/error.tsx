'use client';

import { ErrorState } from '@/components/ErrorState';

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/** Erro na página do módulo: o menu e a top bar continuam de pé. */
export default function ShellError({ error, retry }: ErrorProps) {
  return (
    <ErrorState
      title="FALHA AO CARREGAR O MÓDULO"
      message={error.message}
      onRetry={retry}
    />
  );
}
