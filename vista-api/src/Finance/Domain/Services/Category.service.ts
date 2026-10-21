import { NewCategory } from '../Category';
import { CategoryDto } from '../Queries/FindCategories.query';

export const CATEGORY_SERVICE = Symbol('CategoryService');

/** O dono vem da sessão, nunca do corpo. */
export type CreateCategoryInput = Omit<NewCategory, 'userId'>;

/** O tipo não muda: só o nome. */
export interface RenameCategoryInput {
  name: string;
}

export interface CategoryService {
  create(userId: string, input: CreateCategoryInput): Promise<CategoryDto>;
  rename(
    userId: string,
    id: string,
    input: RenameCategoryInput,
  ): Promise<CategoryDto>;
  /** Recusa remover categoria usada por lançamentos ou gastos fixos. */
  remove(userId: string, id: string): Promise<void>;
}
