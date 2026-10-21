import { Field, fieldClass } from '@/components/Field';

type MoneyInputProps = {
  defaultValue?: string;
  label?: string;
  required?: boolean;
};

/** Texto livre (`1.234,56`): quem converte para centavos é a Server Action. */
export function MoneyInput({
  defaultValue,
  label = 'VALOR (R$)',
  required = true,
}: MoneyInputProps) {
  return (
    <Field label={label}>
      <input
        name="amount"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        defaultValue={defaultValue}
        required={required}
        className={fieldClass}
      />
    </Field>
  );
}
