'use client';

import { useActionState } from 'react';
import { Field, fieldClass, FormError } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { SubmitButton } from '@/components/SubmitButton';
import type { Account, CardInvoice } from '@/lib/finance';
import { initialFormState, type FormState } from '@/lib/form';
import { centsToInput, formatCents } from '@/lib/money';
import { formatMonth } from '@/lib/month';
import { payInvoice } from '../actions';

type PayInvoiceFormProps = {
  cardName: string;
  invoice: CardInvoice;
  accounts: Account[];
  defaultDate: string;
  onSaved: () => void;
};

/** Pagamento com valor livre: pagar menos que o total deixa o resto para a fatura seguinte. */
export function PayInvoiceForm({
  cardName,
  invoice,
  accounts,
  defaultDate,
  onSaved,
}: PayInvoiceFormProps) {
  const [state, action] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await payInvoice(
        invoice.cardId,
        invoice.month,
        previous,
        formData,
      );

      if (result.error === null) {
        onSaved();
      }

      return result;
    },
    initialFormState,
  );
  const values = state.values;
  const accountDefault = values?.accountId ?? '';

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-secondary text-sm">
        Fatura de {formatMonth(invoice.month)} do {cardName}: total{' '}
        <strong>{formatCents(invoice.totalInCents)}</strong>
        {invoice.remainingInCents > 0 && (
          <>
            , restam <strong>{formatCents(invoice.remainingInCents)}</strong>
          </>
        )}
        .
      </p>
      <Field label="PAGAR COM A CONTA">
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
          {accounts
            .filter((account) => !account.archived)
            .map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
        </select>
      </Field>
      <MoneyInput
        label="VALOR (R$)"
        defaultValue={
          values?.amount ??
          (invoice.remainingInCents > 0
            ? centsToInput(invoice.remainingInCents)
            : undefined)
        }
      />
      <Field label="DATA DO PAGAMENTO">
        <input
          name="date"
          type="date"
          defaultValue={values?.date ?? defaultDate}
          required
          className={fieldClass}
        />
      </Field>
      <p className="text-dim text-[11px]">
        Pagar menos que o total é permitido: o que faltar rola para a próxima
        fatura.
      </p>
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton label="PAGAR" />
      </div>
    </form>
  );
}
