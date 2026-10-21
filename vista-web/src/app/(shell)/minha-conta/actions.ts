'use server';

import { redirect } from 'next/navigation';
import { text, toFormState } from '@/lib/actions.server';
import * as auth from '@/lib/auth.api';
import type { FormState } from '@/lib/form';
import { clearSession } from '@/lib/session.server';

export async function rename(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  return toFormState(() => auth.rename(text(formData, 'name')), formData);
}

/** As senhas nunca voltam ao navegador, nem em erro. */
export async function changePassword(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const newPassword = text(formData, 'newPassword');

  if (newPassword !== text(formData, 'confirmPassword')) {
    return { error: 'A confirmação não é igual à nova senha' };
  }

  const current = text(formData, 'currentPassword');
  const result = await toFormState(() =>
    auth.changePassword(newPassword, current === '' ? undefined : current),
  );

  return result.error === null
    ? { error: null, values: { done: '1' } }
    : { error: result.error };
}

export async function logout(): Promise<void> {
  // A sessão some do navegador mesmo se a API não responder.
  await auth.logout().catch(() => undefined);
  await clearSession();
  redirect('/entrar');
}
