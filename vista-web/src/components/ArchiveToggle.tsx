'use client';

import { useState, useTransition } from 'react';
import { iconButton } from '@/components/buttons';
import type { FormState } from '@/lib/form';

type ArchiveToggleProps = {
  /** Nome do item, para leitores de tela. */
  label: string;
  archived: boolean;
  onToggle: () => Promise<FormState>;
};

/** Arquiva ou desarquiva com um clique; a mensagem de erro, se houver, aparece embaixo. */
export function ArchiveToggle({
  label,
  archived,
  onToggle,
}: ArchiveToggleProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const verb = archived ? 'Desarquivar' : 'Arquivar';

  return (
    <>
      <button
        type="button"
        disabled={pending}
        aria-label={`${verb} ${label}`}
        title={verb}
        onClick={() =>
          startTransition(async () => {
            const result = await onToggle();

            setError(result.error);
          })
        }
        className={iconButton}
      >
        <span aria-hidden className="icon text-[18px]">
          {archived ? 'unarchive' : 'archive'}
        </span>
      </button>
      {error && (
        <p role="alert" className="text-accent basis-full text-right text-xs">
          {error}
        </p>
      )}
    </>
  );
}
