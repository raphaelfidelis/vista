'use client';

import { useActionState } from 'react';
import { Field, fieldClass, FormError } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { SubmitButton } from '@/components/SubmitButton';
import type { Account, Goal } from '@/lib/finance';
import { initialFormState, type FormState } from '@/lib/form';
import { centsToInput } from '@/lib/money';
import { saveGoal } from './actions';
import { MAX_NAME_LENGTH } from '@/lib/limits';

type GoalFormProps = {
  /** Nulo cria; uma meta edita. */
  goal: Goal | null;
  /** Contas de reserva que ainda não têm meta (mais a da própria meta, na edição). */
  accounts: Account[];
  onSaved: () => void;
};

export function GoalForm({ goal, accounts, onSaved }: GoalFormProps) {
  const [state, action] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await saveGoal(goal?.id ?? null, previous, formData);

      if (result.error === null) {
        onSaved();
      }

      return result;
    },
    initialFormState,
  );
  const values = state.values;
  const accountDefault = values?.accountId ?? goal?.accountId ?? '';

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="NOME">
        <input
          name="name"
          maxLength={MAX_NAME_LENGTH}
          type="text"
          autoComplete="off"
          placeholder="Ex.: Viagem"
          defaultValue={values?.name ?? goal?.name}
          required
          className={fieldClass}
        />
      </Field>
      <MoneyInput
        label="ALVO (R$)"
        defaultValue={
          values?.amount ??
          (goal ? centsToInput(goal.targetInCents) : undefined)
        }
      />
      <Field label="PRAZO (OPCIONAL)">
        <input
          name="deadline"
          type="month"
          defaultValue={values?.deadline ?? goal?.deadline ?? ''}
          className={fieldClass}
        />
      </Field>
      <Field label="CONTA DE RESERVA">
        <select
          key={accountDefault}
          name="accountId"
          defaultValue={accountDefault}
          required
          className={fieldClass}
        >
          <option value="" disabled>
            Selecione
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-dim text-[11px]">
        O progresso é o saldo da conta de reserva: guarde dinheiro nela
        (transferindo de outra conta) e a meta anda sozinha.
      </p>
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton label={goal ? 'SALVAR' : 'ADICIONAR'} />
      </div>
    </form>
  );
}
