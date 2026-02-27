import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemMetricsTable1709040000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "system_metrics" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "metric_type" VARCHAR(50) NOT NULL,
                "metric_value" NUMERIC,
                "metadata" jsonb,
                "recorded_at" TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_system_metrics_metric_type" ON "system_metrics" ("metric_type")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_system_metrics_recorded_at" ON "system_metrics" ("recorded_at" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_system_metrics_recorded_at"`);
        await queryRunner.query(`DROP INDEX "IDX_system_metrics_metric_type"`);
        await queryRunner.query(`DROP TABLE "system_metrics"`);
    }
}
