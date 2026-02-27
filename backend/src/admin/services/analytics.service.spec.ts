import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { DailyStat } from '../entities/daily-stat.entity';

describe('AnalyticsService', () => {
    let service: AnalyticsService;
    let userRepository: any;
    let postRepository: any;
    let dailyStatRepository: any;

    const mockDailyStats = [
        {
            date: new Date('2024-01-01'),
            total_users: 100,
            new_users: 10,
            active_users: 80,
            total_posts: 50,
            new_posts: 5,
            revenue: 1000,
        },
        {
            date: new Date('2024-01-02'),
            total_users: 110,
            new_users: 10,
            active_users: 85,
            total_posts: 55,
            new_posts: 5,
            revenue: 1100,
        },
    ];

    beforeEach(async () => {
        const mockUserRepository = {
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn(),
            })),
        };

        const mockPostRepository = {
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn(),
                getRawOne: jest.fn(),
            })),
        };

        const mockDailyStatRepository = {
            createQueryBuilder: jest.fn(() => ({
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: getRepositoryToken(Post),
                    useValue: mockPostRepository,
                },
                {
                    provide: getRepositoryToken(DailyStat),
                    useValue: mockDailyStatRepository,
                },
            ],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);
        userRepository = module.get(getRepositoryToken(User));
        postRepository = module.get(getRepositoryToken(Post));
        dailyStatRepository = module.get(getRepositoryToken(DailyStat));

        jest.clearAllMocks();
    });

    describe('getUserAnalytics', () => {
        it('should return user analytics with growth, retention, and churn', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockDailyStats),
            };
            dailyStatRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            userRepository.count.mockResolvedValue(100);

            const userQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(50),
            };
            userRepository.createQueryBuilder.mockReturnValue(userQueryBuilder);

            const result = await service.getUserAnalytics(startDate, endDate);

            expect(result).toHaveProperty('growth');
            expect(result).toHaveProperty('retention');
            expect(result).toHaveProperty('churn');
            expect(result).toHaveProperty('dailyStats');
            expect(result.dailyStats).toEqual(mockDailyStats);
        });

        it('should calculate growth correctly', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockDailyStats),
            };
            dailyStatRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            userRepository.count.mockResolvedValue(100);

            const userQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(50),
            };
            userRepository.createQueryBuilder.mockReturnValue(userQueryBuilder);

            const result = await service.getUserAnalytics(startDate, endDate);

            // Growth should be (110 - 100) / 100 * 100 = 10%
            expect(result.growth).toBe(10);
        });
    });

    describe('getPostAnalytics', () => {
        it('should return post analytics with counts and averages', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            postRepository.count.mockResolvedValue(100);

            const queryBuilder = {
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([
                    { type: 'SQUAD', count: '50' },
                    { type: 'SCRIM', count: '30' },
                ]),
                getRawOne: jest.fn().mockResolvedValue({ avg: '100.5' }),
            };
            postRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPostAnalytics(startDate, endDate);

            expect(result).toHaveProperty('totalPosts');
            expect(result).toHaveProperty('postsByType');
            expect(result).toHaveProperty('postsByRegion');
            expect(result).toHaveProperty('avgViewsPerPost');
            expect(result).toHaveProperty('avgApplicationsPerPost');
            expect(result.totalPosts).toBe(100);
        });

        it('should group posts by type', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            postRepository.count.mockResolvedValue(100);

            const mockPostsByType = [
                { type: 'SQUAD', count: '50' },
                { type: 'SCRIM', count: '30' },
                { type: 'TOURNAMENT', count: '20' },
            ];

            const queryBuilder = {
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue(mockPostsByType),
                getRawOne: jest.fn().mockResolvedValue({ avg: '100' }),
            };
            postRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPostAnalytics(startDate, endDate);

            expect(result.postsByType).toEqual(mockPostsByType);
        });

        it('should calculate average views and applications', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            postRepository.count.mockResolvedValue(100);

            const queryBuilder = {
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([]),
                getRawOne: jest
                    .fn()
                    .mockResolvedValueOnce({ avg: '150.5' })
                    .mockResolvedValueOnce({ avg: '25.3' }),
            };
            postRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPostAnalytics(startDate, endDate);

            expect(result.avgViewsPerPost).toBe(150.5);
            expect(result.avgApplicationsPerPost).toBe(25.3);
        });
    });

    describe('getRevenueAnalytics', () => {
        it('should return revenue analytics with total and daily breakdown', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockDailyStats),
            };
            dailyStatRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            userRepository.count.mockResolvedValue(50);

            const result = await service.getRevenueAnalytics(startDate, endDate);

            expect(result).toHaveProperty('totalRevenue');
            expect(result).toHaveProperty('premiumUsers');
            expect(result).toHaveProperty('dailyRevenue');
            expect(result.premiumUsers).toBe(50);
        });

        it('should calculate total revenue correctly', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockDailyStats),
            };
            dailyStatRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            userRepository.count.mockResolvedValue(50);

            const result = await service.getRevenueAnalytics(startDate, endDate);

            // Total revenue should be 1000 + 1100 = 2100
            expect(result.totalRevenue).toBe(2100);
        });

        it('should format daily revenue correctly', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockDailyStats),
            };
            dailyStatRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            userRepository.count.mockResolvedValue(50);

            const result = await service.getRevenueAnalytics(startDate, endDate);

            expect(result.dailyRevenue).toHaveLength(2);
            expect(result.dailyRevenue[0]).toHaveProperty('date');
            expect(result.dailyRevenue[0]).toHaveProperty('revenue');
            expect(result.dailyRevenue[0].revenue).toBe(1000);
        });
    });

    describe('calculateRetention', () => {
        it('should calculate retention rate correctly', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            userRepository.count
                .mockResolvedValueOnce(100) // total users
                .mockResolvedValueOnce(80); // active users

            const result = await service.calculateRetention(startDate, endDate);

            // Retention should be 80/100 * 100 = 80%
            expect(result).toBe(80);
        });

        it('should return 0 if no users', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            userRepository.count.mockResolvedValue(0);

            const result = await service.calculateRetention(startDate, endDate);

            expect(result).toBe(0);
        });
    });

    describe('calculateChurn', () => {
        it('should calculate churn rate correctly', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            userRepository.count.mockResolvedValue(100);

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(20),
            };
            userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.calculateChurn(startDate, endDate);

            // Churn should be 20/100 * 100 = 20%
            expect(result).toBe(20);
        });

        it('should return 0 if no users', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            userRepository.count.mockResolvedValue(0);

            const result = await service.calculateChurn(startDate, endDate);

            expect(result).toBe(0);
        });

        it('should consider users inactive after 30 days', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            userRepository.count.mockResolvedValue(100);

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(15),
            };
            userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.calculateChurn(startDate, endDate);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                '(user.last_activity_at IS NULL OR user.last_activity_at < :thirtyDaysAgo)',
                expect.objectContaining({
                    thirtyDaysAgo: expect.any(Date),
                }),
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty daily stats', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            dailyStatRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            userRepository.count.mockResolvedValue(0);

            const userQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0),
            };
            userRepository.createQueryBuilder.mockReturnValue(userQueryBuilder);

            const result = await service.getUserAnalytics(startDate, endDate);

            expect(result.growth).toBe(0);
            expect(result.dailyStats).toEqual([]);
        });

        it('should handle null/undefined average values', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            postRepository.count.mockResolvedValue(0);

            const queryBuilder = {
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([]),
                getRawOne: jest.fn().mockResolvedValue({ avg: null }),
            };
            postRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getPostAnalytics(startDate, endDate);

            expect(result.avgViewsPerPost).toBe(0);
            expect(result.avgApplicationsPerPost).toBe(0);
        });
    });
});
