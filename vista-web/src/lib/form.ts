/**
 * Resultado de uma Server Action de formulário: `error` é a mensagem da API
 * para o usuário. Em erro, `values` devolve o que foi enviado: o React limpa
 * o formulário ao fim da action, e quem digitou não deve perder o texto.
 */
export type FormState = {
  error: string | null;
  values?: Record<string, string>;
};

export const initialFormState: FormState = { error: null };
