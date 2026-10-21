'use client';

import { useActionState, useState } from 'react';
import { Field, fieldClass, FormError } from '@/components/Field';
import { MoneyInput } from '@/components/MoneyInput';
import { Segmented } from '@/components/Segmented';
import { SubmitButton } from '@/components/SubmitButton';
import type {
  Account,
  Card,
  Category,
  CategoryKind,
  Recurring,
} from '@/lib/finance';
import { initialFormState, type FormState } from '@/lib/form';
import { centsToInput } from '@/lib/money';
import { saveRecurring } from './actions';
import { MAX_DESCRIPTION_LENGTH } from '@/lib/limits';

type RecurringFormProps = {
  /** Nulo cria; um gasto fixo edita. */
  item: Recurring | null;
  categories: Category[];
  accounts: Account[];
  cards: Card[];
  onSaved: () => void;
};

type CheckboxProps = {
  name: string;
  label: string;
  defaultChecked: boolean;
};

function Checkbox({ name, label, defaultChecked }: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="accent-accent size-4"
      />
      {label}
    </label>
  );
}

function originOf(item: Recurring | null): string {
  if (item?.cardId) {
    return `card:${item.cardId}`;
  }

  return item?.accountId ? `account:${item.accountId}` : '';
}

export function RecurringForm({
  item,
  categories,
  accounts,
  cards,
  onSaved,
}: RecurringFormProps) {
  const [kind, setKind] = useState<CategoryKind>(item?.kind ?? 'EXPENSE');
  const [state, action] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await saveRecurring(item?.id ?? null, previous, formData);

      if (result.error === null) {
        onSaved();
      }

      return result;
    },
    initialFormState,
  );
  // Um checkbox desmarcado não vai no FormData: depois de um erro, "não veio"
  // significa desmarcado, e só o primeiro render usa o valor do cadastro.
  const values = state.values;
  const submitted = values !== undefined;
  const wantedCategory = values?.categoryId ?? item?.categoryId ?? '';
  const categoryDefault = categories.some(
    (category) => category.id === wantedCategory && category.kind === kind,
  )
    ? wantedCategory
    : '';
  const originDefault = values?.origin ?? originOf(item);
  const accountDefault = values?.accountId ?? item?.accountId ?? '';
  const visibleAccounts = accounts.filter(
    (account) => !account.archived || account.id === item?.accountId,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value={kind} />
      {!item && (
        <Segmented<CategoryKind>
          label="Tipo de gasto fixo"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'EXPENSE', label: 'DESPESA' },
            { value: 'INCOME', label: 'RECEITA' },
          ]}
        />
      )}
      <Field label="DESCRIÇÃO">
        <input
          name="description"
          maxLength={MAX_DESCRIPTION_LENGTH}
          type="text"
          autoComplete="off"
          defaultValue={values?.description ?? item?.description}
          required
          className={fieldClass}
        />
      </Field>
      <Field label="CATEGORIA">
        <select
          // O React não atualiza o defaultValue de um select já montado.
          key={`${kind}-${categoryDefault}`}
          name="categoryId"
          defaultValue={categoryDefault}
          required
          className={fieldClass}
        >
          <option value="" disabled>
            Selecione
          </option>
          {categories
            .filter((category) => category.kind === kind)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </Field>
      {kind === 'EXPENSE' ? (
        <Field label="PAGO COM">
          <select
            key={originDefault}
            name="origin"
            defaultValue={originDefault}
            required
            className={fieldClass}
          >
            <option value="" disabled>
              Selecione
            </option>
            <optgroup label="Contas">
              {visibleAccounts.map((account) => (
                <option key={account.id} value={`account:${account.id}`}>
                  {account.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Cartões">
              {cards
                .filter((card) => !card.archived || card.id === item?.cardId)
                .map((card) => (
                  <option key={card.id} value={`card:${card.id}`}>
                    {card.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </Field>
      ) : (
        <Field label="CONTA">
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
            {visibleAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Checkbox
        key={`variable-${submitted}`}
        name="variableAmount"
        label="O valor muda todo mês (ex.: energia)"
        defaultChecked={
          submitted
            ? 'variableAmount' in values
            : (item?.variableAmount ?? false)
        }
      />
      <MoneyInput
        label="VALOR (R$) · OPCIONAL SE MUDA TODO MÊS"
        required={false}
        defaultValue={
          values?.amount ??
          (item?.amountInCents == null
            ? undefined
            : centsToInput(item.amountInCents))
        }
      />
      <Field label="DIA DO VENCIMENTO">
        <input
          name="dueDay"
          type="number"
          min={1}
          max={31}
          inputMode="numeric"
          defaultValue={values?.dueDay ?? item?.dueDay}
          required
          className={fieldClass}
        />
      </Field>
      {item && (
        <Checkbox
          key={`active-${submitted}`}
          name="active"
          label="Ativo (aparece na checklist de todo mês)"
          defaultChecked={submitted ? 'active' in values : item.active}
        />
      )}
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton label={item ? 'SALVAR' : 'ADICIONAR'} />
      </div>
    </form>
  );
}
