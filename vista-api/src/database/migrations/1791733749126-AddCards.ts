import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCards1791733749126 implements MigrationInterface {
  name = 'AddCards1791733749126';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cards" ("id" uuid NOT NULL, "name" text NOT NULL, "bankId" uuid, "closingDay" smallint NOT NULL, "dueDay" smallint NOT NULL, "limitInCents" integer, "archived" boolean NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_6077bbed1f2d46517bb4f77d134" UNIQUE ("name"), CONSTRAINT "PK_5f3269634705fdff4a9935860fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_739a02da6f10aa517d20d6c464" ON "cards"  ("bankId") `,
    );
    await queryRunner.query(`ALTER TABLE "recurring" ADD "cardId" uuid`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "cardId" uuid`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "toCardId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "invoiceMonth" text`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ADD "purchaseId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "installmentNumber" smallint`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "installmentCount" smallint`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" DROP CONSTRAINT "FK_1c3b27e5abf6c582aea8bc7eacb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" ALTER COLUMN "accountId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "accountId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06fb78890d153bfed108448a40" ON "recurring"  ("cardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1dac70b33bf7a903782df5b63" ON "transactions"  ("cardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3495166c656c8646fe2147fffd" ON "transactions"  ("toCardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_58c65011d6dd857227579810eb" ON "transactions"  ("invoiceMonth") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb509b1ed35a90d440d2d3e9ca" ON "transactions"  ("purchaseId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "FK_739a02da6f10aa517d20d6c4648" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" ADD CONSTRAINT "FK_1c3b27e5abf6c582aea8bc7eacb" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" ADD CONSTRAINT "FK_06fb78890d153bfed108448a40a" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_d1dac70b33bf7a903782df5b637" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_3495166c656c8646fe2147fffd6" FOREIGN KEY ("toCardId") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_3495166c656c8646fe2147fffd6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_d1dac70b33bf7a903782df5b637"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" DROP CONSTRAINT "FK_06fb78890d153bfed108448a40a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" DROP CONSTRAINT "FK_1c3b27e5abf6c582aea8bc7eacb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" DROP CONSTRAINT "FK_739a02da6f10aa517d20d6c4648"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb509b1ed35a90d440d2d3e9ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58c65011d6dd857227579810eb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3495166c656c8646fe2147fffd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1dac70b33bf7a903782df5b63"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_06fb78890d153bfed108448a40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "accountId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" ALTER COLUMN "accountId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" ADD CONSTRAINT "FK_1c3b27e5abf6c582aea8bc7eacb" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "installmentCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "installmentNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "purchaseId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "invoiceMonth"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "toCardId"`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "cardId"`);
    await queryRunner.query(`ALTER TABLE "recurring" DROP COLUMN "cardId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_739a02da6f10aa517d20d6c464"`,
    );
    await queryRunner.query(`DROP TABLE "cards"`);
  }
}
