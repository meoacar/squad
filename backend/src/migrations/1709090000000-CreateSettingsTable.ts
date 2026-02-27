import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSettingsTable1709090000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'settings',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'key',
                        type: 'varchar',
                        isUnique: true,
                    },
                    {
                        name: 'value',
                        type: 'text',
                    },
                    {
                        name: 'category',
                        type: 'enum',
                        enum: ['GENERAL', 'PAYMENT', 'EMAIL', 'SECURITY', 'FEATURES', 'LIMITS'],
                        default: "'GENERAL'",
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'is_public',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_settings_key" ON "settings" ("key")`);
        await queryRunner.query(`CREATE INDEX "IDX_settings_category" ON "settings" ("category")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('settings');
    }
}
