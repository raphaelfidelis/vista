'use server';

import { invalidAmount, text, toFormState } from '@/lib/actions.server';
import type { AccountType } from '@/lib/finance';
import * as api from '@/lib/finance.api';
import type { FormState } from '@/lib/form';
import { parseSignedCents } from '@/lib/money';

export async function saveAccount(
  id: string | null,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const initialBalanceInCents = parseSignedCents(text(formData, 'amount'));

  if (initialBalanceInCents === null) {
    return invalidAmount(formData);
  }

  const name = text(formData, 'name');
  const bankId = text(formData, 'bankId');
  const initialBalanceDate = text(formData, 'date');

  return toFormState(
    () =>
      id === null
        ? api.createAccount({
            name,
            type: text(formData, 'type') as AccountType,
            ...(bankId === '' ? {} : { bankId }),
            initialBalanceInCents,
            initialBalanceDate,
          })
        : api.updateAccount(id, {
            name,
            bankId: bankId === '' ? null : bankId,
            initialBalanceInCents,
            initialBalanceDate,
          }),
    formData,
  );
}

export async function adjustAccount(
  id: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const balanceInCents = parseSignedCents(text(formData, 'amount'));

  if (balanceInCents === null) {
    return invalidAmount(formData);
  }

  return toFormState(
    () =>
      api.adjustAccount(id, { balanceInCents, date: text(formData, 'date') }),
    formData,
  );
}

export async function archiveAccount(
  id: string,
  archived: boolean,
): Promise<FormState> {
  return toFormState(() => api.setAccountArchived(id, archived));
}

export async function deleteAccount(id: string): Promise<FormState> {
  return toFormState(() => api.deleteAccount(id));
}

export async function createBank(name: string): Promise<FormState> {
  return toFormState(() => api.createBank(name));
}

export async function renameBank(id: string, name: string): Promise<FormState> {
  return toFormState(() => api.renameBank(id, name));
}

export async function deleteBank(id: string): Promise<FormState> {
  return toFormState(() => api.deleteBank(id));
}
