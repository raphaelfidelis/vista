import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpenses1790541464169 implements MigrationInterface {
  name = 'CreateExpenses1790541464169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "expenseCategories" ("id" uuid NOT NULL, "name" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_b25552546cc9166eea9cdd4b2b3" UNIQUE ("name"), CONSTRAINT "PK_d9becb3aa7d4d423e1c8bd01ac2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" uuid NOT NULL, "description" text NOT NULL, "amountInCents" integer NOT NULL, "date" date NOT NULL, "categoryId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_280137355ed0f561f9aee0ac2c" ON "expenses"  ("date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac0801a1760c5f9ce43c03bacd" ON "expenses"  ("categoryId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0" FOREIGN KEY ("categoryId") REFERENCES "expenseCategories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac0801a1760c5f9ce43c03bacd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_280137355ed0f561f9aee0ac2c"`,
    );
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TABLE "expenseCategories"`);
  }
}
