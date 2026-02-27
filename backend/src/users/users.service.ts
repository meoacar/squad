import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { PostStatus } from '../common/enums';
import { UserStatsDto } from './dto/user-stats.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
        @InjectRepository(Favorite)
        private readonly favoriteRepository: Repository<Favorite>,
    ) { }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create(userData);
        return await this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { email } });
    }

    async findByUsername(username: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { username } });
    }

    async update(id: string, updateData: Partial<User>): Promise<User> {
        await this.userRepository.update(id, updateData);
        return await this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    async incrementFailedLoginAttempts(id: string): Promise<void> {
        await this.userRepository.increment({ id }, 'failed_login_attempts', 1);
    }

    async resetFailedLoginAttempts(id: string): Promise<void> {
        await this.userRepository.update(id, { failed_login_attempts: 0 });
    }

    async lockAccount(id: string, lockUntil: Date): Promise<void> {
        await this.userRepository.update(id, { account_locked_until: lockUntil });
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.userRepository.update(id, { last_login_at: new Date() });
    }

    async getAdminRole(userId: string): Promise<string | null> {
        const result = await this.userRepository.query(
            'SELECT role FROM admin_roles WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        return result.length > 0 ? result[0].role : null;
    }

    async getUserStats(userId: string): Promise<UserStatsDto> {
        // Total posts
        const totalPosts = await this.postRepository.count({
            where: { created_by: userId },
        });

        // Active posts
        const activePosts = await this.postRepository.count({
            where: {
                created_by: userId,
                status: PostStatus.ACTIVE,
            },
        });

        // Total applications made by user
        const totalApplications = await this.applicationRepository.count({
            where: { applicant_id: userId },
        });

        // Accepted applications
        const acceptedApplications = await this.applicationRepository.count({
            where: {
                applicant_id: userId,
                status: ApplicationStatus.ACCEPTED,
            },
        });

        // Get user's post IDs
        const userPosts = await this.postRepository.find({
            where: { created_by: userId },
            select: ['id'],
        });

        const postIds = userPosts.map(post => post.id);

        // Count unique users who favorited user's posts
        let favoritedBy = 0;
        if (postIds.length > 0) {
            const result = await this.favoriteRepository
                .createQueryBuilder('favorite')
                .select('COUNT(DISTINCT favorite.user_id)', 'count')
                .where('favorite.post_id IN (:...postIds)', { postIds })
                .getRawOne();
            favoritedBy = parseInt(result.count) || 0;
        }

        // Count incoming applications to user's posts
        let incomingApplications = 0;
        if (postIds.length > 0) {
            incomingApplications = await this.applicationRepository.count({
                where: postIds.map(postId => ({ post_id: postId })),
            });
        }

        return {
            totalPosts,
            activePosts,
            totalApplications,
            acceptedApplications,
            favoritedBy,
            incomingApplications,
        };
    }
}
