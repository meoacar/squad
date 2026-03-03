import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateClanRoles1709150001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update existing 'admin' roles to 'leader'
        await queryRunner.query(`
            UPDATE clan_members 
            SET role = 'leader' 
            WHERE role = 'admin'
        `);

        // Update role column to use new enum values
        await queryRunner.query(`
            ALTER TABLE clan_members 
            DROP CONSTRAINT IF EXISTS "CHK_clan_members_role"
        `);

        await queryRunner.query(`
            ALTER TABLE clan_members 
            ADD CONSTRAINT "CHK_clan_members_role" 
            CHECK (role IN ('leader', 'co_leader', 'moderator', 'member'))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert leader roles back to admin
        await queryRunner.query(`
            UPDATE clan_members 
            SET role = 'admin' 
            WHERE role = 'leader'
        `);

        // Revert role constraint
        await queryRunner.query(`
            ALTER TABLE clan_members 
            DROP CONSTRAINT IF EXISTS "CHK_clan_members_role"
        `);

        await queryRunner.query(`
            ALTER TABLE clan_members 
            ADD CONSTRAINT "CHK_clan_members_role" 
            CHECK (role IN ('admin', 'member'))
        `);
    }
}
