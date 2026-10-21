import { AuthValidationError } from './Errors/AuthValidation.error';
import { User } from './User';

describe('User', () => {
  describe('create', () => {
    it('cria sem senha (quem entra só com o Google)', () => {
      const user = User.create({ name: 'Maria', email: 'maria@exemplo.com' });

      expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(user.passwordHash).toBeNull();
      expect(user.hasPassword).toBe(false);
    });

    it('guarda o e-mail aparado e em minúsculas', () => {
      const user = User.create({
        name: 'Maria',
        email: '  Maria.Silva@Exemplo.COM ',
      });

      expect(user.email).toBe('maria.silva@exemplo.com');
    });

    it('apara o nome', () => {
      expect(User.create({ name: '  Maria  ', email: 'm@e.co' }).name).toBe(
        'Maria',
      );
    });

    it.each(['', '   ', 'sem-arroba', 'a@b', '@e.co', 'a b@e.co', 'a@@e.co'])(
      'recusa o e-mail %p',
      (email) => {
        expect(() => User.create({ name: 'Maria', email })).toThrow(
          AuthValidationError,
        );
      },
    );

    it('recusa e-mail com mais de 254 caracteres', () => {
      const email = 'a'.repeat(250) + '@e.co';

      expect(() => User.create({ name: 'Maria', email })).toThrow(
        /e-mail válido/,
      );
    });

    it('aceita nome com 60 caracteres e recusa 61', () => {
      expect(() =>
        User.create({ name: 'n'.repeat(60), email: 'm@e.co' }),
      ).not.toThrow();
      expect(() =>
        User.create({ name: 'n'.repeat(61), email: 'm@e.co' }),
      ).toThrow(/até 60 caracteres/);
    });

    it('recusa nome vazio', () => {
      expect(() => User.create({ name: '   ', email: 'm@e.co' })).toThrow(
        /nome é obrigatório/,
      );
    });
  });

  describe('senha', () => {
    it('definir o hash passa a ter senha', () => {
      const user = User.create({ name: 'Maria', email: 'm@e.co' });

      user.changePasswordHash('$argon2id$...');

      expect(user.hasPassword).toBe(true);
      expect(user.passwordHash).toBe('$argon2id$...');
    });
  });

  describe('nome', () => {
    it('troca validando', () => {
      const user = User.create({ name: 'Maria', email: 'm@e.co' });

      user.name = '  Maria Silva ';
      expect(user.name).toBe('Maria Silva');
      expect(() => (user.name = '')).toThrow(AuthValidationError);
      expect(user.name).toBe('Maria Silva');
    });
  });

  describe('normalizeEmail', () => {
    it('não valida: serve para procurar um e-mail qualquer', () => {
      expect(User.normalizeEmail('  QUALQUER COISA ')).toBe('qualquer coisa');
    });
  });
});
