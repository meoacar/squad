import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRejectionReasonToApplications1772217237470 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "applications" 
            ADD COLUMN IF NOT EXISTS "rejection_reason" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "applications" 
            DROP COLUMN IF EXISTS "rejection_reason"
        `);
    }

}
