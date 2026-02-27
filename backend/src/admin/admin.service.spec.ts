import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuditService } from './services/audit.service';
import { AnalyticsService } from './services/analytics.service';
import { QueueService } from './services/queue.service';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Report } from '../reports/entities/report.entity';
import { DailyStat } from './entities/daily-stat.entity';
import { UserStatus } from '../common/enums/user-status.enum';
import { PostStatus } from '../common/enums/post-status.enum';

describe('AdminService', () => {
    let service: AdminService;
    let userRepository: any;
    let postRepository: any;
    let reportRepository: any;
    let dailyStatRepository: any;
    let auditService: any;
    let cacheManager: any;

    const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
        is_premium: false,
        password: 'hashed',
        refresh_token: 'token',
        email_verification_token: 'verify',
        password_reset_token: 'reset',
    };

    const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        status: PostStatus.ACTIVE,
        created_by: 'user-123',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_boosted: false,
        is_featured: false,
    };

    const mockReport = {
        id: 'report-123',
        post_id: 'post-123',
        reporter_id: 'user-456',
        reason: 'spam',
        status: 'PENDING',
    };

    beforeEach(async () => {
        const mockUserRepository = {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            })),
        };

        const mockPostRepository = {
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn(),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn(),
            })),
        };

        const mockReportRepository = {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn(),
            })),
        };

        const mockDailyStatRepository = {
            createQueryBuilder: jest.fn(() => ({
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            })),
        };

        const mockAuditService = {
            log: jest.fn(),
            getLogs: jest.fn(),
        };

        const mockAnalyticsService = {};

        const mockQueueService = {};

        const mockCacheManager = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
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
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        userRepository = module.get(getRepositoryToken(User));
        postRepository = module.get(getRepositoryToken(Post));
        reportRepository = module.get(getRepositoryToken(Report));
        dailyStatRepository = module.get(getRepositoryToken(DailyStat));
        auditService = module.get(AuditService);
        cacheManager = module.get(CACHE_MANAGER);

        jest.clearAllMocks();
    });

    describe('User Management', () => {
        describe('getUsers', () => {
            it('should return users without sensitive fields', async () => {
                const queryBuilder = {
                    andWhere: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([mockUser]),
                };
                userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

                const result = await service.getUsers();

                expect(result).toHaveLength(1);
                expect(result[0]).not.toHaveProperty('password');
                expect(result[0]).not.toHaveProperty('refresh_token');
                expect(result[0]).not.toHaveProperty('email_verification_token');
                expect(result[0]).not.toHaveProperty('password_reset_token');
            });

            it('should filter users by search term', async () => {
                const queryBuilder = {
                    andWhere: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([mockUser]),
                };
                userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

                await service.getUsers('test');

                expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                    '(user.username ILIKE :search OR user.email ILIKE :search)',
                    { search: '%test%' },
                );
            });

            it('should filter users by status', async () => {
                const queryBuilder = {
                    andWhere: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([mockUser]),
                };
                userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

                await service.getUsers(undefined, UserStatus.ACTIVE);

                expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                    'user.status = :status',
                    { status: UserStatus.ACTIVE },
                );
            });
        });

        describe('getUserById', () => {
            it('should return user without sensitive fields', async () => {
                userRepository.findOne.mockResolvedValue(mockUser);

                const result = await service.getUserById('user-123');

                expect(result).not.toHaveProperty('password');
                expect(result.id).toBe('user-123');
            });

            it('should throw NotFoundException if user not found', async () => {
                userRepository.findOne.mockResolvedValue(null);

                await expect(service.getUserById('invalid-id')).rejects.toThrow(
                    NotFoundException,
                );
            });
        });

        describe('suspendUser', () => {
            it('should suspend user for specified days', async () => {
                userRepository.findOne.mockResolvedValue(mockUser);
                userRepository.update.mockResolvedValue({});
                userRepository.findOne.mockResolvedValueOnce(mockUser).mockResolvedValueOnce({
                    ...mockUser,
                    status: UserStatus.SUSPENDED,
                });

                const dto = { days: 7, reason: 'Violation of terms' };
                const result = await service.suspendUser('user-123', dto, 'admin-123');

                expect(userRepository.update).toHaveBeenCalledWith(
                    'user-123',
                    expect.objectContaining({
                        status: UserStatus.SUSPENDED,
                        suspended_reason: dto.reason,
                    }),
                );
                expect(auditService.log).toHaveBeenCalledWith(
                    expect.objectContaining({
                        adminId: 'admin-123',
                        action: 'USER_SUSPENDED',
                        targetType: 'user',
                        targetId: 'user-123',
                    }),
                );
            });

            it('should throw NotFoundException if user not found', async () => {
                userRepository.findOne.mockResolvedValue(null);

                const dto = { days: 7, reason: 'Test' };
                await expect(
                    service.suspendUser('invalid-id', dto, 'admin-123'),
                ).rejects.toThrow(NotFoundException);
            });
        });

        describe('banUser', () => {
            it('should ban user permanently', async () => {
                userRepository.findOne.mockResolvedValue(mockUser);
                userRepository.update.mockResolvedValue({});
                userRepository.findOne.mockResolvedValueOnce(mockUser).mockResolvedValueOnce({
                    ...mockUser,
                    status: UserStatus.BANNED,
                });

                const dto = { reason: 'Severe violation', permanent: true };
                const result = await service.banUser('user-123', dto, 'admin-123');

                expect(userRepository.update).toHaveBeenCalledWith(
                    'user-123',
                    expect.objectContaining({
                        status: UserStatus.BANNED,
                        banned_reason: dto.reason,
                    }),
                );
                expect(auditService.log).toHaveBeenCalledWith(
                    expect.objectContaining({
                        action: 'USER_BANNED',
                    }),
                );
            });
        });

        describe('unbanUser', () => {
            it('should unban user and restore active status', async () => {
                userRepository.findOne.mockResolvedValue({
                    ...mockUser,
                    status: UserStatus.BANNED,
                });
                userRepository.update.mockResolvedValue({});
                userRepository.findOne.mockResolvedValueOnce(mockUser).mockResolvedValueOnce({
                    ...mockUser,
                    status: UserStatus.ACTIVE,
                });

                const result = await service.unbanUser('user-123', 'admin-123');

                expect(userRepository.update).toHaveBeenCalledWith(
                    'user-123',
                    expect.objectContaining({
                        status: UserStatus.ACTIVE,
                        banned_at: undefined,
                        banned_reason: undefined,
                    }),
                );
            });
        });

        describe('assignPremium', () => {
            it('should assign premium to user', async () => {
                userRepository.findOne.mockResolvedValue(mockUser);
                userRepository.update.mockResolvedValue({});
                userRepository.findOne.mockResolvedValueOnce(mockUser).mockResolvedValueOnce({
                    ...mockUser,
                    is_premium: true,
                });

                const dto = { days: 30, tier: 'BASIC' };
                const result = await service.assignPremium('user-123', dto);

                expect(userRepository.update).toHaveBeenCalledWith(
                    'user-123',
                    expect.objectContaining({
                        is_premium: true,
                        premium_tier: 'BASIC',
                    }),
                );
                expect(result.is_premium).toBe(true);
            });
        });

        describe('removePremium', () => {
            it('should remove premium from user', async () => {
                userRepository.findOne.mockResolvedValue({
                    ...mockUser,
                    is_premium: true,
                });
                userRepository.update.mockResolvedValue({});
                userRepository.findOne.mockResolvedValueOnce(mockUser).mockResolvedValueOnce({
                    ...mockUser,
                    is_premium: false,
                });

                const result = await service.removePremium('user-123');

                expect(userRepository.update).toHaveBeenCalledWith(
                    'user-123',
                    expect.objectContaining({
                        is_premium: false,
                        premium_expires_at: undefined,
                        premium_tier: undefined,
                    }),
                );
            });
        });
    });

    describe('Post Management', () => {
        describe('getPosts', () => {
            it('should return paginated posts', async () => {
                const queryBuilder = {
                    andWhere: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    getManyAndCount: jest.fn().mockResolvedValue([[mockPost], 1]),
                };
                postRepository.createQueryBuilder.mockReturnValue(queryBuilder);

                const result = await service.getPosts({}, 1, 25);

                expect(result.posts).toHaveLength(1);
                expect(result.total).toBe(1);
                expect(result.page).toBe(1);
                expect(result.limit).toBe(25);
            });

            it('should filter posts by search term', async () => {
                const queryBuilder = {
                    andWhere: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
                };
                postRepository.createQueryBuilder.mockReturnValue(queryBuilder);

                await service.getPosts({ search: 'test' }, 1, 25);

                expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                    'post.title ILIKE :search',
                    { search: '%test%' },
                );
            });
        });

        describe('assignBoost', () => {
            it('should assign boost to post', async () => {
                postRepository.findOne.mockResolvedValue(mockPost);
                postRepository.update.mockResolvedValue({});
                postRepository.findOne.mockResolvedValueOnce(mockPost).mockResolvedValueOnce({
                    ...mockPost,
                    is_boosted: true,
                });

                const dto = { hours: 24 };
                const result = await service.assignBoost('post-123', dto);

                expect(postRepository.update).toHaveBeenCalledWith(
                    'post-123',
                    expect.objectContaining({
                        is_boosted: true,
                    }),
                );
            });
        });

        describe('setFeatured', () => {
            it('should set post as featured', async () => {
                postRepository.findOne.mockResolvedValue(mockPost);
                postRepository.update.mockResolvedValue({});
                postRepository.findOne.mockResolvedValueOnce(mockPost).mockResolvedValueOnce({
                    ...mockPost,
                    is_featured: true,
                });

                const result = await service.setFeatured('post-123', true);

                expect(postRepository.update).toHaveBeenCalledWith(
                    'post-123',
                    expect.objectContaining({
                        is_featured: true,
                    }),
                );
            });

            it('should remove featured status', async () => {
                postRepository.findOne.mockResolvedValue({
                    ...mockPost,
                    is_featured: true,
                });
                postRepository.update.mockResolvedValue({});
                postRepository.findOne.mockResolvedValueOnce(mockPost).mockResolvedValueOnce({
                    ...mockPost,
                    is_featured: false,
                });

                const result = await service.setFeatured('post-123', false);

                expect(postRepository.update).toHaveBeenCalledWith(
                    'post-123',
                    expect.objectContaining({
                        is_featured: false,
                        featured_until: undefined,
                    }),
                );
            });
        });

        describe('deletePost', () => {
            it('should soft delete post', async () => {
                postRepository.findOne.mockResolvedValue(mockPost);
                postRepository.update.mockResolvedValue({});

                const result = await service.deletePost('post-123', 'spam', 'admin-123');

                expect(postRepository.update).toHaveBeenCalledWith(
                    'post-123',
                    expect.objectContaining({
                        status: PostStatus.DELETED,
                        deletion_reason: 'spam',
                        deleted_by: 'admin-123',
                    }),
                );
                expect(auditService.log).toHaveBeenCalled();
            });
        });

        describe('pausePost', () => {
            it('should pause post', async () => {
                postRepository.findOne.mockResolvedValue(mockPost);
                postRepository.update.mockResolvedValue({});
                postRepository.findOne.mockResolvedValueOnce(mockPost).mockResolvedValueOnce({
                    ...mockPost,
                    status: PostStatus.PAUSED,
                });

                const result = await service.pausePost('post-123', 'admin-123');

                expect(postRepository.update).toHaveBeenCalledWith(
                    'post-123',
                    { status: PostStatus.PAUSED },
                );
            });
        });

        describe('resumePost', () => {
            it('should resume paused post', async () => {
                postRepository.findOne.mockResolvedValue({
                    ...mockPost,
                    status: PostStatus.PAUSED,
                });
                postRepository.update.mockResolvedValue({});
                postRepository.findOne.mockResolvedValueOnce(mockPost).mockResolvedValueOnce({
                    ...mockPost,
                    status: PostStatus.ACTIVE,
                });

                const result = await service.resumePost('post-123', 'admin-123');

                expect(postRepository.update).toHaveBeenCalledWith(
                    'post-123',
                    { status: PostStatus.ACTIVE },
                );
            });
        });

        describe('extendPost', () => {
            it('should extend post expiration', async () => {
                postRepository.findOne.mockResolvedValue(mockPost);
                postRepository.update.mockResolvedValue({});
                postRepository.findOne.mockResolvedValueOnce(mockPost).mockResolvedValueOnce(mockPost);

                const result = await service.extendPost('post-123', 24, 'admin-123');

                expect(postRepository.update).toHaveBeenCalled();
                expect(auditService.log).toHaveBeenCalledWith(
                    expect.objectContaining({
                        action: 'POST_EXTENDED',
                        details: { hours: 24 },
                    }),
                );
            });
        });
    });

    describe('Report Management', () => {
        describe('getReports', () => {
            it('should return paginated reports', async () => {
                const queryBuilder = {
                    andWhere: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    addOrderBy: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    getManyAndCount: jest.fn().mockResolvedValue([[mockReport], 1]),
                };
                reportRepository.createQueryBuilder.mockReturnValue(queryBuilder);

                const result = await service.getReports({}, 1, 25);

                expect(result.reports).toHaveLength(1);
                expect(result.total).toBe(1);
            });
        });

        describe('resolveReport', () => {
            it('should resolve report', async () => {
                reportRepository.findOne.mockResolvedValue(mockReport);
                reportRepository.update.mockResolvedValue({});
                reportRepository.findOne.mockResolvedValueOnce(mockReport).mockResolvedValueOnce({
                    ...mockReport,
                    status: 'RESOLVED',
                });

                const dto = {
                    status: 'RESOLVED',
                    resolution: 'Action taken',
                    action: 'WARN',
                };
                const result = await service.resolveReport('report-123', dto, 'admin-123');

                expect(reportRepository.update).toHaveBeenCalledWith(
                    'report-123',
                    expect.objectContaining({
                        status: 'RESOLVED',
                        resolution_notes: 'Action taken',
                        reviewed_by: 'admin-123',
                    }),
                );
            });
        });

        describe('dismissReport', () => {
            it('should dismiss report', async () => {
                reportRepository.findOne.mockResolvedValue(mockReport);
                reportRepository.update.mockResolvedValue({});
                reportRepository.findOne.mockResolvedValueOnce(mockReport).mockResolvedValueOnce({
                    ...mockReport,
                    status: 'DISMISSED',
                });

                const result = await service.dismissReport(
                    'report-123',
                    'Not a violation',
                    'admin-123',
                );

                expect(reportRepository.update).toHaveBeenCalledWith(
                    'report-123',
                    expect.objectContaining({
                        status: 'DISMISSED',
                        resolution_notes: 'Not a violation',
                    }),
                );
            });
        });

        describe('getReportStats', () => {
            it('should return report statistics', async () => {
                reportRepository.count
                    .mockResolvedValueOnce(100)
                    .mockResolvedValueOnce(30)
                    .mockResolvedValueOnce(50)
                    .mockResolvedValueOnce(20);

                const result = await service.getReportStats();

                expect(result).toEqual({
                    total: 100,
                    pending: 30,
                    resolved: 50,
                    dismissed: 20,
                });
            });
        });

        describe('getSimilarReports', () => {
            it('should return similar reports', async () => {
                reportRepository.findOne.mockResolvedValue(mockReport);
                reportRepository.find.mockResolvedValue([
                    { ...mockReport, id: 'report-456' },
                ]);

                const result = await service.getSimilarReports('report-123');

                expect(result).toHaveLength(1);
                expect(result[0].id).not.toBe('report-123');
            });
        });
    });

    describe('Dashboard', () => {
        describe('getDashboardStats', () => {
            it('should return cached stats if available', async () => {
                const cachedStats = { totalUsers: 100 };
                cacheManager.get.mockResolvedValue(cachedStats);

                const result = await service.getDashboardStats();

                expect(result).toEqual(cachedStats);
                expect(cacheManager.get).toHaveBeenCalled();
                expect(userRepository.count).not.toHaveBeenCalled();
            });

            it('should fetch and cache stats if not cached', async () => {
                cacheManager.get.mockResolvedValue(null);
                userRepository.count.mockResolvedValue(100);
                postRepository.count.mockResolvedValue(50);
                reportRepository.count.mockResolvedValue(10);

                const queryBuilder = {
                    select: jest.fn().mockReturnThis(),
                    getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
                };
                postRepository.createQueryBuilder.mockReturnValue(queryBuilder);

                const result = await service.getDashboardStats();

                expect(cacheManager.set).toHaveBeenCalled();
                expect(result).toHaveProperty('totalUsers');
                expect(result).toHaveProperty('totalPosts');
            });
        });

        describe('getDashboardCharts', () => {
            it('should return chart data for specified period', async () => {
                const mockStats = [
                    { date: new Date(), new_users: 10, new_posts: 5, revenue: 100 },
                ];
                const queryBuilder = {
                    where: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue(mockStats),
                };
                dailyStatRepository.createQueryBuilder.mockReturnValue(queryBuilder);

                const result = await service.getDashboardCharts('30d');

                expect(result).toHaveProperty('userGrowth');
                expect(result).toHaveProperty('postTrend');
                expect(result).toHaveProperty('revenue');
            });
        });
    });

    describe('Bulk Operations', () => {
        describe('bulkSuspendUsers', () => {
            it('should suspend multiple users', async () => {
                userRepository.update.mockResolvedValue({});

                const dto = { days: 7, reason: 'Bulk suspension' };
                const result = await service.bulkSuspendUsers(
                    ['user-1', 'user-2'],
                    dto,
                    'admin-123',
                );

                expect(result.success).toBe(true);
                expect(result.count).toBe(2);
                expect(userRepository.update).toHaveBeenCalledWith(
                    ['user-1', 'user-2'],
                    expect.objectContaining({
                        status: UserStatus.SUSPENDED,
                    }),
                );
            });
        });

        describe('bulkBanUsers', () => {
            it('should ban multiple users', async () => {
                userRepository.update.mockResolvedValue({});

                const dto = { reason: 'Bulk ban', permanent: true };
                const result = await service.bulkBanUsers(
                    ['user-1', 'user-2'],
                    dto,
                    'admin-123',
                );

                expect(result.success).toBe(true);
                expect(result.count).toBe(2);
                expect(userRepository.update).toHaveBeenCalledWith(
                    ['user-1', 'user-2'],
                    expect.objectContaining({
                        status: UserStatus.BANNED,
                    }),
                );
            });
        });
    });
});
