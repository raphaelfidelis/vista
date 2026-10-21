import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Escrita à mão. Dá as categorias padrão às contas que já existiam e ainda não
 * têm nenhuma categoria (as novas ganham no cadastro, pelo DefaultCategoriesSetup).
 * A lista é a de DEFAULT_CATEGORIES nesta data, por extenso: migration é
 * retrato do passado e não muda quando a lista mudar.
 */
export class AddDefaultCategories1792700000000 implements MigrationInterface {
  name = 'AddDefaultCategories1792700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "categories" ("id", "userId", "name", "kind", "createdAt")
      SELECT gen_random_uuid(), "users"."id", "defaults"."name", "defaults"."kind", now()
      FROM "users"
      CROSS JOIN (VALUES
        ('Moradia', 'EXPENSE'),
        ('Mercado', 'EXPENSE'),
        ('Alimentação', 'EXPENSE'),
        ('Transporte', 'EXPENSE'),
        ('Saúde', 'EXPENSE'),
        ('Educação', 'EXPENSE'),
        ('Lazer', 'EXPENSE'),
        ('Assinaturas', 'EXPENSE'),
        ('Compras', 'EXPENSE'),
        ('Contas e serviços', 'EXPENSE'),
        ('Impostos e taxas', 'EXPENSE'),
        ('Outros', 'EXPENSE'),
        ('Salário', 'INCOME'),
        ('Renda extra', 'INCOME'),
        ('Rendimentos', 'INCOME'),
        ('Reembolsos', 'INCOME'),
        ('Outros', 'INCOME')
      ) AS "defaults" ("name", "kind")
      WHERE NOT EXISTS (
        SELECT 1 FROM "categories" WHERE "categories"."userId" = "users"."id"
      )
    `);
  }

  /** Não desfaz: depois de criadas, as categorias são do usuário (podem ter lançamentos). */
  public async down(): Promise<void> {}
}
