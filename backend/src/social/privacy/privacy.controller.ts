import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import {
    SetProfileVisibilityDto,
    SetRatingVisibilityDto,
    UpdateNotificationPreferencesDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

interface RequestWithUser {
    user: {
        id: string;
        username: string;
    };
}

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
    constructor(private readonly privacyService: PrivacyService) { }

    /**
     * Set profile visibility
     * POST /privacy/profile-visibility
     */
    @Post('profile-visibility')
    async setProfileVisibility(
        @Request() req: RequestWithUser,
        @Body() dto: SetProfileVisibilityDto,
    ) {
        await this.privacyService.setProfileVisibility(req.user.id, dto.visibility);
        return {
            success: true,
            message: 'Profile visibility updated successfully',
        };
    }

    /**
     * Get profile visibility
     * GET /privacy/profile-visibility
     */
    @Get('profile-visibility')
    async getProfileVisibility(@Request() req: RequestWithUser) {
        const visibility = await this.privacyService.getProfileVisibility(req.user.id);
        return {
            success: true,
            visibility,
        };
    }

    /**
     * Set rating visibility
     * POST /privacy/rating-visibility
     */
    @Post('rating-visibility')
    async setRatingVisibility(
        @Request() req: RequestWithUser,
        @Body() dto: SetRatingVisibilityDto,
    ) {
        await this.privacyService.setRatingVisibility(req.user.id, dto.isHidden);
        return {
            success: true,
            message: 'Rating visibility updated successfully',
        };
    }

    /**
     * Check if viewer can view target user's rating
     * GET /privacy/can-view-rating/:userId
     */
    @Get('can-view-rating/:userId')
    async canViewRating(@Request() req: RequestWithUser, @Param('userId') userId: string) {
        const canView = await this.privacyService.canViewRating(req.user.id, userId);
        return {
            success: true,
            canView,
        };
    }

    /**
     * Block a user
     * POST /privacy/block/:userId
     */
    @Post('block/:userId')
    async blockUser(@Request() req: RequestWithUser, @Param('userId') userId: string) {
        const block = await this.privacyService.blockUser(req.user.id, userId);
        return {
            success: true,
            data: block,
        };
    }

    /**
     * Unblock a user
     * DELETE /privacy/block/:userId
     */
    @Delete('block/:userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async unblockUser(@Request() req: RequestWithUser, @Param('userId') userId: string) {
        await this.privacyService.unblockUser(req.user.id, userId);
    }

    /**
     * Check if a user is blocked
     * GET /privacy/is-blocked/:userId
     */
    @Get('is-blocked/:userId')
    async isBlocked(@Request() req: RequestWithUser, @Param('userId') userId: string) {
        const isBlocked = await this.privacyService.isBlocked(req.user.id, userId);
        return {
            success: true,
            isBlocked,
        };
    }

    /**
     * Get list of blocked users
     * GET /privacy/blocked-users
     */
    @Get('blocked-users')
    async getBlockedUsers(@Request() req: RequestWithUser) {
        const users = await this.privacyService.getBlockedUsers(req.user.id);
        return {
            success: true,
            data: users,
        };
    }

    /**
     * Update notification preferences
     * POST /privacy/notification-preferences
     */
    @Post('notification-preferences')
    async updateNotificationPreferences(
        @Request() req: RequestWithUser,
        @Body() dto: UpdateNotificationPreferencesDto,
    ) {
        const preferences = await this.privacyService.updateNotificationPreferences(
            req.user.id,
            dto,
        );
        return {
            success: true,
            data: preferences,
        };
    }

    /**
     * Get notification preferences
     * GET /privacy/notification-preferences
     */
    @Get('notification-preferences')
    async getNotificationPreferences(@Request() req: RequestWithUser) {
        const preferences = await this.privacyService.getNotificationPreferences(req.user.id);
        return {
            success: true,
            data: preferences,
        };
    }
}
