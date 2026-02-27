import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminRolesTable1709030000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "admin_roles" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" UUID NOT NULL,
                "role" VARCHAR(50) NOT NULL,
                "permissions" JSONB,
                "granted_by" UUID,
                "granted_at" TIMESTAMP DEFAULT NOW(),
                "expires_at" TIMESTAMP,
                "created_at" TIMESTAMP DEFAULT NOW(),
                CONSTRAINT "FK_admin_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_admin_roles_granted_by" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_admin_roles_user" ON "admin_roles" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_admin_roles_role" ON "admin_roles" ("role")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_admin_roles_role"`);
        await queryRunner.query(`DROP INDEX "IDX_admin_roles_user"`);
        await queryRunner.query(`DROP TABLE "admin_roles"`);
    }
}
