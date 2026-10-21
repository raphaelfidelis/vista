import { CategoryKind } from './Category';

/**
 * Categorias com que toda conta nasce; o usuário renomeia e exclui à vontade.
 * A migration AddDefaultCategories repete esta lista para as contas que já
 * existiam: se mudar aqui, as contas antigas não mudam.
 */
export const DEFAULT_CATEGORIES: readonly {
  kind: CategoryKind;
  name: string;
}[] = [
  { kind: 'EXPENSE', name: 'Moradia' },
  { kind: 'EXPENSE', name: 'Mercado' },
  { kind: 'EXPENSE', name: 'Alimentação' },
  { kind: 'EXPENSE', name: 'Transporte' },
  { kind: 'EXPENSE', name: 'Saúde' },
  { kind: 'EXPENSE', name: 'Educação' },
  { kind: 'EXPENSE', name: 'Lazer' },
  { kind: 'EXPENSE', name: 'Assinaturas' },
  { kind: 'EXPENSE', name: 'Compras' },
  { kind: 'EXPENSE', name: 'Contas e serviços' },
  { kind: 'EXPENSE', name: 'Impostos e taxas' },
  { kind: 'EXPENSE', name: 'Outros' },
  { kind: 'INCOME', name: 'Salário' },
  { kind: 'INCOME', name: 'Renda extra' },
  { kind: 'INCOME', name: 'Rendimentos' },
  { kind: 'INCOME', name: 'Reembolsos' },
  { kind: 'INCOME', name: 'Outros' },
];
