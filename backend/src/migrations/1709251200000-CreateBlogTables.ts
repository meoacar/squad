import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateBlogTables1709251200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if blog_categories table exists
        const categoriesTableExists = await queryRunner.hasTable('blog_categories');

        if (!categoriesTableExists) {
            // Create blog_categories table
            await queryRunner.createTable(
                new Table({
                    name: 'blog_categories',
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
                            name: 'slug',
                            type: 'varchar',
                            isUnique: true,
                        },
                        {
                            name: 'description',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'order',
                            type: 'int',
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

        // Check if blog_posts table exists
        const postsTableExists = await queryRunner.hasTable('blog_posts');

        if (!postsTableExists) {
            // Create blog_posts table
            await queryRunner.createTable(
                new Table({
                    name: 'blog_posts',
                    columns: [
                        {
                            name: 'id',
                            type: 'uuid',
                            isPrimary: true,
                            generationStrategy: 'uuid',
                            default: 'uuid_generate_v4()',
                        },
                        {
                            name: 'title',
                            type: 'varchar',
                        },
                        {
                            name: 'slug',
                            type: 'varchar',
                            isUnique: true,
                        },
                        {
                            name: 'content',
                            type: 'text',
                        },
                        {
                            name: 'excerpt',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'featured_image',
                            type: 'varchar',
                            isNullable: true,
                        },
                        {
                            name: 'status',
                            type: 'enum',
                            enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
                            default: "'DRAFT'",
                        },
                        {
                            name: 'category_id',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'author_id',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'view_count',
                            type: 'int',
                            default: 0,
                        },
                        {
                            name: 'tags',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'meta_title',
                            type: 'varchar',
                            isNullable: true,
                        },
                        {
                            name: 'meta_description',
                            type: 'varchar',
                            isNullable: true,
                        },
                        {
                            name: 'is_featured',
                            type: 'boolean',
                            default: false,
                        },
                        {
                            name: 'published_at',
                            type: 'timestamp',
                            isNullable: true,
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

            // Add foreign key for category
            await queryRunner.createForeignKey(
                'blog_posts',
                new TableForeignKey({
                    columnNames: ['category_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'blog_categories',
                    onDelete: 'SET NULL',
                }),
            );

            // Add foreign key for author
            await queryRunner.createForeignKey(
                'blog_posts',
                new TableForeignKey({
                    columnNames: ['author_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'users',
                    onDelete: 'SET NULL',
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        const blogPostsTable = await queryRunner.getTable('blog_posts');
        if (blogPostsTable) {
            const categoryForeignKey = blogPostsTable.foreignKeys.find(
                fk => fk.columnNames.indexOf('category_id') !== -1,
            );
            const authorForeignKey = blogPostsTable.foreignKeys.find(
                fk => fk.columnNames.indexOf('author_id') !== -1,
            );

            if (categoryForeignKey) {
                await queryRunner.dropForeignKey('blog_posts', categoryForeignKey);
            }
            if (authorForeignKey) {
                await queryRunner.dropForeignKey('blog_posts', authorForeignKey);
            }
        }

        // Drop tables
        await queryRunner.dropTable('blog_posts', true);
        await queryRunner.dropTable('blog_categories', true);
    }
}
