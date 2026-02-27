import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToUsers1709060000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to users table
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "suspended_until" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "suspended_reason" TEXT,
            ADD COLUMN IF NOT EXISTS "banned_at" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "banned_reason" TEXT,
            ADD COLUMN IF NOT EXISTS "admin_notes" TEXT,
            ADD COLUMN IF NOT EXISTS "last_activity_at" TIMESTAMP
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_suspended_until" ON "users" ("suspended_until")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_banned_at" ON "users" ("banned_at")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_last_activity_at" ON "users" ("last_activity_at" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_last_activity_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_banned_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_suspended_until"`);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "last_activity_at",
            DROP COLUMN IF EXISTS "admin_notes",
            DROP COLUMN IF EXISTS "banned_reason",
            DROP COLUMN IF EXISTS "banned_at",
            DROP COLUMN IF EXISTS "suspended_reason",
            DROP COLUMN IF EXISTS "suspended_until"
        `);
    }
}
