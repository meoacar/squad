import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { DailyStat } from '../entities/daily-stat.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Post)
        private postRepository: Repository<Post>,
        @InjectRepository(DailyStat)
        private dailyStatRepository: Repository<DailyStat>,
    ) { }

    async getUserAnalytics(startDate: Date, endDate: Date) {
        const dailyStats = await this.dailyStatRepository
            .createQueryBuilder('stat')
            .where('stat.date BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .orderBy('stat.date', 'ASC')
            .getMany();

        const growth = this.calculateGrowth(dailyStats);
        const retention = await this.calculateRetention(startDate, endDate);
        const churn = await this.calculateChurn(startDate, endDate);

        return {
            growth,
            retention,
            churn,
            dailyStats,
        };
    }

    async getPostAnalytics(startDate: Date, endDate: Date) {
        const totalPosts = await this.postRepository.count();

        const postsByType = await this.postRepository
            .createQueryBuilder('post')
            .select('post.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .where('post.created_at BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .groupBy('post.type')
            .getRawMany();

        const postsByRegion = await this.postRepository
            .createQueryBuilder('post')
            .select('post.region', 'region')
            .addSelect('COUNT(*)', 'count')
            .where('post.created_at BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .groupBy('post.region')
            .getRawMany();

        const avgViews = await this.postRepository
            .createQueryBuilder('post')
            .select('AVG(post.view_count)', 'avg')
            .where('post.created_at BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .getRawOne();

        const avgApplications = await this.postRepository
            .createQueryBuilder('post')
            .select('AVG(post.application_count)', 'avg')
            .where('post.created_at BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .getRawOne();

        return {
            totalPosts,
            postsByType,
            postsByRegion,
            avgViewsPerPost: parseFloat(avgViews?.avg || '0'),
            avgApplicationsPerPost: parseFloat(avgApplications?.avg || '0'),
        };
    }

    async getRevenueAnalytics(startDate: Date, endDate: Date) {
        const dailyStats = await this.dailyStatRepository
            .createQueryBuilder('stat')
            .where('stat.date BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .orderBy('stat.date', 'ASC')
            .getMany();

        const totalRevenue = dailyStats.reduce(
            (sum, stat) => sum + (parseFloat(stat.revenue as any) || 0),
            0,
        );

        const premiumUsers = await this.userRepository.count({
            where: {
                is_premium: true,
            },
        });

        return {
            totalRevenue,
            premiumUsers,
            dailyRevenue: dailyStats.map((stat) => ({
                date: stat.date,
                revenue: parseFloat(stat.revenue as any) || 0,
            })),
        };
    }

    async calculateRetention(startDate: Date, endDate: Date): Promise<number> {
        // Calculate user retention rate
        const totalUsers = await this.userRepository.count({
            where: {
                created_at: Between(startDate, endDate),
            },
        });

        if (totalUsers === 0) return 0;

        const activeUsers = await this.userRepository.count({
            where: {
                created_at: Between(startDate, endDate),
                last_activity_at: Between(startDate, endDate),
            },
        });

        return (activeUsers / totalUsers) * 100;
    }

    async calculateChurn(startDate: Date, endDate: Date): Promise<number> {
        // Calculate user churn rate
        const totalUsers = await this.userRepository.count({
            where: {
                created_at: Between(startDate, endDate),
            },
        });

        if (totalUsers === 0) return 0;

        const inactiveUsers = await this.userRepository
            .createQueryBuilder('user')
            .where('user.created_at BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .andWhere(
                '(user.last_activity_at IS NULL OR user.last_activity_at < :thirtyDaysAgo)',
                {
                    thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            )
            .getCount();

        return (inactiveUsers / totalUsers) * 100;
    }

    private calculateGrowth(dailyStats: DailyStat[]) {
        if (dailyStats.length < 2) return 0;

        const firstDay = dailyStats[0];
        const lastDay = dailyStats[dailyStats.length - 1];

        if (!firstDay.total_users || firstDay.total_users === 0) return 0;

        return (
            ((lastDay.total_users - firstDay.total_users) / firstDay.total_users) *
            100
        );
    }
}
