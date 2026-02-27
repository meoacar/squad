import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1709020000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "admin_id" uuid NOT NULL,
                "action_type" VARCHAR(50) NOT NULL,
                "target_type" VARCHAR(50) NOT NULL,
                "target_id" uuid,
                "details" jsonb,
                "ip_address" inet,
                "user_agent" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_audit_logs_admin_id" FOREIGN KEY ("admin_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_admin_id" ON "audit_logs" ("admin_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_action_type" ON "audit_logs" ("action_type")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_action_type"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_admin_id"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }
}
