'use server';

import { invalidAmount, text, toFormState } from '@/lib/actions.server';
import * as api from '@/lib/finance.api';
import type { FormState } from '@/lib/form';
import { parseCents } from '@/lib/money';

export async function saveGoal(
  id: string | null,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const targetInCents = parseCents(text(formData, 'amount'));

  if (targetInCents === null) {
    return invalidAmount(formData);
  }

  const name = text(formData, 'name');
  const accountId = text(formData, 'accountId');
  const deadline = text(formData, 'deadline');

  return toFormState(
    () =>
      id === null
        ? api.createGoal({
            name,
            targetInCents,
            ...(deadline === '' ? {} : { deadline }),
            accountId,
          })
        : api.updateGoal(id, {
            name,
            targetInCents,
            deadline: deadline === '' ? null : deadline,
            accountId,
          }),
    formData,
  );
}

export async function deleteGoal(id: string): Promise<FormState> {
  return toFormState(() => api.deleteGoal(id));
}
