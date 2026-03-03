import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrivacyTables1709170000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create blocks table
        await queryRunner.query(`
            CREATE TABLE "blocks" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "blocker_id" UUID NOT NULL,
                "blocked_id" UUID NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_blocks_blocker" FOREIGN KEY ("blocker_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_blocks_blocked" FOREIGN KEY ("blocked_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_blocks_blocker_blocked" UNIQUE ("blocker_id", "blocked_id"),
                CONSTRAINT "CHK_blocks_no_self_block" CHECK ("blocker_id" != "blocked_id")
            )
        `);

        // Create indexes for blocks
        await queryRunner.query(`
            CREATE INDEX "IDX_blocks_blocker" ON "blocks" ("blocker_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_blocks_blocked" ON "blocks" ("blocked_id")
        `);

        // Create notification_preferences table
        await queryRunner.query(`
            CREATE TABLE "notification_preferences" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" UUID NOT NULL UNIQUE,
                "email_messages" BOOLEAN NOT NULL DEFAULT TRUE,
                "email_follow" BOOLEAN NOT NULL DEFAULT TRUE,
                "email_clan_invites" BOOLEAN NOT NULL DEFAULT TRUE,
                "email_activity_interactions" BOOLEAN NOT NULL DEFAULT TRUE,
                "push_messages" BOOLEAN NOT NULL DEFAULT TRUE,
                "push_follow" BOOLEAN NOT NULL DEFAULT TRUE,
                "push_clan_invites" BOOLEAN NOT NULL DEFAULT TRUE,
                "push_activity_interactions" BOOLEAN NOT NULL DEFAULT TRUE,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_notification_preferences_user" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop notification_preferences table
        await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences"`);

        // Drop blocks table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blocks_blocked"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blocks_blocker"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "blocks"`);
    }
}
