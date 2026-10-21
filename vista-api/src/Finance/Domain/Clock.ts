export const CLOCK = Symbol('Clock');

/** Quem sabe a data de hoje: troca-se por um relógio fixo nos testes. */
export interface Clock {
  /** AAAA-MM-DD, no fuso de São Paulo. */
  today(): string;
}
