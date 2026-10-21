import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBudgetsAndGoals1791739037161 implements MigrationInterface {
  name = 'AddBudgetsAndGoals1791739037161';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "budgetLimits" ("categoryId" uuid NOT NULL, "amountInCents" integer NOT NULL, CONSTRAINT "PK_4f14e3607d391158c36a29ef64c" PRIMARY KEY ("categoryId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "budgetOverrides" ("categoryId" uuid NOT NULL, "month" text NOT NULL, "amountInCents" integer NOT NULL, CONSTRAINT "PK_54ecc7123ba2b3b7b97922a0e02" PRIMARY KEY ("categoryId", "month"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "goals" ("id" uuid NOT NULL, "name" text NOT NULL, "targetInCents" integer NOT NULL, "deadline" text, "accountId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_8d56e21d2bf0214932ae72d49e0" UNIQUE ("accountId"), CONSTRAINT "REL_8d56e21d2bf0214932ae72d49e" UNIQUE ("accountId"), CONSTRAINT "PK_26e17b251afab35580dff769223" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgetLimits" ADD CONSTRAINT "FK_4f14e3607d391158c36a29ef64c" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgetOverrides" ADD CONSTRAINT "FK_9ac992a67a4c3bb12e994953ab1" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" ADD CONSTRAINT "FK_8d56e21d2bf0214932ae72d49e0" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "FK_8d56e21d2bf0214932ae72d49e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgetOverrides" DROP CONSTRAINT "FK_9ac992a67a4c3bb12e994953ab1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgetLimits" DROP CONSTRAINT "FK_4f14e3607d391158c36a29ef64c"`,
    );
    await queryRunner.query(`DROP TABLE "goals"`);
    await queryRunner.query(`DROP TABLE "budgetOverrides"`);
    await queryRunner.query(`DROP TABLE "budgetLimits"`);
  }
}
