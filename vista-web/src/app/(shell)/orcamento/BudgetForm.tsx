'use client';

import { useActionState, useState } from 'react';
import { DeleteButton } from '@/components/DeleteButton';
import { FormError } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { Segmented } from '@/components/Segmented';
import { SubmitButton } from '@/components/SubmitButton';
import { initialFormState, type FormState } from '@/lib/form';
import { centsToInput, formatCents } from '@/lib/money';
import { formatMonth } from '@/lib/month';
import { removeLimit, removeOverride, saveBudget } from './actions';

/** A categoria sendo editada, com o que ela tem de limite neste mês. */
export type BudgetTarget = {
  categoryId: string;
  categoryName: string;
  /** O limite padrão; nulo se não houver. */
  defaultLimitInCents: number | null;
  /** O limite que vale neste mês; nulo se a categoria está sem orçamento. */
  limitInCents: number | null;
  isOverride: boolean;
};

type BudgetFormProps = {
  target: BudgetTarget;
  /** AAAA-MM do mês exibido. */
  month: string;
  onDone: () => void;
};

type Scope = 'default' | 'month';

export function BudgetForm({ target, month, onDone }: BudgetFormProps) {
  const [scope, setScope] = useState<Scope>(
    target.isOverride ? 'month' : 'default',
  );
  const [state, action] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await saveBudget(
        target.categoryId,
        month,
        previous,
        formData,
      );

      if (result.error === null) {
        onDone();
      }

      return result;
    },
    initialFormState,
  );
  const initial = target.limitInCents;

  // Remover fecha o painel: os valores que ele mostra deixam de valer.
  async function remove(work: () => Promise<FormState>): Promise<FormState> {
    const result = await work();

    if (result.error === null) {
      onDone();
    }

    return result;
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="scope" value={scope} />
        <p className="text-secondary text-sm">{target.categoryName}</p>
        <Segmented<Scope>
          label="Onde vale o limite"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'default', label: 'PADRÃO (TODO MÊS)' },
            { value: 'month', label: `SÓ EM ${formatMonth(month)}` },
          ]}
        />
        <MoneyInput
          label="LIMITE (R$)"
          defaultValue={
            state.values?.amount ??
            (initial === null ? undefined : centsToInput(initial))
          }
        />
        <p className="text-dim text-[11px]">
          O limite padrão vale em todos os meses; a exceção vale só no mês
          escolhido, no lugar do padrão.
        </p>
        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton label="SALVAR" />
        </div>
      </form>

      {(target.defaultLimitInCents !== null || target.isOverride) && (
        <div className="flex flex-col gap-2">
          {target.defaultLimitInCents !== null && (
            <div className="bg-item flex items-center justify-between gap-2 p-2 pl-3 text-sm">
              <span>
                Limite padrão {formatCents(target.defaultLimitInCents)}
              </span>
              <DeleteButton
                label="limite padrão"
                onDelete={() => remove(() => removeLimit(target.categoryId))}
              />
            </div>
          )}
          {target.isOverride && (
            <div className="bg-item flex items-center justify-between gap-2 p-2 pl-3 text-sm">
              <span>
                Exceção de {formatMonth(month)}{' '}
                {target.limitInCents !== null &&
                  formatCents(target.limitInCents)}
              </span>
              <DeleteButton
                label={`exceção de ${formatMonth(month)}`}
                onDelete={() =>
                  remove(() => removeOverride(target.categoryId, month))
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
