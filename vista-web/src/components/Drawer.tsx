'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { iconButton } from '@/components/buttons';

type DrawerProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Painel lateral sobre um `<dialog>` nativo, que já cuida de foco preso, `Esc`
 * e backdrop. Existe só enquanto aberto: quem o usa o desmonta ao fechar, e o
 * formulário de dentro nasce limpo a cada abertura.
 */
export function Drawer({ title, onClose, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
      // O autofocus do React roda antes de o diálogo existir na tela.
      dialog
        .querySelector<HTMLElement>(
          'input:not([type=hidden]), select, textarea',
        )
        ?.focus();
    }
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // Clique no backdrop chega com o próprio <dialog> como alvo.
        if (event.target === ref.current) {
          onClose();
        }
      }}
      className="bg-panel text-primary fixed inset-0 m-0 h-dvh max-h-none w-full max-w-full p-0 backdrop:bg-black/60 md:right-0 md:left-auto md:w-md"
    >
      <div className="flex h-full flex-col gap-6 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-base font-bold tracking-[0.03em]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className={iconButton}
          >
            <span aria-hidden className="icon text-[18px]">
              close
            </span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
