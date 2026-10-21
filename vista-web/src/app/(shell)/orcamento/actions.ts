'use server';

import { invalidAmount, text, toFormState } from '@/lib/actions.server';
import * as api from '@/lib/finance.api';
import type { FormState } from '@/lib/form';
import { parseCents } from '@/lib/money';

/** Salva o limite: o padrão (todo mês) ou uma exceção só no mês exibido. */
export async function saveBudget(
  categoryId: string,
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
      text(formData, 'scope') === 'month'
        ? api.setBudgetOverride(categoryId, month, amountInCents)
        : api.setBudgetLimit(categoryId, amountInCents),
    formData,
  );
}

export async function removeLimit(categoryId: string): Promise<FormState> {
  return toFormState(() => api.removeBudgetLimit(categoryId));
}

export async function removeOverride(
  categoryId: string,
  month: string,
): Promise<FormState> {
  return toFormState(() => api.removeBudgetOverride(categoryId, month));
}
