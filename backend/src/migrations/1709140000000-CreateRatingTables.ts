import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRatingTables1709140000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ratings table
        await queryRunner.query(`
            CREATE TABLE "ratings" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "rater_id" UUID NOT NULL,
                "rated_user_id" UUID NOT NULL,
                "match_id" UUID NOT NULL,
                "rating" INTEGER NOT NULL,
                "comment" TEXT,
                "is_hidden" BOOLEAN NOT NULL DEFAULT FALSE,
                "flag_count" INTEGER NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_ratings_rater" FOREIGN KEY ("rater_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_ratings_rated_user" FOREIGN KEY ("rated_user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_ratings_rater_rated_match" UNIQUE ("rater_id", "rated_user_id", "match_id"),
                CONSTRAINT "CHK_ratings_no_self_rate" CHECK ("rater_id" != "rated_user_id"),
                CONSTRAINT "CHK_ratings_value" CHECK ("rating" >= 1 AND "rating" <= 5),
                CONSTRAINT "CHK_ratings_comment_length" CHECK ("comment" IS NULL OR LENGTH("comment") <= 500)
            )
        `);

        // Create indexes for ratings
        await queryRunner.query(`
            CREATE INDEX "IDX_ratings_rated_user" ON "ratings" ("rated_user_id", "created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_ratings_rater" ON "ratings" ("rater_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_ratings_match" ON "ratings" ("match_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_ratings_hidden" ON "ratings" ("is_hidden")
        `);

        // Create rating_reports table
        await queryRunner.query(`
            CREATE TABLE "rating_reports" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "rating_id" UUID NOT NULL,
                "reporter_id" UUID NOT NULL,
                "reason" TEXT NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_rating_reports_rating" FOREIGN KEY ("rating_id") 
                    REFERENCES "ratings"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_rating_reports_reporter" FOREIGN KEY ("reporter_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_rating_reports_rating_reporter" UNIQUE ("rating_id", "reporter_id")
            )
        `);

        // Create index for rating_reports
        await queryRunner.query(`
            CREATE INDEX "IDX_rating_reports_rating" ON "rating_reports" ("rating_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop rating_reports table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rating_reports_rating"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "rating_reports"`);

        // Drop ratings table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ratings_hidden"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ratings_match"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ratings_rater"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ratings_rated_user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "ratings"`);
    }
}
