import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToPosts1709070000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to posts table
        await queryRunner.query(`
            ALTER TABLE "posts" 
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "deleted_by" UUID,
            ADD COLUMN IF NOT EXISTS "deletion_reason" TEXT,
            ADD COLUMN IF NOT EXISTS "admin_notes" TEXT
        `);

        // Add foreign key constraint for deleted_by
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_posts_deleted_by'
                ) THEN
                    ALTER TABLE "posts"
                    ADD CONSTRAINT "FK_posts_deleted_by" 
                    FOREIGN KEY ("deleted_by") 
                    REFERENCES "users"("id") 
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        // Create index on deleted_at
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_posts_deleted_at" ON "posts" ("deleted_at")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_deleted_at"`);

        // Drop foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "posts" 
            DROP CONSTRAINT IF EXISTS "FK_posts_deleted_by"
        `);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "posts" 
            DROP COLUMN IF EXISTS "admin_notes",
            DROP COLUMN IF EXISTS "deletion_reason",
            DROP COLUMN IF EXISTS "deleted_by",
            DROP COLUMN IF EXISTS "deleted_at"
        `);
    }
}
