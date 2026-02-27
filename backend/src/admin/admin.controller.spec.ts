import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RoleService } from './services/role.service';
import { QueueService } from './services/queue.service';

describe('AdminController', () => {
    let controller: AdminController;
    let adminService: any;
    let roleService: any;
    let queueService: any;

    const mockRequest = {
        user: { id: 'admin-123', role: 'ADMIN' },
    } as any;

    beforeEach(async () => {
        const mockAdminService = {
            getUsers: jest.fn(),
            getUserById: jest.fn(),
            assignPremium: jest.fn(),
            removePremium: jest.fn(),
            assignBoost: jest.fn(),
            setFeatured: jest.fn(),
            getStats: jest.fn(),
            getDashboardStats: jest.fn(),
            getDashboardCharts: jest.fn(),
            getRecentActivities: jest.fn(),
            suspendUser: jest.fn(),
            banUser: jest.fn(),
            unbanUser: jest.fn(),
            getUserActivity: jest.fn(),
            getUserPosts: jest.fn(),
            getUserApplications: jest.fn(),
            bulkSuspendUsers: jest.fn(),
            bulkBanUsers: jest.fn(),
            getPosts: jest.fn(),
            getPostById: jest.fn(),
            updatePost: jest.fn(),
            deletePost: jest.fn(),
            pausePost: jest.fn(),
            resumePost: jest.fn(),
            extendPost: jest.fn(),
            getReports: jest.fn(),
            getReportById: jest.fn(),
            resolveReport: jest.fn(),
            dismissReport: jest.fn(),
            getReportStats: jest.fn(),
            getSimilarReports: jest.fn(),
        };

        const mockRoleService = {
            getAllAdminUsers: jest.fn(),
            assignRole: jest.fn(),
            revokeRole: jest.fn(),
            getUserRole: jest.fn(),
        };

        const mockQueueService = {
            getQueueStats: jest.fn(),
            getJobStatus: jest.fn(),
            cleanQueue: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                {
                    provide: AdminService,
                    useValue: mockAdminService,
                },
                {
                    provide: RoleService,
                    useValue: mockRoleService,
                },
                {
                    provide: QueueService,
                    useValue: mockQueueService,
                },
            ],
        }).compile();

        controller = module.get<AdminController>(AdminController);
        adminService = module.get(AdminService);
        roleService = module.get(RoleService);
        queueService = module.get(QueueService);

        jest.clearAllMocks();
    });

    describe('User Management Endpoints', () => {
        describe('GET /admin/users', () => {
            it('should return all users', async () => {
                const mockUsers = [{ id: 'user-1', username: 'test' }];
                adminService.getUsers.mockResolvedValue(mockUsers);

                const result = await controller.getUsers();

                expect(result).toEqual(mockUsers);
                expect(adminService.getUsers).toHaveBeenCalled();
            });

            it('should filter users by search term', async () => {
                adminService.getUsers.mockResolvedValue([]);

                await controller.getUsers('test');

                expect(adminService.getUsers).toHaveBeenCalledWith('test', undefined, undefined);
            });

            it('should filter users by status and region', async () => {
                adminService.getUsers.mockResolvedValue([]);

                await controller.getUsers(undefined, 'ACTIVE', 'US');

                expect(adminService.getUsers).toHaveBeenCalledWith(undefined, 'ACTIVE', 'US');
            });
        });

        describe('GET /admin/users/:userId', () => {
            it('should return user by id', async () => {
                const mockUser = { id: 'user-123', username: 'test' };
                adminService.getUserById.mockResolvedValue(mockUser);

                const result = await controller.getUserById('user-123');

                expect(result).toEqual(mockUser);
                expect(adminService.getUserById).toHaveBeenCalledWith('user-123');
            });
        });

        describe('POST /admin/users/:userId/premium', () => {
            it('should assign premium to user', async () => {
                const dto = { days: 30, tier: 'BASIC' };
                const mockUser = { id: 'user-123', is_premium: true };
                adminService.assignPremium.mockResolvedValue(mockUser);

                const result = await controller.assignPremium('user-123', dto);

                expect(result).toEqual(mockUser);
                expect(adminService.assignPremium).toHaveBeenCalledWith('user-123', dto);
            });
        });

        describe('DELETE /admin/users/:userId/premium', () => {
            it('should remove premium from user', async () => {
                const mockUser = { id: 'user-123', is_premium: false };
                adminService.removePremium.mockResolvedValue(mockUser);

                const result = await controller.removePremium('user-123');

                expect(result).toEqual(mockUser);
                expect(adminService.removePremium).toHaveBeenCalledWith('user-123');
            });
        });

        describe('POST /admin/users/:id/suspend', () => {
            it('should suspend user', async () => {
                const dto = { days: 7, reason: 'Violation' };
                const mockUser = { id: 'user-123', status: 'SUSPENDED' };
                adminService.suspendUser.mockResolvedValue(mockUser);

                const result = await controller.suspendUser('user-123', dto, mockRequest);

                expect(result).toEqual(mockUser);
                expect(adminService.suspendUser).toHaveBeenCalledWith(
                    'user-123',
                    dto,
                    'admin-123',
                );
            });
        });

        describe('POST /admin/users/:id/ban', () => {
            it('should ban user', async () => {
                const dto = { reason: 'Severe violation', permanent: true };
                const mockUser = { id: 'user-123', status: 'BANNED' };
                adminService.banUser.mockResolvedValue(mockUser);

                const result = await controller.banUser('user-123', dto, mockRequest);

                expect(result).toEqual(mockUser);
                expect(adminService.banUser).toHaveBeenCalledWith('user-123', dto, 'admin-123');
            });
        });

        describe('DELETE /admin/users/:id/ban', () => {
            it('should unban user', async () => {
                const mockUser = { id: 'user-123', status: 'ACTIVE' };
                adminService.unbanUser.mockResolvedValue(mockUser);

                const result = await controller.unbanUser('user-123', mockRequest);

                expect(result).toEqual(mockUser);
                expect(adminService.unbanUser).toHaveBeenCalledWith('user-123', 'admin-123');
            });
        });

        describe('GET /admin/users/:id/activity', () => {
            it('should return user activity', async () => {
                const mockActivity = { user: {}, totalPosts: 10, recentPosts: [] };
                adminService.getUserActivity.mockResolvedValue(mockActivity);

                const result = await controller.getUserActivity('user-123');

                expect(result).toEqual(mockActivity);
                expect(adminService.getUserActivity).toHaveBeenCalledWith('user-123');
            });
        });

        describe('GET /admin/users/:id/posts', () => {
            it('should return user posts', async () => {
                const mockPosts = { posts: [], total: 0, page: 1, limit: 25 };
                adminService.getUserPosts.mockResolvedValue(mockPosts);

                const result = await controller.getUserPosts('user-123', 1, 25);

                expect(result).toEqual(mockPosts);
                expect(adminService.getUserPosts).toHaveBeenCalledWith('user-123', 1, 25);
            });
        });

        describe('POST /admin/users/bulk-action', () => {
            it('should perform bulk suspend action', async () => {
                const dto = {
                    action: 'SUSPEND',
                    ids: ['user-1', 'user-2'],
                    params: { days: 7, reason: 'Bulk action' },
                };
                adminService.bulkSuspendUsers.mockResolvedValue({ success: true, count: 2 });

                const result = await controller.bulkUserAction(dto, mockRequest);

                expect(result.success).toBe(true);
                expect(adminService.bulkSuspendUsers).toHaveBeenCalledWith(
                    dto.ids,
                    dto.params,
                    'admin-123',
                );
            });

            it('should perform bulk ban action', async () => {
                const dto = {
                    action: 'BAN',
                    ids: ['user-1', 'user-2'],
                    params: { reason: 'Bulk ban', permanent: true },
                };
                adminService.bulkBanUsers.mockResolvedValue({ success: true, count: 2 });

                const result = await controller.bulkUserAction(dto, mockRequest);

                expect(result.success).toBe(true);
                expect(adminService.bulkBanUsers).toHaveBeenCalledWith(
                    dto.ids,
                    dto.params,
                    'admin-123',
                );
            });
        });
    });

    describe('Post Management Endpoints', () => {
        describe('POST /admin/posts/:postId/boost', () => {
            it('should assign boost to post', async () => {
                const dto = { hours: 24 };
                const mockPost = { id: 'post-123', is_boosted: true };
                adminService.assignBoost.mockResolvedValue(mockPost);

                const result = await controller.assignBoost('post-123', dto);

                expect(result).toEqual(mockPost);
                expect(adminService.assignBoost).toHaveBeenCalledWith('post-123', dto);
            });
        });

        describe('POST /admin/posts/:postId/feature', () => {
            it('should set post as featured', async () => {
                const mockPost = { id: 'post-123', is_featured: true };
                adminService.setFeatured.mockResolvedValue(mockPost);

                const result = await controller.setFeatured('post-123');

                expect(result).toEqual(mockPost);
                expect(adminService.setFeatured).toHaveBeenCalledWith('post-123', true);
            });
        });

        describe('DELETE /admin/posts/:postId/feature', () => {
            it('should remove featured status', async () => {
                const mockPost = { id: 'post-123', is_featured: false };
                adminService.setFeatured.mockResolvedValue(mockPost);

                const result = await controller.removeFeatured('post-123');

                expect(result).toEqual(mockPost);
                expect(adminService.setFeatured).toHaveBeenCalledWith('post-123', false);
            });
        });

        describe('GET /admin/posts', () => {
            it('should return paginated posts', async () => {
                const mockPosts = { posts: [], total: 0, page: 1, limit: 25 };
                adminService.getPosts.mockResolvedValue(mockPosts);

                const result = await controller.getPosts();

                expect(result).toEqual(mockPosts);
                expect(adminService.getPosts).toHaveBeenCalled();
            });

            it('should filter posts by search, status, and type', async () => {
                adminService.getPosts.mockResolvedValue({ posts: [], total: 0 });

                await controller.getPosts('test', 'ACTIVE', 'SQUAD', 1, 25);

                expect(adminService.getPosts).toHaveBeenCalledWith(
                    { search: 'test', status: 'ACTIVE', type: 'SQUAD' },
                    1,
                    25,
                );
            });
        });

        describe('GET /admin/posts/:id', () => {
            it('should return post by id', async () => {
                const mockPost = { id: 'post-123', title: 'Test' };
                adminService.getPostById.mockResolvedValue(mockPost);

                const result = await controller.getPostById('post-123');

                expect(result).toEqual(mockPost);
                expect(adminService.getPostById).toHaveBeenCalledWith('post-123');
            });
        });

        describe('PATCH /admin/posts/:id', () => {
            it('should update post', async () => {
                const dto = { title: 'Updated' };
                const mockPost = { id: 'post-123', title: 'Updated' };
                adminService.updatePost.mockResolvedValue(mockPost);

                const result = await controller.updatePost('post-123', dto, mockRequest);

                expect(result).toEqual(mockPost);
                expect(adminService.updatePost).toHaveBeenCalledWith(
                    'post-123',
                    dto,
                    'admin-123',
                );
            });
        });

        describe('DELETE /admin/posts/:id', () => {
            it('should delete post', async () => {
                const dto = { reason: 'spam' };
                adminService.deletePost.mockResolvedValue({ success: true });

                const result = await controller.deletePost('post-123', dto, mockRequest);

                expect(result.success).toBe(true);
                expect(adminService.deletePost).toHaveBeenCalledWith(
                    'post-123',
                    'spam',
                    'admin-123',
                );
            });
        });

        describe('POST /admin/posts/:id/pause', () => {
            it('should pause post', async () => {
                const mockPost = { id: 'post-123', status: 'PAUSED' };
                adminService.pausePost.mockResolvedValue(mockPost);

                const result = await controller.pausePost('post-123', mockRequest);

                expect(result).toEqual(mockPost);
                expect(adminService.pausePost).toHaveBeenCalledWith('post-123', 'admin-123');
            });
        });

        describe('POST /admin/posts/:id/resume', () => {
            it('should resume post', async () => {
                const mockPost = { id: 'post-123', status: 'ACTIVE' };
                adminService.resumePost.mockResolvedValue(mockPost);

                const result = await controller.resumePost('post-123', mockRequest);

                expect(result).toEqual(mockPost);
                expect(adminService.resumePost).toHaveBeenCalledWith('post-123', 'admin-123');
            });
        });

        describe('POST /admin/posts/:id/extend', () => {
            it('should extend post duration', async () => {
                const dto = { hours: 24 };
                const mockPost = { id: 'post-123' };
                adminService.extendPost.mockResolvedValue(mockPost);

                const result = await controller.extendPost('post-123', dto, mockRequest);

                expect(result).toEqual(mockPost);
                expect(adminService.extendPost).toHaveBeenCalledWith(
                    'post-123',
                    24,
                    'admin-123',
                );
            });
        });
    });

    describe('Report Management Endpoints', () => {
        describe('GET /admin/reports', () => {
            it('should return paginated reports', async () => {
                const mockReports = { reports: [], total: 0, page: 1, limit: 25 };
                adminService.getReports.mockResolvedValue(mockReports);

                const result = await controller.getReports();

                expect(result).toEqual(mockReports);
                expect(adminService.getReports).toHaveBeenCalled();
            });

            it('should filter reports by status and priority', async () => {
                adminService.getReports.mockResolvedValue({ reports: [], total: 0 });

                await controller.getReports('PENDING', 1, 1, 25);

                expect(adminService.getReports).toHaveBeenCalledWith(
                    { status: 'PENDING', priority: 1 },
                    1,
                    25,
                );
            });
        });

        describe('GET /admin/reports/:id', () => {
            it('should return report by id', async () => {
                const mockReport = { id: 'report-123', reason: 'spam' };
                adminService.getReportById.mockResolvedValue(mockReport);

                const result = await controller.getReportById('report-123');

                expect(result).toEqual(mockReport);
                expect(adminService.getReportById).toHaveBeenCalledWith('report-123');
            });
        });

        describe('POST /admin/reports/:id/resolve', () => {
            it('should resolve report', async () => {
                const dto = {
                    status: 'RESOLVED',
                    resolution: 'Action taken',
                    action: 'WARN',
                };
                const mockReport = { id: 'report-123', status: 'RESOLVED' };
                adminService.resolveReport.mockResolvedValue(mockReport);

                const result = await controller.resolveReport('report-123', dto, mockRequest);

                expect(result).toEqual(mockReport);
                expect(adminService.resolveReport).toHaveBeenCalledWith(
                    'report-123',
                    dto,
                    'admin-123',
                );
            });
        });

        describe('POST /admin/reports/:id/dismiss', () => {
            it('should dismiss report', async () => {
                const dto = { reason: 'Not a violation' };
                const mockReport = { id: 'report-123', status: 'DISMISSED' };
                adminService.dismissReport.mockResolvedValue(mockReport);

                const result = await controller.dismissReport('report-123', dto, mockRequest);

                expect(result).toEqual(mockReport);
                expect(adminService.dismissReport).toHaveBeenCalledWith(
                    'report-123',
                    'Not a violation',
                    'admin-123',
                );
            });
        });

        describe('GET /admin/reports/stats', () => {
            it('should return report statistics', async () => {
                const mockStats = { total: 100, pending: 30, resolved: 50, dismissed: 20 };
                adminService.getReportStats.mockResolvedValue(mockStats);

                const result = await controller.getReportStats();

                expect(result).toEqual(mockStats);
                expect(adminService.getReportStats).toHaveBeenCalled();
            });
        });

        describe('GET /admin/reports/similar/:id', () => {
            it('should return similar reports', async () => {
                const mockReports = [{ id: 'report-456' }];
                adminService.getSimilarReports.mockResolvedValue(mockReports);

                const result = await controller.getSimilarReports('report-123');

                expect(result).toEqual(mockReports);
                expect(adminService.getSimilarReports).toHaveBeenCalledWith('report-123');
            });
        });
    });

    describe('Dashboard Endpoints', () => {
        describe('GET /admin/stats', () => {
            it('should return platform statistics', async () => {
                const mockStats = { totalUsers: 100, totalPosts: 50 };
                adminService.getStats.mockResolvedValue(mockStats);

                const result = await controller.getStats();

                expect(result).toEqual(mockStats);
                expect(adminService.getStats).toHaveBeenCalled();
            });
        });

        describe('GET /admin/dashboard/stats', () => {
            it('should return dashboard statistics', async () => {
                const mockStats = { totalUsers: 100, activeUsers: 80 };
                adminService.getDashboardStats.mockResolvedValue(mockStats);

                const result = await controller.getDashboardStats();

                expect(result).toEqual(mockStats);
                expect(adminService.getDashboardStats).toHaveBeenCalled();
            });
        });

        describe('GET /admin/dashboard/charts', () => {
            it('should return dashboard charts data', async () => {
                const mockCharts = { userGrowth: [], postTrend: [] };
                adminService.getDashboardCharts.mockResolvedValue(mockCharts);

                const result = await controller.getDashboardCharts('30d');

                expect(result).toEqual(mockCharts);
                expect(adminService.getDashboardCharts).toHaveBeenCalledWith('30d');
            });
        });

        describe('GET /admin/dashboard/activities', () => {
            it('should return recent activities', async () => {
                const mockActivities = [[], 0];
                adminService.getRecentActivities.mockResolvedValue(mockActivities);

                const result = await controller.getRecentActivities(20);

                expect(result).toEqual(mockActivities);
                expect(adminService.getRecentActivities).toHaveBeenCalledWith(20);
            });
        });
    });

    describe('Role Management Endpoints', () => {
        describe('GET /admin/roles', () => {
            it('should return all admin users', async () => {
                const mockAdmins = [{ id: 'admin-1', role: 'ADMIN' }];
                roleService.getAllAdminUsers.mockResolvedValue(mockAdmins);

                const result = await controller.getAllAdminUsers();

                expect(result).toEqual(mockAdmins);
                expect(roleService.getAllAdminUsers).toHaveBeenCalled();
            });
        });

        describe('POST /admin/roles/:userId', () => {
            it('should assign role to user', async () => {
                const dto = { role: 'ADMIN', expiresAt: '2024-12-31' };
                const mockRole = { user_id: 'user-123', role: 'ADMIN' };
                roleService.assignRole.mockResolvedValue(mockRole);

                const result = await controller.assignRole('user-123', dto, mockRequest);

                expect(result).toEqual(mockRole);
                expect(roleService.assignRole).toHaveBeenCalledWith(
                    'user-123',
                    'ADMIN',
                    'admin-123',
                    expect.any(Date),
                );
            });
        });

        describe('DELETE /admin/roles/:userId', () => {
            it('should revoke role from user', async () => {
                roleService.revokeRole.mockResolvedValue(undefined);

                const result = await controller.revokeRole('user-123');

                expect(result.message).toBe('Role revoked successfully');
                expect(roleService.revokeRole).toHaveBeenCalledWith('user-123');
            });
        });

        describe('GET /admin/roles/:userId', () => {
            it('should return user role', async () => {
                roleService.getUserRole.mockResolvedValue('ADMIN');

                const result = await controller.getUserRole('user-123');

                expect(result).toEqual({ userId: 'user-123', role: 'ADMIN' });
                expect(roleService.getUserRole).toHaveBeenCalledWith('user-123');
            });
        });
    });

    describe('Queue Management Endpoints', () => {
        describe('GET /admin/queues/stats', () => {
            it('should return queue statistics', async () => {
                const mockStats = { waiting: 5, active: 2, completed: 100 };
                queueService.getQueueStats.mockResolvedValue(mockStats);

                const result = await controller.getQueueStats();

                expect(result).toHaveProperty('admin');
                expect(result).toHaveProperty('analytics');
                expect(queueService.getQueueStats).toHaveBeenCalledTimes(2);
            });
        });

        describe('GET /admin/queues/:queueName/jobs/:jobId', () => {
            it('should return job status', async () => {
                const mockJob = { id: 'job-123', status: 'completed' };
                queueService.getJobStatus.mockResolvedValue(mockJob);

                const result = await controller.getJobStatus('admin', 'job-123');

                expect(result).toEqual(mockJob);
                expect(queueService.getJobStatus).toHaveBeenCalledWith('admin', 'job-123');
            });
        });

        describe('POST /admin/queues/:queueName/clean', () => {
            it('should clean queue', async () => {
                queueService.cleanQueue.mockResolvedValue(undefined);

                const result = await controller.cleanQueue('admin', { grace: 3600 });

                expect(result.success).toBe(true);
                expect(queueService.cleanQueue).toHaveBeenCalledWith('admin', 3600);
            });
        });
    });
});
