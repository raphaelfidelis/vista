const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Centavos como "R$ 1.234,56", para as mensagens que o domínio escreve. */
export function formatMoney(cents: number): string {
  return formatter.format(cents / 100);
}
