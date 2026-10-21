/** Limites que a API também aplica: aqui só para o navegador avisar antes de enviar. */
export const MAX_USER_NAME_LENGTH = 60;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_INVITE_LENGTH = 128;

export type User = {
  id: string;
  name: string;
  email: string;
  /** Falso para quem criou a conta com o Google. */
  hasPassword: boolean;
};

export type SessionResult = {
  token: string;
  /** ISO 8601 */
  expiresAt: string;
};
