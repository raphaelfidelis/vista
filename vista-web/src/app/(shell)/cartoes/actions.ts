'use server';

import { invalidAmount, text, toFormState } from '@/lib/actions.server';
import * as api from '@/lib/finance.api';
import type { FormState } from '@/lib/form';
import { parseCents } from '@/lib/money';

/** Limite opcional (vazio → nulo); indefinido quando o texto não é um valor. */
function readLimit(formData: FormData): number | null | undefined {
  const raw = text(formData, 'amount').trim();

  return raw === '' ? null : (parseCents(raw) ?? undefined);
}

export async function saveCard(
  id: string | null,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const limitInCents = readLimit(formData);

  if (limitInCents === undefined) {
    return invalidAmount(formData);
  }

  const name = text(formData, 'name');
  const bankId = text(formData, 'bankId');
  const closingDay = Number(text(formData, 'closingDay'));
  const dueDay = Number(text(formData, 'dueDay'));

  return toFormState(
    () =>
      id === null
        ? api.createCard({
            name,
            ...(bankId === '' ? {} : { bankId }),
            closingDay,
            dueDay,
            ...(limitInCents === null ? {} : { limitInCents }),
          })
        : api.updateCard(id, {
            name,
            bankId: bankId === '' ? null : bankId,
            closingDay,
            dueDay,
            limitInCents,
          }),
    formData,
  );
}

export async function archiveCard(
  id: string,
  archived: boolean,
): Promise<FormState> {
  return toFormState(() => api.setCardArchived(id, archived));
}

export async function deleteCard(id: string): Promise<FormState> {
  return toFormState(() => api.deleteCard(id));
}

/** Paga a fatura (ou parte dela) com dinheiro de uma conta: transferência para o cartão. */
export async function payInvoice(
  cardId: string,
  month: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const amountInCents = parseCents(text(formData, 'amount'));

  if (amountInCents === null) {
    return invalidAmount(formData);
  }

  return toFormState(
    () =>
      api.createTransaction({
        kind: 'TRANSFER',
        description: 'Pagamento de fatura',
        amountInCents,
        date: text(formData, 'date'),
        accountId: text(formData, 'accountId'),
        toCardId: cardId,
        invoiceMonth: month,
      }),
    formData,
  );
}
