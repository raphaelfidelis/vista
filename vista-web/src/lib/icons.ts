import { modules } from '@/lib/modules';

export const BRAND_ICON = 'stacks';

/** Ícones dos botões e indicadores das telas. */
const UI_ICONS = [
  'add',
  'archive',
  'arrow_downward',
  'arrow_upward',
  'check',
  'chevron_left',
  'chevron_right',
  'close',
  'delete',
  'download',
  'edit',
  'logout',
  'more_horiz',
  'payments',
  'search',
  'person',
  'event_repeat',
  'swap_horiz',
  'tune',
  'unarchive',
];

const iconNames = [
  ...new Set([
    BRAND_ICON,
    ...UI_ICONS,
    ...modules.map((module) => module.icon),
  ]),
].sort();

/**
 * Pede ao Google só os glifos usados: a fonte completa tem ~320 KB, o subset
 * poucos KB. A lista vem do registro de módulos e dos ícones de interface
 * acima, então um módulo novo não exige mexer aqui.
 */
export const ICON_FONT_URL = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=${iconNames.join(',')}&display=block`;
