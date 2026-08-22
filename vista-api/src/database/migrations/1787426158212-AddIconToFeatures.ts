import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIconToFeatures1787426158212 implements MigrationInterface {
  name = 'AddIconToFeatures1787426158212';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "features" ADD "icon" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "features" DROP COLUMN "icon"`);
  }
}
