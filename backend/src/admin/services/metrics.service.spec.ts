import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MetricsService } from './metrics.service';
import { SystemMetric } from '../entities/system-metric.entity';

describe('MetricsService', () => {
    let service: MetricsService;
    let systemMetricRepository: any;

    const mockMetric = {
        id: 'metric-123',
        metric_type: 'api_response_time',
        metric_value: 150,
        metadata: { unit: 'ms' },
        recorded_at: new Date(),
    };

    beforeEach(async () => {
        const mockSystemMetricRepository = {
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetricsService,
                {
                    provide: getRepositoryToken(SystemMetric),
                    useValue: mockSystemMetricRepository,
                },
            ],
        }).compile();

        service = module.get<MetricsService>(MetricsService);
        systemMetricRepository = module.get(getRepositoryToken(SystemMetric));

        jest.clearAllMocks();
    });

    describe('collectMetrics', () => {
        it('should collect and save system metrics', async () => {
            systemMetricRepository.create.mockReturnValue(mockMetric);
            systemMetricRepository.save.mockResolvedValue(mockMetric);

            await service.collectMetrics();

            expect(systemMetricRepository.create).toHaveBeenCalledTimes(3);
            expect(systemMetricRepository.save).toHaveBeenCalledTimes(3);
        });

        it('should collect api_response_time metric', async () => {
            systemMetricRepository.create.mockReturnValue(mockMetric);
            systemMetricRepository.save.mockResolvedValue(mockMetric);
            systemMetricRepository.count.mockResolvedValue(100);

            await service.collectMetrics();

            expect(systemMetricRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    metric_type: 'api_response_time',
                    metadata: { unit: 'ms' },
                }),
            );
        });

        it('should collect memory_usage metric', async () => {
            systemMetricRepository.create.mockReturnValue(mockMetric);
            systemMetricRepository.save.mockResolvedValue(mockMetric);

            await service.collectMetrics();

            expect(systemMetricRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    metric_type: 'memory_usage',
                    metadata: { unit: 'MB' },
                }),
            );
        });

        it('should collect cpu_usage metric', async () => {
            systemMetricRepository.create.mockReturnValue(mockMetric);
            systemMetricRepository.save.mockResolvedValue(mockMetric);

            await service.collectMetrics();

            expect(systemMetricRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    metric_type: 'cpu_usage',
                    metadata: { unit: 'seconds' },
                }),
            );
        });

        it('should save all metrics', async () => {
            systemMetricRepository.create.mockReturnValue(mockMetric);
            systemMetricRepository.save.mockResolvedValue(mockMetric);

            await service.collectMetrics();

            expect(systemMetricRepository.save).toHaveBeenCalledTimes(3);
        });
    });

    describe('getSystemHealth', () => {
        it('should return system health status', async () => {
            const mockMetrics = [mockMetric];
            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockMetrics),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getSystemHealth();

            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('uptime');
            expect(result).toHaveProperty('memory');
            expect(result).toHaveProperty('recentMetrics');
            expect(result.status).toBe('healthy');
        });

        it('should include memory usage information', async () => {
            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getSystemHealth();

            expect(result.memory).toHaveProperty('used');
            expect(result.memory).toHaveProperty('total');
            expect(result.memory).toHaveProperty('unit');
            expect(result.memory.unit).toBe('MB');
        });

        it('should include uptime', async () => {
            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getSystemHealth();

            expect(result.uptime).toBeGreaterThanOrEqual(0);
            expect(typeof result.uptime).toBe('number');
        });

        it('should fetch recent metrics from last 5 minutes', async () => {
            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getSystemHealth();

            expect(queryBuilder.where).toHaveBeenCalledWith(
                'metric.recorded_at > :time',
                expect.objectContaining({
                    time: expect.any(Date),
                }),
            );
        });

        it('should limit recent metrics to 10', async () => {
            const mockMetrics = Array(20).fill(mockMetric);
            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockMetrics),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getSystemHealth();

            expect(result.recentMetrics).toHaveLength(10);
        });

        it('should order metrics by recorded_at DESC', async () => {
            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getSystemHealth();

            expect(queryBuilder.orderBy).toHaveBeenCalledWith('metric.recorded_at', 'DESC');
        });
    });

    describe('getPerformanceMetrics', () => {
        it('should return performance metrics for date range', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const mockMetrics = [
                { ...mockMetric, metric_type: 'api_response_time' },
                { ...mockMetric, metric_type: 'memory_usage' },
                { ...mockMetric, metric_type: 'cpu_usage' },
            ];

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockMetrics),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPerformanceMetrics(startDate, endDate);

            expect(result).toHaveProperty('metrics');
            expect(result).toHaveProperty('summary');
            expect(result.summary).toHaveProperty('totalDataPoints');
            expect(result.summary).toHaveProperty('metricTypes');
        });

        it('should group metrics by type', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const mockMetrics = [
                { ...mockMetric, metric_type: 'api_response_time', metric_value: 100 },
                { ...mockMetric, metric_type: 'api_response_time', metric_value: 150 },
                { ...mockMetric, metric_type: 'memory_usage', metric_value: 512 },
            ];

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockMetrics),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPerformanceMetrics(startDate, endDate);

            expect(result.metrics).toHaveProperty('api_response_time');
            expect(result.metrics).toHaveProperty('memory_usage');
            expect(result.metrics.api_response_time).toHaveLength(2);
            expect(result.metrics.memory_usage).toHaveLength(1);
        });

        it('should include metric values and timestamps', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const mockMetrics = [mockMetric];

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockMetrics),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPerformanceMetrics(startDate, endDate);

            const metricType = mockMetric.metric_type;
            expect(result.metrics[metricType][0]).toHaveProperty('value');
            expect(result.metrics[metricType][0]).toHaveProperty('timestamp');
            expect(result.metrics[metricType][0]).toHaveProperty('metadata');
        });

        it('should filter by date range', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getPerformanceMetrics(startDate, endDate);

            expect(queryBuilder.where).toHaveBeenCalledWith(
                'metric.recorded_at BETWEEN :start AND :end',
                {
                    start: startDate,
                    end: endDate,
                },
            );
        });

        it('should order by recorded_at ASC', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getPerformanceMetrics(startDate, endDate);

            expect(queryBuilder.orderBy).toHaveBeenCalledWith('metric.recorded_at', 'ASC');
        });

        it('should calculate summary correctly', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const mockMetrics = [
                { ...mockMetric, metric_type: 'api_response_time' },
                { ...mockMetric, metric_type: 'memory_usage' },
                { ...mockMetric, metric_type: 'cpu_usage' },
            ];

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockMetrics),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPerformanceMetrics(startDate, endDate);

            expect(result.summary.totalDataPoints).toBe(3);
            expect(result.summary.metricTypes).toHaveLength(3);
            expect(result.summary.metricTypes).toContain('api_response_time');
            expect(result.summary.metricTypes).toContain('memory_usage');
            expect(result.summary.metricTypes).toContain('cpu_usage');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty metrics', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPerformanceMetrics(startDate, endDate);

            expect(result.metrics).toEqual({});
            expect(result.summary.totalDataPoints).toBe(0);
            expect(result.summary.metricTypes).toHaveLength(0);
        });

        it('should handle metrics with null metadata', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const mockMetrics = [
                { ...mockMetric, metadata: null },
            ];

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockMetrics),
            };
            systemMetricRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPerformanceMetrics(startDate, endDate);

            expect(result.metrics[mockMetric.metric_type][0].metadata).toBeNull();
        });
    });
});
