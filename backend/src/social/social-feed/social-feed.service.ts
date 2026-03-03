import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
    Activity,
    ActivityLike,
    ActivityComment,
    Follow,
} from '../entities';
import { ActivityType } from '../entities/activity.entity';
import { PaginationDto, PaginatedResult } from './dto';
import {
    NotFoundException,
    ConflictException,
    AuthorizationException,
} from '../exceptions';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class SocialFeedService {
    private readonly logger = new Logger(SocialFeedService.name);

    constructor(
        @InjectRepository(Activity)
        private activityRepository: Repository<Activity>,
        @InjectRepository(ActivityLike)
        private activityLikeRepository: Repository<ActivityLike>,
        @InjectRepository(ActivityComment)
        private activityCommentRepository: Repository<ActivityComment>,
        @InjectRepository(Follow)
        private followRepository: Repository<Follow>,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Create a new activity
     */
    async createActivity(
        userId: string,
        type: ActivityType,
        data: Record<string, any>,
    ): Promise<Activity> {
        const activity = this.activityRepository.create({
            user_id: userId,
            type,
            data,
        });

        return this.activityRepository.save(activity);
    }

    /**
     * Get user feed (activities from followed users + own activities)
     * Shows activities from the last 30 days
     */
    async getUserFeed(
        userId: string,
        pagination: PaginationDto,
    ): Promise<PaginatedResult<Activity>> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        // Get list of users that the current user follows
        const follows = await this.followRepository.find({
            where: { follower_id: userId },
            select: ['following_id'],
        });

        const followingIds = follows.map((f) => f.following_id);

        // Include own user ID to see own activities
        const userIds = [...followingIds, userId];

        // Get activities from followed users + self from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const queryBuilder = this.activityRepository
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.user', 'user')
            .where('activity.user_id IN (:...userIds)', { userIds })
            .andWhere('activity.created_at > :thirtyDaysAgo', { thirtyDaysAgo })
            .orderBy('activity.created_at', 'DESC')
            .skip(skip)
            .take(limit);

        const [activities, total] = await queryBuilder.getManyAndCount();

        return {
            data: activities,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get activities for a specific user
     * Shows activities from the last 30 days
     */
    async getUserActivities(
        userId: string,
        pagination: PaginationDto,
    ): Promise<PaginatedResult<Activity>> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        // Get activities from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [activities, total] = await this.activityRepository.findAndCount({
            where: {
                user_id: userId,
                created_at: MoreThan(thirtyDaysAgo),
            },
            relations: ['user'],
            skip,
            take: limit,
            order: { created_at: 'DESC' },
        });

        return {
            data: activities,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Like an activity
     * If already liked, this will unlike (toggle behavior)
     */
    async likeActivity(activityId: string, userId: string): Promise<ActivityLike | null> {
        // Check if activity exists
        const activity = await this.activityRepository.findOne({
            where: { id: activityId },
        });

        if (!activity) {
            throw new NotFoundException('Activity', activityId);
        }

        // Check if already liked
        const existingLike = await this.activityLikeRepository.findOne({
            where: { activity_id: activityId, user_id: userId },
        });

        if (existingLike) {
            // Unlike (toggle behavior)
            await this.activityLikeRepository.remove(existingLike);

            // Decrement like count
            await this.activityRepository.decrement(
                { id: activityId },
                'like_count',
                1,
            );

            return null;
        }

        // Create like
        const like = this.activityLikeRepository.create({
            activity_id: activityId,
            user_id: userId,
        });

        const savedLike = await this.activityLikeRepository.save(like);

        // Increment like count
        await this.activityRepository.increment(
            { id: activityId },
            'like_count',
            1,
        );

        // Send notification to activity owner (if not liking own activity)
        if (activity.user_id !== userId) {
            try {
                await this.notificationsService.sendToUser(activity.user_id, {
                    title: 'Activity Liked',
                    body: 'Someone liked your activity',
                    url: `/activity/${activityId}`,
                });
            } catch (error) {
                this.logger.error('Failed to send activity like notification', error);
            }
        }

        return savedLike;
    }

    /**
     * Unlike an activity
     */
    async unlikeActivity(activityId: string, userId: string): Promise<void> {
        const like = await this.activityLikeRepository.findOne({
            where: { activity_id: activityId, user_id: userId },
        });

        if (!like) {
            throw new NotFoundException('Like not found');
        }

        await this.activityLikeRepository.remove(like);

        // Decrement like count
        await this.activityRepository.decrement(
            { id: activityId },
            'like_count',
            1,
        );
    }

    /**
     * Comment on an activity
     */
    async commentOnActivity(
        activityId: string,
        userId: string,
        content: string,
    ): Promise<ActivityComment> {
        // Check if activity exists
        const activity = await this.activityRepository.findOne({
            where: { id: activityId },
        });

        if (!activity) {
            throw new NotFoundException('Activity', activityId);
        }

        // Create comment
        const comment = this.activityCommentRepository.create({
            activity_id: activityId,
            user_id: userId,
            content,
        });

        const savedComment = await this.activityCommentRepository.save(comment);

        // Increment comment count
        await this.activityRepository.increment(
            { id: activityId },
            'comment_count',
            1,
        );

        // Send notification to activity owner (if not commenting on own activity)
        if (activity.user_id !== userId) {
            try {
                await this.notificationsService.sendToUser(activity.user_id, {
                    title: 'New Comment',
                    body: 'Someone commented on your activity',
                    url: `/activity/${activityId}`,
                });
            } catch (error) {
                this.logger.error('Failed to send activity comment notification', error);
            }
        }

        return savedComment;
    }

    /**
     * Delete a comment
     * Only the comment owner can delete their comment
     */
    async deleteComment(commentId: string, userId: string): Promise<void> {
        const comment = await this.activityCommentRepository.findOne({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('Comment', commentId);
        }

        // Check if user is the comment owner
        if (comment.user_id !== userId) {
            throw new AuthorizationException('You can only delete your own comments');
        }

        await this.activityCommentRepository.remove(comment);

        // Decrement comment count
        await this.activityRepository.decrement(
            { id: comment.activity_id },
            'comment_count',
            1,
        );
    }

    /**
     * Get like count for an activity
     */
    async getActivityLikes(activityId: string): Promise<number> {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId },
            select: ['like_count'],
        });

        if (!activity) {
            throw new NotFoundException('Activity', activityId);
        }

        return activity.like_count;
    }

    /**
     * Get comments for an activity
     */
    async getActivityComments(
        activityId: string,
        pagination: PaginationDto,
    ): Promise<PaginatedResult<ActivityComment>> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        const [comments, total] = await this.activityCommentRepository.findAndCount({
            where: { activity_id: activityId },
            relations: ['user'],
            skip,
            take: limit,
            order: { created_at: 'ASC' }, // Chronological order
        });

        return {
            data: comments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Check if user has liked an activity
     */
    async hasUserLiked(activityId: string, userId: string): Promise<boolean> {
        const like = await this.activityLikeRepository.findOne({
            where: { activity_id: activityId, user_id: userId },
        });

        return !!like;
    }
}
