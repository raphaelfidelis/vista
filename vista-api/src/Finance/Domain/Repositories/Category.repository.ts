import { Category, CategoryKind } from '../Category';

export const CATEGORY_REPOSITORY = Symbol('CategoryRepository');

export interface CategoryRepository {
  /** Por nome; sem o tipo, as duas listas. */
  findAll(userId: string, kind?: CategoryKind): Promise<Category[]>;
  findById(userId: string, id: string): Promise<Category | null>;
  /** Dentro do mesmo tipo e sem diferenciar maiúsculas de minúsculas. */
  findByName(
    userId: string,
    name: string,
    kind: CategoryKind,
  ): Promise<Category | null>;
  save(category: Category): Promise<void>;
  delete(userId: string, id: string): Promise<void>;
}
