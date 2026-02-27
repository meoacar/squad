import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditService } from './services/audit.service';
import { AnalyticsService } from './services/analytics.service';
import { RoleService } from './services/role.service';
import { QueueService } from './services/queue.service';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Report } from '../reports/entities/report.entity';
import { DailyStat } from './entities/daily-stat.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AdminRole as AdminRoleEntity } from './entities/admin-role.entity';
import { UserStatus } from '../common/enums/user-status.enum';
import { PostStatus } from '../common/enums/post-status.enum';

describe('Admin Module Integration Tests', () => {
    let adminService: AdminService;
    let adminController: AdminController;
    let auditService: AuditService;
    let roleService: RoleService;
    let userRepository: any;
    let postRepository: any;
    let reportRepository: any;
    let adminRoleRepository: any;
    let auditLogRepository: any;

    const mockRequest = {
        user: { id: 'admin-123', role: 'ADMIN' },
    } as any;

    beforeEach(async () => {
        const mockUserRepository = {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            })),
        };

        const mockPostRepository = {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
                select: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
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
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            })),
        };

        const mockDailyStatRepository = {
            createQueryBuilder: jest.fn(() => ({
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            })),
        };

        const mockAuditLogRepository = {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            })),
        };

        const mockAdminRoleRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            })),
        };

        const mockCacheManager = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        const mockQueueService = {
            getQueueStats: jest.fn(),
            getJobStatus: jest.fn(),
            cleanQueue: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                AdminService,
                AuditService,
                AnalyticsService,
                RoleService,
                {
                    provide: QueueService,
                    useValue: mockQueueService,
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
                    provide: getRepositoryToken(AuditLog),
                    useValue: mockAuditLogRepository,
                },
                {
                    provide: getRepositoryToken(AdminRoleEntity),
                    useValue: mockAdminRoleRepository,
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        adminService = module.get<AdminService>(AdminService);
        adminController = module.get<AdminController>(AdminController);
        auditService = module.get<AuditService>(AuditService);
        roleService = module.get<RoleService>(RoleService);
        userRepository = module.get(getRepositoryToken(User));
        postRepository = module.get(getRepositoryToken(Post));
        reportRepository = module.get(getRepositoryToken(Report));
        adminRoleRepository = module.get(getRepositoryToken(AdminRoleEntity));
        auditLogRepository = module.get(getRepositoryToken(AuditLog));

        jest.clearAllMocks();
    });

    describe('User Moderation Workflow', () => {
        it('should suspend user and log action', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                status: UserStatus.ACTIVE,
            };

            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            userRepository.findOne
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce({ ...mockUser, status: UserStatus.SUSPENDED });

            const mockAuditLog = { id: 'log-123' };
            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const dto = { days: 7, reason: 'Violation of terms' };
            const result = await adminController.suspendUser('user-123', dto, mockRequest);

            expect(result.status).toBe(UserStatus.SUSPENDED);
            expect(auditLogRepository.save).toHaveBeenCalled();
            expect(auditLogRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action_type: 'USER_SUSPENDED',
                    target_id: 'user-123',
                }),
            );
        });

        it('should ban user and log action', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                status: UserStatus.ACTIVE,
            };

            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            userRepository.findOne
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce({ ...mockUser, status: UserStatus.BANNED });

            const mockAuditLog = { id: 'log-123' };
            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const dto = { reason: 'Severe violation', permanent: true };
            const result = await adminController.banUser('user-123', dto, mockRequest);

            expect(result.status).toBe(UserStatus.BANNED);
            expect(auditLogRepository.save).toHaveBeenCalled();
        });

        it('should unban user and log action', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                status: UserStatus.BANNED,
            };

            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            userRepository.findOne
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce({ ...mockUser, status: UserStatus.ACTIVE });

            const mockAuditLog = { id: 'log-123' };
            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const result = await adminController.unbanUser('user-123', mockRequest);

            expect(result.status).toBe(UserStatus.ACTIVE);
            expect(auditLogRepository.save).toHaveBeenCalled();
        });
    });

    describe('Post Moderation Workflow', () => {
        it('should delete post and log action', async () => {
            const mockPost = {
                id: 'post-123',
                title: 'Test Post',
                status: PostStatus.ACTIVE,
            };

            postRepository.findOne.mockResolvedValue(mockPost);
            postRepository.update.mockResolvedValue({});

            const mockAuditLog = { id: 'log-123' };
            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const dto = { reason: 'spam' };
            const result = await adminController.deletePost('post-123', dto, mockRequest);

            expect(result.success).toBe(true);
            expect(postRepository.update).toHaveBeenCalledWith(
                'post-123',
                expect.objectContaining({
                    status: PostStatus.DELETED,
                    deletion_reason: 'spam',
                }),
            );
            expect(auditLogRepository.save).toHaveBeenCalled();
        });

        it('should boost post and log action', async () => {
            const mockPost = {
                id: 'post-123',
                title: 'Test Post',
                is_boosted: false,
            };

            postRepository.findOne.mockResolvedValue(mockPost);
            postRepository.update.mockResolvedValue({});
            postRepository.findOne
                .mockResolvedValueOnce(mockPost)
                .mockResolvedValueOnce({ ...mockPost, is_boosted: true });

            const dto = { hours: 24 };
            const result = await adminController.assignBoost('post-123', dto);

            expect(result.is_boosted).toBe(true);
            expect(postRepository.update).toHaveBeenCalledWith(
                'post-123',
                expect.objectContaining({
                    is_boosted: true,
                }),
            );
        });
    });

    describe('Report Resolution Workflow', () => {
        it('should resolve report and log action', async () => {
            const mockReport = {
                id: 'report-123',
                status: 'PENDING',
                reason: 'spam',
            };

            reportRepository.findOne.mockResolvedValue(mockReport);
            reportRepository.update.mockResolvedValue({});
            reportRepository.findOne
                .mockResolvedValueOnce(mockReport)
                .mockResolvedValueOnce({ ...mockReport, status: 'RESOLVED' });

            const mockAuditLog = { id: 'log-123' };
            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const dto = {
                status: 'RESOLVED',
                resolution: 'Action taken',
                action: 'WARN',
            };
            const result = await adminController.resolveReport('report-123', dto, mockRequest);

            expect(result.status).toBe('RESOLVED');
            expect(auditLogRepository.save).toHaveBeenCalled();
        });

        it('should dismiss report and log action', async () => {
            const mockReport = {
                id: 'report-123',
                status: 'PENDING',
                reason: 'spam',
            };

            reportRepository.findOne.mockResolvedValue(mockReport);
            reportRepository.update.mockResolvedValue({});
            reportRepository.findOne
                .mockResolvedValueOnce(mockReport)
                .mockResolvedValueOnce({ ...mockReport, status: 'DISMISSED' });

            const mockAuditLog = { id: 'log-123' };
            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const dto = { reason: 'Not a violation' };
            const result = await adminController.dismissReport('report-123', dto, mockRequest);

            expect(result.status).toBe('DISMISSED');
            expect(auditLogRepository.save).toHaveBeenCalled();
        });
    });

    describe('Premium Management Workflow', () => {
        it('should assign premium to user', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                is_premium: false,
            };

            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            userRepository.findOne
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce({ ...mockUser, is_premium: true });

            const dto = { days: 30, tier: 'BASIC' };
            const result = await adminController.assignPremium('user-123', dto);

            expect(result.is_premium).toBe(true);
            expect(userRepository.update).toHaveBeenCalledWith(
                'user-123',
                expect.objectContaining({
                    is_premium: true,
                    premium_tier: 'BASIC',
                }),
            );
        });

        it('should remove premium from user', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                is_premium: true,
            };

            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            userRepository.findOne
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce({ ...mockUser, is_premium: false });

            const result = await adminController.removePremium('user-123');

            expect(result.is_premium).toBe(false);
            expect(userRepository.update).toHaveBeenCalledWith(
                'user-123',
                expect.objectContaining({
                    is_premium: false,
                }),
            );
        });
    });

    describe('Role Management Workflow', () => {
        it('should assign admin role to user', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
            };

            const mockRole = {
                id: 'role-123',
                user_id: 'user-123',
                role: 'ADMIN',
            };

            userRepository.findOne.mockResolvedValue(mockUser);
            adminRoleRepository.update.mockResolvedValue({});
            adminRoleRepository.create.mockReturnValue(mockRole);
            adminRoleRepository.save.mockResolvedValue(mockRole);

            const dto = { role: 'ADMIN' };
            const result = await adminController.assignRole('user-123', dto, mockRequest);

            expect(result.role).toBe('ADMIN');
            expect(adminRoleRepository.save).toHaveBeenCalled();
        });

        it('should revoke admin role from user', async () => {
            adminRoleRepository.update.mockResolvedValue({});

            const result = await adminController.revokeRole('user-123');

            expect(result.message).toBe('Role revoked successfully');
            expect(adminRoleRepository.update).toHaveBeenCalledWith(
                { user_id: 'user-123' },
                { expires_at: expect.any(Date) },
            );
        });
    });

    describe('Bulk Operations Workflow', () => {
        it('should bulk suspend multiple users', async () => {
            userRepository.update.mockResolvedValue({});

            const mockAuditLog = { id: 'log-123' };
            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const dto = {
                action: 'SUSPEND',
                ids: ['user-1', 'user-2', 'user-3'],
                params: { days: 7, reason: 'Bulk suspension' },
            };

            const result = await adminController.bulkUserAction(dto, mockRequest);

            expect(result.success).toBe(true);
            expect(result.count).toBe(3);
            expect(userRepository.update).toHaveBeenCalledWith(
                dto.ids,
                expect.objectContaining({
                    status: UserStatus.SUSPENDED,
                }),
            );
            expect(auditLogRepository.save).toHaveBeenCalled();
        });

        it('should bulk ban multiple users', async () => {
            userRepository.update.mockResolvedValue({});

            const mockAuditLog = { id: 'log-123' };
            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const dto = {
                action: 'BAN',
                ids: ['user-1', 'user-2'],
                params: { reason: 'Bulk ban', permanent: true },
            };

            const result = await adminController.bulkUserAction(dto, mockRequest);

            expect(result.success).toBe(true);
            expect(result.count).toBe(2);
            expect(userRepository.update).toHaveBeenCalledWith(
                dto.ids,
                expect.objectContaining({
                    status: UserStatus.BANNED,
                }),
            );
        });
    });

    describe('Audit Trail', () => {
        it('should create audit log for every admin action', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                status: UserStatus.ACTIVE,
            };

            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({});
            userRepository.findOne
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce({ ...mockUser, status: UserStatus.SUSPENDED });

            const mockAuditLog = { id: 'log-123' };
            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const dto = { days: 7, reason: 'Test' };
            await adminController.suspendUser('user-123', dto, mockRequest);

            expect(auditLogRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    admin_id: 'admin-123',
                    action_type: 'USER_SUSPENDED',
                    target_type: 'user',
                    target_id: 'user-123',
                }),
            );
            expect(auditLogRepository.save).toHaveBeenCalled();
        });
    });
});
