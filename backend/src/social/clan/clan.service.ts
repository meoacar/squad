import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import {
    Clan,
    ClanMember,
    ClanMemberRole,
    ClanInvitation,
    ClanInvitationStatus,
    ClanAnnouncement,
    ActivityType,
} from '../entities';
import { User } from '../../users/entities/user.entity';
import {
    CreateClanDto,
    UpdateClanDto,
    InviteMemberDto,
    CreateAnnouncementDto,
    ClanLeaderboardQueryDto,
} from './dto';
import {
    ValidationException,
    ConflictException,
    NotFoundException,
    AuthorizationException,
} from '../exceptions';
import { NotificationsService } from '../../notifications/notifications.service';
import { SocialFeedService } from '../social-feed/social-feed.service';

export interface ClanStats {
    total_matches: number;
    average_rating: number;
    badges: any[];
}

export interface ClanLeaderboardEntry {
    rank: number;
    clan_id: string;
    clan_name: string;
    member_count: number;
    total_matches: number;
}

@Injectable()
export class ClanService {
    private readonly logger = new Logger(ClanService.name);

    constructor(
        @InjectRepository(Clan)
        private clanRepository: Repository<Clan>,
        @InjectRepository(ClanMember)
        private clanMemberRepository: Repository<ClanMember>,
        @InjectRepository(ClanInvitation)
        private clanInvitationRepository: Repository<ClanInvitation>,
        @InjectRepository(ClanAnnouncement)
        private clanAnnouncementRepository: Repository<ClanAnnouncement>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private dataSource: DataSource,
        private notificationsService: NotificationsService,
        private socialFeedService: SocialFeedService,
    ) { }

    /**
     * Create a new clan
     */
    async createClan(creatorId: string, data: CreateClanDto): Promise<Clan> {
        this.logger.log(`🚀 Creating clan for user ${creatorId} with data:`, JSON.stringify(data));

        // Validate clan name length
        if (data.name.length < 3 || data.name.length > 30) {
            throw new ValidationException('Clan name must be between 3 and 30 characters');
        }

        // Check if clan name already exists
        const existingClan = await this.clanRepository.findOne({
            where: { name: data.name },
        });

        if (existingClan) {
            throw new ConflictException('Clan name already exists');
        }

        // Check if user exists
        const creator = await this.userRepository.findOne({
            where: { id: creatorId },
        });

        if (!creator) {
            throw new NotFoundException('User', creatorId);
        }

        // Check if user is already in a clan
        const existingMembership = await this.clanMemberRepository.findOne({
            where: { user_id: creatorId },
        });

        if (existingMembership) {
            throw new ConflictException('User is already a member of a clan');
        }

        // Use transaction to ensure atomicity
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create clan with all fields
            const clan = queryRunner.manager.create(Clan, {
                name: data.name,
                tag: data.tag,
                description: data.description,
                avatar_url: data.avatar_url,
                region: data.region,
                language: data.language,
                min_tier: data.min_tier,
                max_members: data.max_members || 50,
                is_recruiting: data.is_recruiting !== undefined ? data.is_recruiting : true,
                requirements: data.requirements,
                discord_url: data.discord_url,
                creator_id: creatorId,
                member_count: 1,
            });

            const savedClan = await queryRunner.manager.save(clan);

            // Add creator as leader
            const leaderMember = queryRunner.manager.create(ClanMember, {
                clan_id: savedClan.id,
                user_id: creatorId,
                role: ClanMemberRole.LEADER,
            });

            await queryRunner.manager.save(leaderMember);

            await queryRunner.commitTransaction();

            this.logger.log(`Clan created: ${savedClan.id} by user ${creatorId}`);

            // Create activity for clan creation
            try {
                await this.socialFeedService.createActivity(
                    creatorId,
                    ActivityType.CLAN_CREATED,
                    {
                        clanId: savedClan.id,
                        clanName: savedClan.name,
                        clanTag: savedClan.tag,
                    },
                );
            } catch (error) {
                this.logger.error('Failed to create clan creation activity', error);
            }

            return savedClan;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error.code === '23505') {
                // Unique constraint violation
                throw new ConflictException('Clan name already exists');
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Update clan information
     */
    async updateClan(clanId: string, userId: string, data: UpdateClanDto): Promise<Clan> {
        const clan = await this.clanRepository.findOne({
            where: { id: clanId },
        });

        if (!clan) {
            throw new NotFoundException('Clan', clanId);
        }

        // Check if user has permission (co-leader or higher)
        const member = await this.clanMemberRepository.findOne({
            where: { clan_id: clanId, user_id: userId },
        });

        if (!member || !this.hasPermission(member.role, ClanMemberRole.CO_LEADER)) {
            throw new AuthorizationException('Only co-leaders and above can update clan information');
        }

        // If name is being updated, check uniqueness
        if (data.name && data.name !== clan.name) {
            const existingClan = await this.clanRepository.findOne({
                where: { name: data.name },
            });

            if (existingClan) {
                throw new ConflictException('Clan name already exists');
            }
        }

        // Update clan
        Object.assign(clan, data);

        try {
            const updatedClan = await this.clanRepository.save(clan);
            this.logger.log(`Clan updated: ${clanId} by user ${userId}`);
            return updatedClan;
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Clan name already exists');
            }
            throw error;
        }
    }

