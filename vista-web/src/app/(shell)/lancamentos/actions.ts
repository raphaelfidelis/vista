'use server';

import { invalidAmount, text, toFormState } from '@/lib/actions.server';
import type { CategoryKind, NewRecurring } from '@/lib/finance';
import * as api from '@/lib/finance.api';
import type { FormState } from '@/lib/form';
import { parseCents } from '@/lib/money';
import { dueDateIn } from '@/lib/month';

/** Valor opcional (vazio → nulo); indefinido quando o texto não é um valor. */
function readOptionalAmount(formData: FormData): number | null | undefined {
  const raw = text(formData, 'amount').trim();

  return raw === '' ? null : (parseCents(raw) ?? undefined);
}

/**
 * Despesa fixa: o campo "origin" (`account:ID` ou `card:ID`). Receita fixa:
 * só conta, no campo "accountId".
 */
function readOrigin(
  formData: FormData,
  kind: CategoryKind,
): { accountId: string | null; cardId: string | null } {
  if (kind !== 'EXPENSE') {
    return { accountId: text(formData, 'accountId') || null, cardId: null };
  }

  const [type, id = ''] = text(formData, 'origin').split(':');

  return type === 'card'
    ? { accountId: null, cardId: id }
    : { accountId: id || null, cardId: null };
}

/** Lançamento de um clique: só para gasto fixo de valor definido; os outros passam pelo formulário. */
export async function launchRecurring(
  id: string,
  month: string,
): Promise<FormState> {
  const item = (await api.getRecurring()).find((r) => r.id === id);

  if (!item || item.variableAmount || item.amountInCents === null) {
    return { error: 'Este gasto fixo precisa de um valor para ser lançado.' };
  }

  const amountInCents = item.amountInCents;

  return toFormState(() =>
    api.createTransaction({
      kind: item.kind,
      description: item.description,
      amountInCents,
      date: dueDateIn(month, item.dueDay),
      categoryId: item.categoryId,
      ...(item.cardId
        ? { cardId: item.cardId }
        : { accountId: item.accountId ?? undefined }),
      recurringId: id,
    }),
  );
}

export async function saveRecurring(
  id: string | null,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const amountInCents = readOptionalAmount(formData);

  if (amountInCents === undefined) {
    return invalidAmount(formData);
  }

  const kind = text(formData, 'kind') as CategoryKind;
  const shared = {
    description: text(formData, 'description'),
    categoryId: text(formData, 'categoryId'),
    ...readOrigin(formData, kind),
    amountInCents,
    variableAmount: formData.has('variableAmount'),
    dueDay: Number(text(formData, 'dueDay')),
  };
  const input: NewRecurring = { ...shared, kind };

  return toFormState(
    () =>
      id === null
        ? api.createRecurring(input)
        : api.updateRecurring(id, {
            ...shared,
            active: formData.has('active'),
          }),
    formData,
  );
}

export async function deleteRecurring(id: string): Promise<FormState> {
  return toFormState(() => api.deleteRecurring(id));
}

export async function createCategory(
  name: string,
  kind: CategoryKind,
): Promise<FormState> {
  return toFormState(() => api.createCategory(name, kind));
}

export async function renameCategory(
  id: string,
  name: string,
): Promise<FormState> {
  return toFormState(() => api.renameCategory(id, name));
}

export async function deleteCategory(id: string): Promise<FormState> {
  return toFormState(() => api.deleteCategory(id));
}
