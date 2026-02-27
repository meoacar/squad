import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemMetric } from '../entities/system-metric.entity';

@Injectable()
export class MetricsService {
    constructor(
        @InjectRepository(SystemMetric)
        private systemMetricRepository: Repository<SystemMetric>,
    ) { }

    async collectMetrics(): Promise<void> {
        const metrics = [
            {
                metric_type: 'api_response_time',
                metric_value: await this.measureApiResponseTime(),
                metadata: { unit: 'ms' },
            },
            {
                metric_type: 'memory_usage',
                metric_value: process.memoryUsage().heapUsed / 1024 / 1024,
                metadata: { unit: 'MB' },
            },
            {
                metric_type: 'cpu_usage',
                metric_value: process.cpuUsage().user / 1000000,
                metadata: { unit: 'seconds' },
            },
        ];

        for (const metric of metrics) {
            const systemMetric = this.systemMetricRepository.create(metric);
            await this.systemMetricRepository.save(systemMetric);
        }
    }

    async getSystemHealth() {
        const recentMetrics = await this.systemMetricRepository
            .createQueryBuilder('metric')
            .where('metric.recorded_at > :time', {
                time: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
            })
            .orderBy('metric.recorded_at', 'DESC')
            .getMany();

        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        return {
            status: 'healthy',
            uptime: uptime,
            memory: {
                used: memoryUsage.heapUsed / 1024 / 1024,
                total: memoryUsage.heapTotal / 1024 / 1024,
                unit: 'MB',
            },
            recentMetrics: recentMetrics.slice(0, 10),
        };
    }

    async getPerformanceMetrics(startDate: Date, endDate: Date) {
        const metrics = await this.systemMetricRepository
            .createQueryBuilder('metric')
            .where('metric.recorded_at BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .orderBy('metric.recorded_at', 'ASC')
            .getMany();

        const groupedMetrics = metrics.reduce((acc, metric) => {
            if (!acc[metric.metric_type]) {
                acc[metric.metric_type] = [];
            }
            acc[metric.metric_type].push({
                value: metric.metric_value,
                timestamp: metric.recorded_at,
                metadata: metric.metadata,
            });
            return acc;
        }, {} as Record<string, any[]>);

        return {
            metrics: groupedMetrics,
            summary: {
                totalDataPoints: metrics.length,
                metricTypes: Object.keys(groupedMetrics),
            },
        };
    }

    private async measureApiResponseTime(): Promise<number> {
        // Simple measurement - in production, this would be more sophisticated
        const start = Date.now();
        await this.systemMetricRepository.count();
        return Date.now() - start;
    }
}