    /**
     * Delete a clan
     */
    async deleteClan(clanId: string, userId: string): Promise<void> {
        const clan = await this.clanRepository.findOne({
            where: { id: clanId },
        });

        if (!clan) {
            throw new NotFoundException('Clan', clanId);
        }

        // Check if user is the creator
        if (clan.creator_id !== userId) {
            throw new AuthorizationException('Only the clan creator can delete the clan');
        }

        await this.clanRepository.remove(clan);
        this.logger.log(`Clan deleted: ${clanId} by user ${userId}`);
    }

    /**
     * Get clan by ID
     */
    async getClan(clanId: string): Promise<Clan> {
        const clan = await this.clanRepository.findOne({
            where: { id: clanId },
            relations: ['creator'],
        });

        if (!clan) {
            throw new NotFoundException('Clan', clanId);
        }

        return clan;
    }

    /**
     * Get user's clan
     */
    async getUserClan(userId: string): Promise<Clan | null> {
        const member = await this.clanMemberRepository.findOne({
            where: { user_id: userId },
            relations: ['clan'],
        });

        return member ? member.clan : null;
    }

    /**
     * Get user's pending clan invitations
     */
    async getUserInvitations(userId: string): Promise<ClanInvitation[]> {
        const invitations = await this.clanInvitationRepository.find({
            where: {
                invitee_id: userId,
                status: ClanInvitationStatus.PENDING,
            },
            relations: ['clan', 'inviter'],
            order: {
                created_at: 'DESC',
            },
        });

        return invitations;
    }

    /**
     * Invite a member to the clan
     */
    async inviteMember(
        clanId: string,
        inviterId: string,
        inviteeId: string,
    ): Promise<ClanInvitation> {
        // Check if clan exists
        const clan = await this.clanRepository.findOne({
            where: { id: clanId },
        });

        if (!clan) {
            throw new NotFoundException('Clan', clanId);
        }

        // Check if inviter has permission (moderator or higher)
        const inviterMember = await this.clanMemberRepository.findOne({
            where: { clan_id: clanId, user_id: inviterId },
        });

        if (!inviterMember || !this.hasPermission(inviterMember.role, ClanMemberRole.MODERATOR)) {
            throw new AuthorizationException('Only moderators and above can invite members');
        }

        // Check if invitee exists
        const invitee = await this.userRepository.findOne({
            where: { id: inviteeId },
        });

        if (!invitee) {
            throw new NotFoundException('User', inviteeId);
        }

        // Check if invitee is already a member
        const existingMembership = await this.clanMemberRepository.findOne({
            where: { user_id: inviteeId },
        });

        if (existingMembership) {
            throw new ConflictException('User is already a member of a clan');
        }

        // Check if there's already a pending invitation
        const existingInvitation = await this.clanInvitationRepository.findOne({
            where: {
                clan_id: clanId,
                invitee_id: inviteeId,
                status: ClanInvitationStatus.PENDING,
            },
        });

        if (existingInvitation) {
            throw new ConflictException('Invitation already sent to this user');
        }

        // Check member limit
        if (clan.member_count >= clan.max_members) {
            throw new ConflictException('Clan has reached maximum member limit');
        }

        // Create invitation
        const invitation = this.clanInvitationRepository.create({
            clan_id: clanId,
            inviter_id: inviterId,
            invitee_id: inviteeId,
            status: ClanInvitationStatus.PENDING,
        });

        const savedInvitation = await this.clanInvitationRepository.save(invitation);

        // Send notification
        try {
            await this.notificationsService.sendToUser(inviteeId, {
                title: 'Clan Invitation',
                body: `You have been invited to join ${clan.name}`,
                url: `/clans/${clanId}`,
            });
        } catch (error) {
            this.logger.error('Failed to send clan invitation notification', error);
        }

        this.logger.log(`Clan invitation sent: ${savedInvitation.id}`);

        return savedInvitation;
    }

