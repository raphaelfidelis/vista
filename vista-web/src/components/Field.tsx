import type { ReactNode } from 'react';

export const fieldClass =
  'bg-item text-primary placeholder:text-dim focus:outline-accent w-full px-3 py-2.5 text-base outline-offset-0 focus:outline-2 md:text-sm';

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-dim text-[10px] tracking-[0.2em]">{label}</span>
      {children}
    </label>
  );
}

type FormErrorProps = {
  message: string | null;
};

export function FormError({ message }: FormErrorProps) {
  return message === null ? null : (
    <p role="alert" className="text-accent text-xs">
      {message}
    </p>
  );
}
