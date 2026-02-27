import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsAdminToUsers1709012000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "is_admin" boolean NOT NULL DEFAULT false
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_is_admin" ON "users" ("is_admin")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_admin"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_admin"`);
    }
}
