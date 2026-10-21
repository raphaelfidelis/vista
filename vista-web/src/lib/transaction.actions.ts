'use server';

import { invalidAmount, text, toFormState } from '@/lib/actions.server';
import * as api from '@/lib/finance.api';
import type {
  TransactionKind,
  TransactionSearch,
  TransactionSearchResult,
} from '@/lib/finance';
import type { FormState } from '@/lib/form';
import { parseCents, parseSignedCents } from '@/lib/money';

const DEFAULT_DESCRIPTIONS: Partial<Record<TransactionKind, string>> = {
  TRANSFER: 'Transferência',
};

type Origin = { accountId?: string; cardId?: string };

/** Lê o campo "origin" (`account:ID` ou `card:ID`) da despesa; ou o `accountId` dos outros tipos. */
function readOrigin(formData: FormData, kind: TransactionKind): Origin {
  if (kind !== 'EXPENSE') {
    return { accountId: text(formData, 'accountId') };
  }

  const [type, id = ''] = text(formData, 'origin').split(':');

  return type === 'card' ? { cardId: id } : { accountId: id };
}

/** Ações de lançamento usadas por mais de uma tela (lançamentos, contas e cartões). */
export async function saveTransaction(
  id: string | null,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const description = text(formData, 'description').trim();
  const categoryId = text(formData, 'categoryId');

  // Compra parcelada: só descrição e categoria mudam, em todas as parcelas.
  if (id !== null && text(formData, 'installment') === '1') {
    return toFormState(
      () => api.updateTransaction(id, { description, categoryId }),
      formData,
    );
  }

  const kind = text(formData, 'kind') as TransactionKind;
  const raw = text(formData, 'amount');
  // Só o ajuste pode ser negativo.
  const amountInCents =
    kind === 'ADJUSTMENT' ? parseSignedCents(raw) : parseCents(raw);

  if (amountInCents === null) {
    return invalidAmount(formData);
  }

  const date = text(formData, 'date');
  const origin = readOrigin(formData, kind);
  const hasCategory = kind === 'EXPENSE' || kind === 'INCOME';
  // Pagamento de fatura não tem conta de destino: o campo nem aparece.
  const toAccountId = text(formData, 'toAccountId') || undefined;
  const fullDescription = description || (DEFAULT_DESCRIPTIONS[kind] ?? '');
  const installments = Number(text(formData, 'installments') || '1');
  const ongoing =
    origin.cardId !== undefined && text(formData, 'ongoing') === '1';

  return toFormState(
    () =>
      id === null
        ? api.createTransaction({
            kind,
            description: fullDescription,
            amountInCents,
            date,
            ...origin,
            ...(hasCategory ? { categoryId } : {}),
            ...(kind === 'TRANSFER' ? { toAccountId } : {}),
            ...(ongoing
              ? {
                  installmentCount: installments,
                  currentInstallment: Number(
                    text(formData, 'currentInstallment'),
                  ),
                  invoiceMonth: text(formData, 'invoiceMonth'),
                }
              : origin.cardId && installments > 1
                ? { installmentCount: installments }
                : {}),
            ...(text(formData, 'recurringId') === ''
              ? {}
              : { recurringId: text(formData, 'recurringId') }),
          })
        : api.updateTransaction(id, {
            description: fullDescription,
            amountInCents,
            date,
            // Na despesa, trocar entre conta e cartão limpa o outro lado.
            ...(kind === 'EXPENSE'
              ? {
                  accountId: origin.accountId ?? null,
                  cardId: origin.cardId ?? null,
                }
              : origin),
            ...(hasCategory ? { categoryId } : {}),
            ...(kind === 'TRANSFER' ? { toAccountId } : {}),
          }),
    formData,
  );
}

export async function deleteTransaction(id: string): Promise<FormState> {
  return toFormState(() => api.deleteTransaction(id));
}

/** Próxima página da busca (CARREGAR MAIS). */
export async function loadMoreTransactions(
  filters: TransactionSearch,
  offset: number,
): Promise<TransactionSearchResult> {
  return api.searchTransactions(filters, offset);
}

/** MUDAR CATEGORIA: só os ids e a categoria vão à API, que confere cada um contra o usuário. */
export async function recategorizeTransactions(
  ids: string[],
  categoryId: string,
): Promise<FormState> {
  return toFormState(() => api.recategorizeTransactions(ids, categoryId));
}
