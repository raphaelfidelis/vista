import { AuthValidationError } from './Errors/AuthValidation.error';
import { validPassword } from './Password';

const EMAIL = 'maria@exemplo.com';

describe('validPassword', () => {
  it('aceita de 10 a 128 caracteres, sem regra de composição', () => {
    expect(validPassword('a'.repeat(10), EMAIL)).toBe('a'.repeat(10));
    expect(validPassword('a'.repeat(128), EMAIL)).toBe('a'.repeat(128));
    expect(validPassword('só letras minúsculas', EMAIL)).toBe(
      'só letras minúsculas',
    );
  });

  it('recusa menos de 10 caracteres', () => {
    expect(() => validPassword('a'.repeat(9), EMAIL)).toThrow(
      /de 10 a 128 caracteres/,
    );
  });

  it('recusa mais de 128 caracteres', () => {
    expect(() => validPassword('a'.repeat(129), EMAIL)).toThrow(
      AuthValidationError,
    );
  });

  it('recusa a senha igual ao e-mail, mesmo com maiúsculas', () => {
    expect(() => validPassword(EMAIL, EMAIL)).toThrow(/igual ao e-mail/);
    expect(() => validPassword(' MARIA@exemplo.com ', EMAIL)).toThrow(
      /igual ao e-mail/,
    );
  });
});
