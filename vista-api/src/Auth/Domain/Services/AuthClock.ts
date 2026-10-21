export const AUTH_CLOCK = Symbol('AuthClock');

/** O instante atual: troca-se por um relógio fixo nos testes. */
export interface AuthClock {
  now(): Date;
}
