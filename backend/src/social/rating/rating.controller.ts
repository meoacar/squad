import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { RateUserDto } from './dto/rate-user.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

interface RequestWithUser {
    user: {
        id: string;
        username: string;
    };
}

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
    constructor(private readonly ratingService: RatingService) { }

    /**
     * Rate a user after a match
     * POST /ratings
     */
    @Post()
    async rateUser(@Request() req: RequestWithUser, @Body() dto: RateUserDto) {
        const rating = await this.ratingService.rateUser(req.user.id, dto);
        return {
            success: true,
            data: rating,
        };
    }

    /**
     * Check if current user can rate another user for a match
     * GET /ratings/can-rate/:userId/:matchId
     */
    @Get('can-rate/:userId/:matchId')
    async canRateUser(
        @Request() req: RequestWithUser,
        @Param('userId') userId: string,
        @Param('matchId') matchId: string,
    ) {
        const canRate = await this.ratingService.canRateUser(req.user.id, userId, matchId);
        return {
            success: true,
            canRate,
        };
    }

    /**
     * Get ratings for a user
     * GET /ratings/user/:userId
     */
    @Get('user/:userId')
    async getUserRatings(@Param('userId') userId: string, @Query() pagination: PaginationDto) {
        const result = await this.ratingService.getUserRatings(userId, pagination);
        return {
            success: true,
            ...result,
        };
    }

    /**
     * Get average rating for a user
     * GET /ratings/user/:userId/average
     */
    @Get('user/:userId/average')
    async getAverageRating(@Param('userId') userId: string) {
        const average = await this.ratingService.getAverageRating(userId);
        return {
            success: true,
            average,
        };
    }

    /**
     * Get rating count for a user
     * GET /ratings/user/:userId/count
     */
    @Get('user/:userId/count')
    async getRatingCount(@Param('userId') userId: string) {
        const count = await this.ratingService.getRatingCount(userId);
        return {
            success: true,
            count,
        };
    }

    /**
     * Check if user has trusted player badge
     * GET /ratings/user/:userId/trusted-badge
     */
    @Get('user/:userId/trusted-badge')
    async hasTrustedPlayerBadge(@Param('userId') userId: string) {
        const hasBadge = await this.ratingService.hasTrustedPlayerBadge(userId);
        return {
            success: true,
            hasTrustedBadge: hasBadge,
        };
    }

    /**
     * Report a rating comment
     * POST /ratings/:ratingId/report
     */
    @Post(':ratingId/report')
    @HttpCode(HttpStatus.NO_CONTENT)
    async reportComment(
        @Request() req: RequestWithUser,
        @Param('ratingId') ratingId: string,
        @Body() dto: { reason: string },
    ) {
        await this.ratingService.reportComment(ratingId, req.user.id, dto.reason);
    }

    /**
     * Hide a rating comment (admin only)
     * POST /ratings/:ratingId/hide
     */
    @Post(':ratingId/hide')
    @HttpCode(HttpStatus.NO_CONTENT)
    async hideComment(@Param('ratingId') ratingId: string) {
        await this.ratingService.hideComment(ratingId);
    }

    /**
     * Delete a rating comment (admin only)
     * DELETE /ratings/:ratingId
     */
    @Delete(':ratingId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteComment(@Param('ratingId') ratingId: string) {
        await this.ratingService.deleteComment(ratingId);
    }
}
