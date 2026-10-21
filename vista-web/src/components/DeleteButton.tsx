'use client';

import { useState, useTransition } from 'react';
import { iconButton } from '@/components/buttons';
import type { FormState } from '@/lib/form';

type DeleteButtonProps = {
  /** Descreve o item para leitores de tela: "Excluir <label>". */
  label: string;
  onDelete: () => Promise<FormState>;
  /** Aviso mostrado enquanto pede a confirmação (ex.: "apaga todas as parcelas"). */
  confirmHint?: string;
};

/** Exclusão em dois cliques, no próprio lugar: sem modal para algo que um clique desfaz. */
export function DeleteButton({
  label,
  onDelete,
  confirmHint,
}: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await onDelete();

      setError(result.error);
      setConfirming(result.error !== null);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={`Excluir ${label}`}
        onClick={() => setConfirming(true)}
        className={iconButton}
      >
        <span aria-hidden className="icon text-[18px]">
          delete
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-x-2 text-[11px] font-bold tracking-[0.08em]">
        <span className="text-secondary">CONFIRMAR?</span>
        {confirmHint && (
          <span className="text-muted font-normal">{confirmHint}</span>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={confirm}
          className="text-accent cursor-pointer p-2 disabled:opacity-40 md:p-0"
        >
          SIM
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="text-muted hover:text-primary cursor-pointer p-2 disabled:opacity-40 md:p-0"
        >
          NÃO
        </button>
      </div>
      {error && (
        <p role="alert" className="text-accent max-w-64 text-right text-[11px]">
          {error}
        </p>
      )}
    </div>
  );
}
