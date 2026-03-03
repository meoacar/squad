import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowUserDto, PaginationDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

interface RequestWithUser {
    user: {
        id: string;
        username: string;
    };
}

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
    constructor(private readonly followService: FollowService) { }

    /**
     * Follow a user
     * POST /follow/:userId
     */
    @Post(':userId')
    async followUser(@Request() req: RequestWithUser, @Param('userId') userId: string) {
        const result = await this.followService.followUser(req.user.id, userId);
        return {
            success: true,
            data: result,
        };
    }

    /**
     * Unfollow a user
     * DELETE /follow/:userId
     */
    @Delete(':userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async unfollowUser(@Request() req: RequestWithUser, @Param('userId') userId: string) {
        await this.followService.unfollowUser(req.user.id, userId);
    }

    /**
     * Get followers of a user
     * GET /follow/:userId/followers
     */
    @Get(':userId/followers')
    async getFollowers(@Param('userId') userId: string, @Query() pagination: PaginationDto) {
        const result = await this.followService.getFollowers(userId, pagination);
        return {
            success: true,
            ...result,
        };
    }

    /**
     * Get users that a user is following
     * GET /follow/:userId/following
     */
    @Get(':userId/following')
    async getFollowing(@Param('userId') userId: string, @Query() pagination: PaginationDto) {
        const result = await this.followService.getFollowing(userId, pagination);
        return {
            success: true,
            ...result,
        };
    }

    /**
     * Get follower count for a user
     * GET /follow/:userId/followers/count
     */
    @Get(':userId/followers/count')
    async getFollowerCount(@Param('userId') userId: string) {
        const count = await this.followService.getFollowerCount(userId);
        return {
            success: true,
            count,
        };
    }

    /**
     * Get following count for a user
     * GET /follow/:userId/following/count
     */
    @Get(':userId/following/count')
    async getFollowingCount(@Param('userId') userId: string) {
        const count = await this.followService.getFollowingCount(userId);
        return {
            success: true,
            count,
        };
    }

    /**
     * Check if current user is following another user
     * GET /follow/:userId/is-following
     */
    @Get(':userId/is-following')
    async isFollowing(@Request() req: RequestWithUser, @Param('userId') userId: string) {
        const isFollowing = await this.followService.isFollowing(req.user.id, userId);
        return {
            success: true,
            isFollowing,
        };
    }

    /**
     * Get pending follow requests for current user
     * GET /follow/requests/pending
     */
    @Get('requests/pending')
    async getPendingFollowRequests(@Request() req: RequestWithUser) {
        const requests = await this.followService.getPendingFollowRequests(req.user.id);
        return {
            success: true,
            data: requests,
        };
    }

    /**
     * Approve a follow request
     * POST /follow/requests/:requestId/approve
     */
    @Post('requests/:requestId/approve')
    async approveFollowRequest(@Request() req: RequestWithUser, @Param('requestId') requestId: string) {
        const follow = await this.followService.approveFollowRequest(requestId, req.user.id);
        return {
            success: true,
            data: follow,
        };
    }

    /**
     * Reject a follow request
     * POST /follow/requests/:requestId/reject
     */
    @Post('requests/:requestId/reject')
    @HttpCode(HttpStatus.NO_CONTENT)
    async rejectFollowRequest(@Request() req: RequestWithUser, @Param('requestId') requestId: string) {
        await this.followService.rejectFollowRequest(requestId, req.user.id);
    }
}
