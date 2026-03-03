import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessageTables1709130000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create conversations table
        await queryRunner.query(`
            CREATE TABLE "conversations" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "participant_ids" UUID[] NOT NULL,
                "last_message_id" UUID,
                "last_message_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);

        // Create GIN index for participant_ids array
        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_participants" ON "conversations" USING GIN("participant_ids")
        `);

        // Create messages table
        await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "sender_id" UUID NOT NULL,
                "content" TEXT NOT NULL,
                "message_type" VARCHAR(20) NOT NULL,
                "conversation_id" UUID,
                "group_id" UUID,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "edited_at" TIMESTAMP,
                "deleted_at" TIMESTAMP,
                CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") 
                    REFERENCES "conversations"("id") ON DELETE CASCADE,
                CONSTRAINT "CHK_messages_length" CHECK (LENGTH("content") <= 2000)
            )
        `);

        // Create indexes for messages
        await queryRunner.query(`
            CREATE INDEX "IDX_messages_conversation" ON "messages" ("conversation_id", "created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_messages_group" ON "messages" ("group_id", "created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_messages_sender" ON "messages" ("sender_id")
        `);

        // Create message_reads table
        await queryRunner.query(`
            CREATE TABLE "message_reads" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "message_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "read_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_message_reads_message" FOREIGN KEY ("message_id") 
                    REFERENCES "messages"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_message_reads_user" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_message_reads_message_user" UNIQUE ("message_id", "user_id")
            )
        `);

        // Create index for message_reads
        await queryRunner.query(`
            CREATE INDEX "IDX_message_reads_user" ON "message_reads" ("user_id", "read_at" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop message_reads table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_reads_user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "message_reads"`);

        // Drop messages table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_sender"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_group"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_conversation"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);

        // Drop conversations table
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_participants"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
    }
}
