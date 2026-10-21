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
  Transaction,
  TransactionKind,
} from '@/lib/finance';
import { initialFormState, type FormState } from '@/lib/form';
import { centsToInput } from '@/lib/money';
import { formatMonth } from '@/lib/month';
import { saveTransaction } from '@/lib/transaction.actions';
import { MAX_DESCRIPTION_LENGTH } from '@/lib/limits';

/** Valores iniciais de um lançamento novo (vindos de um gasto fixo, ou de "transferir" numa conta). */
export type TransactionPreset = {
  kind: TransactionKind;
  description?: string;
  /** Nulo deixa o campo vazio. */
  amountInCents?: number | null;
  date?: string;
  categoryId?: string;
  accountId?: string;
  cardId?: string;
  toAccountId?: string;
  recurringId?: string;
};

type TransactionFormProps = {
  /** Nulo cria; um lançamento edita. */
  transaction: Transaction | null;
  preset?: TransactionPreset;
  categories: Category[];
  accounts: Account[];
  cards: Card[];
  defaultDate: string;
  onSaved: () => void;
};

const CREATABLE_KINDS = [
  { value: 'EXPENSE', label: 'DESPESA' },
  { value: 'INCOME', label: 'RECEITA' },
  { value: 'TRANSFER', label: 'TRANSFERÊNCIA' },
] as const;

const MAX_INSTALLMENTS = 48;

type AccountSelectProps = {
  label: string;
  name: string;
  accounts: Account[];
  /** Conta já gravada: continua na lista mesmo arquivada. */
  current: string | undefined;
  defaultValue: string;
};

