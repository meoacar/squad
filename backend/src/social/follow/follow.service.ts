import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow, FollowRequest, FollowRequestStatus, ActivityType } from '../entities';
import { User } from '../../users/entities/user.entity';
import { PaginationDto, PaginatedResult } from './dto';
import {
    ValidationException,
    ConflictException,
    NotFoundException,
    AuthorizationException,
} from '../exceptions';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrivacyService } from '../privacy/privacy.service';
import { SocialFeedService } from '../social-feed/social-feed.service';

@Injectable()
export class FollowService {
    private readonly logger = new Logger(FollowService.name);

    constructor(
        @InjectRepository(Follow)
        private followRepository: Repository<Follow>,
        @InjectRepository(FollowRequest)
        private followRequestRepository: Repository<FollowRequest>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private notificationsService: NotificationsService,
        @Inject(forwardRef(() => PrivacyService))
        private privacyService: PrivacyService,
        private socialFeedService: SocialFeedService,
    ) { }

    /**
     * Follow a user
     * Handles both public and private profiles
     */
    async followUser(followerId: string, followingId: string): Promise<Follow | FollowRequest> {
        // Validate: Cannot follow self
        if (followerId === followingId) {
            throw new ValidationException('Cannot follow yourself');
        }

        // Check if users exist
        const [follower, following] = await Promise.all([
            this.userRepository.findOne({ where: { id: followerId } }),
            this.userRepository.findOne({ where: { id: followingId } }),
        ]);

        if (!follower) {
            throw new NotFoundException('User', followerId);
        }
        if (!following) {
            throw new NotFoundException('User', followingId);
        }

        // Check if already following
        const existingFollow = await this.followRepository.findOne({
            where: { follower_id: followerId, following_id: followingId },
        });

        if (existingFollow) {
            throw new ConflictException('Already following this user');
        }

        // Check if blocked
        const isBlocked = await this.privacyService.isBlocked(followerId, followingId);
        if (isBlocked) {
            throw new AuthorizationException('Cannot follow blocked user');
        }

        // Handle private profiles
        if (following.profile_visibility === 'PRIVATE') {
            return this.sendFollowRequest(followerId, followingId);
        }

        // Create follow relationship for public profiles
        try {
            const follow = this.followRepository.create({
                follower_id: followerId,
                following_id: followingId,
            });

            const savedFollow = await this.followRepository.save(follow);

            // Update counts
            await this.updateFollowCounts(followerId, followingId);

            // Send notification
            try {
                await this.notificationsService.sendToUser(followingId, {
                    title: 'New Follower',
                    body: `${follower.username} started following you`,
                    url: `/profile/${follower.username}`,
                });
            } catch (error) {
                this.logger.error('Failed to send follow notification', error);
                // Don't fail the request if notification fails
            }

            // Create activity
            try {
                await this.socialFeedService.createActivity(
                    followingId,
                    ActivityType.USER_FOLLOWED,
                    {
                        followerId: followerId,
                        followerUsername: follower.username,
                        followerAvatar: follower.avatar_url,
                    },
                );
            } catch (error) {
                this.logger.error('Failed to create follow activity', error);
            }

            return savedFollow;
        } catch (error) {
            if (error.code === '23505') {
                // Unique constraint violation
                throw new ConflictException('Already following this user');
            }
            throw error;
        }
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const follow = await this.followRepository.findOne({
            where: { follower_id: followerId, following_id: followingId },
        });

        if (!follow) {
            throw new NotFoundException('Follow relationship');
        }

        await this.followRepository.remove(follow);

        // Update counts
        await this.updateFollowCounts(followerId, followingId);
    }

    /**
     * Get followers of a user
     */
    async getFollowers(
        userId: string,
        pagination: PaginationDto,
    ): Promise<PaginatedResult<User>> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        const [follows, total] = await this.followRepository.findAndCount({
            where: { following_id: userId },
            relations: ['follower'],
            skip,
            take: limit,
            order: { created_at: 'DESC' },
        });

        const users = follows.map((follow) => follow.follower);

