'use client';

import { useActionState } from 'react';
import { Field, fieldClass, FormError } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { SubmitButton } from '@/components/SubmitButton';
import type { Bank, Card } from '@/lib/finance';
import { initialFormState, type FormState } from '@/lib/form';
import { centsToInput } from '@/lib/money';
import { saveCard } from './actions';
import { MAX_NAME_LENGTH } from '@/lib/limits';

type CardFormProps = {
  /** Nulo cria; um cartão edita. */
  card: Card | null;
  banks: Bank[];
  onSaved: () => void;
};

export function CardForm({ card, banks, onSaved }: CardFormProps) {
  const [state, action] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await saveCard(card?.id ?? null, previous, formData);

      if (result.error === null) {
        onSaved();
      }

      return result;
    },
    initialFormState,
  );
  const values = state.values;
  const bankDefault = values?.bankId ?? card?.bankId ?? '';

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="NOME">
        <input
          name="name"
          maxLength={MAX_NAME_LENGTH}
          type="text"
          autoComplete="off"
          defaultValue={values?.name ?? card?.name}
          required
          className={fieldClass}
        />
      </Field>
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
      <div className="flex gap-4">
        <Field label="DIA DO FECHAMENTO">
          <input
            name="closingDay"
            type="number"
            min={1}
            max={31}
            inputMode="numeric"
            defaultValue={values?.closingDay ?? card?.closingDay}
            required
            className={fieldClass}
          />
        </Field>
        <Field label="DIA DO VENCIMENTO">
          <input
            name="dueDay"
            type="number"
            min={1}
            max={31}
            inputMode="numeric"
            defaultValue={values?.dueDay ?? card?.dueDay}
            required
            className={fieldClass}
          />
        </Field>
      </div>
      <MoneyInput
        label="LIMITE (R$) · OPCIONAL"
        required={false}
        defaultValue={
          values?.amount ??
          (card?.limitInCents == null
            ? undefined
            : centsToInput(card.limitInCents))
        }
      />
      <p className="text-dim text-[11px]">
        A compra feita no dia do fechamento já entra na fatura seguinte. Mudar
        os dias não recalcula as compras que já foram lançadas.
      </p>
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton label={card ? 'SALVAR' : 'ADICIONAR'} />
      </div>
    </form>
  );
}
