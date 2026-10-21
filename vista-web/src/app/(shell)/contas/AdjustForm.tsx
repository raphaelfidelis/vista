'use client';

import { useActionState } from 'react';
import { Field, fieldClass, FormError } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { SubmitButton } from '@/components/SubmitButton';
import type { Account } from '@/lib/finance';
import { initialFormState, type FormState } from '@/lib/form';
import { centsToInput, formatCents } from '@/lib/money';
import { adjustAccount } from './actions';

type AdjustFormProps = {
  account: Account;
  defaultDate: string;
  onSaved: () => void;
};

/** Informa o saldo real; a diferença vira um lançamento de ajuste (ex.: rendimento). */
export function AdjustForm({ account, defaultDate, onSaved }: AdjustFormProps) {
  const [state, action] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await adjustAccount(account.id, previous, formData);

      if (result.error === null) {
        onSaved();
      }

      return result;
    },
    initialFormState,
  );
  const values = state.values;

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-secondary text-sm">
        {account.name} · saldo atual{' '}
        <strong>{formatCents(account.balanceInCents)}</strong>
      </p>
      <MoneyInput
        label="NOVO SALDO (R$)"
        defaultValue={values?.amount ?? centsToInput(account.balanceInCents)}
      />
      <Field label="DATA DO AJUSTE">
        <input
          name="date"
          type="date"
          defaultValue={values?.date ?? defaultDate}
          required
          className={fieldClass}
        />
      </Field>
      <p className="text-dim text-[11px]">
        A diferença entre o saldo atual e o novo é lançada como ajuste.
      </p>
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton label="AJUSTAR" />
      </div>
    </form>
  );
}