        return {
            data: users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get users that a user is following
     */
    async getFollowing(
        userId: string,
        pagination: PaginationDto,
    ): Promise<PaginatedResult<User>> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        const [follows, total] = await this.followRepository.findAndCount({
            where: { follower_id: userId },
            relations: ['following'],
            skip,
            take: limit,
            order: { created_at: 'DESC' },
        });

        const users = follows.map((follow) => follow.following);

        return {
            data: users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get follower count for a user
     */
    async getFollowerCount(userId: string): Promise<number> {
        return this.followRepository.count({
            where: { following_id: userId },
        });
    }

    /**
     * Get following count for a user
     */
    async getFollowingCount(userId: string): Promise<number> {
        return this.followRepository.count({
            where: { follower_id: userId },
        });
    }

    /**
     * Check if a user is following another user
     */
    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await this.followRepository.findOne({
            where: { follower_id: followerId, following_id: followingId },
        });

        return !!follow;
    }

    /**
     * Send a follow request (for private profiles)
     */
    async sendFollowRequest(requesterId: string, targetId: string): Promise<FollowRequest> {
        // Check if request already exists
        const existingRequest = await this.followRequestRepository.findOne({
            where: {
                requester_id: requesterId,
                target_id: targetId,
                status: FollowRequestStatus.PENDING,
            },
        });

        if (existingRequest) {
            throw new ConflictException('Follow request already sent');
        }

        const request = this.followRequestRepository.create({
            requester_id: requesterId,
            target_id: targetId,
            status: FollowRequestStatus.PENDING,
        });

        const savedRequest = await this.followRequestRepository.save(request);

        // Send notification
        const requester = await this.userRepository.findOne({
            where: { id: requesterId },
        });

        if (requester) {
            try {
                await this.notificationsService.sendToUser(targetId, {
                    title: 'Follow Request',
                    body: `${requester.username} wants to follow you`,
                    url: `/follow-requests`,
                });
            } catch (error) {
                this.logger.error('Failed to send follow request notification', error);
            }
        }

        return savedRequest;
    }

    /**
     * Approve a follow request
     */
    async approveFollowRequest(requestId: string, userId: string): Promise<Follow> {
        const request = await this.followRequestRepository.findOne({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException('Follow request', requestId);
        }

        // Verify that the user is the target of the request
        if (request.target_id !== userId) {
            throw new AuthorizationException('You can only approve requests sent to you');
        }

        if (request.status !== FollowRequestStatus.PENDING) {
            throw new ConflictException('Follow request has already been processed');
        }

        // Update request status
        request.status = FollowRequestStatus.APPROVED;
        await this.followRequestRepository.save(request);

        // Create follow relationship
        const follow = this.followRepository.create({
            follower_id: request.requester_id,
            following_id: request.target_id,
        });

        const savedFollow = await this.followRepository.save(follow);

        // Update counts
        await this.updateFollowCounts(request.requester_id, request.target_id);

        // Send notification to requester
        const target = await this.userRepository.findOne({
            where: { id: request.target_id },
        });

        if (target) {
            try {
                await this.notificationsService.sendToUser(request.requester_id, {
                    title: 'Follow Request Accepted',
                    body: `${target.username} accepted your follow request`,
                    url: `/profile/${target.username}`,
                });
            } catch (error) {
                this.logger.error('Failed to send follow request accepted notification', error);
            }
        }

        return savedFollow;
    }

    /**
     * Reject a follow request
     */
    async rejectFollowRequest(requestId: string, userId: string): Promise<void> {
        const request = await this.followRequestRepository.findOne({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException('Follow request', requestId);
        }

        // Verify that the user is the target of the request
        if (request.target_id !== userId) {
            throw new AuthorizationException('You can only reject requests sent to you');
        }

        if (request.status !== FollowRequestStatus.PENDING) {
            throw new ConflictException('Follow request has already been processed');
        }

        // Update request status
        request.status = FollowRequestStatus.REJECTED;
        await this.followRequestRepository.save(request);
    }

    /**
     * Get pending follow requests for a user
     */
    async getPendingFollowRequests(userId: string): Promise<FollowRequest[]> {
        return this.followRequestRepository.find({
            where: {
                target_id: userId,
                status: FollowRequestStatus.PENDING,
            },
            relations: ['requester'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Update follower and following counts for both users
     */
    private async updateFollowCounts(followerId: string, followingId: string): Promise<void> {
        // Update follower count
        const followerCount = await this.getFollowerCount(followingId);
        await this.userRepository.update(followingId, {
            follower_count: followerCount,
        });

        // Update following count
        const followingCount = await this.getFollowingCount(followerId);
        await this.userRepository.update(followerId, {
            following_count: followingCount,
        });
    }
}
