import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToReports1709080000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to reports table
        await queryRunner.query(`
            ALTER TABLE "reports" 
            ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "assigned_to" UUID,
            ADD COLUMN IF NOT EXISTS "resolution_notes" TEXT
        `);

        // Add foreign key constraint for assigned_to
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_reports_assigned_to'
                ) THEN
                    ALTER TABLE "reports"
                    ADD CONSTRAINT "FK_reports_assigned_to" 
                    FOREIGN KEY ("assigned_to") 
                    REFERENCES "users"("id") 
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        // Create index on priority (descending order for high priority first)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_reports_priority" ON "reports" ("priority" DESC)
        `);

        // Create index on assigned_to
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_reports_assigned_to" ON "reports" ("assigned_to")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reports_assigned_to"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reports_priority"`);

        // Drop foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "reports" 
            DROP CONSTRAINT IF EXISTS "FK_reports_assigned_to"
        `);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "reports" 
            DROP COLUMN IF EXISTS "resolution_notes",
            DROP COLUMN IF EXISTS "assigned_to",
            DROP COLUMN IF EXISTS "priority"
        `);
    }
}
