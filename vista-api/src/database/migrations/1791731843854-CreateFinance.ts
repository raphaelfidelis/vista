import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFinance1791731843854 implements MigrationInterface {
  name = 'CreateFinance1791731843854';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "banks" ("id" uuid NOT NULL, "name" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_bc680de8ba9d7878fddcecd610c" UNIQUE ("name"), CONSTRAINT "PK_3975b5f684ec241e3901db62d77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL, "name" text NOT NULL, "type" text NOT NULL, "bankId" uuid, "initialBalanceInCents" integer NOT NULL, "initialBalanceDate" date NOT NULL, "archived" boolean NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_2db43cdbf7bb862e577b5f540c8" UNIQUE ("name"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_284431ab046a654132d200a6b4" ON "accounts"  ("bankId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL, "name" text NOT NULL, "kind" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b8a6a8d1219e4f73b371fbc074" ON "categories"  ("kind", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "recurring" ("id" uuid NOT NULL, "description" text NOT NULL, "kind" text NOT NULL, "categoryId" uuid NOT NULL, "accountId" uuid NOT NULL, "amountInCents" integer, "variableAmount" boolean NOT NULL, "dueDay" smallint NOT NULL, "active" boolean NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_acc6dc70e758d53730436620b79" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_732132b1fd40941d12824804f5" ON "recurring"  ("categoryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1c3b27e5abf6c582aea8bc7eac" ON "recurring"  ("accountId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL, "kind" text NOT NULL, "description" text NOT NULL, "amountInCents" integer NOT NULL, "date" date NOT NULL, "categoryId" uuid, "accountId" uuid NOT NULL, "toAccountId" uuid, "recurringId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d66471a99dd3836e1528d39a1e" ON "transactions"  ("date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86e965e74f9cc66149cf6c90f6" ON "transactions"  ("categoryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_26d8aec71ae9efbe468043cd2b" ON "transactions"  ("accountId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b21fbaa4a042efac978a5252c" ON "transactions"  ("toAccountId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2dbb10ac2732f4875805648f1e" ON "transactions"  ("recurringId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_284431ab046a654132d200a6b49" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" ADD CONSTRAINT "FK_732132b1fd40941d12824804f5a" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" ADD CONSTRAINT "FK_1c3b27e5abf6c582aea8bc7eacb" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_86e965e74f9cc66149cf6c90f64" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_0b21fbaa4a042efac978a5252cf" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_2dbb10ac2732f4875805648f1e8" FOREIGN KEY ("recurringId") REFERENCES "recurring"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_2dbb10ac2732f4875805648f1e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_0b21fbaa4a042efac978a5252cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_86e965e74f9cc66149cf6c90f64"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" DROP CONSTRAINT "FK_1c3b27e5abf6c582aea8bc7eacb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" DROP CONSTRAINT "FK_732132b1fd40941d12824804f5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_284431ab046a654132d200a6b49"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2dbb10ac2732f4875805648f1e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b21fbaa4a042efac978a5252c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26d8aec71ae9efbe468043cd2b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_86e965e74f9cc66149cf6c90f6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d66471a99dd3836e1528d39a1e"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1c3b27e5abf6c582aea8bc7eac"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_732132b1fd40941d12824804f5"`,
    );
    await queryRunner.query(`DROP TABLE "recurring"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b8a6a8d1219e4f73b371fbc074"`,
    );
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_284431ab046a654132d200a6b4"`,
    );
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TABLE "banks"`);
  }
}
