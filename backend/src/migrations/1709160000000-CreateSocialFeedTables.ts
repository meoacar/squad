import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialFeedTables1709160000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create activities table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "activities" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" UUID NOT NULL,
                "type" VARCHAR(50) NOT NULL,
                "data" JSONB NOT NULL,
                "like_count" INTEGER NOT NULL DEFAULT 0,
                "comment_count" INTEGER NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_activities_user" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create indexes for activities
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activities_user" ON "activities" ("user_id", "created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activities_created" ON "activities" ("created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activities_type" ON "activities" ("type")
        `);

        // Create activity_likes table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "activity_likes" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "activity_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_activity_likes_activity" FOREIGN KEY ("activity_id") 
                    REFERENCES "activities"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_activity_likes_user" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_activity_likes_activity_user" UNIQUE ("activity_id", "user_id")
            )
        `);

        // Create indexes for activity_likes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activity_likes_activity" ON "activity_likes" ("activity_id")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activity_likes_user" ON "activity_likes" ("user_id")
        `);

        // Create activity_comments table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "activity_comments" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "activity_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "content" TEXT NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_activity_comments_activity" FOREIGN KEY ("activity_id") 
                    REFERENCES "activities"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_activity_comments_user" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "CHK_activity_comments_content_length" CHECK (LENGTH("content") <= 500)
            )
        `);

        // Create indexes for activity_comments
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activity_comments_activity" ON "activity_comments" ("activity_id", "created_at" ASC)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activity_comments_user" ON "activity_comments" ("user_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop activity_comments table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_comments_user"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_comments_activity"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "activity_comments"`);

        // Drop activity_likes table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_likes_user"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_likes_activity"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "activity_likes"`);

        // Drop activities table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activities_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activities_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activities_user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "activities"`);
    }
}
