import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueService } from './queue.service';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(private readonly queueService: QueueService) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async scheduleDailyStats() {
        this.logger.log('Scheduling daily stats calculation');
        try {
            await this.queueService.addDailyStatsJob({});
            this.logger.log('Daily stats job scheduled successfully');
        } catch (error) {
            this.logger.error('Failed to schedule daily stats job:', error);
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async scheduleQueueCleanup() {
        this.logger.log('Scheduling queue cleanup');
        try {
            // Clean completed/failed jobs older than 24 hours
            await this.queueService.cleanQueue('admin', 86400000);
            await this.queueService.cleanQueue('analytics', 86400000);
            this.logger.log('Queue cleanup completed');
        } catch (error) {
            this.logger.error('Failed to clean queues:', error);
        }
    }

    // Optional: Monitor queue health
    @Cron(CronExpression.EVERY_5_MINUTES)
    async monitorQueueHealth() {
        try {
            const adminStats = await this.queueService.getQueueStats('admin');
            const analyticsStats = await this.queueService.getQueueStats('analytics');

            this.logger.debug('Queue Stats:', {
                admin: adminStats,
                analytics: analyticsStats,
            });

            // Alert if too many failed jobs
            if (adminStats.failed > 100) {
                this.logger.warn(`Admin queue has ${adminStats.failed} failed jobs`);
            }
            if (analyticsStats.failed > 50) {
                this.logger.warn(`Analytics queue has ${analyticsStats.failed} failed jobs`);
            }
        } catch (error) {
            this.logger.error('Failed to monitor queue health:', error);
        }
    }
}
