import { AttemptLimiter } from './AttemptLimiter';
import { AuthTooManyAttemptsError } from './Errors/AuthTooManyAttempts.error';

const MINUTE = 60 * 1000;
const T0 = Date.UTC(2026, 9, 13, 12, 0, 0);

function limiter() {
  return new AttemptLimiter(3, 15 * MINUTE);
}

describe('AttemptLimiter', () => {
  it('deixa passar até o máximo e bloqueia a próxima', () => {
    const attempts = limiter();

    for (let i = 0; i < 3; i++) {
      attempts.assertAllowed('a', T0);
      attempts.record('a', T0);
    }

    expect(() => attempts.assertAllowed('a', T0)).toThrow(
      AuthTooManyAttemptsError,
    );
  });

  it('conta cada chave separadamente', () => {
    const attempts = limiter();

    for (let i = 0; i < 3; i++) {
      attempts.record('a', T0);
    }

    expect(() => attempts.assertAllowed('b', T0)).not.toThrow();
  });

  it('informa em quantos segundos libera: quando a tentativa mais antiga sai da janela', () => {
    const attempts = limiter();

    attempts.record('a', T0);
    attempts.record('a', T0 + 5 * MINUTE);
    attempts.record('a', T0 + 6 * MINUTE);

    let error: AuthTooManyAttemptsError | undefined;

    try {
      attempts.assertAllowed('a', T0 + 10 * MINUTE);
    } catch (caught) {
      error = caught as AuthTooManyAttemptsError;
    }

    // A primeira (T0) sai da janela em T0 + 15 min: faltam 5 min.
    expect(error?.retryAfterSeconds).toBe(5 * 60);
  });

  it('libera quando a tentativa mais antiga sai da janela', () => {
    const attempts = limiter();

    for (let i = 0; i < 3; i++) {
      attempts.record('a', T0);
    }

    expect(() => attempts.assertAllowed('a', T0 + 15 * MINUTE - 1)).toThrow();
    expect(() => attempts.assertAllowed('a', T0 + 15 * MINUTE)).not.toThrow();
  });

  it('reset zera a chave', () => {
    const attempts = limiter();

    for (let i = 0; i < 3; i++) {
      attempts.record('a', T0);
    }
    attempts.reset('a');

    expect(() => attempts.assertAllowed('a', T0)).not.toThrow();
  });

  it('descarta as chaves mais antigas quando passa de 10 mil', () => {
    const attempts = new AttemptLimiter(1, 15 * MINUTE);

    for (let i = 0; i <= 10_000; i++) {
      attempts.record('chave-' + i, T0);
    }

    // A primeira foi descartada; a última continua bloqueada.
    expect(() => attempts.assertAllowed('chave-0', T0)).not.toThrow();
    expect(() => attempts.assertAllowed('chave-10000', T0)).toThrow();
  });
});
