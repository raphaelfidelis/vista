import { FinanceValidationError } from './Errors/FinanceValidation.error';

/** Limite de uma coluna `integer` do Postgres: acima disso o banco falharia com 500. */
export const MAX_AMOUNT_IN_CENTS = 2_147_483_647;

/** Valor de lançamento: centavos inteiros, maior que zero. */
export function validPositiveAmount(value: number): number {
  const valid =
    Number.isInteger(value) && value > 0 && value <= MAX_AMOUNT_IN_CENTS;

  if (!valid) {
    throw new FinanceValidationError(
      'O valor deve ser um número inteiro de centavos maior que zero',
    );
  }

  return value;
}

/** Valor que pode ser negativo (saldo inicial, ajuste): centavos inteiros dentro do limite do banco. */
export function validSignedAmount(value: number): number {
  if (!Number.isInteger(value) || Math.abs(value) > MAX_AMOUNT_IN_CENTS) {
    throw new FinanceValidationError(
      'O valor deve ser um número inteiro de centavos',
    );
  }

  return value;
}
