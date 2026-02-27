import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
    BulkSuspendJobData,
    BulkBanJobData,
    BulkExportJobData,
    NotificationJobData,
} from '../queues/admin.processor';
import {
    DailyStatsJobData,
    AnalyticsReportJobData,
} from '../queues/analytics.processor';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue('admin') private adminQueue: Queue,
        @InjectQueue('analytics') private analyticsQueue: Queue,
    ) { }

    // Admin Queue Jobs
    async addBulkSuspendJob(data: BulkSuspendJobData) {
        this.logger.log(`Adding bulk suspend job for ${data.userIds.length} users`);
        return await this.adminQueue.add('bulk-suspend', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
    }

    async addBulkBanJob(data: BulkBanJobData) {
        this.logger.log(`Adding bulk ban job for ${data.userIds.length} users`);
        return await this.adminQueue.add('bulk-ban', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
    }

    async addNotificationJob(data: NotificationJobData) {
        this.logger.log(`Adding notification job for user ${data.userId}`);
        return await this.adminQueue.add('send-notification', data, {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
    }

    async addBulkExportJob(data: BulkExportJobData) {
        this.logger.log(`Adding bulk export job for ${data.type}`);
        return await this.adminQueue.add('bulk-export', data, {
            attempts: 2,
            timeout: 300000, // 5 minutes
        });
    }

    // Analytics Queue Jobs
    async addDailyStatsJob(data: DailyStatsJobData = {}) {
        this.logger.log('Adding daily stats calculation job');
        return await this.analyticsQueue.add('daily-stats', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        });
    }

    async addAnalyticsReportJob(data: AnalyticsReportJobData) {
        this.logger.log(`Adding analytics report job for ${data.type}`);
        return await this.analyticsQueue.add('generate-report', data, {
            attempts: 2,
            timeout: 600000, // 10 minutes
        });
    }

    // Job Status Methods
    async getJobStatus(queueName: 'admin' | 'analytics', jobId: string) {
        const queue = queueName === 'admin' ? this.adminQueue : this.analyticsQueue;
        const job = await queue.getJob(jobId);

        if (!job) {
            return null;
        }

        return {
            id: job.id,
            name: job.name,
            data: job.data,
            progress: await job.progress(),
            state: await job.getState(),
            attemptsMade: job.attemptsMade,
            finishedOn: job.finishedOn,
            processedOn: job.processedOn,
            failedReason: job.failedReason,
            returnvalue: job.returnvalue,
        };
    }

    async getQueueStats(queueName: 'admin' | 'analytics') {
        const queue = queueName === 'admin' ? this.adminQueue : this.analyticsQueue;

        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
        ]);

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed,
        };
    }

    async cleanQueue(queueName: 'admin' | 'analytics', grace: number = 86400000) {
        const queue = queueName === 'admin' ? this.adminQueue : this.analyticsQueue;

        // Clean completed jobs older than grace period (default 24 hours)
        await queue.clean(grace, 'completed');
        await queue.clean(grace, 'failed');

        this.logger.log(`Cleaned ${queueName} queue`);
    }
}
