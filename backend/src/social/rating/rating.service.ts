import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Rating, RatingReport } from '../entities';
import { User } from '../../users/entities/user.entity';
import { PaginationDto, PaginatedResult } from './dto/pagination.dto';
import { RateUserDto } from './dto/rate-user.dto';
import {
    ValidationException,
    ConflictException,
    NotFoundException,
} from '../exceptions';

@Injectable()
export class RatingService {
    private readonly logger = new Logger(RatingService.name);

    // Profanity detection - basic list (can be extended)
    private readonly profanityWords = [
        'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard',
        // Add more words as needed
    ];

    constructor(
        @InjectRepository(Rating)
        private ratingRepository: Repository<Rating>,
        @InjectRepository(RatingReport)
        private ratingReportRepository: Repository<RatingReport>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private dataSource: DataSource,
    ) { }

    /**
     * Rate a user after a match
     */
    async rateUser(
        raterId: string,
        dto: RateUserDto,
    ): Promise<Rating> {
        const { rated_user_id, match_id, rating, comment } = dto;

        // Validate: Cannot rate self
        if (raterId === rated_user_id) {
            throw new ValidationException('Cannot rate yourself');
        }

        // Check if users exist
        const [rater, ratedUser] = await Promise.all([
            this.userRepository.findOne({ where: { id: raterId } }),
            this.userRepository.findOne({ where: { id: rated_user_id } }),
        ]);

        if (!rater) {
            throw new NotFoundException('User', raterId);
        }
        if (!ratedUser) {
            throw new NotFoundException('User', rated_user_id);
        }

        // Check if can rate (match completion check would go here)
        const canRate = await this.canRateUser(raterId, rated_user_id, match_id);
        if (!canRate) {
            throw new ValidationException('Cannot rate this user for this match');
        }

        // Check if already rated
        const existingRating = await this.ratingRepository.findOne({
            where: {
                rater_id: raterId,
                rated_user_id,
                match_id,
            },
        });

        if (existingRating) {
            throw new ConflictException('You have already rated this user for this match');
        }

        // Check for profanity in comment
        const hasProfanity = comment ? this.containsProfanity(comment) : false;

        // Create rating
        const newRating = this.ratingRepository.create({
            rater_id: raterId,
            rated_user_id,
            match_id,
            rating,
            comment,
            is_hidden: hasProfanity, // Auto-hide if profanity detected
            flag_count: hasProfanity ? 1 : 0,
        });

        const savedRating = await this.ratingRepository.save(newRating);

        // Update user's average rating and badge
        await this.updateUserRatingStats(rated_user_id);

        return savedRating;
    }

    /**
     * Check if a user can rate another user for a specific match
     */
    async canRateUser(
        raterId: string,
        ratedUserId: string,
        matchId: string,
    ): Promise<boolean> {
        // Check if already rated
        const existingRating = await this.ratingRepository.findOne({
            where: {
                rater_id: raterId,
                rated_user_id: ratedUserId,
                match_id: matchId,
            },
        });

        if (existingRating) {
            return false;
        }

        // TODO: Add match completion check when match system is implemented
        // For now, we'll assume the match is valid
        return true;
    }

    /**
     * Get ratings for a user
     */
    async getUserRatings(
        userId: string,
        pagination: PaginationDto,
    ): Promise<PaginatedResult<Rating>> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        const [ratings, total] = await this.ratingRepository.findAndCount({
            where: {
                rated_user_id: userId,
                is_hidden: false, // Only show non-hidden ratings
            },
            relations: ['rater'],
            skip,
            take: limit,
            order: { created_at: 'DESC' },
        });

