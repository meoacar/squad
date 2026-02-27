import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AuditService } from './services/audit.service';
import { AnalyticsService } from './services/analytics.service';
import { QueueService } from './services/queue.service';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Report } from '../reports/entities/report.entity';
import { DailyStat } from './entities/daily-stat.entity';
import { CACHE_KEYS, CACHE_TTL } from './constants/cache-keys.constant';

describe('AdminService - Redis Caching', () => {
    let service: AdminService;
    let cacheManager: any;

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockUserRepository = {
        count: jest.fn(),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const mockPostRepository = {
        count: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const mockReportRepository = {
        count: jest.fn(),
    };

    const mockDailyStatRepository = {
        createQueryBuilder: jest.fn(),
    };

    const mockAuditService = {
        log: jest.fn(),
        getLogs: jest.fn(),
    };

    const mockAnalyticsService = {};

    const mockQueueService = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: getRepositoryToken(Post),
                    useValue: mockPostRepository,
                },
                {
                    provide: getRepositoryToken(Report),
                    useValue: mockReportRepository,
                },
                {
                    provide: getRepositoryToken(DailyStat),
                    useValue: mockDailyStatRepository,
                },
                {
                    provide: AuditService,
                    useValue: mockAuditService,
                },
                {
                    provide: AnalyticsService,
                    useValue: mockAnalyticsService,
                },
                {
                    provide: QueueService,
                    useValue: mockQueueService,
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        cacheManager = module.get(CACHE_MANAGER);

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should return cached stats if available', async () => {
            const cachedStats = {
                totalUsers: 100,
                activeUsers: 80,
                totalPosts: 50,
            };

            mockCacheManager.get.mockResolvedValue(cachedStats);

            const result = await service.getDashboardStats();

            expect(result).toEqual(cachedStats);
            expect(mockCacheManager.get).toHaveBeenCalledWith(CACHE_KEYS.DASHBOARD_STATS);
            expect(mockUserRepository.count).not.toHaveBeenCalled();
        });

        it('should fetch and cache stats if not in cache', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockUserRepository.count.mockResolvedValue(100);
            mockPostRepository.count.mockResolvedValue(50);
            mockReportRepository.count.mockResolvedValue(10);

            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
            };
            mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.getDashboardStats();

            expect(mockCacheManager.get).toHaveBeenCalledWith(CACHE_KEYS.DASHBOARD_STATS);
            expect(mockUserRepository.count).toHaveBeenCalled();
            expect(mockCacheManager.set).toHaveBeenCalledWith(
                CACHE_KEYS.DASHBOARD_STATS,
                expect.any(Object),
                CACHE_TTL.DASHBOARD_STATS * 1000,
            );
        });

        it('should use correct cache key constant', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockUserRepository.count.mockResolvedValue(100);
            mockPostRepository.count.mockResolvedValue(50);
            mockReportRepository.count.mockResolvedValue(10);

            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
            };
            mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.getDashboardStats();

            expect(mockCacheManager.get).toHaveBeenCalledWith('admin:dashboard:stats');
        });

        it('should use correct TTL (5 minutes)', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockUserRepository.count.mockResolvedValue(100);
            mockPostRepository.count.mockResolvedValue(50);
            mockReportRepository.count.mockResolvedValue(10);

            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
            };
            mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.getDashboardStats();

            expect(mockCacheManager.set).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                300000, // 5 minutes in milliseconds
            );
        });
    });

    describe('Cache Keys', () => {
        it('should have correct cache key patterns', () => {
            expect(CACHE_KEYS.DASHBOARD_STATS).toBe('admin:dashboard:stats');
            expect(CACHE_KEYS.DASHBOARD_CHARTS('30d')).toBe('admin:dashboard:charts:30d');
            expect(CACHE_KEYS.USER_DETAIL('user-123')).toBe('admin:users:detail:user-123');
        });

        it('should have correct TTL values', () => {
            expect(CACHE_TTL.DASHBOARD_STATS).toBe(300); // 5 minutes
            expect(CACHE_TTL.ANALYTICS).toBe(600); // 10 minutes
            expect(CACHE_TTL.SYSTEM_METRICS).toBe(60); // 1 minute
        });
    });
});
