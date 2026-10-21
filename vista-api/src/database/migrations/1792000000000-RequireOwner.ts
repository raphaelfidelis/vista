import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Escrita à mão. Os dados de antes do login (userId nulo) passam para a única
 * conta que existe, e o dono vira obrigatório em todas as tabelas. Com mais
 * de uma conta, ou nenhuma, para sem mudar nada: não dá para adivinhar de quem são.
 * Cada instrução está por extenso: nada de SQL montado com texto.
 */
const ORPHAN_COUNTS = [
  'SELECT COUNT(*)::int AS "count" FROM "banks" WHERE "userId" IS NULL',
  'SELECT COUNT(*)::int AS "count" FROM "categories" WHERE "userId" IS NULL',
  'SELECT COUNT(*)::int AS "count" FROM "accounts" WHERE "userId" IS NULL',
  'SELECT COUNT(*)::int AS "count" FROM "cards" WHERE "userId" IS NULL',
  'SELECT COUNT(*)::int AS "count" FROM "transactions" WHERE "userId" IS NULL',
  'SELECT COUNT(*)::int AS "count" FROM "recurring" WHERE "userId" IS NULL',
  'SELECT COUNT(*)::int AS "count" FROM "budgetLimits" WHERE "userId" IS NULL',
  'SELECT COUNT(*)::int AS "count" FROM "budgetOverrides" WHERE "userId" IS NULL',
  'SELECT COUNT(*)::int AS "count" FROM "goals" WHERE "userId" IS NULL',
];

const ADOPT = [
  'UPDATE "banks" SET "userId" = $1 WHERE "userId" IS NULL',
  'UPDATE "categories" SET "userId" = $1 WHERE "userId" IS NULL',
  'UPDATE "accounts" SET "userId" = $1 WHERE "userId" IS NULL',
  'UPDATE "cards" SET "userId" = $1 WHERE "userId" IS NULL',
  'UPDATE "transactions" SET "userId" = $1 WHERE "userId" IS NULL',
  'UPDATE "recurring" SET "userId" = $1 WHERE "userId" IS NULL',
  'UPDATE "budgetLimits" SET "userId" = $1 WHERE "userId" IS NULL',
  'UPDATE "budgetOverrides" SET "userId" = $1 WHERE "userId" IS NULL',
  'UPDATE "goals" SET "userId" = $1 WHERE "userId" IS NULL',
];

const REQUIRE = [
  'ALTER TABLE "banks" ALTER COLUMN "userId" SET NOT NULL',
  'ALTER TABLE "categories" ALTER COLUMN "userId" SET NOT NULL',
  'ALTER TABLE "accounts" ALTER COLUMN "userId" SET NOT NULL',
  'ALTER TABLE "cards" ALTER COLUMN "userId" SET NOT NULL',
  'ALTER TABLE "transactions" ALTER COLUMN "userId" SET NOT NULL',
  'ALTER TABLE "recurring" ALTER COLUMN "userId" SET NOT NULL',
  'ALTER TABLE "budgetLimits" ALTER COLUMN "userId" SET NOT NULL',
  'ALTER TABLE "budgetOverrides" ALTER COLUMN "userId" SET NOT NULL',
  'ALTER TABLE "goals" ALTER COLUMN "userId" SET NOT NULL',
];

const RELAX = [
  'ALTER TABLE "banks" ALTER COLUMN "userId" DROP NOT NULL',
  'ALTER TABLE "categories" ALTER COLUMN "userId" DROP NOT NULL',
  'ALTER TABLE "accounts" ALTER COLUMN "userId" DROP NOT NULL',
  'ALTER TABLE "cards" ALTER COLUMN "userId" DROP NOT NULL',
  'ALTER TABLE "transactions" ALTER COLUMN "userId" DROP NOT NULL',
  'ALTER TABLE "recurring" ALTER COLUMN "userId" DROP NOT NULL',
  'ALTER TABLE "budgetLimits" ALTER COLUMN "userId" DROP NOT NULL',
  'ALTER TABLE "budgetOverrides" ALTER COLUMN "userId" DROP NOT NULL',
  'ALTER TABLE "goals" ALTER COLUMN "userId" DROP NOT NULL',
];

export class RequireOwner1792000000000 implements MigrationInterface {
  name = 'RequireOwner1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    let orphans = 0;

    for (const sql of ORPHAN_COUNTS) {
      const [row] = (await queryRunner.query(sql)) as { count: number }[];
      orphans += row?.count ?? 0;
    }

    if (orphans > 0) {
      const users = (await queryRunner.query('SELECT "id" FROM "users"')) as {
        id: string;
      }[];

      if (users.length !== 1) {
        throw new Error(
          `Há ${orphans} registro(s) sem dono e ${users.length} conta(s). ` +
            'Crie só a sua conta (e nenhuma outra) e rode a migration de novo.',
        );
      }

      for (const sql of ADOPT) {
        await queryRunner.query(sql, [users[0].id]);
      }
    }

    for (const sql of REQUIRE) {
      await queryRunner.query(sql);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const sql of RELAX) {
      await queryRunner.query(sql);
    }
  }
}
