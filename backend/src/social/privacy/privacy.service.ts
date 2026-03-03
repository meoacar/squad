import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block, NotificationPreferences, Follow } from '../entities';
import { User } from '../../users/entities/user.entity';
import {
    ValidationException,
    ConflictException,
    NotFoundException,
} from '../exceptions';
import { ProfileVisibility } from './dto/set-profile-visibility.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class PrivacyService {
    private readonly logger = new Logger(PrivacyService.name);

    constructor(
        @InjectRepository(Block)
        private blockRepository: Repository<Block>,
        @InjectRepository(NotificationPreferences)
        private notificationPreferencesRepository: Repository<NotificationPreferences>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Follow)
        private followRepository: Repository<Follow>,
    ) { }

    /**
     * Set profile visibility (public or private)
     */
    async setProfileVisibility(userId: string, visibility: ProfileVisibility): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User', userId);
        }

        await this.userRepository.update(userId, {
            profile_visibility: visibility,
        });

        this.logger.log(`User ${userId} set profile visibility to ${visibility}`);
    }

    /**
     * Get profile visibility for a user
     */
    async getProfileVisibility(userId: string): Promise<ProfileVisibility> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User', userId);
        }

        return user.profile_visibility as ProfileVisibility;
    }

    /**
     * Set rating visibility (hidden or visible)
     */
    async setRatingVisibility(userId: string, isHidden: boolean): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User', userId);
        }

        await this.userRepository.update(userId, {
            rating_hidden: isHidden,
        });

        this.logger.log(`User ${userId} set rating visibility to ${isHidden ? 'hidden' : 'visible'}`);
    }

    /**
     * Check if a viewer can view a target user's rating
     */
    async canViewRating(viewerId: string, targetUserId: string): Promise<boolean> {
        const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });

        if (!targetUser) {
            throw new NotFoundException('User', targetUserId);
        }

        // If rating is not hidden, everyone can view it
        if (!targetUser.rating_hidden) {
            return true;
        }

        // If rating is hidden, only the user themselves can view it
        return viewerId === targetUserId;
    }

    /**
     * Block a user
     */
    async blockUser(blockerId: string, blockedId: string): Promise<Block> {
        // Validate: Cannot block self
        if (blockerId === blockedId) {
            throw new ValidationException('Cannot block yourself');
        }

        // Check if users exist
        const [blocker, blocked] = await Promise.all([
            this.userRepository.findOne({ where: { id: blockerId } }),
            this.userRepository.findOne({ where: { id: blockedId } }),
        ]);

        if (!blocker) {
            throw new NotFoundException('User', blockerId);
        }
        if (!blocked) {
            throw new NotFoundException('User', blockedId);
        }

        // Check if already blocked
        const existingBlock = await this.blockRepository.findOne({
            where: { blocker_id: blockerId, blocked_id: blockedId },
        });

        if (existingBlock) {
            throw new ConflictException('User is already blocked');
        }

        // Remove any existing follow relationships (Requirement 14.4)
        await this.removeFollowRelationships(blockerId, blockedId);

        // Create block
        try {
            const block = this.blockRepository.create({
                blocker_id: blockerId,
                blocked_id: blockedId,
            });

            const savedBlock = await this.blockRepository.save(block);

            this.logger.log(`User ${blockerId} blocked user ${blockedId}`);

            return savedBlock;
        } catch (error) {
            if (error.code === '23505') {
                // Unique constraint violation
                throw new ConflictException('User is already blocked');
            }
            throw error;
        }
    }

    /**
     * Unblock a user
     */
    async unblockUser(blockerId: string, blockedId: string): Promise<void> {
        const block = await this.blockRepository.findOne({
            where: { blocker_id: blockerId, blocked_id: blockedId },
        });

        if (!block) {
            throw new NotFoundException('Block relationship');
        }

        await this.blockRepository.remove(block);

        this.logger.log(`User ${blockerId} unblocked user ${blockedId}`);
    }

    /**
     * Check if a user is blocked
     * Returns true if either user has blocked the other
     */
    async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
        const block = await this.blockRepository.findOne({
            where: [
                { blocker_id: userId, blocked_id: otherUserId },
                { blocker_id: otherUserId, blocked_id: userId },
            ],
        });

        return !!block;
    }

    /**
     * Get list of blocked users
     */
    async getBlockedUsers(userId: string): Promise<User[]> {
        const blocks = await this.blockRepository.find({
            where: { blocker_id: userId },
            relations: ['blocked'],
            order: { created_at: 'DESC' },
        });

        return blocks.map((block) => block.blocked);
    }

    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(
        userId: string,
        preferences: UpdateNotificationPreferencesDto,
    ): Promise<NotificationPreferences> {
        // Check if user exists
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User', userId);
        }

        // Check if preferences already exist
        let notificationPreferences = await this.notificationPreferencesRepository.findOne({
            where: { user_id: userId },
        });

        if (notificationPreferences) {
            // Update existing preferences
            Object.assign(notificationPreferences, preferences);
            const updated = await this.notificationPreferencesRepository.save(notificationPreferences);
            this.logger.log(`User ${userId} updated notification preferences`);
            return updated;
        } else {
            // Create new preferences with defaults
            const newPreferences = this.notificationPreferencesRepository.create({
                user_id: userId,
                ...preferences,
            });
            const saved = await this.notificationPreferencesRepository.save(newPreferences);
            this.logger.log(`User ${userId} created notification preferences`);
            return saved;
        }
    }

    /**
     * Get notification preferences
     */
    async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        // Check if user exists
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User', userId);
        }

        // Get or create preferences
        let preferences = await this.notificationPreferencesRepository.findOne({
            where: { user_id: userId },
        });

        if (!preferences) {
            // Create default preferences
            preferences = this.notificationPreferencesRepository.create({
                user_id: userId,
                email_messages: true,
                email_follow: true,
                email_clan_invites: true,
                email_activity_interactions: true,
                push_messages: true,
                push_follow: true,
                push_clan_invites: true,
                push_activity_interactions: true,
            });
            await this.notificationPreferencesRepository.save(preferences);
        }

        return preferences;
    }

    /**
     * Remove follow relationships between two users (both directions)
     * Used when blocking a user
     */
    private async removeFollowRelationships(userId1: string, userId2: string): Promise<void> {
        // Remove both directions of follow relationships
        await this.followRepository.delete({
            follower_id: userId1,
            following_id: userId2,
        });

        await this.followRepository.delete({
            follower_id: userId2,
            following_id: userId1,
        });

        // Update follower/following counts for both users
        await this.updateFollowCounts(userId1);
        await this.updateFollowCounts(userId2);
    }

    /**
     * Update follower and following counts for a user
     */
    private async updateFollowCounts(userId: string): Promise<void> {
        const [followerCount, followingCount] = await Promise.all([
            this.followRepository.count({ where: { following_id: userId } }),
            this.followRepository.count({ where: { follower_id: userId } }),
        ]);

        await this.userRepository.update(userId, {
            follower_count: followerCount,
            following_count: followingCount,
        });
    }
}
