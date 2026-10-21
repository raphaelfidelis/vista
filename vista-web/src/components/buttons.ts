const base =
  'inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2 text-[11px] font-bold tracking-[0.1em] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40';

export const primaryButton = `${base} bg-accent text-on-accent`;

export const secondaryButton = `${base} bg-item text-secondary hover:bg-item-hover hover:text-primary`;

/** Botão de ícone dentro de linhas: 40 px no celular (alvo de toque), 32 no computador. */
export const iconButton =
  'bg-item text-secondary hover:bg-item-hover hover:text-primary flex size-10 cursor-pointer items-center justify-center md:size-8';
