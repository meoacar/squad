# Integration Examples

This document provides concrete examples of how to integrate the Social Feed module with existing services.

## Example 1: Clan Service Integration

Update the Clan Service to create activities when users join clans:

```typescript
// backend/src/social/clan/clan.service.ts

import { Injectable } from '@nestjs/common';
import { SocialFeedService } from '../social-feed/social-feed.service';
import { ActivityType } from '../entities/activity.entity';

@Injectable()
export class ClanService {
  constructor(
    // ... existing dependencies
    private socialFeedService: SocialFeedService,
  ) {}

  async acceptInvitation(invitationId: string, userId: string): Promise<ClanMember> {
    // ... existing logic to accept invitation
    const member = await this.clanMemberRepository.save({
      clan_id: invitation.clan_id,
      user_id: userId,
      role: 'member',
    });

    // Get clan details
    const clan = await this.clanRepository.findOne({
      where: { id: invitation.clan_id },
    });

    // Create activity for social feed
    try {
      await this.socialFeedService.createActivity(
        userId,
        ActivityType.CLAN_JOINED,
        {
          clanId: clan.id,
          clanName: clan.name,
          clanAvatar: clan.avatar_url,
        }
      );
    } catch (error) {
      this.logger.error('Failed to create clan joined activity', error);
      // Don't fail the main operation
    }

    return member;
  }
}
```

Don't forget to update the ClanModule:

```typescript
// backend/src/social/clan/clan.module.ts

import { Module } from '@nestjs/common';
import { SocialFeedModule } from '../social-feed/social-feed.module';

@Module({
  imports: [
    // ... existing imports
    SocialFeedModule,
  ],
  // ...
})
export class ClanModule {}
```

## Example 2: Rating Service Integration

Update the Rating Service to create badge earned activities:

```typescript
// backend/src/social/rating/rating.service.ts

import { Injectable } from '@nestjs/common';
import { SocialFeedService } from '../social-feed/social-feed.service';
import { ActivityType } from '../entities/activity.entity';

@Injectable()
export class RatingService {
  constructor(
    // ... existing dependencies
    private socialFeedService: SocialFeedService,
  ) {}

  async updateTrustedPlayerBadge(userId: string): Promise<void> {
    const averageRating = await this.getAverageRating(userId);
    const ratingCount = await this.getRatingCount(userId);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const hadBadge = user.has_trusted_badge;

    // Award badge
    if (averageRating >= 4.5 && ratingCount >= 20 && !hadBadge) {
      await this.userRepository.update(userId, {
        has_trusted_badge: true,
      });

      // Create activity for badge earned
      try {
        await this.socialFeedService.createActivity(
          userId,
          ActivityType.BADGE_EARNED,
          {
            badgeType: 'TRUSTED_PLAYER',
            badgeName: 'Trusted Player',
            description: 'Earned by maintaining a 4.5+ rating with 20+ reviews',
            averageRating,
            ratingCount,
          }
        );
      } catch (error) {
        this.logger.error('Failed to create badge earned activity', error);
      }
    }

    // Remove badge
    if (averageRating < 4.3 && hadBadge) {
      await this.userRepository.update(userId, {
        has_trusted_badge: false,
      });
    }
  }
}
```

Update the RatingModule:

```typescript
// backend/src/social/rating/rating.module.ts

import { Module } from '@nestjs/common';
import { SocialFeedModule } from '../social-feed/social-feed.module';

@Module({
  imports: [
    // ... existing imports
    SocialFeedModule,
  ],
  // ...
})
export class RatingModule {}
```

## Example 3: Posts Service Integration (Game Listings)

Update the Posts Service to create activities when game listings are created:

```typescript
// backend/src/posts/posts.service.ts

import { Injectable } from '@nestjs/common';
import { SocialFeedService } from '../social/social-feed/social-feed.service';
import { ActivityType } from '../social/entities/activity.entity';

@Injectable()
export class PostsService {
  constructor(
    // ... existing dependencies
    private socialFeedService: SocialFeedService,
  ) {}

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    // ... existing logic to create post
    const post = await this.postRepository.save({
      userId,
      ...createPostDto,
    });

    // Create activity for social feed
    try {
      await this.socialFeedService.createActivity(
        userId,
        ActivityType.GAME_LISTING_CREATED,
        {
          listingId: post.id,
          game: post.game,
          title: post.title,
          gameMode: post.gameMode,
          platform: post.platform,
          region: post.region,
        }
      );
    } catch (error) {
      this.logger.error('Failed to create game listing activity', error);
      // Don't fail the main operation
    }

    return post;
  }
}
```

