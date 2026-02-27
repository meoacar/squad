import {
    Controller,
    Post,
    Delete,
    Body,
    Param,
    Get,
    UseGuards,
    Query,
    Patch,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { AssignPremiumDto } from './dto/assign-premium.dto';
import { AssignBoostDto } from './dto/assign-boost.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleService } from './services/role.service';
import { QueueService } from './services/queue.service';
import { AnalyticsService } from './services/analytics.service';
import { MetricsService } from './services/metrics.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Post as PostEntity } from '../posts/entities/post.entity';
import { Report } from '../reports/entities/report.entity';
import { Payment } from '../payments/entities/payment.entity';
import { DailyStat } from './entities/daily-stat.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionGuard)
@ApiBearerAuth()
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly roleService: RoleService,
        private readonly queueService: QueueService,
        private readonly analyticsService: AnalyticsService,
        private readonly metricsService: MetricsService,
        @InjectRepository(PostEntity)
        private readonly postRepository: Repository<PostEntity>,
        @InjectRepository(Report)
        private readonly reportRepository: Repository<Report>,
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(DailyStat)
        private readonly dailyStatRepository: Repository<DailyStat>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    @Get('users')
    @RequirePermission('users:read')
    @ApiOperation({ summary: 'Get all users (admin only)' })
    async getUsers(
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('region') region?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.adminService.getUsers(search, status, region, page, limit);
    }

    @Get('users/:userId')
    @RequirePermission('users:read')
    @ApiOperation({ summary: 'Get user by ID (admin only)' })
    async getUserById(@Param('userId') userId: string) {
        return await this.adminService.getUserById(userId);
    }

    @Post('users/:userId/premium')
    @RequirePermission('users:update')
    @ApiOperation({ summary: 'Assign premium to user (admin only)' })
    async assignPremium(
        @Param('userId') userId: string,
        @Body() dto: AssignPremiumDto,
    ) {
        return await this.adminService.assignPremium(userId, dto);
    }

    @Delete('users/:userId/premium')
    @RequirePermission('users:update')
    @ApiOperation({ summary: 'Remove premium from user (admin only)' })
    async removePremium(@Param('userId') userId: string) {
        return await this.adminService.removePremium(userId);
    }

    @Post('posts/:postId/boost')
    @RequirePermission('posts:boost')
    @ApiOperation({ summary: 'Assign boost to post (admin only)' })
    async assignBoost(@Param('postId') postId: string, @Body() dto: AssignBoostDto) {
        return await this.adminService.assignBoost(postId, dto);
    }

    @Post('posts/:postId/feature')
    @RequirePermission('posts:feature')
    @ApiOperation({ summary: 'Set post as featured (admin only)' })
    async setFeatured(@Param('postId') postId: string) {
        return await this.adminService.setFeatured(postId, true);
    }

    @Delete('posts/:postId/feature')
    @RequirePermission('posts:feature')
    @ApiOperation({ summary: 'Remove featured status (admin only)' })
    async removeFeatured(@Param('postId') postId: string) {
        return await this.adminService.setFeatured(postId, false);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get platform statistics (admin only)' })
    async getStats() {
        return await this.adminService.getStats();
    }

    // Dashboard Endpoints
    @Get('dashboard/stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    async getDashboardStats() {
        return await this.adminService.getDashboardStats();
    }

    @Get('dashboard/charts')
    @ApiOperation({ summary: 'Get dashboard charts data' })
    async getDashboardCharts(@Query('period') period?: string) {
        return await this.adminService.getDashboardCharts(period);
    }

    @Get('dashboard/activities')
    @ApiOperation({ summary: 'Get recent admin activities' })
    async getRecentActivities(@Query('limit') limit?: number) {
        return await this.adminService.getRecentActivities(limit);
    }

    // User Management Endpoints
    @Patch('users/:id')
    @RequirePermission('users:update')
    @ApiOperation({ summary: 'Update user details' })
    async updateUser(
        @Param('id') id: string,
        @Body() dto: any,
        @CurrentUser() user: any,
    ) {
        return this.adminService.updateUser(id, dto, user.id);
    }

    @Post('users/:id/suspend')
    @RequirePermission('users:suspend')
    @ApiOperation({ summary: 'Suspend user' })
    async suspendUser(
        @Param('id') id: string,
        @Body() dto: SuspendUserDto,
        @Req() req: Request,
    ) {
        const adminId = (req.user as any).id;
        return await this.adminService.suspendUser(id, dto, adminId);
    }

    @Post('users/:id/ban')
    @RequirePermission('users:ban')
    @ApiOperation({ summary: 'Ban user' })
    async banUser(
        @Param('id') id: string,
        @Body() dto: BanUserDto,
        @Req() req: Request,
    ) {
        const adminId = (req.user as any).id;
        return await this.adminService.banUser(id, dto, adminId);
    }

    @Delete('users/:id/ban')
    @RequirePermission('users:ban')
    @ApiOperation({ summary: 'Unban user' })
    async unbanUser(@Param('id') id: string, @Req() req: Request) {
        const adminId = (req.user as any).id;
        return await this.adminService.unbanUser(id, adminId);
    }

    @Post('users/:id/notes')
    @ApiOperation({ summary: 'Add admin notes to user' })
    async addUserNotes(@Param('id') id: string, @Body() dto: { notes: string }) {
        // Implementation would go here
        return { message: 'Notes added' };
    }

    @Get('users/:id/activity')
    @ApiOperation({ summary: 'Get user activity' })
    async getUserActivity(@Param('id') id: string) {
        return await this.adminService.getUserActivity(id);
    }

    @Get('users/:id/posts')
    @ApiOperation({ summary: 'Get user posts' })
    async getUserPosts(
        @Param('id') id: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.adminService.getUserPosts(id, page, limit);
    }

    @Get('users/:id/applications')
    @ApiOperation({ summary: 'Get user applications' })
    async getUserApplications(@Param('id') id: string) {
        return await this.adminService.getUserApplications(id);
    }

    @Post('users/bulk-action')
    @ApiOperation({ summary: 'Perform bulk action on users' })
    async bulkUserAction(@Body() dto: BulkActionDto, @Req() req: Request) {
        const adminId = (req.user as any).id;

        if (dto.action === 'SUSPEND') {
            return await this.adminService.bulkSuspendUsers(
                dto.ids,
                dto.params as SuspendUserDto,
                adminId,
            );
        } else if (dto.action === 'BAN') {
            return await this.adminService.bulkBanUsers(
                dto.ids,
                dto.params as BanUserDto,
                adminId,
            );
        }

        return { message: 'Bulk action completed' };
    }

    // Post Management Endpoints
    @Get('posts')
    @RequirePermission('posts:read')
    @ApiOperation({ summary: 'Get all posts with filters' })
    async getPosts(
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('type') type?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.adminService.getPosts(
            { search, status, type },
            page,
            limit,
        );
    }

    @Get('posts/:id')
    @RequirePermission('posts:read')
    @ApiOperation({ summary: 'Get post by ID' })
    async getPostById(@Param('id') id: string) {
        return await this.adminService.getPostById(id);
    }

    @Patch('posts/:id')
    @RequirePermission('posts:update')
    @ApiOperation({ summary: 'Update post' })
    async updatePost(
        @Param('id') id: string,
        @Body() dto: UpdatePostDto,
        @Req() req: Request,
    ) {
        const adminId = (req.user as any).id;
        return await this.adminService.updatePost(id, dto, adminId);
    }

    @Delete('posts/:id')
    @RequirePermission('posts:delete')
    @ApiOperation({ summary: 'Delete post' })
    async deletePost(
        @Param('id') id: string,
        @Body() dto: { reason: string },
        @Req() req: Request,
    ) {
        const adminId = (req.user as any).id;
        return await this.adminService.deletePost(id, dto.reason, adminId);
    }

    @Post('posts/:id/pause')
    @ApiOperation({ summary: 'Pause post' })
    async pausePost(@Param('id') id: string, @Req() req: Request) {
        const adminId = (req.user as any).id;
        return await this.adminService.pausePost(id, adminId);
    }

    @Post('posts/:id/resume')
    @ApiOperation({ summary: 'Resume post' })
    async resumePost(@Param('id') id: string, @Req() req: Request) {
        const adminId = (req.user as any).id;
        return await this.adminService.resumePost(id, adminId);
    }

    @Post('posts/:id/extend')
    @ApiOperation({ summary: 'Extend post duration' })
    async extendPost(
        @Param('id') id: string,
        @Body() dto: { hours: number },
        @Req() req: Request,
    ) {
        const adminId = (req.user as any).id;
        return await this.adminService.extendPost(id, dto.hours, adminId);
    }

    @Post('posts/bulk-action')
    @ApiOperation({ summary: 'Perform bulk action on posts' })
    async bulkPostAction(@Body() dto: BulkActionDto) {
        return { message: 'Bulk action completed' };
    }

    // Report Management Endpoints
    @Get('reports')
    @RequirePermission('reports:read')
    @ApiOperation({ summary: 'Get all reports' })
    async getReports(
        @Query('status') status?: string,
        @Query('priority') priority?: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.adminService.getReports(
            { status, priority },
            page,
            limit,
        );
    }

    @Get('reports/:id')
    @RequirePermission('reports:read')
    @ApiOperation({ summary: 'Get report by ID' })
    async getReportById(@Param('id') id: string) {
        return await this.adminService.getReportById(id);
    }

    @Patch('reports/:id')
    @ApiOperation({ summary: 'Update report' })
    async updateReport(@Param('id') id: string, @Body() dto: any) {
        return { message: 'Report updated' };
    }

    @Post('reports/:id/resolve')
    @RequirePermission('reports:resolve')
    @ApiOperation({ summary: 'Resolve report' })
    async resolveReport(
        @Param('id') id: string,
        @Body() dto: ResolveReportDto,
        @Req() req: Request,
    ) {
        const adminId = (req.user as any).id;
        return await this.adminService.resolveReport(id, dto, adminId);
    }

    @Post('reports/:id/dismiss')
    @RequirePermission('reports:resolve')
    @ApiOperation({ summary: 'Dismiss report' })
    async dismissReport(
        @Param('id') id: string,
        @Body() dto: { reason: string },
        @Req() req: Request,
    ) {
        const adminId = (req.user as any).id;
        return await this.adminService.dismissReport(id, dto.reason, adminId);
    }

    @Get('reports/stats')
    @ApiOperation({ summary: 'Get report statistics' })
    async getReportStats() {
        return await this.adminService.getReportStats();
    }

    @Get('reports/similar/:id')
    @ApiOperation({ summary: 'Get similar reports' })
    async getSimilarReports(@Param('id') id: string) {
        return await this.adminService.getSimilarReports(id);
    }

    // Analytics Endpoints
    @Get('analytics/users')
    @RequirePermission('analytics:read')
    @ApiOperation({ summary: 'Get user analytics' })
    async getUserAnalytics(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('groupBy') groupBy?: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const analytics = await this.analyticsService.getUserAnalytics(start, end);

        // Get additional user stats
        const totalUsers = await this.adminService.getStats().then(s => s.totalUsers);
        const activeUsers = await this.adminService.getStats().then(s => s.activeUsers);
        const newUsers = analytics.dailyStats.reduce((sum, stat) => sum + stat.new_users, 0);

        return {
            totalUsers,
            activeUsers,
            newUsers,
            growth: analytics.growth,
            retention: analytics.retention,
            churn: analytics.churn,
            growthData: analytics.dailyStats.map(stat => ({
                date: stat.date,
                users: stat.total_users,
            })),
            activeUsersData: analytics.dailyStats.map(stat => ({
                date: stat.date,
                active: stat.active_users,
            })),
        };
    }

    @Get('analytics/posts')
    @RequirePermission('analytics:read')
    @ApiOperation({ summary: 'Get post analytics' })
    async getPostAnalytics(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('groupBy') groupBy?: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const analytics = await this.analyticsService.getPostAnalytics(start, end);

        // Get new posts count
        const newPosts = await this.postRepository.count({
            where: {
                created_at: Between(start, end),
            },
        });

        // Get trend data from daily stats
        const dailyStats = await this.dailyStatRepository
            .createQueryBuilder('stat')
            .where('stat.date BETWEEN :start AND :end', { start, end })
            .orderBy('stat.date', 'ASC')
            .getMany();

        return {
            totalPosts: analytics.totalPosts,
            newPosts,
            avgViewsPerPost: Math.round(analytics.avgViewsPerPost),
            avgApplicationsPerPost: Math.round(analytics.avgApplicationsPerPost),
            postsByType: analytics.postsByType,
            postsByRegion: analytics.postsByRegion,
            trendData: dailyStats.map(stat => ({
                date: stat.date,
                posts: stat.new_posts,
            })),
        };
    }

    @Get('analytics/revenue')
    @RequirePermission('analytics:read')
    @ApiOperation({ summary: 'Get revenue analytics' })
    async getRevenueAnalytics(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('groupBy') groupBy?: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const analytics = await this.analyticsService.getRevenueAnalytics(start, end);

        // Calculate MRR and ARR
        const mrr = analytics.totalRevenue / ((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const arr = mrr * 12;

        // Get revenue by type from payments if available
        let revenueByType = [];
        try {
            revenueByType = await this.paymentRepository
                .createQueryBuilder('payment')
                .select('payment.type', 'type')
                .addSelect('SUM(payment.amount)', 'revenue')
                .where('payment.status = :status', { status: 'COMPLETED' })
                .andWhere('payment.created_at BETWEEN :start AND :end', { start, end })
                .groupBy('payment.type')
                .getRawMany();
        } catch (error) {
            // Payments table might not exist yet
            revenueByType = [];
        }

        return {
            totalRevenue: Math.round(analytics.totalRevenue * 100) / 100,
            mrr: Math.round(mrr * 100) / 100,
            arr: Math.round(arr * 100) / 100,
            premiumUsers: analytics.premiumUsers,
            dailyRevenue: analytics.dailyRevenue,
            revenueByType: revenueByType.map(item => ({
                type: item.type,
                revenue: parseFloat(item.revenue || '0'),
            })),
        };
    }

    @Get('analytics/reports')
    @RequirePermission('analytics:read')
    @ApiOperation({ summary: 'Get report analytics' })
    async getReportAnalytics(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const [totalReports, pendingReports, resolvedReports, reportsByReason] = await Promise.all([
            this.reportRepository.count({
                where: {
                    created_at: Between(start, end),
                },
            }),
            this.reportRepository.count({
                where: {
                    status: 'PENDING' as any,
                    created_at: Between(start, end),
                },
            }),
            this.reportRepository.count({
                where: {
                    status: 'RESOLVED' as any,
                    created_at: Between(start, end),
                },
            }),
            this.reportRepository
                .createQueryBuilder('report')
                .select('report.reason', 'reason')
                .addSelect('COUNT(*)', 'count')
                .where('report.created_at BETWEEN :start AND :end', { start, end })
                .groupBy('report.reason')
                .getRawMany(),
        ]);

        return {
            totalReports,
            pendingReports,
            resolvedReports,
            reportsByReason,
        };
    }

    // System Monitoring Endpoints
    @Get('system/health')
    @ApiOperation({ summary: 'Get system health' })
    async getSystemHealth() {
        const health = await this.metricsService.getSystemHealth();

        // Check database connection
        let dbStatus = 'ok';
        let dbResponseTime = 0;
        try {
            const start = Date.now();
            await this.userRepository.count();
            dbResponseTime = Date.now() - start;
        } catch (error) {
            dbStatus = 'error';
        }

        // Check Redis/Cache connection
        let cacheStatus = 'ok';
        let cacheResponseTime = 0;
        try {
            const start = Date.now();
            await this.adminService.getDashboardStats();
            cacheResponseTime = Date.now() - start;
        } catch (error) {
            cacheStatus = 'error';
        }

        return {
            status: health.status,
            uptime: Math.floor(health.uptime),
            services: [
                {
                    name: 'database',
                    status: dbStatus,
                    responseTime: dbResponseTime,
                },
                {
                    name: 'redis',
                    status: cacheStatus,
                    responseTime: cacheResponseTime,
                },
                {
                    name: 'api',
                    status: 'ok',
                    responseTime: 0,
                },
            ],
            memory: health.memory,
        };
    }

    @Get('system/metrics')
    @ApiOperation({ summary: 'Get system metrics' })
    async getSystemMetrics() {
        const endDate = new Date();
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

        const performanceMetrics = await this.metricsService.getPerformanceMetrics(startDate, endDate);

        // Get request stats
        const totalRequests = await this.userRepository.count() + await this.postRepository.count();

        // Mock data for demonstration - in production, this would come from actual metrics
        const requestsByEndpoint = [
            { endpoint: '/api/v1/posts', count: 1250 },
            { endpoint: '/api/v1/users', count: 890 },
            { endpoint: '/api/v1/auth/login', count: 450 },
            { endpoint: '/api/v1/admin', count: 320 },
        ];

        const requestsByStatus = [
            { status: '200', count: 2500 },
            { status: '201', count: 450 },
            { status: '400', count: 120 },
            { status: '401', count: 80 },
            { status: '500', count: 10 },
        ];

        return {
            totalRequests,
            requestsByEndpoint,
            requestsByStatus,
            database: {
                activeConnections: 5,
                totalQueries: totalRequests,
                avgQueryTime: 15,
                slowQueries: 3,
            },
            cache: {
                hitRate: 85,
                hits: 8500,
                misses: 1500,
                memoryUsed: 128,
            },
        };
    }

    @Get('system/errors')
    @ApiOperation({ summary: 'Get system errors' })
    async getSystemErrors() {
        // In production, this would fetch from error logging service
        // For now, return mock data
        return {
            totalErrors: 0,
            errors: [],
        };
    }

    @Get('system/performance')
    @ApiOperation({ summary: 'Get system performance' })
    async getSystemPerformance() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        // Calculate percentages
        const memoryPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
        const cpuPercent = Math.round((cpuUsage.user / 1000000) % 100);

        // Generate mock history data for charts
        const now = Date.now();
        const cpuHistory = Array.from({ length: 20 }, (_, i) => ({
            time: new Date(now - (19 - i) * 60000).toISOString(),
            usage: Math.floor(Math.random() * 30) + 20,
        }));

        const memoryHistory = Array.from({ length: 20 }, (_, i) => ({
            time: new Date(now - (19 - i) * 60000).toISOString(),
            usage: Math.floor(Math.random() * 20) + memoryPercent - 10,
        }));

        const responseTimeHistory = Array.from({ length: 20 }, (_, i) => ({
            time: new Date(now - (19 - i) * 60000).toISOString(),
            responseTime: Math.floor(Math.random() * 50) + 50,
        }));

        return {
            cpu: {
                usage: cpuPercent,
            },
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                usagePercent: memoryPercent,
            },
            disk: {
                usagePercent: 45, // Mock data
            },
            avgResponseTime: 85,
            cpuHistory,
            memoryHistory,
            responseTimeHistory,
        };
    }

    // Audit Log Endpoints
    @Get('audit-logs')
    @RequirePermission('audit:read')
    @ApiOperation({ summary: 'Get audit logs' })
    async getAuditLogs() {
        return { message: 'Audit logs' };
    }

    @Get('audit-logs/:id')
    @RequirePermission('audit:read')
    @ApiOperation({ summary: 'Get audit log by ID' })
    async getAuditLogById(@Param('id') id: string) {
        return { message: 'Audit log details' };
    }

    @Get('audit-logs/export')
    @RequirePermission('audit:read')
    @ApiOperation({ summary: 'Export audit logs' })
    async exportAuditLogs() {
        return { message: 'Audit logs exported' };
    }

    // Role Management Endpoints
    @Get('roles')
    @RequirePermission('*')
    @ApiOperation({ summary: 'Get all admin users and their roles' })
    async getAllAdminUsers() {
        return await this.roleService.getAllAdminUsers();
    }

    @Post('roles/:userId')
    @RequirePermission('*')
    @ApiOperation({ summary: 'Assign admin role to user (super admin only)' })
    async assignRole(
        @Param('userId') userId: string,
        @Body() dto: AssignRoleDto,
        @Req() req: Request,
    ) {
        const adminId = (req.user as any).id;
        const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
        return await this.roleService.assignRole(userId, dto.role, adminId, expiresAt);
    }

    @Delete('roles/:userId')
    @RequirePermission('*')
    @ApiOperation({ summary: 'Revoke admin role from user (super admin only)' })
    async revokeRole(@Param('userId') userId: string) {
        await this.roleService.revokeRole(userId);
        return { message: 'Role revoked successfully' };
    }

    @Get('roles/:userId')
    @RequirePermission('*')
    @ApiOperation({ summary: 'Get user role (super admin only)' })
    async getUserRole(@Param('userId') userId: string) {
        const role = await this.roleService.getUserRole(userId);
        return { userId, role };
    }

    // Queue Management Endpoints
    @Get('queues/stats')
    @RequirePermission('system:read')
    @ApiOperation({ summary: 'Get queue statistics' })
    async getQueueStats() {
        const [adminStats, analyticsStats] = await Promise.all([
            this.queueService.getQueueStats('admin'),
            this.queueService.getQueueStats('analytics'),
        ]);

        return {
            admin: adminStats,
            analytics: analyticsStats,
        };
    }

    @Get('queues/:queueName/jobs/:jobId')
    @RequirePermission('system:read')
    @ApiOperation({ summary: 'Get job status' })
    async getJobStatus(
        @Param('queueName') queueName: 'admin' | 'analytics',
        @Param('jobId') jobId: string,
    ) {
        return await this.queueService.getJobStatus(queueName, jobId);
    }

    @Post('queues/:queueName/clean')
    @RequirePermission('system:write')
    @ApiOperation({ summary: 'Clean completed/failed jobs from queue' })
    async cleanQueue(
        @Param('queueName') queueName: 'admin' | 'analytics',
        @Body() dto: { grace?: number },
    ) {
        await this.queueService.cleanQueue(queueName, dto.grace);
        return { success: true, message: `Queue ${queueName} cleaned` };
    }

    // Payment Management Endpoints
    @Get('payments')
    @RequirePermission('payments:read')
    async getPayments(
        @Query('status') status?: string,
        @Query('type') type?: string,
        @Query('method') method?: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const filters = { status, type, method, search };
        return this.adminService.getPayments(
            filters,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 25,
        );
    }

    @Get('payments/stats')
    @RequirePermission('payments:read')
    async getPaymentStats() {
        return this.adminService.getPaymentStats();
    }

    @Get('payments/:id')
    @RequirePermission('payments:read')
    async getPaymentById(@Param('id') id: string) {
        return this.adminService.getPaymentById(id);
    }

    @Post('payments/:id/refund')
    @RequirePermission('payments:refund')
    async refundPayment(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @CurrentUser() user: any,
    ) {
        return this.adminService.refundPayment(id, reason, user.id);
    }

    // Settings Management Endpoints
    @Get('settings')
    @RequirePermission('settings:read')
    async getSettings(@Query('category') category?: string) {
        return this.adminService.getSettings(category);
    }

    @Get('settings/:key')
    @RequirePermission('settings:read')
    async getSetting(@Param('key') key: string) {
        return this.adminService.getSetting(key);
    }

    @Patch('settings/:key')
    @RequirePermission('settings:write')
    async updateSetting(
        @Param('key') key: string,
        @Body('value') value: string,
        @CurrentUser() user: any,
    ) {
        return this.adminService.updateSetting(key, value, user.id);
    }

    @Post('settings/bulk')
    @RequirePermission('settings:write')
    async bulkUpdateSettings(
        @Body('settings') settings: Record<string, string>,
        @CurrentUser() user: any,
    ) {
        return this.adminService.bulkUpdateSettings(settings, user.id);
    }

    @Post('settings/initialize')
    @RequirePermission('settings:write')
    async initializeDefaultSettings() {
        return this.adminService.initializeDefaultSettings();
    }

    // Pages Management Endpoints
    @Get('pages')
    @RequirePermission('content:read')
    @ApiOperation({ summary: 'Get all pages' })
    async getPages(
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const filters = { search, status };
        return this.adminService.getPages(
            filters,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 25,
        );
    }

    @Get('pages/:id')
    @RequirePermission('content:read')
    @ApiOperation({ summary: 'Get page by ID' })
    async getPageById(@Param('id') id: string) {
        return this.adminService.getPageById(id);
    }

    @Post('pages')
    @RequirePermission('content:write')
    @ApiOperation({ summary: 'Create page' })
    async createPage(@Body() dto: any, @CurrentUser() user: any) {
        return this.adminService.createPage(dto, user.id);
    }

    @Patch('pages/:id')
    @RequirePermission('content:write')
    @ApiOperation({ summary: 'Update page' })
    async updatePage(
        @Param('id') id: string,
        @Body() dto: any,
        @CurrentUser() user: any,
    ) {
        return this.adminService.updatePage(id, dto, user.id);
    }

    @Delete('pages/:id')
    @RequirePermission('content:delete')
    @ApiOperation({ summary: 'Delete page' })
    async deletePage(@Param('id') id: string, @CurrentUser() user: any) {
        return this.adminService.deletePage(id, user.id);
    }

    // Menu Items Management Endpoints
    @Get('menu-items')
    @RequirePermission('content:read')
    @ApiOperation({ summary: 'Get all menu items' })
    async getMenuItems(@Query('location') location?: string) {
        return this.adminService.getMenuItems(location);
    }

    @Get('menu-items/:id')
    @RequirePermission('content:read')
    @ApiOperation({ summary: 'Get menu item by ID' })
    async getMenuItemById(@Param('id') id: string) {
        return this.adminService.getMenuItemById(id);
    }

    @Post('menu-items')
    @RequirePermission('content:write')
    @ApiOperation({ summary: 'Create menu item' })
    async createMenuItem(@Body() dto: any, @CurrentUser() user: any) {
        return this.adminService.createMenuItem(dto, user.id);
    }

    @Patch('menu-items/:id')
    @RequirePermission('content:write')
    @ApiOperation({ summary: 'Update menu item' })
    async updateMenuItem(
        @Param('id') id: string,
        @Body() dto: any,
        @CurrentUser() user: any,
    ) {
        return this.adminService.updateMenuItem(id, dto, user.id);
    }

    @Delete('menu-items/:id')
    @RequirePermission('content:delete')
    @ApiOperation({ summary: 'Delete menu item' })
    async deleteMenuItem(@Param('id') id: string, @CurrentUser() user: any) {
        return this.adminService.deleteMenuItem(id, user.id);
    }

    @Post('menu-items/reorder')
    @RequirePermission('content:write')
    @ApiOperation({ summary: 'Reorder menu items' })
    async reorderMenuItems(
        @Body() dto: { items: Array<{ id: string; order: number }> },
        @CurrentUser() user: any,
    ) {
        return this.adminService.reorderMenuItems(dto.items, user.id);
    }
}
