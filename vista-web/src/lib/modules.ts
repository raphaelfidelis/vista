export type Module = {
  name: string;
  description: string;
  icon: string;
  href: string;
};

export const modules: Module[] = [
  {
    name: 'VISÃO GERAL',
    description: 'o mês, os alertas e o que vem pela frente',
    icon: 'space_dashboard',
    href: '/visao-geral',
  },
  {
    name: 'LANÇAMENTOS',
    description: 'receitas, despesas e transferências',
    icon: 'receipt_long',
    href: '/lancamentos',
  },
  {
    name: 'CARTÕES',
    description: 'faturas, parcelas e limites',
    icon: 'credit_card',
    href: '/cartoes',
  },
  {
    name: 'CONTAS',
    description: 'saldos e reservas',
    icon: 'account_balance',
    href: '/contas',
  },
  {
    name: 'ORÇAMENTO',
    description: 'limites por categoria',
    icon: 'donut_large',
    href: '/orcamento',
  },
  {
    name: 'METAS',
    description: 'quanto falta para chegar lá',
    icon: 'flag',
    href: '/metas',
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
