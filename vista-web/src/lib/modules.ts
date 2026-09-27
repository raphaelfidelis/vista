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

/** Sub-rotas contam como o módulo: `/clima/semana` ativa `/clima`. */
export function isActiveModule(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findActiveModule(pathname: string): Module | undefined {
  return modules.find((module) => isActiveModule(pathname, module.href));
}
