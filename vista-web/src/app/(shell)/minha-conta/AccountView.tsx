'use client';

import { useActionState } from 'react';
import { secondaryButton } from '@/components/buttons';
import { Field, fieldClass, FormError } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import {
  MAX_PASSWORD_LENGTH,
  MAX_USER_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  type User,
} from '@/lib/auth';
import { initialFormState } from '@/lib/form';
import { changePassword, logout, rename } from './actions';

type AccountViewProps = {
  user: User;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex max-w-md flex-col gap-3">
      <h2 className="text-dim text-[10px] tracking-[0.22em]">{title}</h2>
      {children}
    </section>
  );
}

function NameForm({ user }: AccountViewProps) {
  const [state, action] = useActionState(rename, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="NOME">
        <input
          name="name"
          type="text"
          autoComplete="name"
          maxLength={MAX_USER_NAME_LENGTH}
          defaultValue={state.values?.name ?? user.name}
          required
          className={fieldClass}
        />
      </Field>
      <Field label="E-MAIL">
        <input
          type="email"
          value={user.email}
          readOnly
          disabled
          className={`${fieldClass} text-muted`}
        />
      </Field>
      <FormError message={state.error} />
      <div>
        <SubmitButton label="SALVAR NOME" />
      </div>
    </form>
  );
}

function PasswordForm({ user }: AccountViewProps) {
  const [state, action] = useActionState(changePassword, initialFormState);
  const passwordField = {
    type: 'password',
    minLength: MIN_PASSWORD_LENGTH,
    maxLength: MAX_PASSWORD_LENGTH,
    autoComplete: 'new-password',
    required: true,
    className: fieldClass,
  } as const;

  return (
    <form action={action} className="flex flex-col gap-4">
      {user.hasPassword ? (
        <Field label="SENHA ATUAL">
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            maxLength={MAX_PASSWORD_LENGTH}
            required
            className={fieldClass}
          />
        </Field>
      ) : (
        <p className="text-secondary text-sm">
          Sua conta entra pelo Google. Defina uma senha para entrar também com o
          e-mail.
        </p>
      )}
      <Field label={`NOVA SENHA · MÍNIMO ${MIN_PASSWORD_LENGTH} CARACTERES`}>
        <input name="newPassword" {...passwordField} />
      </Field>
      <Field label="REPITA A NOVA SENHA">
        <input name="confirmPassword" {...passwordField} />
      </Field>
      <FormError message={state.error} />
      {state.values?.done && (
        <p role="status" className="text-accent text-xs">
          Senha trocada. As outras sessões abertas foram encerradas.
        </p>
      )}
      <div>
        <SubmitButton
          label={user.hasPassword ? 'TROCAR SENHA' : 'DEFINIR SENHA'}
        />
      </div>
    </form>
  );
}

export function AccountView({ user }: AccountViewProps) {
  return (
    <>
      <Section title="PERFIL">
        <NameForm user={user} />
      </Section>
      <Section title="SENHA">
        <PasswordForm user={user} />
      </Section>
      <Section title="SESSÃO">
        <form action={logout}>
          <button type="submit" className={secondaryButton}>
            <span aria-hidden className="icon text-[16px]">
              logout
            </span>
            SAIR
          </button>
        </form>
      </Section>
    </>
  );
}
