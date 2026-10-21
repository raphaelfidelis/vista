'use client';

import { useActionState } from 'react';
import { Field, fieldClass, FormError } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { SubmitButton } from '@/components/SubmitButton';
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
  type Bank,
} from '@/lib/finance';
import { initialFormState, type FormState } from '@/lib/form';
import { centsToInput } from '@/lib/money';
import { saveAccount } from './actions';
import { MAX_NAME_LENGTH } from '@/lib/limits';

type AccountFormProps = {
  /** Nulo cria; uma conta edita. */
  account: Account | null;
  banks: Bank[];
  /** Data padrão do saldo inicial de uma conta nova. */
  defaultDate: string;
  onSaved: () => void;
};

export function AccountForm({
  account,
  banks,
  defaultDate,
  onSaved,
}: AccountFormProps) {
  const [state, action] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await saveAccount(account?.id ?? null, previous, formData);

      if (result.error === null) {
        onSaved();
      }

      return result;
    },
    initialFormState,
  );
  const values = state.values;
  const bankDefault = values?.bankId ?? account?.bankId ?? '';
  const typeDefault = values?.type ?? 'CHECKING';

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="NOME">
        <input
          name="name"
          maxLength={MAX_NAME_LENGTH}
          type="text"
          autoComplete="off"
          defaultValue={values?.name ?? account?.name}
          required
          className={fieldClass}
        />
      </Field>
      {account ? (
        <p className="text-muted text-xs tracking-[0.1em]">
          TIPO: {ACCOUNT_TYPE_LABELS[account.type]} (não muda depois de criada)
        </p>
      ) : (
        <Field label="TIPO">
          <select
            key={typeDefault}
            name="type"
            defaultValue={typeDefault}
            required
            className={fieldClass}
          >
            {(
              Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]
            ).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="BANCO (OPCIONAL)">
        <select
          key={bankDefault}
          name="bankId"
          defaultValue={bankDefault}
          className={fieldClass}
        >
          <option value="">Sem banco</option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </select>
      </Field>
      <MoneyInput
        label="SALDO INICIAL (R$) · PODE SER NEGATIVO"
        defaultValue={
          values?.amount ??
          (account ? centsToInput(account.initialBalanceInCents) : '0,00')
        }
      />
      <Field label="DATA DO SALDO INICIAL">
        <input
          name="date"
          type="date"
          defaultValue={
            values?.date ?? account?.initialBalanceDate ?? defaultDate
          }
          required
          className={fieldClass}
        />
      </Field>
      <p className="text-dim text-[11px]">
        Lançamentos anteriores a essa data não entram no saldo: já estão dentro
        do saldo inicial.
      </p>
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton label={account ? 'SALVAR' : 'ADICIONAR'} />
      </div>
    </form>
  );
}
