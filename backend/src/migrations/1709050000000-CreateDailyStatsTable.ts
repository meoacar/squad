import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDailyStatsTable1709050000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "daily_stats" (
                "date" DATE PRIMARY KEY,
                "total_users" INTEGER,
                "new_users" INTEGER,
                "active_users" INTEGER,
                "total_posts" INTEGER,
                "new_posts" INTEGER,
                "total_applications" INTEGER,
                "new_applications" INTEGER,
                "premium_users" INTEGER,
                "revenue" NUMERIC(10,2),
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_daily_stats_date" ON "daily_stats" ("date" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_daily_stats_date"`);
        await queryRunner.query(`DROP TABLE "daily_stats"`);
    }
}
