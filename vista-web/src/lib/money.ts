const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCents(cents: number): string {
  return formatter.format(cents / 100);
}

/** `1.234,56`, `1234,5` e `1234` (com ou sem `R$`) viram centavos inteiros, sem passar por float. */
export function parseCents(text: string): number | null {
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(
    text.trim().replace(/^R\$\s*/, ''),
  );

  if (!match) {
    return null;
  }

  const reais = Number((match[1] ?? '').replaceAll('.', ''));
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  const total = reais * 100 + cents;

  return Number.isSafeInteger(total) ? total : null;
}

function percent(fraction: number): string {
  return (fraction * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/** Fração (0.125) como `+12,5%`; `null` quando não há base de comparação. */
export function formatChange(change: number | null): string {
  if (change === null) {
    return '—';
  }

  return `${change > 0 ? '+' : ''}${percent(change)}%`;
}

/** Fração de 0 a 1 como `12,5%`. */
export function formatShare(share: number | null): string {
  return share === null ? '—' : `${percent(share)}%`;
}

/** Centavos como texto de campo: `1230` → `12,30`. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** Como `parseCents`, mas aceita sinal (`-50,00`): saldo inicial e ajuste podem ser negativos. */
export function parseSignedCents(text: string): number | null {
  const trimmed = text.trim();
  const negative = trimmed.startsWith('-');
  const cents = parseCents(trimmed.replace(/^[-+]\s*/, ''));

  if (cents === null) {
    return null;
  }

  return negative && cents !== 0 ? -cents : cents;
}

/** Centavos com sinal explícito: `+R$ 10,00` / `−R$ 10,00`. */
export function formatSignedCents(cents: number): string {
  const sign = cents > 0 ? '+' : cents < 0 ? '−' : '';

  return `${sign}${formatCents(Math.abs(cents))}`;
}
