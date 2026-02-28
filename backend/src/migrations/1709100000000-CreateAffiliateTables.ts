import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAffiliateTables1709100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if affiliate_links table exists
        const linksTableExists = await queryRunner.hasTable('affiliate_links');

        if (!linksTableExists) {
            // Create affiliate_links table
            await queryRunner.createTable(
                new Table({
                    name: 'affiliate_links',
                    columns: [
                        {
                            name: 'id',
                            type: 'uuid',
                            isPrimary: true,
                            generationStrategy: 'uuid',
                            default: 'uuid_generate_v4()',
                        },
                        {
                            name: 'name',
                            type: 'varchar',
                        },
                        {
                            name: 'url',
                            type: 'text',
                        },
                        {
                            name: 'short_code',
                            type: 'varchar',
                            isUnique: true,
                        },
                        {
                            name: 'provider',
                            type: 'enum',
                            enum: ['AMAZON', 'ALIEXPRESS', 'CODASHOP', 'RAZER', 'NORDVPN', 'CUSTOM'],
                        },
                        {
                            name: 'category',
                            type: 'enum',
                            enum: ['GAMING_GEAR', 'UC', 'VPN', 'SOFTWARE', 'ACCESSORIES', 'OTHER'],
                        },
                        {
                            name: 'commission_rate',
                            type: 'decimal',
                            precision: 5,
                            scale: 2,
                            default: 0,
                        },
                        {
                            name: 'image_url',
                            type: 'varchar',
                            isNullable: true,
                        },
                        {
                            name: 'description',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'price',
                            type: 'varchar',
                            isNullable: true,
                        },
                        {
                            name: 'rating',
                            type: 'decimal',
                            precision: 3,
                            scale: 1,
                            default: 0,
                            isNullable: true,
                        },
                        {
                            name: 'click_count',
                            type: 'int',
                            default: 0,
                        },
                        {
                            name: 'conversion_count',
                            type: 'int',
                            default: 0,
                        },
                        {
                            name: 'revenue',
                            type: 'decimal',
                            precision: 10,
                            scale: 2,
                            default: 0,
                        },
                        {
                            name: 'is_active',
                            type: 'boolean',
                            default: true,
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
                            onUpdate: 'CURRENT_TIMESTAMP',
                        },
                    ],
                }),
                true,
            );
        }

        // Check if affiliate_clicks table exists
        const clicksTableExists = await queryRunner.hasTable('affiliate_clicks');

        if (!clicksTableExists) {
            // Create affiliate_clicks table
            await queryRunner.createTable(
                new Table({
                    name: 'affiliate_clicks',
                    columns: [
                        {
                            name: 'id',
                            type: 'uuid',
                            isPrimary: true,
                            generationStrategy: 'uuid',
                            default: 'uuid_generate_v4()',
                        },
                        {
                            name: 'link_id',
                            type: 'uuid',
                        },
                        {
                            name: 'user_id',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'ip_address',
                            type: 'varchar',
                            isNullable: true,
                        },
                        {
                            name: 'user_agent',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'referrer',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'clicked_at',
                            type: 'timestamp',
                            default: 'CURRENT_TIMESTAMP',
                        },
                    ],
                }),
                true,
            );

            // Add foreign key for link
            await queryRunner.createForeignKey(
                'affiliate_clicks',
                new TableForeignKey({
                    columnNames: ['link_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'affiliate_links',
                    onDelete: 'CASCADE',
                }),
            );

            // Add foreign key for user
            await queryRunner.createForeignKey(
                'affiliate_clicks',
                new TableForeignKey({
                    columnNames: ['user_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'users',
                    onDelete: 'SET NULL',
                }),
            );
        }

        // Check if affiliate_conversions table exists
        const conversionsTableExists = await queryRunner.hasTable('affiliate_conversions');

        if (!conversionsTableExists) {
            // Create affiliate_conversions table
            await queryRunner.createTable(
                new Table({
                    name: 'affiliate_conversions',
                    columns: [
                        {
                            name: 'id',
                            type: 'uuid',
                            isPrimary: true,
                            generationStrategy: 'uuid',
                            default: 'uuid_generate_v4()',
                        },
                        {
                            name: 'link_id',
                            type: 'uuid',
                        },
                        {
                            name: 'click_id',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'user_id',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'amount',
                            type: 'decimal',
                            precision: 10,
                            scale: 2,
                        },
                        {
                            name: 'commission',
                            type: 'decimal',
                            precision: 10,
                            scale: 2,
                        },
                        {
                            name: 'status',
                            type: 'enum',
                            enum: ['PENDING', 'APPROVED', 'REJECTED'],
                            default: "'PENDING'",
                        },
                        {
                            name: 'converted_at',
                            type: 'timestamp',
                            default: 'CURRENT_TIMESTAMP',
                        },
                    ],
                }),
                true,
            );

            // Add foreign key for link
            await queryRunner.createForeignKey(
                'affiliate_conversions',
                new TableForeignKey({
                    columnNames: ['link_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'affiliate_links',
                    onDelete: 'CASCADE',
                }),
            );

            // Add foreign key for click
            await queryRunner.createForeignKey(
                'affiliate_conversions',
                new TableForeignKey({
                    columnNames: ['click_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'affiliate_clicks',
                    onDelete: 'SET NULL',
                }),
            );

            // Add foreign key for user
            await queryRunner.createForeignKey(
                'affiliate_conversions',
                new TableForeignKey({
                    columnNames: ['user_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'users',
                    onDelete: 'SET NULL',
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        const conversionsTable = await queryRunner.getTable('affiliate_conversions');
        if (conversionsTable) {
            const linkFk = conversionsTable.foreignKeys.find(
                fk => fk.columnNames.indexOf('link_id') !== -1,
            );
            const clickFk = conversionsTable.foreignKeys.find(
                fk => fk.columnNames.indexOf('click_id') !== -1,
            );
            const userFk = conversionsTable.foreignKeys.find(
                fk => fk.columnNames.indexOf('user_id') !== -1,
            );

            if (linkFk) await queryRunner.dropForeignKey('affiliate_conversions', linkFk);
            if (clickFk) await queryRunner.dropForeignKey('affiliate_conversions', clickFk);
            if (userFk) await queryRunner.dropForeignKey('affiliate_conversions', userFk);
        }

        const clicksTable = await queryRunner.getTable('affiliate_clicks');
        if (clicksTable) {
            const linkFk = clicksTable.foreignKeys.find(
                fk => fk.columnNames.indexOf('link_id') !== -1,
            );
            const userFk = clicksTable.foreignKeys.find(
                fk => fk.columnNames.indexOf('user_id') !== -1,
            );

            if (linkFk) await queryRunner.dropForeignKey('affiliate_clicks', linkFk);
            if (userFk) await queryRunner.dropForeignKey('affiliate_clicks', userFk);
        }

        // Drop tables
        await queryRunner.dropTable('affiliate_conversions', true);
        await queryRunner.dropTable('affiliate_clicks', true);
        await queryRunner.dropTable('affiliate_links', true);
    }
}
