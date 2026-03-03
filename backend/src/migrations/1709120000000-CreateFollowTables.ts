import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFollowTables1709120000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create follows table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "follows" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "follower_id" UUID NOT NULL,
                "following_id" UUID NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_follows_follower" FOREIGN KEY ("follower_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_follows_following" FOREIGN KEY ("following_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_follows_follower_following" UNIQUE ("follower_id", "following_id"),
                CONSTRAINT "CHK_follows_no_self_follow" CHECK ("follower_id" != "following_id")
            )
        `);

        // Create indexes for follows
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_follows_follower" ON "follows" ("follower_id")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_follows_following" ON "follows" ("following_id")
        `);

        // Create follow_requests table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "follow_requests" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "requester_id" UUID NOT NULL,
                "target_id" UUID NOT NULL,
                "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_follow_requests_requester" FOREIGN KEY ("requester_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_follow_requests_target" FOREIGN KEY ("target_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_follow_requests_requester_target" UNIQUE ("requester_id", "target_id"),
                CONSTRAINT "CHK_follow_requests_no_self_request" CHECK ("requester_id" != "target_id")
            )
        `);

        // Create indexes for follow_requests
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_follow_requests_target_status" ON "follow_requests" ("target_id", "status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop follow_requests table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follow_requests_target_status"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "follow_requests"`);

        // Drop follows table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follows_following"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follows_follower"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "follows"`);
    }
}
