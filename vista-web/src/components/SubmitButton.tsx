'use client';

import { useFormStatus } from 'react-dom';
import { primaryButton } from '@/components/buttons';

type SubmitButtonProps = {
  label: string;
  /** Texto enquanto a ação roda. */
  pendingLabel?: string;
};

export function SubmitButton({
  label,
  pendingLabel = 'SALVANDO…',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primaryButton} w-full md:w-auto`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
