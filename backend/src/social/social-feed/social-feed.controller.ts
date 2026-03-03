import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { SocialFeedService } from './social-feed.service';
import { PaginationDto, CreateActivityDto, CommentActivityDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('social-feed')
@UseGuards(JwtAuthGuard)
export class SocialFeedController {
    constructor(private readonly socialFeedService: SocialFeedService) { }

    /**
     * Get user's feed (activities from followed users)
     */
    @Get('feed')
    async getUserFeed(@Request() req: any, @Query() pagination: PaginationDto) {
        const userId = req.user.id;
        return this.socialFeedService.getUserFeed(userId, pagination);
    }

    /**
     * Get activities for a specific user
     */
    @Get('activities/:userId')
    async getUserActivities(
        @Param('userId') userId: string,
        @Query() pagination: PaginationDto,
    ) {
        return this.socialFeedService.getUserActivities(userId, pagination);
    }

    /**
     * Create a new activity (manual creation)
     */
    @Post('activities')
    async createActivity(@Request() req: any, @Body() dto: CreateActivityDto) {
        const userId = req.user.id;
        return this.socialFeedService.createActivity(userId, dto.type, dto.data);
    }

    /**
     * Like an activity (toggle behavior)
     */
    @Post('activities/:activityId/like')
    async likeActivity(@Request() req: any, @Param('activityId') activityId: string) {
        const userId = req.user.id;
        const result = await this.socialFeedService.likeActivity(activityId, userId);

        return {
            success: true,
            liked: result !== null,
            message: result ? 'Activity liked' : 'Activity unliked',
        };
    }

    /**
     * Unlike an activity
     */
    @Delete('activities/:activityId/like')
    async unlikeActivity(@Request() req: any, @Param('activityId') activityId: string) {
        const userId = req.user.id;
        await this.socialFeedService.unlikeActivity(activityId, userId);

        return {
            success: true,
            message: 'Activity unliked',
        };
    }

    /**
     * Comment on an activity
     */
    @Post('activities/:activityId/comments')
    async commentOnActivity(
        @Request() req: any,
        @Param('activityId') activityId: string,
        @Body() dto: CommentActivityDto,
    ) {
        const userId = req.user.id;
        return this.socialFeedService.commentOnActivity(
            activityId,
            userId,
            dto.content,
        );
    }

    /**
     * Delete a comment
     */
    @Delete('comments/:commentId')
    async deleteComment(@Request() req: any, @Param('commentId') commentId: string) {
        const userId = req.user.id;
        await this.socialFeedService.deleteComment(commentId, userId);

        return {
            success: true,
            message: 'Comment deleted',
        };
    }

    /**
     * Get like count for an activity
     */
    @Get('activities/:activityId/likes/count')
    async getActivityLikes(@Param('activityId') activityId: string) {
        const count = await this.socialFeedService.getActivityLikes(activityId);
        return { count };
    }

    /**
     * Get comments for an activity
     */
    @Get('activities/:activityId/comments')
    async getActivityComments(
        @Param('activityId') activityId: string,
        @Query() pagination: PaginationDto,
    ) {
        return this.socialFeedService.getActivityComments(activityId, pagination);
    }

    /**
     * Check if user has liked an activity
     */
    @Get('activities/:activityId/likes/check')
    async hasUserLiked(@Request() req: any, @Param('activityId') activityId: string) {
        const userId = req.user.id;
        const hasLiked = await this.socialFeedService.hasUserLiked(activityId, userId);
        return { hasLiked };
    }
}
