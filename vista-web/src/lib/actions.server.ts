import 'server-only';
import { refresh } from 'next/cache';
import { ApiError } from '@/lib/api.server';
import type { FormState } from '@/lib/form';

/**
 * Roda a chamada à API de uma Server Action. Erro de regra de negócio vira
 * mensagem para a tela; qualquer outro sobe para o `error.tsx`.
 */
export async function toFormState(
  work: () => Promise<unknown>,
  formData?: FormData,
): Promise<FormState> {
  try {
    await work();
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, values: formData && fields(formData) };
    }

    throw error;
  }

  refresh();

  return { error: null };
}

/** Campos de texto enviados, para devolver ao formulário em caso de erro. */
export function fields(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData].filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

export function invalidAmount(formData: FormData): FormState {
  return {
    error: 'Informe um valor válido, como 1.234,56',
    values: fields(formData),
  };
}

/** Campo de texto do formulário; ausente vira vazio, e a API valida o resto. */
export function text(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === 'string' ? value : '';
}
