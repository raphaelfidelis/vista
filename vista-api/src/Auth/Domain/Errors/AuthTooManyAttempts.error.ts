export class AuthTooManyAttemptsError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super(
      `Muitas tentativas. Tente de novo em ${Math.max(1, Math.ceil(retryAfterSeconds / 60))} minuto(s).`,
    );
    this.name = 'AuthTooManyAttemptsError';
  }
}