    /**
     * Accept a clan invitation
     */
    async acceptInvitation(invitationId: string, userId: string): Promise<ClanMember> {
        const invitation = await this.clanInvitationRepository.findOne({
            where: { id: invitationId },
            relations: ['clan'],
        });

        if (!invitation) {
            throw new NotFoundException('Invitation', invitationId);
        }

        // Verify that the user is the invitee
        if (invitation.invitee_id !== userId) {
            throw new AuthorizationException('You can only accept invitations sent to you');
        }

        if (invitation.status !== ClanInvitationStatus.PENDING) {
            throw new ConflictException('Invitation has already been processed');
        }

        // Check if user is already in a clan
        const existingMembership = await this.clanMemberRepository.findOne({
            where: { user_id: userId },
        });

        if (existingMembership) {
            throw new ConflictException('You are already a member of a clan');
        }

        // Check member limit
        const clan = invitation.clan;
        if (clan.member_count >= clan.max_members) {
            throw new ConflictException('Clan has reached maximum member limit');
        }

        // Use transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update invitation status
            invitation.status = ClanInvitationStatus.ACCEPTED;
            await queryRunner.manager.save(invitation);

            // Create clan member
            const member = queryRunner.manager.create(ClanMember, {
                clan_id: invitation.clan_id,
                user_id: userId,
                role: ClanMemberRole.MEMBER,
            });

            const savedMember = await queryRunner.manager.save(member);

            // Update member count
            await queryRunner.manager.increment(
                Clan,
                { id: invitation.clan_id },
                'member_count',
                1,
            );

            await queryRunner.commitTransaction();

            this.logger.log(`User ${userId} joined clan ${invitation.clan_id}`);

            // Create activity for joining clan
            try {
                await this.socialFeedService.createActivity(
                    userId,
                    ActivityType.CLAN_JOINED,
                    {
                        clanId: invitation.clan.id,
                        clanName: invitation.clan.name,
                        clanTag: invitation.clan.tag,
                    },
                );
            } catch (error) {
                this.logger.error('Failed to create clan join activity', error);
            }

            return savedMember;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Reject a clan invitation
     */
    async rejectInvitation(invitationId: string, userId: string): Promise<void> {
        const invitation = await this.clanInvitationRepository.findOne({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new NotFoundException('Invitation', invitationId);
        }

        // Verify that the user is the invitee
        if (invitation.invitee_id !== userId) {
            throw new AuthorizationException('You can only reject invitations sent to you');
        }

        if (invitation.status !== ClanInvitationStatus.PENDING) {
            throw new ConflictException('Invitation has already been processed');
        }

        // Update invitation status
        invitation.status = ClanInvitationStatus.REJECTED;
        await this.clanInvitationRepository.save(invitation);

        this.logger.log(`User ${userId} rejected invitation ${invitationId}`);
    }

    /**
     * Remove a member from the clan
     */
    async removeMember(clanId: string, adminId: string, memberId: string): Promise<void> {
        // Check if admin has permission (co-leader or higher)
        const adminMember = await this.clanMemberRepository.findOne({
            where: { clan_id: clanId, user_id: adminId },
        });

        if (!adminMember || !this.hasPermission(adminMember.role, ClanMemberRole.CO_LEADER)) {
            throw new AuthorizationException('Only co-leaders and above can remove members');
        }

        // Check if member exists
        const member = await this.clanMemberRepository.findOne({
            where: { clan_id: clanId, user_id: memberId },
        });

        if (!member) {
            throw new NotFoundException('Member not found in this clan');
        }

        // Cannot remove the creator
        const clan = await this.clanRepository.findOne({
            where: { id: clanId },
        });

        if (clan && clan.creator_id === memberId) {
            throw new AuthorizationException('Cannot remove the clan creator');
        }

        // Use transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Remove member
            await queryRunner.manager.remove(member);

            // Update member count
            await queryRunner.manager.decrement(Clan, { id: clanId }, 'member_count', 1);

            await queryRunner.commitTransaction();

            this.logger.log(`User ${memberId} removed from clan ${clanId} by ${adminId}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Leave a clan
     */
    async leaveClan(clanId: string, userId: string): Promise<void> {
        const member = await this.clanMemberRepository.findOne({
            where: { clan_id: clanId, user_id: userId },
        });

        if (!member) {
            throw new NotFoundException('You are not a member of this clan');
        }

        // Check if user is the creator
        const clan = await this.clanRepository.findOne({
            where: { id: clanId },
        });

        if (clan && clan.creator_id === userId) {
            throw new AuthorizationException(
                'Clan creator cannot leave. Delete the clan instead.',
            );
        }

        // Use transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Remove member
            await queryRunner.manager.remove(member);

            // Update member count
            await queryRunner.manager.decrement(Clan, { id: clanId }, 'member_count', 1);

            await queryRunner.commitTransaction();

            this.logger.log(`User ${userId} left clan ${clanId}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get clan members
     */
    async getClanMembers(clanId: string): Promise<ClanMember[]> {
        const members = await this.clanMemberRepository.find({
            where: { clan_id: clanId },
            relations: ['user'],
            order: { joined_at: 'ASC' },
        });

        return members;
    }

    /**
     * Get clan statistics
     */
    async getClanStats(clanId: string): Promise<ClanStats> {
        const clan = await this.clanRepository.findOne({
            where: { id: clanId },
        });

        if (!clan) {
            throw new NotFoundException('Clan', clanId);
        }

        // Get all clan members
        const members = await this.clanMemberRepository.find({
            where: { clan_id: clanId },
            relations: ['user'],
        });

        // Calculate total matches (sum of all member matches)
        const totalMatches = members.reduce((sum, member) => {
            return sum + (member.user?.successful_matches || 0);
        }, 0);

        // Calculate average rating
        const ratingsSum = members.reduce((sum, member) => {
            return sum + (member.user?.rating_average || 0);
        }, 0);
        const averageRating =
            members.length > 0 ? Number((ratingsSum / members.length).toFixed(1)) : 0;

        // Get badges (placeholder - implement based on actual badge system)
        const badges: any[] = [];

        return {
            total_matches: totalMatches,
            average_rating: averageRating,
            badges,
        };
    }

    /**
     * Create a clan announcement
     */
    async createAnnouncement(
        clanId: string,
        userId: string,
        data: CreateAnnouncementDto,
    ): Promise<ClanAnnouncement> {
        // Check if user has permission (moderator or higher)
        const member = await this.clanMemberRepository.findOne({
            where: { clan_id: clanId, user_id: userId },
        });

        if (!member || !this.hasPermission(member.role, ClanMemberRole.MODERATOR)) {
            throw new AuthorizationException('Only moderators and above can create announcements');
        }

        // Validate content length
        if (data.content.length > 1000) {
            throw new ValidationException('Announcement content cannot exceed 1000 characters');
        }

        // Calculate expiration date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Create announcement
        const announcement = this.clanAnnouncementRepository.create({
            clan_id: clanId,
            author_id: userId,
            content: data.content,
            expires_at: expiresAt,
        });

        const savedAnnouncement = await this.clanAnnouncementRepository.save(announcement);

        // Send notifications to all clan members
        const members = await this.clanMemberRepository.find({
            where: { clan_id: clanId },
        });

        const clan = await this.clanRepository.findOne({
            where: { id: clanId },
        });

        for (const member of members) {
            if (member.user_id !== userId) {
                try {
                    await this.notificationsService.sendToUser(member.user_id, {
                        title: 'New Clan Announcement',
                        body: `New announcement in ${clan?.name}`,
                        url: `/clans/${clanId}`,
                    });
                } catch (error) {
                    this.logger.error(
                        `Failed to send announcement notification to ${member.user_id}`,
                        error,
                    );
                }
            }
        }

        this.logger.log(`Announcement created: ${savedAnnouncement.id} in clan ${clanId}`);

        return savedAnnouncement;
    }

    /**
     * Get clan announcements (non-expired only)
     */
    async getAnnouncements(clanId: string): Promise<ClanAnnouncement[]> {
        const now = new Date();

        const announcements = await this.clanAnnouncementRepository.find({
            where: {
                clan_id: clanId,
                expires_at: MoreThan(now),
            },
            relations: ['author'],
            order: { created_at: 'DESC' },
        });

        return announcements;
    }

    /**
     * Delete a clan announcement
     */
    async deleteAnnouncement(announcementId: string, userId: string): Promise<void> {
        const announcement = await this.clanAnnouncementRepository.findOne({
            where: { id: announcementId },
        });

        if (!announcement) {
            throw new NotFoundException('Announcement', announcementId);
        }

        // Check if user has permission (moderator or higher)
        const member = await this.clanMemberRepository.findOne({
            where: { clan_id: announcement.clan_id, user_id: userId },
        });

        if (!member || !this.hasPermission(member.role, ClanMemberRole.MODERATOR)) {
            throw new AuthorizationException('Only moderators and above can delete announcements');
        }

        await this.clanAnnouncementRepository.remove(announcement);

        this.logger.log(`Announcement deleted: ${announcementId} by user ${userId}`);
    }

    /**
     * Get clan leaderboard
     */
    async getClanLeaderboard(query: ClanLeaderboardQueryDto): Promise<ClanLeaderboardEntry[]> {
        const { gameType, limit = 100 } = query;

        // Get all clans with their members
        const clans = await this.clanRepository.find({
            relations: ['creator'],
            order: { created_at: 'DESC' },
        });

        // Calculate total matches for each clan
        const clanStats = await Promise.all(
            clans.map(async (clan) => {
                const members = await this.clanMemberRepository.find({
                    where: { clan_id: clan.id },
                    relations: ['user'],
                });

                // Calculate total matches
                // Note: If filtering by game type is needed, this logic needs to be adjusted
                const totalMatches = members.reduce((sum, member) => {
                    return sum + (member.user?.successful_matches || 0);
                }, 0);

                return {
                    clan_id: clan.id,
                    clan_name: clan.name,
                    member_count: clan.member_count,
                    total_matches: totalMatches,
                };
            }),
        );

        // Sort by total matches (descending), then by member count, then by name
        clanStats.sort((a, b) => {
            if (b.total_matches !== a.total_matches) {
                return b.total_matches - a.total_matches;
            }
            if (b.member_count !== a.member_count) {
                return b.member_count - a.member_count;
            }
            return a.clan_name.localeCompare(b.clan_name);
        });

        // Take top N clans
        const topClans = clanStats.slice(0, limit);

        // Add rank
        const leaderboard: ClanLeaderboardEntry[] = topClans.map((clan, index) => ({
            rank: index + 1,
            ...clan,
        }));

        this.logger.log(`📊 Leaderboard generated with ${leaderboard.length} clans`);
        return leaderboard;
    }

    /**
     * Check if user has required permission level
     */
    private hasPermission(userRole: ClanMemberRole, requiredRole: ClanMemberRole): boolean {
        const roleHierarchy = {
            [ClanMemberRole.LEADER]: 4,
            [ClanMemberRole.CO_LEADER]: 3,
            [ClanMemberRole.MODERATOR]: 2,
            [ClanMemberRole.MEMBER]: 1,
        };

        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    }

    /**
     * Change member role (only leader can do this)
     */
    async changeMemberRole(
        clanId: string,
        adminId: string,
        memberId: string,
        newRole: ClanMemberRole,
    ): Promise<ClanMember> {
        // Check if admin is leader
        const adminMember = await this.clanMemberRepository.findOne({
            where: { clan_id: clanId, user_id: adminId },
        });

        if (!adminMember || adminMember.role !== ClanMemberRole.LEADER) {
            throw new AuthorizationException('Only clan leader can change member roles');
        }

        // Get target member
        const targetMember = await this.clanMemberRepository.findOne({
            where: { clan_id: clanId, user_id: memberId },
            relations: ['user'],
        });

        if (!targetMember) {
            throw new NotFoundException('Member not found in this clan');
        }

        // Cannot change leader's role
        if (targetMember.role === ClanMemberRole.LEADER) {
            throw new AuthorizationException('Cannot change leader role');
        }

        // Cannot promote to leader
        if (newRole === ClanMemberRole.LEADER) {
            throw new AuthorizationException('Cannot promote member to leader');
        }

        // Update role
        targetMember.role = newRole;
        const updatedMember = await this.clanMemberRepository.save(targetMember);

        this.logger.log(`Member role changed: ${memberId} to ${newRole} in clan ${clanId}`);

        return updatedMember;
    }
}
