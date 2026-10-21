import { AuthValidationError } from './Errors/AuthValidation.error';

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Só o tamanho conta, sem regra de composição (NIST 800-63B). `email` é o da
 * conta: usá-lo como senha é o primeiro palpite de qualquer ataque.
 */
export function validPassword(password: string, email: string): string {
  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    throw new AuthValidationError(
      `A senha deve ter de ${MIN_PASSWORD_LENGTH} a ${MAX_PASSWORD_LENGTH} caracteres`,
    );
  }

  if (password.trim().toLowerCase() === email) {
    throw new AuthValidationError('A senha não pode ser igual ao e-mail');
  }

  return password;
}
