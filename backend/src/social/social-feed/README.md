# Social Feed Module

This module handles the social feed system, including activity creation, likes, comments, and automatic activity generation through event listeners.

## Features

- User feed (activities from followed users)
- User activities timeline
- Activity interactions (likes, comments)
- Automatic activity creation through events (requires setup)

## Installation Requirements

To enable automatic activity creation through events, you need to install the NestJS Event Emitter package:

```bash
npm install @nestjs/event-emitter
```

Then update `backend/src/social/social-feed/social-feed.module.ts` to include:

```typescript
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ActivityListener } from './listeners/activity.listener';

@Module({
  imports: [
    // ... other imports
    EventEmitterModule.forRoot(),
  ],
  providers: [SocialFeedService, ActivityListener],
  // ...
})
```

Also update `backend/src/app.module.ts` to include EventEmitterModule globally:

```typescript
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    // ... other imports
    EventEmitterModule.forRoot(),
    // ...
  ],
})
```

## Event System

The Social Feed module listens to various events and automatically creates activities. To trigger activity creation from other modules, emit the following events:

### Game Listing Created

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameListingCreatedEvent } from '../social/social-feed/events/activity.events';

// In your service
constructor(private eventEmitter: EventEmitter2) {}

// When a game listing is created
this.eventEmitter.emit(
  'game.listing.created',
  new GameListingCreatedEvent(userId, listingId, {
    game: 'PUBG',
    title: 'Looking for squad',
    // ... other listing data
  })
);
```

### Match Completed

```typescript
import { MatchCompletedEvent } from '../social/social-feed/events/activity.events';

this.eventEmitter.emit(
  'match.completed',
  new MatchCompletedEvent(userId, matchId, {
    game: 'PUBG',
    opponent: 'PlayerName',
    result: 'win',
    // ... other match data
  })
);
```

### Badge Earned

```typescript
import { BadgeEarnedEvent } from '../social/social-feed/events/activity.events';

this.eventEmitter.emit(
  'badge.earned',
  new BadgeEarnedEvent(userId, {
    badgeType: 'TRUSTED_PLAYER',
    badgeName: 'Trusted Player',
    // ... other badge data
  })
);
```

### Level Up

```typescript
import { LevelUpEvent } from '../social/social-feed/events/activity.events';

this.eventEmitter.emit(
  'user.level.up',
  new LevelUpEvent(userId, {
    oldLevel: 5,
    newLevel: 6,
    // ... other level data
  })
);
```

### Clan Joined

```typescript
import { ClanJoinedEvent } from '../social/social-feed/events/activity.events';

this.eventEmitter.emit(
  'clan.joined',
  new ClanJoinedEvent(userId, {
    clanId: 'clan-uuid',
    clanName: 'Elite Squad',
    // ... other clan data
  })
);
```

## API Endpoints

### Get User Feed
```
GET /social-feed/feed?page=1&limit=20
```
Returns activities from users that the authenticated user follows.

### Get User Activities
```
GET /social-feed/activities/:userId?page=1&limit=20
```
Returns activities for a specific user.

### Create Activity (Manual)
```
POST /social-feed/activities
Body: {
  "type": "GAME_LISTING_CREATED",
  "data": { ... }
}
```

### Like Activity
```
POST /social-feed/activities/:activityId/like
```
Toggle like on an activity (like if not liked, unlike if already liked).

### Unlike Activity
```
DELETE /social-feed/activities/:activityId/like
```
Remove like from an activity.

### Comment on Activity
```
POST /social-feed/activities/:activityId/comments
Body: {
  "content": "Great game!"
}
```

### Delete Comment
```
DELETE /social-feed/comments/:commentId
```
Only the comment owner can delete their comment.

### Get Activity Likes Count
```
GET /social-feed/activities/:activityId/likes/count
```

### Get Activity Comments
```
GET /social-feed/activities/:activityId/comments?page=1&limit=20
```

### Check if User Liked Activity
```
GET /social-feed/activities/:activityId/likes/check
```

## Integration with Other Modules

### Option 1: Using Event Emitter (Recommended)

To integrate the Social Feed module with other modules using events:

1. Install `@nestjs/event-emitter` package
2. Import `EventEmitterModule` in your module (if not already imported globally)
3. Inject `EventEmitter2` in your service
4. Emit the appropriate event when an action occurs

Example in PostsService:

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameListingCreatedEvent } from '../social/social-feed/events/activity.events';

@Injectable()
export class PostsService {
  constructor(
    private eventEmitter: EventEmitter2,
    // ... other dependencies
  ) {}

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const post = await this.postRepository.save({
      userId,
      ...createPostDto,
    });

    // Emit event for social feed
    this.eventEmitter.emit(
      'game.listing.created',
      new GameListingCreatedEvent(userId, post.id, {
        game: post.game,
        title: post.title,
      })
    );

    return post;
  }
}
```

### Option 2: Direct Service Call (Without Event Emitter)

If you don't want to use the event emitter, you can directly call the SocialFeedService:

1. Import `SocialFeedModule` in your module
2. Inject `SocialFeedService` in your service
3. Call `createActivity` method directly

Example in PostsService:

```typescript
import { SocialFeedService } from '../social/social-feed/social-feed.service';
import { ActivityType } from '../social/entities/activity.entity';

@Injectable()
export class PostsService {
  constructor(
    private socialFeedService: SocialFeedService,
    // ... other dependencies
  ) {}

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const post = await this.postRepository.save({
      userId,
      ...createPostDto,
    });

    // Create activity directly
    try {
      await this.socialFeedService.createActivity(
        userId,
        ActivityType.GAME_LISTING_CREATED,
        {
          listingId: post.id,
          game: post.game,
          title: post.title,
        }
      );
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to create activity', error);
    }

    return post;
  }
}
```

In your module:

```typescript
import { SocialFeedModule } from '../social/social-feed/social-feed.module';

@Module({
  imports: [
    // ... other imports
    SocialFeedModule,
  ],
  // ...
})
export class PostsModule {}
```

## Notes

- Activities are automatically filtered to show only those from the last 30 days
- Feed shows activities only from users that the authenticated user follows
- Notifications are sent when activities are liked or commented on
- Event listeners handle errors gracefully and log failures without breaking the main flow