        return {
            data: ratings,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get average rating for a user
     */
    async getAverageRating(userId: string): Promise<number> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['rating_average'],
        });

        return user?.rating_average || 0;
    }

    /**
     * Get rating count for a user
     */
    async getRatingCount(userId: string): Promise<number> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['rating_count'],
        });

        return user?.rating_count || 0;
    }

    /**
     * Update user's rating statistics and badge
     */
    private async updateUserRatingStats(userId: string): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Calculate average rating
            const result = await queryRunner.manager
                .createQueryBuilder(Rating, 'rating')
                .select('AVG(rating.rating)', 'average')
                .addSelect('COUNT(rating.id)', 'count')
                .where('rating.rated_user_id = :userId', { userId })
                .andWhere('rating.is_hidden = false')
                .getRawOne();

            const average = result.average ? parseFloat(parseFloat(result.average).toFixed(1)) : 0;
            const count = parseInt(result.count) || 0;

            // Update user stats
            await queryRunner.manager.update(User, userId, {
                rating_average: average,
                rating_count: count,
            });

            // Update trusted player badge
            await this.updateTrustedPlayerBadgeInTransaction(userId, average, count, queryRunner);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Failed to update user rating stats', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Update trusted player badge for a user
     */
    async updateTrustedPlayerBadge(userId: string): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['rating_average', 'rating_count', 'has_trusted_badge'],
        });

        if (!user) {
            throw new NotFoundException('User', userId);
        }

        const shouldHaveBadge = user.rating_average >= 4.5 && user.rating_count >= 20;
        const shouldRemoveBadge = user.has_trusted_badge && user.rating_average < 4.3;

        if (shouldHaveBadge && !user.has_trusted_badge) {
            await this.userRepository.update(userId, { has_trusted_badge: true });
            this.logger.log(`Awarded trusted player badge to user ${userId}`);
        } else if (shouldRemoveBadge) {
            await this.userRepository.update(userId, { has_trusted_badge: false });
            this.logger.log(`Removed trusted player badge from user ${userId}`);
        }
    }

    /**
     * Update trusted player badge within a transaction
     */
    private async updateTrustedPlayerBadgeInTransaction(
        userId: string,
        average: number,
        count: number,
        queryRunner: any,
    ): Promise<void> {
        const user = await queryRunner.manager.findOne(User, {
            where: { id: userId },
            select: ['has_trusted_badge'],
        });

        if (!user) {
            return;
        }

        const shouldHaveBadge = average >= 4.5 && count >= 20;
        const shouldRemoveBadge = user.has_trusted_badge && average < 4.3;

        if (shouldHaveBadge && !user.has_trusted_badge) {
            await queryRunner.manager.update(User, userId, { has_trusted_badge: true });
            this.logger.log(`Awarded trusted player badge to user ${userId}`);
        } else if (shouldRemoveBadge) {
            await queryRunner.manager.update(User, userId, { has_trusted_badge: false });
            this.logger.log(`Removed trusted player badge from user ${userId}`);
        }
    }

    /**
     * Check if user has trusted player badge
     */
    async hasTrustedPlayerBadge(userId: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['has_trusted_badge'],
        });

        return user?.has_trusted_badge || false;
    }

    /**
     * Flag a comment for profanity
     */
    async flagComment(ratingId: string, reason: string): Promise<void> {
        const rating = await this.ratingRepository.findOne({
            where: { id: ratingId },
        });

        if (!rating) {
            throw new NotFoundException('Rating', ratingId);
        }

        // Increment flag count and hide if necessary
        rating.flag_count += 1;
        if (!rating.is_hidden) {
            rating.is_hidden = true;
        }

        await this.ratingRepository.save(rating);
        this.logger.log(`Flagged rating ${ratingId} for: ${reason}`);
    }

    /**
     * Report a comment
     */
    async reportComment(
        ratingId: string,
        reporterId: string,
        reason: string,
    ): Promise<void> {
        const rating = await this.ratingRepository.findOne({
            where: { id: ratingId },
        });

        if (!rating) {
            throw new NotFoundException('Rating', ratingId);
        }

        // Check if already reported by this user
        const existingReport = await this.ratingReportRepository.findOne({
            where: {
                rating_id: ratingId,
                reporter_id: reporterId,
            },
        });

        if (existingReport) {
            throw new ConflictException('You have already reported this comment');
        }

        // Create report
        const report = this.ratingReportRepository.create({
            rating_id: ratingId,
            reporter_id: reporterId,
            reason,
        });

        await this.ratingReportRepository.save(report);

        // Check if we need to auto-hide (3 or more reports)
        const reportCount = await this.ratingReportRepository.count({
            where: { rating_id: ratingId },
        });

        if (reportCount >= 3 && !rating.is_hidden) {
            await this.hideComment(ratingId);
            this.logger.log(`Auto-hidden rating ${ratingId} due to ${reportCount} reports`);
        }
    }

    /**
     * Hide a comment
     */
    async hideComment(ratingId: string): Promise<void> {
        const rating = await this.ratingRepository.findOne({
            where: { id: ratingId },
        });

        if (!rating) {
            throw new NotFoundException('Rating', ratingId);
        }

        rating.is_hidden = true;
        await this.ratingRepository.save(rating);
    }

    /**
     * Delete a comment (admin only)
     */
    async deleteComment(ratingId: string): Promise<void> {
        const rating = await this.ratingRepository.findOne({
            where: { id: ratingId },
        });

        if (!rating) {
            throw new NotFoundException('Rating', ratingId);
        }

        await this.ratingRepository.remove(rating);

        // Update user's rating stats after deletion
        await this.updateUserRatingStats(rating.rated_user_id);
    }

    /**
     * Check if text contains profanity
     */
    private containsProfanity(text: string): boolean {
        const lowerText = text.toLowerCase();
        return this.profanityWords.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(lowerText);
        });
    }
}
