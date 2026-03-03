import { ActivityType } from '../../entities/activity.entity';

export class GameListingCreatedEvent {
    constructor(
        public readonly userId: string,
        public readonly listingId: string,
        public readonly listingData: {
            game: string;
            title: string;
            [key: string]: any;
        },
    ) { }
}

export class MatchCompletedEvent {
    constructor(
        public readonly userId: string,
        public readonly matchId: string,
        public readonly matchData: {
            game: string;
            opponent?: string;
            result?: string;
            [key: string]: any;
        },
    ) { }
}

export class BadgeEarnedEvent {
    constructor(
        public readonly userId: string,
        public readonly badgeData: {
            badgeType: string;
            badgeName: string;
            [key: string]: any;
        },
    ) { }
}

export class LevelUpEvent {
    constructor(
        public readonly userId: string,
        public readonly levelData: {
            oldLevel: number;
            newLevel: number;
            [key: string]: any;
        },
    ) { }
}

export class ClanJoinedEvent {
    constructor(
        public readonly userId: string,
        public readonly clanData: {
            clanId: string;
            clanName: string;
            [key: string]: any;
        },
    ) { }
}