function AccountSelect({
  label,
  name,
  accounts,
  current,
  defaultValue,
}: AccountSelectProps) {
  return (
    <Field label={label}>
      <select
        // O React não atualiza o defaultValue de um select já montado.
        key={defaultValue}
        name={name}
        defaultValue={defaultValue}
        required
        className={fieldClass}
      >
        <option value="" disabled>
          Selecione
        </option>
        {accounts
          .filter((account) => !account.archived || account.id === current)
          .map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
      </select>
    </Field>
  );
}

type OriginSelectProps = {
  accounts: Account[];
  cards: Card[];
  /** Origem já gravada: continua na lista mesmo arquivada. */
  current: string;
  defaultValue: string;
  onChange: (value: string) => void;
};

/** Despesa: sai de uma conta ou de um cartão. O valor é "account:ID" ou "card:ID". */
function OriginSelect({
  accounts,
  cards,
  current,
  defaultValue,
  onChange,
}: OriginSelectProps) {
  return (
    <Field label="PAGO COM">
      <select
        // O React não atualiza o defaultValue de um select já montado.
        key={defaultValue}
        name="origin"
        defaultValue={defaultValue}
        onChange={(event) => onChange(event.target.value)}
        required
        className={fieldClass}
      >
        <option value="" disabled>
          Selecione
        </option>
        <optgroup label="Contas">
          {accounts
            .filter(
              (account) =>
                !account.archived || `account:${account.id}` === current,
            )
            .map((account) => (
              <option key={account.id} value={`account:${account.id}`}>
                {account.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Cartões">
          {cards
            .filter((card) => !card.archived || `card:${card.id}` === current)
            .map((card) => (
              <option key={card.id} value={`card:${card.id}`}>
                {card.name}
              </option>
            ))}
        </optgroup>
      </select>
    </Field>
  );
}

function originOf(
  value: { accountId?: string | null; cardId?: string | null } | undefined,
): string {
  if (value?.cardId) {
    return `card:${value.cardId}`;
  }

  return value?.accountId ? `account:${value.accountId}` : '';
}

export function TransactionForm({
  transaction,
  preset,
  categories,
  accounts,
  cards,
  defaultDate,
  onSaved,
}: TransactionFormProps) {
  const initial = transaction ?? preset;
  const [kind, setKind] = useState<TransactionKind>(initial?.kind ?? 'EXPENSE');
  const [state, action] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await saveTransaction(
        transaction?.id ?? null,
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
  const originDefault = values?.origin ?? originOf(initial);
  const [origin, setOrigin] = useState(originDefault);
  const [ongoing, setOngoing] = useState(false);
  const wantedCategory = values?.categoryId ?? initial?.categoryId ?? '';
  const categoryDefault = categories.some(
    (category) => category.id === wantedCategory && category.kind === kind,
  )
    ? wantedCategory
    : '';
  const initialAmount = initial?.amountInCents;
  const hasCategory = kind === 'EXPENSE' || kind === 'INCOME';
  const kindIsFixed = transaction !== null || preset !== undefined;
  const isInstallment = transaction?.purchaseId != null;
  const isPayment = transaction?.toCardId != null;
  const onCard = kind === 'EXPENSE' && origin.startsWith('card:');
  // Parcelamento em andamento: só na compra nova no cartão.
  const isOngoing = onCard && ongoing && !transaction;
  const selectedCard = onCard
    ? cards.find((card) => `card:${card.id}` === origin)
    : undefined;
  const categorySelect = (
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
  );
  const descriptionField = (
    <Field label="DESCRIÇÃO">
      <input
        name="description"
        maxLength={MAX_DESCRIPTION_LENGTH}
        type="text"
        autoComplete="off"
        placeholder={kind === 'TRANSFER' ? 'Transferência' : undefined}
        defaultValue={values?.description ?? initial?.description}
        required={kind !== 'TRANSFER'}
        className={fieldClass}
      />
    </Field>
  );

  if (isInstallment && transaction) {
    return (
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="installment" value="1" />
        <input type="hidden" name="kind" value={kind} />
        <p className="text-secondary text-sm">
          Compra parcelada em {transaction.installmentCount}x no{' '}
          {transaction.cardName}. Valor, data e cartão não mudam: para isso,
          exclua a compra e lance de novo. Descrição e categoria valem para
          todas as parcelas.
        </p>
        {descriptionField}
        {categorySelect}
        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton label="SALVAR" />
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value={kind} />
      {preset?.recurringId && (
        <input type="hidden" name="recurringId" value={preset.recurringId} />
      )}
      {!kindIsFixed && (
        <Segmented<TransactionKind>
          label="Tipo de lançamento"
          value={kind}
          onChange={setKind}
          options={[...CREATABLE_KINDS]}
        />
      )}
      {isPayment && transaction && (
        <p className="text-secondary text-sm">
          Pagamento da fatura de{' '}
          {transaction.invoiceMonth && formatMonth(transaction.invoiceMonth)} do{' '}
          {transaction.toCardName}.
        </p>
      )}
      {descriptionField}
      <MoneyInput
        label={
          kind === 'ADJUSTMENT'
            ? 'VALOR (R$) · COM SINAL'
            : isOngoing
              ? 'VALOR DA PARCELA (R$)'
              : 'VALOR (R$)'
        }
        defaultValue={
          values?.amount ??
          (initialAmount == null ? undefined : centsToInput(initialAmount))
        }
      />
      <Field label={isOngoing ? 'DATA DA COMPRA' : 'DATA'}>
        <input
          name="date"
          type="date"
          defaultValue={values?.date ?? initial?.date ?? defaultDate}
          required
          className={fieldClass}
        />
      </Field>
      {hasCategory && categorySelect}
      {kind === 'EXPENSE' ? (
        <OriginSelect
          accounts={accounts}
          cards={cards}
          current={originOf(transaction ?? undefined)}
          defaultValue={originDefault}
          onChange={setOrigin}
        />
      ) : (
        <AccountSelect
          label={kind === 'TRANSFER' ? 'DE (ORIGEM)' : 'CONTA'}
          name="accountId"
          accounts={accounts}
          current={transaction?.accountId ?? undefined}
          defaultValue={values?.accountId ?? initial?.accountId ?? ''}
        />
      )}
      {onCard && !transaction && (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="ongoing"
            value="1"
            // Não controlado: o React limpa o form após a ação e o defaultChecked
            // devolve a marcação enviada, como o defaultValue dos outros campos.
            defaultChecked={values?.ongoing === '1'}
            onChange={(event) => setOngoing(event.target.checked)}
            className="accent-accent size-4"
          />
          Parcelamento já em andamento
        </label>
      )}
      {isOngoing && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field label="PARCELA ATUAL">
              <input
                name="currentInstallment"
                type="number"
                min={1}
                max={MAX_INSTALLMENTS}
                inputMode="numeric"
                defaultValue={values?.currentInstallment}
                required
                className={fieldClass}
              />
            </Field>
            <Field label="DE (TOTAL DE PARCELAS)">
              <input
                name="installments"
                type="number"
                min={2}
                max={MAX_INSTALLMENTS}
                inputMode="numeric"
                defaultValue={values?.installments}
                required
                className={fieldClass}
              />
            </Field>
          </div>
          <Field label="FATURA DA PARCELA ATUAL">
            <input
              // Troca de cartão: volta para a fatura atual do cartão escolhido.
              key={selectedCard?.id}
              name="invoiceMonth"
              type="month"
              defaultValue={
                values?.invoiceMonth ?? selectedCard?.currentInvoice.month
              }
              required
              className={fieldClass}
            />
          </Field>
          <p className="text-dim text-[11px]">
            Lança só o que falta: da parcela atual até a última, uma por fatura
            a partir da escolhida, com o valor acima em cada uma. As parcelas já
            pagas ficam de fora.
          </p>
        </>
      )}
      {onCard && !transaction && !isOngoing && (
        <>
          <Field label="PARCELAS (1 = À VISTA)">
            <input
              name="installments"
              type="number"
              min={1}
              max={MAX_INSTALLMENTS}
              inputMode="numeric"
              defaultValue={values?.installments ?? '1'}
              className={fieldClass}
            />
          </Field>
          <p className="text-dim text-[11px]">
            Parcelado: o valor acima é o total da compra, dividido nas próximas
            faturas. Os centavos que sobram vão na primeira parcela.
          </p>
        </>
      )}
      {kind === 'TRANSFER' && !isPayment && (
        <AccountSelect
          label="PARA (DESTINO)"
          name="toAccountId"
          accounts={accounts}
          current={transaction?.toAccountId ?? undefined}
          defaultValue={values?.toAccountId ?? initial?.toAccountId ?? ''}
        />
      )}
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton label={transaction ? 'SALVAR' : 'ADICIONAR'} />
      </div>
    </form>
  );
}
