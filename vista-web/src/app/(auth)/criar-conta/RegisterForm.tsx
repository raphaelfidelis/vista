'use client';

import { useActionState } from 'react';
import { Field, fieldClass, FormError } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import {
  MAX_EMAIL_LENGTH,
  MAX_INVITE_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_USER_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@/lib/auth';
import { initialFormState } from '@/lib/form';
import { register } from '../actions';

export function RegisterForm() {
  const [state, action] = useActionState(register, initialFormState);
  const values = state.values;

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="CÓDIGO DE CONVITE">
        <input
          name="inviteCode"
          type="text"
          autoComplete="off"
          maxLength={MAX_INVITE_LENGTH}
          defaultValue={values?.inviteCode}
          required
          autoFocus
          className={fieldClass}
        />
      </Field>
      <Field label="NOME">
        <input
          name="name"
          type="text"
          autoComplete="name"
          maxLength={MAX_USER_NAME_LENGTH}
          defaultValue={values?.name}
          required
          className={fieldClass}
        />
      </Field>
      <Field label="E-MAIL">
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={MAX_EMAIL_LENGTH}
          defaultValue={values?.email}
          required
          className={fieldClass}
        />
      </Field>
      <Field label={`SENHA · MÍNIMO ${MIN_PASSWORD_LENGTH} CARACTERES`}>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          required
          className={fieldClass}
        />
      </Field>
      <FormError message={state.error} />
      <SubmitButton label="CRIAR CONTA" pendingLabel="CRIANDO…" />
    </form>
  );
}
