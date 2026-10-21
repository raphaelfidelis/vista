'use client';

import { useActionState } from 'react';
import { Field, fieldClass, FormError } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH } from '@/lib/auth';
import { initialFormState } from '@/lib/form';
import { login } from '../actions';

export function LoginForm() {
  const [state, action] = useActionState(login, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="E-MAIL">
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={MAX_EMAIL_LENGTH}
          defaultValue={state.values?.email}
          required
          autoFocus
          className={fieldClass}
        />
      </Field>
      <Field label="SENHA">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={MAX_PASSWORD_LENGTH}
          required
          className={fieldClass}
        />
      </Field>
      <FormError message={state.error} />
      <SubmitButton label="ENTRAR" pendingLabel="ENTRANDO…" />
    </form>
  );
}
