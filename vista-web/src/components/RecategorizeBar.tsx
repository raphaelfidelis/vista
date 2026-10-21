'use client';

import { useActionState, useState } from 'react';
import { primaryButton, secondaryButton } from '@/components/buttons';
import { Drawer } from '@/components/Drawer';
import { Field, fieldClass, FormError } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import type { Category, Transaction } from '@/lib/finance';
import { initialFormState, type FormState } from '@/lib/form';
import { recategorizeTransactions } from '@/lib/transaction.actions';

type RecategorizeBarProps = {
  selected: Transaction[];
  categories: Category[];
  onClear: () => void;
};

/**
 * Barra fixa embaixo enquanto há seleção: quantos estão marcados, MUDAR
 * CATEGORIA e CANCELAR. No celular fica acima da barra de navegação.
 */
export function RecategorizeBar({
  selected,
  categories,
  onClear,
}: RecategorizeBarProps) {
  const [open, setOpen] = useState(false);
  const kinds = new Set(selected.map((transaction) => transaction.kind));
  const mixed = kinds.size > 1;
  const kind = selected[0]?.kind;
  const options = categories.filter((category) => category.kind === kind);
  const hasInstallment = selected.some(
    (transaction) => transaction.purchaseId !== null,
  );
  const [state, action] = useActionState(
    async (_: FormState, formData: FormData) => {
      const categoryId = formData.get('categoryId');
      const result = await recategorizeTransactions(
        selected.map((transaction) => transaction.id),
        typeof categoryId === 'string' ? categoryId : '',
      );

      if (result.error === null) {
        setOpen(false);
        onClear();
      }

      return result;
    },
    initialFormState,
  );

  if (selected.length === 0) {
    return null;
  }

  return (
    <>
      <div
        role="region"
        aria-label="Lançamentos selecionados"
        className="bg-panel border-line fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap items-center gap-2 border-t px-4 py-3 md:right-8 md:bottom-6 md:left-auto md:border"
      >
        <span className="text-secondary mr-auto text-xs tracking-[0.1em]">
          {selected.length} SELECIONADO{selected.length === 1 ? '' : 'S'}
        </span>
        <button type="button" onClick={onClear} className={secondaryButton}>
          CANCELAR
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={mixed}
          title={mixed ? 'Selecione só despesas ou só receitas' : undefined}
          className={primaryButton}
        >
          MUDAR CATEGORIA
        </button>
        {mixed && (
          <p className="text-muted w-full text-[11px]">
            Selecione só despesas ou só receitas.
          </p>
        )}
      </div>

      {open && (
        <Drawer title="MUDAR CATEGORIA" onClose={() => setOpen(false)}>
          <form action={action} className="flex flex-col gap-4">
            <p className="text-secondary text-sm">
              {selected.length} lançamento{selected.length === 1 ? '' : 's'} de{' '}
              {kind === 'INCOME' ? 'receita' : 'despesa'}.
            </p>
            <Field label="NOVA CATEGORIA">
              <select
                name="categoryId"
                defaultValue=""
                required
                className={fieldClass}
              >
                <option value="" disabled>
                  Selecione
                </option>
                {options.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            {hasInstallment && (
              <p className="text-dim text-[11px]">
                Parcelas mudam a compra inteira: todas as parcelas recebem a
                nova categoria.
              </p>
            )}
            <FormError message={state.error} />
            <div className="flex justify-end">
              <SubmitButton label="APLICAR" />
            </div>
          </form>
        </Drawer>
      )}
    </>
  );
}
