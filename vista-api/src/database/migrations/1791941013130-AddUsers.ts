import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsers1791941013130 implements MigrationInterface {
  name = 'AddUsers1791941013130';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b8a6a8d1219e4f73b371fbc074"`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "name" text NOT NULL, "email" text NOT NULL, "passwordHash" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL, "userId" uuid NOT NULL, "tokenHash" text NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_bace6c68efc156fddac9b14bda2" UNIQUE ("tokenHash"), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_57de40bc620f456c7311aa3a1e" ON "sessions"  ("userId") `,
    );
    await queryRunner.query(`ALTER TABLE "banks" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "budgetLimits" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "budgetOverrides" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "cards" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "goals" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "recurring" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "userId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "banks" DROP CONSTRAINT "UQ_bc680de8ba9d7878fddcecd610c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "UQ_2db43cdbf7bb862e577b5f540c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" DROP CONSTRAINT "UQ_6077bbed1f2d46517bb4f77d134"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_efc3929d8c1573412824a2698c" ON "banks"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d2d51ef712b003549059479aae" ON "banks"  ("userId", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3aa23c0a6d107393e8b40e3e2a" ON "accounts"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f6653d6268c6ed47b4570a16ca" ON "accounts"  ("userId", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13e8b2a21988bec6fdcbb1fa74" ON "categories"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7a866e6eeb03ef48f1e2f31fe3" ON "categories"  ("userId", "kind", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fae4995bb9513912038efeafef" ON "budgetLimits"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f5a300b9c0cf69a5b8f4f33d1" ON "budgetOverrides"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7b7230897ecdeb7d6b0576d907" ON "cards"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5458f63cad6651c43d4d3d2885" ON "cards"  ("userId", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_57dd8a3fc26eb760d076bf8840" ON "goals"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_119d3eb2a55af1916bfde36405" ON "recurring"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6bb58f2b6e30cb51a6504599f4" ON "transactions"  ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "banks" ADD CONSTRAINT "FK_efc3929d8c1573412824a2698c3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgetLimits" ADD CONSTRAINT "FK_fae4995bb9513912038efeafefe" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgetOverrides" ADD CONSTRAINT "FK_8f5a300b9c0cf69a5b8f4f33d1c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "FK_7b7230897ecdeb7d6b0576d907b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" ADD CONSTRAINT "FK_57dd8a3fc26eb760d076bf8840e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" ADD CONSTRAINT "FK_119d3eb2a55af1916bfde364051" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring" DROP CONSTRAINT "FK_119d3eb2a55af1916bfde364051"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "FK_57dd8a3fc26eb760d076bf8840e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" DROP CONSTRAINT "FK_7b7230897ecdeb7d6b0576d907b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgetOverrides" DROP CONSTRAINT "FK_8f5a300b9c0cf69a5b8f4f33d1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgetLimits" DROP CONSTRAINT "FK_fae4995bb9513912038efeafefe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banks" DROP CONSTRAINT "FK_efc3929d8c1573412824a2698c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6bb58f2b6e30cb51a6504599f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_119d3eb2a55af1916bfde36405"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57dd8a3fc26eb760d076bf8840"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5458f63cad6651c43d4d3d2885"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7b7230897ecdeb7d6b0576d907"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8f5a300b9c0cf69a5b8f4f33d1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fae4995bb9513912038efeafef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7a866e6eeb03ef48f1e2f31fe3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13e8b2a21988bec6fdcbb1fa74"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f6653d6268c6ed47b4570a16ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3aa23c0a6d107393e8b40e3e2a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d2d51ef712b003549059479aae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_efc3929d8c1573412824a2698c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "UQ_6077bbed1f2d46517bb4f77d134" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "UQ_2db43cdbf7bb862e577b5f540c8" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "banks" ADD CONSTRAINT "UQ_bc680de8ba9d7878fddcecd610c" UNIQUE ("name")`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "recurring" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "goals" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "cards" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "budgetOverrides" DROP COLUMN "userId"`,
    );
    await queryRunner.query(`ALTER TABLE "budgetLimits" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "banks" DROP COLUMN "userId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57de40bc620f456c7311aa3a1e"`,
    );
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b8a6a8d1219e4f73b371fbc074" ON "categories" USING btree ("kind", "name") `,
    );
  }
}
