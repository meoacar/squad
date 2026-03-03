import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClanTables1709150000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create clans table
        await queryRunner.query(`
            CREATE TABLE "clans" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR(30) NOT NULL UNIQUE,
                "description" TEXT,
                "avatar_url" VARCHAR(255),
                "creator_id" UUID NOT NULL,
                "member_count" INTEGER NOT NULL DEFAULT 1,
                "max_members" INTEGER NOT NULL DEFAULT 50,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_clans_creator" FOREIGN KEY ("creator_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "CHK_clans_name_length" CHECK (LENGTH("name") >= 3 AND LENGTH("name") <= 30)
            )
        `);

        // Create indexes for clans
        await queryRunner.query(`
            CREATE INDEX "IDX_clans_name" ON "clans" ("name")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_clans_creator" ON "clans" ("creator_id")
        `);

        // Create clan_members table
        await queryRunner.query(`
            CREATE TABLE "clan_members" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "clan_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "role" VARCHAR(20) NOT NULL DEFAULT 'member',
                "joined_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_clan_members_clan" FOREIGN KEY ("clan_id") 
                    REFERENCES "clans"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_clan_members_user" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_clan_members_clan_user" UNIQUE ("clan_id", "user_id")
            )
        `);

        // Create indexes for clan_members
        await queryRunner.query(`
            CREATE INDEX "IDX_clan_members_clan" ON "clan_members" ("clan_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_clan_members_user" ON "clan_members" ("user_id")
        `);

        // Create clan_invitations table
        await queryRunner.query(`
            CREATE TABLE "clan_invitations" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "clan_id" UUID NOT NULL,
                "inviter_id" UUID NOT NULL,
                "invitee_id" UUID NOT NULL,
                "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_clan_invitations_clan" FOREIGN KEY ("clan_id") 
                    REFERENCES "clans"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_clan_invitations_inviter" FOREIGN KEY ("inviter_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_clan_invitations_invitee" FOREIGN KEY ("invitee_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create partial unique index for pending invitations
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_clan_invitations_clan_invitee_pending" 
            ON "clan_invitations" ("clan_id", "invitee_id", "status") 
            WHERE "status" = 'pending'
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_clan_invitations_invitee_status" ON "clan_invitations" ("invitee_id", "status")
        `);

        // Create clan_announcements table
        await queryRunner.query(`
            CREATE TABLE "clan_announcements" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "clan_id" UUID NOT NULL,
                "author_id" UUID NOT NULL,
                "content" TEXT NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "expires_at" TIMESTAMP NOT NULL,
                CONSTRAINT "FK_clan_announcements_clan" FOREIGN KEY ("clan_id") 
                    REFERENCES "clans"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_clan_announcements_author" FOREIGN KEY ("author_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "CHK_clan_announcements_content_length" CHECK (LENGTH("content") <= 1000)
            )
        `);

        // Create indexes for clan_announcements
        await queryRunner.query(`
            CREATE INDEX "IDX_clan_announcements_clan" ON "clan_announcements" ("clan_id", "created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_clan_announcements_expires" ON "clan_announcements" ("expires_at")
        `);

        // Add foreign key to messages table for group_id (clan group chat)
        await queryRunner.query(`
            ALTER TABLE "messages" 
            ADD CONSTRAINT "FK_messages_group" FOREIGN KEY ("group_id") 
            REFERENCES "clans"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key from messages table
        await queryRunner.query(`
            ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "FK_messages_group"
        `);

        // Drop clan_announcements table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clan_announcements_expires"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clan_announcements_clan"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "clan_announcements"`);

        // Drop clan_invitations table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clan_invitations_invitee_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clan_invitations_clan_invitee_pending"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "clan_invitations"`);

        // Drop clan_members table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clan_members_user"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clan_members_clan"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "clan_members"`);

        // Drop clans table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clans_creator"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clans_name"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "clans"`);
    }
}