Update the PostsModule:

```typescript
// backend/src/posts/posts.module.ts

import { Module } from '@nestjs/common';
import { SocialFeedModule } from '../social/social-feed/social-feed.module';

@Module({
  imports: [
    // ... existing imports
    SocialFeedModule,
  ],
  // ...
})
export class PostsModule {}
```

## Example 4: Applications Service Integration (Match Completion)

Update the Applications Service to create activities when matches are completed:

```typescript
// backend/src/applications/applications.service.ts

import { Injectable } from '@nestjs/common';
import { SocialFeedService } from '../social/social-feed/social-feed.service';
import { ActivityType } from '../social/entities/activity.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    // ... existing dependencies
    private socialFeedService: SocialFeedService,
  ) {}

  async completeMatch(applicationId: string, userId: string): Promise<Application> {
    // ... existing logic to complete match
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['post', 'user'],
    });

    application.status = 'completed';
    await this.applicationRepository.save(application);

    // Create activity for both users (post owner and applicant)
    const participants = [application.post.userId, application.user.id];

    for (const participantId of participants) {
      try {
        await this.socialFeedService.createActivity(
          participantId,
          ActivityType.MATCH_COMPLETED,
          {
            matchId: application.id,
            game: application.post.game,
            gameMode: application.post.gameMode,
            platform: application.post.platform,
            completedAt: new Date().toISOString(),
          }
        );
      } catch (error) {
        this.logger.error(`Failed to create match completed activity for user ${participantId}`, error);
      }
    }

    return application;
  }
}
```

Update the ApplicationsModule:

```typescript
// backend/src/applications/applications.module.ts

import { Module } from '@nestjs/common';
import { SocialFeedModule } from '../social/social-feed/social-feed.module';

@Module({
  imports: [
    // ... existing imports
    SocialFeedModule,
  ],
  // ...
})
export class ApplicationsModule {}
```

## Example 5: Users Service Integration (Level Up)

If you have a leveling system in the Users Service:

```typescript
// backend/src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { SocialFeedService } from '../social/social-feed/social-feed.service';
import { ActivityType } from '../social/entities/activity.entity';

@Injectable()
export class UsersService {
  constructor(
    // ... existing dependencies
    private socialFeedService: SocialFeedService,
  ) {}

  async addExperience(userId: string, amount: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const oldLevel = user.level;
    
    user.experience += amount;
    
    // Calculate new level (example logic)
    const newLevel = Math.floor(user.experience / 1000) + 1;
    
    if (newLevel > oldLevel) {
      user.level = newLevel;
      
      // Create level up activity
      try {
        await this.socialFeedService.createActivity(
          userId,
          ActivityType.LEVEL_UP,
          {
            oldLevel,
            newLevel,
            experience: user.experience,
          }
        );
      } catch (error) {
        this.logger.error('Failed to create level up activity', error);
      }
    }
    
    await this.userRepository.save(user);
  }
}
```

Update the UsersModule:

```typescript
// backend/src/users/users.module.ts

import { Module } from '@nestjs/common';
import { SocialFeedModule } from '../social/social-feed/social-feed.module';

@Module({
  imports: [
    // ... existing imports
    SocialFeedModule,
  ],
  // ...
})
export class UsersModule {}
```

## Best Practices

1. **Error Handling**: Always wrap activity creation in try-catch blocks to prevent failures from affecting the main operation
2. **Logging**: Log errors when activity creation fails for debugging purposes
3. **Data Structure**: Include relevant data in the activity that will be useful for displaying in the feed
4. **Performance**: Activity creation is async and should not block the main operation
5. **Testing**: Test both successful activity creation and failure scenarios

## Testing Integration

Example test for clan service integration:

```typescript
describe('ClanService - Social Feed Integration', () => {
  it('should create activity when user joins clan', async () => {
    const user = await createTestUser();
    const clan = await createTestClan();
    const invitation = await clanService.inviteMember(clan.id, clan.creator_id, user.id);
    
    await clanService.acceptInvitation(invitation.id, user.id);
    
    // Verify activity was created
    const activities = await socialFeedService.getUserActivities(user.id, { page: 1, limit: 10 });
    expect(activities.data).toHaveLength(1);
    expect(activities.data[0].type).toBe(ActivityType.CLAN_JOINED);
    expect(activities.data[0].data.clanId).toBe(clan.id);
  });
});
```
