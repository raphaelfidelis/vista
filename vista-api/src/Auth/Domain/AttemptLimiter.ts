import { AuthTooManyAttemptsError } from './Errors/AuthTooManyAttempts.error';

/** Chaves guardadas ao mesmo tempo: passou disso, descarta as mais antigas. */
const MAX_KEYS = 10_000;

/**
 * Limita tentativas por chave (e-mail, IP, usuário) numa janela deslizante.
 * Vive em memória: reiniciar a API zera os contadores. O relógio entra por
 * parâmetro, para o teste ser determinístico.
 */
export class AttemptLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
  ) {}

  /** Lança AuthTooManyAttemptsError enquanto a chave estiver no limite. */
  assertAllowed(key: string, now: number): void {
    const recent = this.recent(key, now);

    if (recent.length >= this.maxAttempts) {
      const unblockAt = recent[0] + this.windowMs;

      throw new AuthTooManyAttemptsError(Math.ceil((unblockAt - now) / 1000));
    }
  }

  record(key: string, now: number): void {
    const recent = this.recent(key, now);

    recent.push(now);
    // Reinsere para a chave mais usada ficar por último e sobreviver à poda.
    this.attempts.delete(key);
    this.attempts.set(key, recent);

    if (this.attempts.size > MAX_KEYS) {
      const oldest = this.attempts.keys().next().value;

      if (oldest !== undefined) {
        this.attempts.delete(oldest);
      }
    }
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  private recent(key: string, now: number): number[] {
    const since = now - this.windowMs;

    return (this.attempts.get(key) ?? []).filter((time) => time > since);
  }
}
