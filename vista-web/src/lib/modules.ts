export type Module = {
  name: string;
  description: string;
  icon: string;
  href: string;
};

export const modules: Module[] = [
  {
    name: 'MOCK',
    description: 'módulo de exemplo',
    icon: 'widgets',
    href: '/mock',
  },
];

export function moduleIndex(position: number): string {
  return String(position + 1).padStart(2, '0');
}
