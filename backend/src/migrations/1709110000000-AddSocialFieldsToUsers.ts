import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocialFieldsToUsers1709110000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add social feature fields to users table
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "rating_average" DECIMAL(2,1) DEFAULT 0.0,
            ADD COLUMN IF NOT EXISTS "rating_count" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "has_trusted_badge" BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS "rating_hidden" BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS "follower_count" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "following_count" INTEGER DEFAULT 0
        `);

        // Create indexes for social fields
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_rating_average" ON "users" ("rating_average" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_trusted_badge" ON "users" ("has_trusted_badge")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_trusted_badge"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_rating_average"`);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "following_count",
            DROP COLUMN IF EXISTS "follower_count",
            DROP COLUMN IF EXISTS "rating_hidden",
            DROP COLUMN IF EXISTS "has_trusted_badge",
            DROP COLUMN IF EXISTS "rating_count",
            DROP COLUMN IF EXISTS "rating_average"
        `);
    }
}
