import { modules } from '@/lib/modules';
import { WEATHER_ICONS } from '@/lib/weather';

export const BRAND_ICON = 'stacks';

const iconNames = [
  ...new Set([
    BRAND_ICON,
    ...modules.map((module) => module.icon),
    ...WEATHER_ICONS,
  ]),
].sort();

/**
 * Pede ao Google só os glifos usados: a fonte completa tem ~320 KB, o subset
 * poucos KB. A lista vem dos registros de módulos e de clima, então um ícone
 * novo em qualquer um deles não exige mexer aqui.
 */
export const ICON_FONT_URL = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=${iconNames.join(',')}&display=block`;
