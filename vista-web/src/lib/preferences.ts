import { accents, defaultAccent } from '@/lib/accents';

export const NAV_COOKIE = 'vista.nav';
export const ACCENT_COOKIE = 'vista.accent';

export function readAccent(value: string | undefined): string {
  return value && accents.some((accent) => accent.value === value)
    ? value
    : defaultAccent;
}

export function readCollapsed(value: string | undefined): boolean {
  return value === 'collapsed';
}
