import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SocialFeedService } from '../social-feed.service';
import { ActivityType } from '../../entities/activity.entity';
import {
    GameListingCreatedEvent,
    MatchCompletedEvent,
    BadgeEarnedEvent,
    LevelUpEvent,
    ClanJoinedEvent,
} from '../events/activity.events';

@Injectable()
export class ActivityListener {
    private readonly logger = new Logger(ActivityListener.name);

    constructor(private readonly socialFeedService: SocialFeedService) { }

    /**
     * Handle game listing creation event
     */
    @OnEvent('game.listing.created')
    async handleGameListingCreated(event: GameListingCreatedEvent) {
        try {
            await this.socialFeedService.createActivity(
                event.userId,
                ActivityType.GAME_LISTING_CREATED,
                {
                    listingId: event.listingId,
                    ...event.listingData,
                },
            );
            this.logger.log(`Activity created for game listing: ${event.listingId}`);
        } catch (error) {
            this.logger.error('Failed to create activity for game listing', error);
        }
    }

    /**
     * Handle match completion event
     */
    @OnEvent('match.completed')
    async handleMatchCompleted(event: MatchCompletedEvent) {
        try {
            await this.socialFeedService.createActivity(
                event.userId,
                ActivityType.MATCH_COMPLETED,
                {
                    matchId: event.matchId,
                    ...event.matchData,
                },
            );
            this.logger.log(`Activity created for match completion: ${event.matchId}`);
        } catch (error) {
            this.logger.error('Failed to create activity for match completion', error);
        }
    }

    /**
     * Handle badge earned event
     */
    @OnEvent('badge.earned')
    async handleBadgeEarned(event: BadgeEarnedEvent) {
        try {
            await this.socialFeedService.createActivity(
                event.userId,
                ActivityType.BADGE_EARNED,
                event.badgeData,
            );
            this.logger.log(`Activity created for badge earned: ${event.badgeData.badgeType}`);
        } catch (error) {
            this.logger.error('Failed to create activity for badge earned', error);
        }
    }

    /**
     * Handle level up event
     */
    @OnEvent('user.level.up')
    async handleLevelUp(event: LevelUpEvent) {
        try {
            await this.socialFeedService.createActivity(
                event.userId,
                ActivityType.LEVEL_UP,
                event.levelData,
            );
            this.logger.log(`Activity created for level up: ${event.levelData.newLevel}`);
        } catch (error) {
            this.logger.error('Failed to create activity for level up', error);
        }
    }

    /**
     * Handle clan joined event
     */
    @OnEvent('clan.joined')
    async handleClanJoined(event: ClanJoinedEvent) {
        try {
            await this.socialFeedService.createActivity(
                event.userId,
                ActivityType.CLAN_JOINED,
                event.clanData,
            );
            this.logger.log(`Activity created for clan joined: ${event.clanData.clanId}`);
        } catch (error) {
            this.logger.error('Failed to create activity for clan joined', error);
        }
    }
}
