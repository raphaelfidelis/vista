import { CategoryKind } from '../Category';

export const FIND_CATEGORIES_QUERY = Symbol('FindCategoriesQuery');

export interface CategoryDto {
  id: string;
  name: string;
  kind: CategoryKind;
  createdAt: string;
}

export interface FindCategoriesQuery {
  /** Por nome; sem o tipo, as duas listas. */
  execute(userId: string, kind?: CategoryKind): Promise<CategoryDto[]>;
}
