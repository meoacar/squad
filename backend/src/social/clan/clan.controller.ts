import {
    Controller,
    Post,
    Get,
    Put,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ClanService } from './clan.service';
import {
    CreateClanDto,
    UpdateClanDto,
    InviteMemberDto,
    CreateAnnouncementDto,
    ClanLeaderboardQueryDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

interface RequestWithUser {
    user: {
        id: string;
        username: string;
    };
}

@Controller('clans')
@UseGuards(JwtAuthGuard)
export class ClanController {
    constructor(private readonly clanService: ClanService) { }

    /**
     * Create a new clan
     * POST /clans
     */
    @Post()
    async createClan(@Request() req: RequestWithUser, @Body() createClanDto: CreateClanDto) {
        const clan = await this.clanService.createClan(req.user.id, createClanDto);
        return {
            success: true,
            data: clan,
        };
    }

    /**
     * Get clan leaderboard
     * GET /clans/leaderboard
     * IMPORTANT: Must be before :clanId route
     */
    @Get('leaderboard')
    async getClanLeaderboard(@Query() query: ClanLeaderboardQueryDto) {
        const leaderboard = await this.clanService.getClanLeaderboard(query);
        return {
            success: true,
            data: leaderboard,
        };
    }

    /**
     * Get current user's clan
     * GET /clans/me/clan
     * IMPORTANT: Must be before :clanId route
     */
    @Get('me/clan')
    async getUserClan(@Request() req: RequestWithUser) {
        const clan = await this.clanService.getUserClan(req.user.id);
        return {
            success: true,
            data: clan,
        };
    }

    /**
     * Get current user's pending clan invitations
     * GET /clans/me/invitations
     * IMPORTANT: Must be before :clanId route
     */
    @Get('me/invitations')
    async getUserInvitations(@Request() req: RequestWithUser) {
        const invitations = await this.clanService.getUserInvitations(req.user.id);
        return {
            success: true,
            data: invitations,
        };
    }

    /**
     * Accept a clan invitation
     * POST /clans/invitations/:invitationId/accept
     * IMPORTANT: Must be before :clanId route
     */
    @Post('invitations/:invitationId/accept')
    async acceptInvitation(
        @Request() req: RequestWithUser,
        @Param('invitationId') invitationId: string,
    ) {
        const member = await this.clanService.acceptInvitation(invitationId, req.user.id);
        return {
            success: true,
            data: member,
        };
    }

    /**
     * Reject a clan invitation
     * POST /clans/invitations/:invitationId/reject
     * IMPORTANT: Must be before :clanId route
     */
    @Post('invitations/:invitationId/reject')
    @HttpCode(HttpStatus.NO_CONTENT)
    async rejectInvitation(
        @Request() req: RequestWithUser,
        @Param('invitationId') invitationId: string,
    ) {
        await this.clanService.rejectInvitation(invitationId, req.user.id);
    }

    /**
     * Delete a clan announcement
     * DELETE /clans/announcements/:announcementId
     * IMPORTANT: Must be before :clanId route
     */
    @Delete('announcements/:announcementId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAnnouncement(
        @Request() req: RequestWithUser,
        @Param('announcementId') announcementId: string,
    ) {
        await this.clanService.deleteAnnouncement(announcementId, req.user.id);
    }

    /**
     * Get clan by ID
     * GET /clans/:clanId
     */
    @Get(':clanId')
    async getClan(@Param('clanId') clanId: string) {
        const clan = await this.clanService.getClan(clanId);
        return {
            success: true,
            data: clan,
        };
    }

    /**
     * Update clan information
     * PUT /clans/:clanId
     */
    @Put(':clanId')
    async updateClan(
        @Request() req: RequestWithUser,
        @Param('clanId') clanId: string,
        @Body() updateClanDto: UpdateClanDto,
    ) {
        const clan = await this.clanService.updateClan(clanId, req.user.id, updateClanDto);
        return {
            success: true,
            data: clan,
        };
    }

    /**
     * Delete a clan
     * DELETE /clans/:clanId
     */
    @Delete(':clanId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteClan(@Request() req: RequestWithUser, @Param('clanId') clanId: string) {
        await this.clanService.deleteClan(clanId, req.user.id);
    }

    /**
     * Get clan members
     * GET /clans/:clanId/members
     */
    @Get(':clanId/members')
    async getClanMembers(@Param('clanId') clanId: string) {
        const members = await this.clanService.getClanMembers(clanId);
        return {
            success: true,
            data: members,
        };
    }

    /**
     * Invite a member to the clan
     * POST /clans/:clanId/invitations
     */
    @Post(':clanId/invitations')
    async inviteMember(
        @Request() req: RequestWithUser,
        @Param('clanId') clanId: string,
        @Body() inviteMemberDto: InviteMemberDto,
    ) {
        const invitation = await this.clanService.inviteMember(
            clanId,
            req.user.id,
            inviteMemberDto.invitee_id,
        );
        return {
            success: true,
            data: invitation,
        };
    }

    /**
     * Change member role (must be before DELETE members route)
     * PATCH /clans/:clanId/members/:memberId/role
     */
    @Patch(':clanId/members/:memberId/role')
    async changeMemberRole(
        @Request() req: RequestWithUser,
        @Param('clanId') clanId: string,
        @Param('memberId') memberId: string,
        @Body('role') role: string,
    ) {
        const member = await this.clanService.changeMemberRole(clanId, req.user.id, memberId, role as any);
        return {
            success: true,
            data: member,
        };
    }

    /**
     * Remove a member from the clan
     * DELETE /clans/:clanId/members/:memberId
     */
    @Delete(':clanId/members/:memberId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeMember(
        @Request() req: RequestWithUser,
        @Param('clanId') clanId: string,
        @Param('memberId') memberId: string,
    ) {
        await this.clanService.removeMember(clanId, req.user.id, memberId);
    }

    /**
     * Leave a clan
     * POST /clans/:clanId/leave
     */
    @Post(':clanId/leave')
    @HttpCode(HttpStatus.NO_CONTENT)
    async leaveClan(@Request() req: RequestWithUser, @Param('clanId') clanId: string) {
        await this.clanService.leaveClan(clanId, req.user.id);
    }

    /**
     * Get clan statistics
     * GET /clans/:clanId/stats
     */
    @Get(':clanId/stats')
    async getClanStats(@Param('clanId') clanId: string) {
        const stats = await this.clanService.getClanStats(clanId);
        return {
            success: true,
            data: stats,
        };
    }

    /**
     * Create a clan announcement
     * POST /clans/:clanId/announcements
     */
    @Post(':clanId/announcements')
    async createAnnouncement(
        @Request() req: RequestWithUser,
        @Param('clanId') clanId: string,
        @Body() createAnnouncementDto: CreateAnnouncementDto,
    ) {
        const announcement = await this.clanService.createAnnouncement(
            clanId,
            req.user.id,
            createAnnouncementDto,
        );
        return {
            success: true,
            data: announcement,
        };
    }

    /**
     * Get clan announcements
     * GET /clans/:clanId/announcements
     */
    @Get(':clanId/announcements')
    async getAnnouncements(@Param('clanId') clanId: string) {
        const announcements = await this.clanService.getAnnouncements(clanId);
        return {
            success: true,
            data: announcements,
        };
    }
}
