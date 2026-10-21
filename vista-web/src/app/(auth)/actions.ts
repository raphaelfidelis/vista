'use server';

import { redirect } from 'next/navigation';
import { text } from '@/lib/actions.server';
import { ApiError } from '@/lib/api.server';
import * as auth from '@/lib/auth.api';
import type { FormState } from '@/lib/form';
import { setSession } from '@/lib/session.server';

/**
 * Em erro, devolve o que foi digitado para o formulário não se apagar,
 * mas nunca a senha: ela não volta ao navegador.
 */
function failure(error: ApiError, values: Record<string, string>): FormState {
  return { error: error.message, values };
}

export async function login(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData, 'email');

  try {
    const session = await auth.login(email, text(formData, 'password'));

    await setSession(session.token, session.expiresAt);
  } catch (error) {
    if (error instanceof ApiError) {
      return failure(error, { email });
    }

    throw error;
  }

  // Destino fixo: nunca um endereço vindo da requisição.
  redirect('/visao-geral');
}

export async function register(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    inviteCode: text(formData, 'inviteCode'),
    name: text(formData, 'name'),
    email: text(formData, 'email'),
  };

  try {
    const session = await auth.register({
      ...values,
      password: text(formData, 'password'),
    });

    await setSession(session.token, session.expiresAt);
  } catch (error) {
    if (error instanceof ApiError) {
      return failure(error, values);
    }

    throw error;
  }

  redirect('/visao-geral');
}
