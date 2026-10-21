export const ACCOUNT_SETUP = Symbol('AccountSetup');

/**
 * O que acontece com uma conta recém-criada (ex.: as categorias padrão).
 * Quem implementa é o módulo dono dos dados; o Auth só avisa que a conta nasceu.
 */
export interface AccountSetup {
  prepare(userId: string): Promise<void>;
}
