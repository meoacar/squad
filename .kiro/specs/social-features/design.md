# Design Document: Social Features

## Overview

Bu tasarım belgesi, oyun platformu için sosyal etkileşim özelliklerinin teknik mimarisini tanımlar. Sistem, kullanıcıların birbirlerini takip etmesini, mesajlaşmasını, değerlendirmesini, clan oluşturmasını ve sosyal aktiviteleri takip etmesini sağlayan kapsamlı bir sosyal platform sunar.

Temel özellikler:
- Kullanıcı takip sistemi (follow/unfollow)
- Direkt mesajlaşma ve grup sohbetleri
- Kullanıcı değerlendirme ve güvenilir oyuncu rozetleri
- Clan oluşturma, yönetimi ve sıralama
- Sosyal feed ve aktivite takibi
- Bildirim sistemi
- Gizlilik kontrolleri
- İçerik moderasyonu

## Architecture

### Sistem Mimarisi

Sosyal özellikler, mevcut NestJS backend ve Next.js frontend üzerine inşa edilecek modüler bir mimari kullanır:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Social  │  │   Clan   │  │ Messages │  │  Profile │   │
│  │   Feed   │  │  Pages   │  │   UI     │  │  Pages   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    REST API / WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Follow  │  │ Message  │  │  Rating  │  │   Clan   │   │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Social  │  │  Privacy │  │Notification│ │Moderation│   │
│  │   Feed   │  │  Module  │  │  Module  │  │  Module  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐      ┌──────▼──────┐
        │   PostgreSQL   │      │    Redis    │
        │   (Primary DB) │      │   (Cache)   │
        └────────────────┘      └─────────────┘
```

### Teknoloji Stack

**Backend:**
- NestJS (Framework)
- TypeORM (ORM)
- PostgreSQL (Primary Database)
- Redis (Caching & Real-time)
- Bull (Job Queue)
- WebSocket (Real-time messaging)

**Frontend:**
- Next.js 14 (Framework)
- React 18 (UI Library)
- Zustand (State Management)
- TanStack Query (Data Fetching)
- Tailwind CSS (Styling)

### Modül Yapısı

Her sosyal özellik bağımsız bir NestJS modülü olarak organize edilir:

1. **FollowModule**: Takip ilişkilerini yönetir
2. **MessageModule**: Direkt ve grup mesajlaşmayı yönetir
3. **RatingModule**: Kullanıcı değerlendirmelerini yönetir
4. **ClanModule**: Clan oluşturma ve yönetimini sağlar
5. **SocialFeedModule**: Aktivite akışını yönetir
6. **PrivacyModule**: Gizlilik ayarlarını yönetir
7. **ModerationModule**: İçerik moderasyonunu sağlar

## Components and Interfaces

### 1. Follow System

#### FollowService
```typescript
interface FollowService {
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  
  // Follow queries
  getFollowers(userId: string, pagination: PaginationDto): Promise<PaginatedResult<User>>;
  getFollowing(userId: string, pagination: PaginationDto): Promise<PaginatedResult<User>>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  
  // Follow requests (for private profiles)
  sendFollowRequest(followerId: string, followingId: string): Promise<FollowRequest>;
  approveFollowRequest(requestId: string): Promise<Follow>;
  rejectFollowRequest(requestId: string): Promise<void>;
  getPendingFollowRequests(userId: string): Promise<FollowRequest[]>;
}
```

#### Follow Entity
```typescript
interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: Date;
}

interface FollowRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}
```

### 2. Message System

#### MessageService
```typescript
interface MessageService {
  // Direct messages
  sendDirectMessage(senderId: string, recipientId: string, content: string): Promise<Message>;
  getDirectMessages(userId: string, otherUserId: string, pagination: PaginationDto): Promise<PaginatedResult<Message>>;
  getConversations(userId: string): Promise<Conversation[]>;
  
  // Group chat
  sendGroupMessage(senderId: string, groupId: string, content: string): Promise<Message>;
  getGroupMessages(groupId: string, pagination: PaginationDto): Promise<PaginatedResult<Message>>;
  deleteGroupMessage(messageId: string, userId: string): Promise<void>;
  
  // Message status
  markAsRead(messageId: string, userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}
```

#### Message Entities
```typescript
interface Message {
  id: string;
  sender_id: string;
  content: string;
  message_type: 'direct' | 'group';
  conversation_id?: string;
  group_id?: string;
  created_at: Date;
  edited_at?: Date;
  deleted_at?: Date;
}

interface Conversation {
  id: string;
  participant_ids: string[];
  last_message_id?: string;
  last_message_at?: Date;
  created_at: Date;
}

interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: Date;
}
```

### 3. Rating System

#### RatingService
```typescript
interface RatingService {
  // Rating operations
  rateUser(raterId: string, ratedUserId: string, matchId: string, rating: number, comment?: string): Promise<Rating>;
  canRateUser(raterId: string, ratedUserId: string, matchId: string): Promise<boolean>;
  
  // Rating queries
  getUserRatings(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Rating>>;
  getAverageRating(userId: string): Promise<number>;
  getRatingCount(userId: string): Promise<number>;
  
  // Badge management
  updateTrustedPlayerBadge(userId: string): Promise<void>;
  hasTrustedPlayerBadge(userId: string): Promise<boolean>;
  
  // Comment moderation
  flagComment(commentId: string, reason: string): Promise<void>;
  reportComment(commentId: string, reporterId: string, reason: string): Promise<void>;
  hideComment(commentId: string): Promise<void>;
  deleteComment(commentId: string): Promise<void>;
}
```

#### Rating Entities
```typescript
interface Rating {
  id: string;
  rater_id: string;
  rated_user_id: string;
  match_id: string;
  rating: number; // 1-5
  comment?: string;
  is_hidden: boolean;
  flag_count: number;
  created_at: Date;
}

interface RatingReport {
  id: string;
  rating_id: string;
  reporter_id: string;
  reason: string;
  created_at: Date;
}
```

### 4. Clan System

#### ClanService
```typescript
interface ClanService {
  // Clan operations
  createClan(creatorId: string, data: CreateClanDto): Promise<Clan>;
  updateClan(clanId: string, userId: string, data: UpdateClanDto): Promise<Clan>;
  deleteClan(clanId: string, userId: string): Promise<void>;
  
  // Member management
  inviteMember(clanId: string, inviterId: string, inviteeId: string): Promise<ClanInvitation>;
  acceptInvitation(invitationId: string, userId: string): Promise<ClanMember>;
  rejectInvitation(invitationId: string, userId: string): Promise<void>;
  removeMember(clanId: string, adminId: string, memberId: string): Promise<void>;
  leaveClan(clanId: string, userId: string): Promise<void>;
  
  // Clan queries
  getClan(clanId: string): Promise<Clan>;
  getClanMembers(clanId: string): Promise<ClanMember[]>;
  getUserClan(userId: string): Promise<Clan | null>;
  getClanStats(clanId: string): Promise<ClanStats>;
  
  // Announcements
  createAnnouncement(clanId: string, userId: string, content: string): Promise<ClanAnnouncement>;
  getAnnouncements(clanId: string): Promise<ClanAnnouncement[]>;
  deleteAnnouncement(announcementId: string, userId: string): Promise<void>;
  
  // Leaderboard
  getClanLeaderboard(gameType?: string, limit?: number): Promise<ClanLeaderboardEntry[]>;
}
```

#### Clan Entities
```typescript
interface Clan {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  creator_id: string;
  member_count: number;
  max_members: number; // 50
  created_at: Date;
  updated_at: Date;
}

interface ClanMember {
  id: string;
  clan_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: Date;
}

interface ClanInvitation {
  id: string;
  clan_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

interface ClanAnnouncement {
  id: string;
  clan_id: string;
  author_id: string;
  content: string;
  created_at: Date;
  expires_at: Date; // 30 days after creation
}

interface ClanStats {
  total_matches: number;
  average_rating: number;
  badges: Badge[];
}

interface ClanLeaderboardEntry {
  rank: number;
  clan_id: string;
  clan_name: string;
  member_count: number;
  total_matches: number;
}
```

### 5. Social Feed System

#### SocialFeedService
```typescript
interface SocialFeedService {
  // Activity creation
  createActivity(userId: string, type: ActivityType, data: any): Promise<Activity>;
  
  // Feed queries
  getUserFeed(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Activity>>;
  getUserActivities(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Activity>>;
  
  // Interactions
  likeActivity(activityId: string, userId: string): Promise<ActivityLike>;
  unlikeActivity(activityId: string, userId: string): Promise<void>;
  commentOnActivity(activityId: string, userId: string, content: string): Promise<ActivityComment>;
  deleteComment(commentId: string, userId: string): Promise<void>;
  
  // Interaction queries
  getActivityLikes(activityId: string): Promise<number>;
  getActivityComments(activityId: string, pagination: PaginationDto): Promise<PaginatedResult<ActivityComment>>;
  hasUserLiked(activityId: string, userId: string): Promise<boolean>;
}
```

#### Social Feed Entities
```typescript
enum ActivityType {
  GAME_LISTING_CREATED = 'GAME_LISTING_CREATED',
  MATCH_COMPLETED = 'MATCH_COMPLETED',
  BADGE_EARNED = 'BADGE_EARNED',
  LEVEL_UP = 'LEVEL_UP',
  CLAN_JOINED = 'CLAN_JOINED',
}

interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  data: Record<string, any>;
  like_count: number;
  comment_count: number;
  created_at: Date;
}

interface ActivityLike {
  id: string;
  activity_id: string;
  user_id: string;
  created_at: Date;
}

interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: Date;
}
```

### 6. Privacy System

#### PrivacyService
```typescript
interface PrivacyService {
  // Profile visibility
  setProfileVisibility(userId: string, visibility: 'public' | 'private'): Promise<void>;
  getProfileVisibility(userId: string): Promise<'public' | 'private'>;
  
  // Rating visibility
  setRatingVisibility(userId: string, isHidden: boolean): Promise<void>;
  canViewRating(viewerId: string, targetUserId: string): Promise<boolean>;
  
  // Blocking
  blockUser(blockerId: string, blockedId: string): Promise<Block>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  isBlocked(userId: string, otherUserId: string): Promise<boolean>;
  getBlockedUsers(userId: string): Promise<User[]>;
  
  // Notification preferences
  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
  getNotificationPreferences(userId: string): Promise<NotificationPreferences>;
}
```

#### Privacy Entities
```typescript
interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: Date;
}

interface NotificationPreferences {
  email_messages: boolean;
  email_follow: boolean;
  email_clan_invites: boolean;
  email_activity_interactions: boolean;
  push_messages: boolean;
  push_follow: boolean;
  push_clan_invites: boolean;
  push_activity_interactions: boolean;
}
```

### 7. Notification System Enhancement

Mevcut notification sistemine yeni notification tipleri eklenecek:

```typescript
enum NotificationType {
  // Existing
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
  APPLICATION_ACCEPTED = 'APPLICATION_ACCEPTED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  POST_BOOSTED = 'POST_BOOSTED',
  PREMIUM_EXPIRING = 'PREMIUM_EXPIRING',
  POST_EXPIRING = 'POST_EXPIRING',
  
  // New social notifications
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  FOLLOW_REQUEST = 'FOLLOW_REQUEST',
  FOLLOW_REQUEST_ACCEPTED = 'FOLLOW_REQUEST_ACCEPTED',
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
  GROUP_MESSAGE = 'GROUP_MESSAGE',
  CLAN_INVITATION = 'CLAN_INVITATION',
  CLAN_ANNOUNCEMENT = 'CLAN_ANNOUNCEMENT',
  ACTIVITY_LIKED = 'ACTIVITY_LIKED',
  ACTIVITY_COMMENTED = 'ACTIVITY_COMMENTED',
  NEW_RATING = 'NEW_RATING',
  BADGE_EARNED = 'BADGE_EARNED',
}
```

## Data Models

### Database Schema

#### Follow Tables
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

CREATE TABLE follow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, target_id),
  CHECK (requester_id != target_id)
);

CREATE INDEX idx_follow_requests_target ON follow_requests(target_id, status);
```

#### Message Tables
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  last_message_id UUID,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN(participant_ids);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES clans(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP,
  CHECK (LENGTH(content) <= 2000)
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_group ON messages(group_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_reads_user ON message_reads(user_id, read_at DESC);
```

#### Rating Tables
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  flag_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(rater_id, rated_user_id, match_id),
  CHECK (rater_id != rated_user_id),
  CHECK (comment IS NULL OR LENGTH(comment) <= 500)
);

CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id, created_at DESC);
CREATE INDEX idx_ratings_rater ON ratings(rater_id);
CREATE INDEX idx_ratings_match ON ratings(match_id);
CREATE INDEX idx_ratings_hidden ON ratings(is_hidden);

CREATE TABLE rating_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(rating_id, reporter_id)
);

CREATE INDEX idx_rating_reports_rating ON rating_reports(rating_id);
```

#### Clan Tables
```sql
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  avatar_url VARCHAR(255),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_count INTEGER NOT NULL DEFAULT 1,
  max_members INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 30)
);

CREATE INDEX idx_clans_name ON clans(name);
CREATE INDEX idx_clans_creator ON clans(creator_id);

CREATE TABLE clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(clan_id, user_id)
);

CREATE INDEX idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX idx_clan_members_user ON clan_members(user_id);

CREATE TABLE clan_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(clan_id, invitee_id, status) WHERE status = 'pending'
);

CREATE INDEX idx_clan_invitations_invitee ON clan_invitations(invitee_id, status);

CREATE TABLE clan_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  CHECK (LENGTH(content) <= 1000)
);

CREATE INDEX idx_clan_announcements_clan ON clan_announcements(clan_id, created_at DESC);
CREATE INDEX idx_clan_announcements_expires ON clan_announcements(expires_at);
```

#### Social Feed Tables
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);

CREATE TABLE activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

CREATE INDEX idx_activity_likes_activity ON activity_likes(activity_id);
CREATE INDEX idx_activity_likes_user ON activity_likes(user_id);

CREATE TABLE activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (LENGTH(content) <= 500)
);

CREATE INDEX idx_activity_comments_activity ON activity_comments(activity_id, created_at ASC);
CREATE INDEX idx_activity_comments_user ON activity_comments(user_id);
```

#### Privacy Tables
```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_messages BOOLEAN NOT NULL DEFAULT TRUE,
  email_follow BOOLEAN NOT NULL DEFAULT TRUE,
  email_clan_invites BOOLEAN NOT NULL DEFAULT TRUE,
  email_activity_interactions BOOLEAN NOT NULL DEFAULT TRUE,
  push_messages BOOLEAN NOT NULL DEFAULT TRUE,
  push_follow BOOLEAN NOT NULL DEFAULT TRUE,
  push_clan_invites BOOLEAN NOT NULL DEFAULT TRUE,
  push_activity_interactions BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### User Entity Updates
```sql
-- Add new fields to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_average DECIMAL(2,1) DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_trusted_badge BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

CREATE INDEX idx_users_rating_average ON users(rating_average);
CREATE INDEX idx_users_trusted_badge ON users(has_trusted_badge);
```

### Data Relationships

```
User (1) ──< (N) Follow
User (1) ──< (N) FollowRequest
User (1) ──< (N) Message
User (1) ──< (N) Rating
User (1) ──< (N) ClanMember
User (1) ──< (N) Activity
User (1) ──< (N) Block

Clan (1) ──< (N) ClanMember
Clan (1) ──< (N) ClanInvitation
Clan (1) ──< (N) ClanAnnouncement
Clan (1) ──< (N) Message (group chat)

Activity (1) ──< (N) ActivityLike
Activity (1) ──< (N) ActivityComment

Rating (1) ──< (N) RatingReport

Conversation (1) ──< (N) Message
Message (1) ──< (N) MessageRead
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, the following redundancies were identified and consolidated:

- Properties 1.4 and 1.5 (follower/following counts) can be combined into a single property about relationship counting
- Properties 6.3 and 6.4 (badge display) can be combined into a single property about badge visibility
- Properties 8.1, 8.2, 8.5 (clan profile data display) can be combined into a single property about required data presence
- Properties 11.1-11.5 (activity creation for different events) can be combined into a single property about activity generation
- Properties 13.1 and 13.2 (message notifications) can be combined into a single property about notification creation

### Follow System Properties

#### Property 1: Follow Relationship Creation
*For any* two distinct users A and B, when A follows B, the system should create a follow relationship where A appears in B's followers list and B appears in A's following list.

**Validates: Requirements 1.1**

#### Property 2: Duplicate Follow Prevention
*For any* user A attempting to follow user B where a follow relationship already exists, the system should reject the request and return an error.

**Validates: Requirements 1.3**

#### Property 3: Follow Relationship Counting
*For any* user, the follower count should equal the number of users following them, and the following count should equal the number of users they follow.

**Validates: Requirements 1.4, 1.5**

#### Property 4: Unfollow Restores State
*For any* two users A and B, if A follows B and then unfollows B, the follow relationship should be removed and both users' counts should be updated accordingly.

**Validates: Requirements 1.6**

### Social Feed Properties

#### Property 5: Feed Visibility Filtering
*For any* user viewing their feed, all displayed listings should be from users they follow, and no listings from non-followed users should appear.

**Validates: Requirements 2.3, 11.8**

#### Property 6: Chronological Ordering
*For any* feed or activity list, items should be ordered in reverse chronological order (newest first).

**Validates: Requirements 2.2, 11.6, 12.5**

#### Property 7: Feed Item Timestamp Presence
*For any* feed item, it should include a timestamp indicating when it was created.

**Validates: Requirements 2.4**

#### Property 8: Time-Based Filtering
*For any* feed or announcement list, only items created within the specified time window (30 days for activities, 30 days for announcements) should be displayed.

**Validates: Requirements 10.4, 11.7**

### Message System Properties

#### Property 9: Match-Based Messaging Enablement
*For any* accepted match, direct messaging should be enabled between all participants.

**Validates: Requirements 3.1**

#### Property 10: Block Prevents Messaging
*For any* two users A and B, if A blocks B, then neither A nor B should be able to send direct messages to each other.

**Validates: Requirements 3.4**

#### Property 11: Message Length Validation
*For any* message submission, messages with content length up to 2000 characters should be accepted, and messages exceeding 2000 characters should be rejected.

**Validates: Requirements 3.5**

#### Property 12: Message Notification Creation
*For any* message sent (direct or group), the system should create a notification for the recipient(s).

**Validates: Requirements 3.6, 13.1, 13.2**

#### Property 13: Clan Group Chat Access
*For any* clan, all current members should have access to the clan's group chat, and non-members should not have access.

**Validates: Requirements 4.1, 4.2**

#### Property 14: Clan Membership Access Round Trip
*For any* user joining and then leaving a clan, their group chat access should be granted upon joining and revoked upon leaving.

**Validates: Requirements 4.3**

#### Property 15: Group Chat Size Limit
*For any* clan, the group chat should support up to 50 participants, and attempts to add more should be rejected.

**Validates: Requirements 4.4**

#### Property 16: Admin Message Deletion Permission
*For any* clan with group chat messages, users with admin privileges should be able to delete any message, while non-admin members should not be able to delete others' messages.

**Validates: Requirements 4.6**

### Rating System Properties

#### Property 17: One Rating Per Match
*For any* completed match, each participant should be able to rate other participants exactly once per match.

**Validates: Requirements 5.1**

#### Property 18: Rating Value Validation
*For any* rating submission, ratings with values between 1 and 5 (inclusive) should be accepted, and ratings outside this range should be rejected.

**Validates: Requirements 5.2**

#### Property 19: Comment Length Validation
*For any* rating with a comment, comments up to 500 characters should be accepted, and comments exceeding 500 characters should be rejected.

**Validates: Requirements 5.3**

#### Property 20: Average Rating Calculation
*For any* user with ratings, the displayed average rating should equal the arithmetic mean of all received ratings, rounded to one decimal place.

**Validates: Requirements 5.5, 5.6**

#### Property 21: Rating Data Display
*For any* user profile view, the system should display the user's average rating and total number of ratings received.

**Validates: Requirements 5.7**

#### Property 22: Trusted Badge Award Threshold
*For any* user with an average rating of 4.5 or higher and at least 20 ratings, the system should award a Trusted Player Badge.

**Validates: Requirements 6.1**

#### Property 23: Trusted Badge Removal Threshold
*For any* user with a Trusted Player Badge whose average rating falls below 4.3, the system should remove the badge.

**Validates: Requirements 6.2**

#### Property 24: Badge Visibility
*For any* user with a Trusted Player Badge, the badge should be displayed on their profile and next to their name in game listings.

**Validates: Requirements 6.3, 6.4**

#### Property 25: Comment Profanity Flagging
*For any* rating comment containing profanity or offensive language, the system should automatically flag it.

**Validates: Requirements 15.1**

#### Property 26: Flagged Comment Visibility
*For any* flagged rating comment, it should be hidden from public view pending review.

**Validates: Requirements 15.2**

#### Property 27: Report Threshold Auto-Hide
*For any* rating comment that receives 3 or more reports, the system should automatically hide it pending review.

**Validates: Requirements 15.4**

### Clan System Properties

#### Property 28: Clan Name Validation
*For any* clan creation attempt, clan names between 3 and 30 characters should be accepted, names outside this range should be rejected, and duplicate names should be rejected.

**Validates: Requirements 7.1**

#### Property 29: Clan Member Limit
*For any* clan, it should support up to 50 members, and attempts to add members beyond this limit should be rejected.

**Validates: Requirements 7.2**

#### Property 30: Creator Admin Assignment
*For any* newly created clan, the creator should automatically be assigned as the clan admin.

**Validates: Requirements 7.3**

#### Property 31: Admin Invitation Permission
*For any* clan, users with admin privileges should be able to invite other users, while non-admin members should not have this permission.

**Validates: Requirements 7.4**

#### Property 32: Admin Removal Permission
*For any* clan, users with admin privileges should be able to remove members, while non-admin members should not have this permission.

**Validates: Requirements 7.5**

#### Property 33: Invitation Notification
*For any* clan invitation sent, the system should create a notification for the invitee.

**Validates: Requirements 7.6**

#### Property 34: Invitation Acceptance Membership
*For any* accepted clan invitation, the invitee should be added as a member of the clan.

**Validates: Requirements 7.7**

#### Property 35: Clan Profile Required Data
*For any* clan profile view, the system should display the clan name, description, creation date, member list, and any earned badges.

**Validates: Requirements 8.1, 8.2, 8.5**

#### Property 36: Clan Statistics Aggregation
*For any* clan, the displayed total matches should equal the sum of all matches completed by clan members, and the average rating should equal the mean of all member ratings.

**Validates: Requirements 8.3, 8.4**

#### Property 37: Announcement Chronological Display
*For any* clan with announcements, they should be displayed in reverse chronological order.

**Validates: Requirements 8.6**

#### Property 38: Leaderboard Ranking
*For any* clan leaderboard, clans should be ranked by total completed matches in descending order.

**Validates: Requirements 9.1**

#### Property 39: Leaderboard Size Limit
*For any* leaderboard query, the system should return at most the top 100 clans.

**Validates: Requirements 9.2**

#### Property 40: Leaderboard Data Display
*For any* leaderboard entry, it should display the clan's rank, name, member count, and total matches.

**Validates: Requirements 9.4**

#### Property 41: Leaderboard Game Type Filtering
*For any* leaderboard query with a game type filter, only clans with matches in that game type should be included in the results.

**Validates: Requirements 9.5**

#### Property 42: Admin Announcement Permission
*For any* clan, users with admin privileges should be able to create announcements, while non-admin members should not have this permission.

**Validates: Requirements 10.1**

#### Property 43: Announcement Length Validation
*For any* announcement submission, announcements up to 1000 characters should be accepted, and announcements exceeding 1000 characters should be rejected.

**Validates: Requirements 10.2**

#### Property 44: Announcement Notification
*For any* created announcement, the system should send notifications to all clan members.

**Validates: Requirements 10.3**

#### Property 45: Admin Announcement Deletion Permission
*For any* clan announcement, users with admin privileges should be able to delete it, while non-admin members should not have this permission.

**Validates: Requirements 10.5**

### Social Feed Interaction Properties

#### Property 46: Activity Generation
*For any* user action that should generate an activity (game listing creation, match completion, badge earning, level up, clan joining), the system should create a corresponding activity in the social feed.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

#### Property 47: Like Toggle Behavior
*For any* activity, when a user likes it for the first time, a like should be created; when the same user likes it again, the like should be removed (toggle behavior).

**Validates: Requirements 12.1, 12.2**

#### Property 48: Like Count Accuracy
*For any* activity, the displayed like count should equal the number of unique users who have liked it.

**Validates: Requirements 12.3**

#### Property 49: Comment Length Validation
*For any* activity comment submission, comments up to 500 characters should be accepted, and comments exceeding 500 characters should be rejected.

**Validates: Requirements 12.4**

#### Property 50: Activity Interaction Notification
*For any* activity that receives a like or comment, the system should send a notification to the activity owner.

**Validates: Requirements 12.6**

#### Property 51: Comment Ownership Deletion
*For any* activity comment, the user who created it should be able to delete it, while other users should not be able to delete it.

**Validates: Requirements 12.7**

### Notification System Properties

#### Property 52: Unread Message Count
*For any* user, the displayed unread message count should equal the number of messages they have received but not yet viewed.

**Validates: Requirements 13.3**

#### Property 53: Read Status Update
*For any* message, when a user views it, the system should mark the corresponding notification as read.

**Validates: Requirements 13.4**

#### Property 54: Email Notification Preference
*For any* user with email notifications enabled, the system should send email notifications for messages; for users with email notifications disabled, no email should be sent.

**Validates: Requirements 13.6**

### Privacy System Properties

#### Property 55: Profile Visibility Setting
*For any* user, they should be able to set their profile as public or private.

**Validates: Requirements 14.1**

#### Property 56: Private Profile Follow Approval
*For any* user with a private profile, follow requests should require approval before creating a follow relationship.

**Validates: Requirements 14.2**

#### Property 57: Block Removes Follow Relationships
*For any* two users A and B with existing follow relationships, when A blocks B, all follow relationships between them (in both directions) should be removed.

**Validates: Requirements 14.4**

#### Property 58: Rating Visibility Control
*For any* user who has hidden their rating, it should be visible only to themselves and hidden from all other users; for users who have not hidden their rating, it should be visible to all users.

**Validates: Requirements 14.5, 14.6**

### Moderation Properties

#### Property 59: User Report Capability
*For any* rating comment, any user should be able to report it as inappropriate.

**Validates: Requirements 15.3**

#### Property 60: Admin Comment Deletion
*For any* rating comment, administrators should be able to permanently delete it.

**Validates: Requirements 15.5**


## Error Handling

### Error Categories

#### 1. Validation Errors (400 Bad Request)
- Invalid input data (e.g., message too long, invalid rating value)
- Missing required fields
- Invalid format (e.g., clan name too short/long)

```typescript
class ValidationError extends Error {
  statusCode = 400;
  constructor(public field: string, public message: string) {
    super(message);
  }
}
```

#### 2. Authorization Errors (403 Forbidden)
- Insufficient permissions (e.g., non-admin trying to delete clan announcement)
- Blocked user attempting to message
- Private profile access without follow relationship

```typescript
class AuthorizationError extends Error {
  statusCode = 403;
  constructor(public message: string) {
    super(message);
  }
}
```

#### 3. Not Found Errors (404 Not Found)
- User not found
- Clan not found
- Message/Activity not found

```typescript
class NotFoundError extends Error {
  statusCode = 404;
  constructor(public resource: string, public id: string) {
    super(`${resource} with id ${id} not found`);
  }
}
```

#### 4. Conflict Errors (409 Conflict)
- Duplicate follow attempt
- Duplicate clan name
- Already rated this match
- Clan member limit reached

```typescript
class ConflictError extends Error {
  statusCode = 409;
  constructor(public message: string) {
    super(message);
  }
}
```

#### 5. Rate Limit Errors (429 Too Many Requests)
- Too many messages sent in short time
- Too many follow requests
- Too many rating submissions

```typescript
class RateLimitError extends Error {
  statusCode = 429;
  constructor(public retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
  }
}
```

### Error Handling Strategy

#### Service Layer
```typescript
// Example: FollowService
async followUser(followerId: string, followingId: string): Promise<Follow> {
  // Validate: Cannot follow self
  if (followerId === followingId) {
    throw new ValidationError('following_id', 'Cannot follow yourself');
  }
  
  // Check if users exist
  const [follower, following] = await Promise.all([
    this.userRepository.findOne({ where: { id: followerId } }),
    this.userRepository.findOne({ where: { id: followingId } }),
  ]);
  
  if (!follower) throw new NotFoundError('User', followerId);
  if (!following) throw new NotFoundError('User', followingId);
  
  // Check if already following
  const existing = await this.followRepository.findOne({
    where: { follower_id: followerId, following_id: followingId },
  });
  
  if (existing) {
    throw new ConflictError('Already following this user');
  }
  
  // Check if blocked
  const isBlocked = await this.privacyService.isBlocked(followerId, followingId);
  if (isBlocked) {
    throw new AuthorizationError('Cannot follow blocked user');
  }
  
  // Handle private profiles
  if (following.profile_visibility === 'private') {
    return this.sendFollowRequest(followerId, followingId);
  }
  
  // Create follow relationship
  try {
    const follow = await this.followRepository.save({
      follower_id: followerId,
      following_id: followingId,
    });
    
    // Update counts
    await this.updateFollowCounts(followerId, followingId);
    
    // Send notification
    await this.notificationService.create({
      user_id: followingId,
      type: NotificationType.NEW_FOLLOWER,
      payload: { follower_id: followerId },
    });
    
    return follow;
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new ConflictError('Already following this user');
    }
    throw error;
  }
}
```

#### Controller Layer
```typescript
@Controller('follows')
export class FollowController {
  @Post()
  @UseGuards(JwtAuthGuard)
  async followUser(
    @CurrentUser() user: User,
    @Body() dto: FollowUserDto,
  ) {
    try {
      const follow = await this.followService.followUser(user.id, dto.user_id);
      return {
        success: true,
        data: follow,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ConflictError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof AuthorizationError) {
        throw new ForbiddenException(error.message);
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
```

#### Global Exception Filter
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    let status = 500;
    let message = 'Internal server error';
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }
    
    // Log error
    this.logger.error({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });
    
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Database Transaction Handling

Critical operations should use transactions to ensure data consistency:

```typescript
async createClan(userId: string, data: CreateClanDto): Promise<Clan> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    // Create clan
    const clan = await queryRunner.manager.save(Clan, {
      name: data.name,
      description: data.description,
      creator_id: userId,
    });
    
    // Add creator as admin member
    await queryRunner.manager.save(ClanMember, {
      clan_id: clan.id,
      user_id: userId,
      role: 'admin',
    });
    
    // Create group chat
    await queryRunner.manager.save(Conversation, {
      participant_ids: [userId],
      conversation_type: 'clan',
      clan_id: clan.id,
    });
    
    await queryRunner.commitTransaction();
    return clan;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Rate limit configuration
const RATE_LIMITS = {
  FOLLOW: { points: 20, duration: 60 }, // 20 follows per minute
  MESSAGE: { points: 30, duration: 60 }, // 30 messages per minute
  RATING: { points: 10, duration: 300 }, // 10 ratings per 5 minutes
  COMMENT: { points: 20, duration: 60 }, // 20 comments per minute
};

@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Throttle(RATE_LIMITS.FOLLOW.points, RATE_LIMITS.FOLLOW.duration)
@Post('follow')
async followUser(@CurrentUser() user: User, @Body() dto: FollowUserDto) {
  // Implementation
}
```

### Graceful Degradation

When external services fail, provide graceful degradation:

```typescript
async sendNotification(notification: CreateNotificationDto) {
  try {
    // Try to send push notification
    await this.pushService.send(notification);
  } catch (error) {
    // Log error but don't fail the request
    this.logger.error('Push notification failed', error);
  }
  
  // Always save in-app notification
  return this.notificationRepository.save(notification);
}
```

## Testing Strategy

### Testing Approach

Bu proje için dual testing yaklaşımı kullanılacak:

1. **Unit Tests**: Spesifik örnekler, edge case'ler ve hata durumları için
2. **Property-Based Tests**: Evrensel özellikler ve geniş input coverage için

Her iki test türü de birbirini tamamlar ve kapsamlı test coverage sağlar.

### Property-Based Testing

#### Framework Selection
- **Backend (TypeScript/NestJS)**: [fast-check](https://github.com/dubzzz/fast-check)
- Minimum 100 iteration per test (randomization nedeniyle)

#### Property Test Structure

Her correctness property için bir property-based test yazılacak:

```typescript
import * as fc from 'fast-check';

describe('Follow System Properties', () => {
  describe('Property 1: Follow Relationship Creation', () => {
    it('should create follow relationship for any two distinct users', async () => {
      // Feature: social-features, Property 1: For any two distinct users A and B, 
      // when A follows B, the system should create a follow relationship
      
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // follower_id
          fc.uuid(), // following_id
          async (followerId, followingId) => {
            // Ensure distinct users
            fc.pre(followerId !== followingId);
            
            // Setup: Create test users
            const follower = await createTestUser({ id: followerId });
            const following = await createTestUser({ id: followingId });
            
            // Action: Follow user
            const follow = await followService.followUser(followerId, followingId);
            
            // Assertions
            expect(follow.follower_id).toBe(followerId);
            expect(follow.following_id).toBe(followingId);
            
            // Verify in followers list
            const followers = await followService.getFollowers(followingId);
            expect(followers.some(u => u.id === followerId)).toBe(true);
            
            // Verify in following list
            const following_list = await followService.getFollowing(followerId);
            expect(following_list.some(u => u.id === followingId)).toBe(true);
            
            // Cleanup
            await cleanupTestData([followerId, followingId]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('Property 3: Follow Relationship Counting', () => {
    it('should maintain accurate follower and following counts', async () => {
      // Feature: social-features, Property 3: For any user, the follower count 
      // should equal the number of users following them
      
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // target user
          fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }), // followers
          async (userId, followerIds) => {
            // Ensure unique followers
            const uniqueFollowers = [...new Set(followerIds)].filter(id => id !== userId);
            
            // Setup: Create users
            const user = await createTestUser({ id: userId });
            const followers = await Promise.all(
              uniqueFollowers.map(id => createTestUser({ id }))
            );
            
            // Action: Create follow relationships
            await Promise.all(
              uniqueFollowers.map(followerId => 
                followService.followUser(followerId, userId)
              )
            );
            
            // Assertions
            const followerCount = await followService.getFollowerCount(userId);
            expect(followerCount).toBe(uniqueFollowers.length);
            
            const followingCount = await followService.getFollowingCount(userId);
            expect(followingCount).toBe(0); // User hasn't followed anyone
            
            // Cleanup
            await cleanupTestData([userId, ...uniqueFollowers]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Rating System Properties', () => {
  describe('Property 18: Rating Value Validation', () => {
    it('should accept ratings 1-5 and reject others', async () => {
      // Feature: social-features, Property 18: For any rating submission, 
      // ratings with values between 1 and 5 should be accepted
      
      await fc.assert(
        fc.asyncProperty(
          fc.integer(), // any integer
          async (ratingValue) => {
            // Setup
            const rater = await createTestUser();
            const rated = await createTestUser();
            const match = await createTestMatch([rater.id, rated.id]);
            
            // Action & Assertion
            if (ratingValue >= 1 && ratingValue <= 5) {
              // Should succeed
              const rating = await ratingService.rateUser(
                rater.id,
                rated.id,
                match.id,
                ratingValue
              );
              expect(rating.rating).toBe(ratingValue);
            } else {
              // Should fail
              await expect(
                ratingService.rateUser(rater.id, rated.id, match.id, ratingValue)
              ).rejects.toThrow(ValidationError);
            }
            
            // Cleanup
            await cleanupTestData([rater.id, rated.id, match.id]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('Property 20: Average Rating Calculation', () => {
    it('should calculate correct average with one decimal precision', async () => {
      // Feature: social-features, Property 20: For any user with ratings, 
      // the displayed average should equal the arithmetic mean
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 20 }),
          async (ratings) => {
            // Setup
            const ratedUser = await createTestUser();
            
            // Create ratings from different users
            for (const ratingValue of ratings) {
              const rater = await createTestUser();
              const match = await createTestMatch([rater.id, ratedUser.id]);
              await ratingService.rateUser(rater.id, ratedUser.id, match.id, ratingValue);
            }
            
            // Calculate expected average
            const sum = ratings.reduce((a, b) => a + b, 0);
            const expectedAverage = Number((sum / ratings.length).toFixed(1));
            
            // Get actual average
            const actualAverage = await ratingService.getAverageRating(ratedUser.id);
            
            // Assertion
            expect(actualAverage).toBe(expectedAverage);
            
            // Cleanup
            await cleanupTestData([ratedUser.id]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Message System Properties', () => {
  describe('Property 11: Message Length Validation', () => {
    it('should accept messages up to 2000 chars and reject longer', async () => {
      // Feature: social-features, Property 11: For any message submission, 
      // messages up to 2000 characters should be accepted
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 3000 }),
          async (messageContent) => {
            // Setup
            const sender = await createTestUser();
            const recipient = await createTestUser();
            const match = await createTestMatch([sender.id, recipient.id]);
            
            // Action & Assertion
            if (messageContent.length <= 2000) {
              // Should succeed
              const message = await messageService.sendDirectMessage(
                sender.id,
                recipient.id,
                messageContent
              );
              expect(message.content).toBe(messageContent);
            } else {
              // Should fail
              await expect(
                messageService.sendDirectMessage(sender.id, recipient.id, messageContent)
              ).rejects.toThrow(ValidationError);
            }
            
            // Cleanup
            await cleanupTestData([sender.id, recipient.id, match.id]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
```

#### Custom Generators

Property-based testler için custom generator'lar:

```typescript
// User generator
const userArbitrary = () => fc.record({
  id: fc.uuid(),
  username: fc.string({ minLength: 3, maxLength: 20 }),
  email: fc.emailAddress(),
  region: fc.constantFrom('EU', 'NA', 'AS', 'SA', 'OC'),
});

// Clan generator
const clanArbitrary = () => fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  description: fc.option(fc.string({ maxLength: 500 })),
  creator_id: fc.uuid(),
});

// Message generator
const messageArbitrary = () => fc.record({
  sender_id: fc.uuid(),
  recipient_id: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 2000 }),
});

// Rating generator
const ratingArbitrary = () => fc.record({
  rater_id: fc.uuid(),
  rated_user_id: fc.uuid(),
  match_id: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.option(fc.string({ maxLength: 500 })),
});
```

### Unit Testing

Unit testler spesifik senaryolar ve edge case'ler için:

```typescript
describe('FollowService', () => {
  describe('followUser', () => {
    it('should reject self-follow attempts', async () => {
      const userId = 'user-123';
      
      await expect(
        followService.followUser(userId, userId)
      ).rejects.toThrow('Cannot follow yourself');
    });
    
    it('should reject duplicate follow attempts', async () => {
      const follower = await createTestUser();
      const following = await createTestUser();
      
      // First follow should succeed
      await followService.followUser(follower.id, following.id);
      
      // Second follow should fail
      await expect(
        followService.followUser(follower.id, following.id)
      ).rejects.toThrow(ConflictError);
    });
    
    it('should send notification on new follow', async () => {
      const follower = await createTestUser();
      const following = await createTestUser();
      
      await followService.followUser(follower.id, following.id);
      
      const notifications = await notificationService.getUserNotifications(following.id);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe(NotificationType.NEW_FOLLOWER);
    });
  });
});

describe('ClanService', () => {
  describe('createClan', () => {
    it('should assign creator as admin', async () => {
      const creator = await createTestUser();
      
      const clan = await clanService.createClan(creator.id, {
        name: 'Test Clan',
        description: 'Test description',
      });
      
      const members = await clanService.getClanMembers(clan.id);
      const creatorMember = members.find(m => m.user_id === creator.id);
      
      expect(creatorMember).toBeDefined();
      expect(creatorMember.role).toBe('admin');
    });
    
    it('should reject clan names shorter than 3 characters', async () => {
      const creator = await createTestUser();
      
      await expect(
        clanService.createClan(creator.id, { name: 'AB' })
      ).rejects.toThrow(ValidationError);
    });
    
    it('should reject duplicate clan names', async () => {
      const creator1 = await createTestUser();
      const creator2 = await createTestUser();
      
      await clanService.createClan(creator1.id, { name: 'Unique Clan' });
      
      await expect(
        clanService.createClan(creator2.id, { name: 'Unique Clan' })
      ).rejects.toThrow(ConflictError);
    });
  });
});
```

### Integration Testing

Integration testler modüller arası etkileşimleri test eder:

```typescript
describe('Social Features Integration', () => {
  it('should handle complete follow-to-feed flow', async () => {
    // Setup users
    const userA = await createTestUser();
    const userB = await createTestUser();
    
    // A follows B
    await followService.followUser(userA.id, userB.id);
    
    // B creates a game listing
    const listing = await gameListingService.create(userB.id, {
      game: 'PUBG',
      description: 'Looking for squad',
    });
    
    // Check that activity was created
    const activities = await socialFeedService.getUserActivities(userB.id);
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe(ActivityType.GAME_LISTING_CREATED);
    
    // Check that A sees it in their feed
    const feedA = await socialFeedService.getUserFeed(userA.id);
    expect(feedA.some(a => a.id === activities[0].id)).toBe(true);
    
    // A likes the activity
    await socialFeedService.likeActivity(activities[0].id, userA.id);
    
    // B should receive notification
    const notifications = await notificationService.getUserNotifications(userB.id);
    expect(notifications.some(n => n.type === NotificationType.ACTIVITY_LIKED)).toBe(true);
  });
  
  it('should handle block cascading effects', async () => {
    // Setup users with follow relationship
    const userA = await createTestUser();
    const userB = await createTestUser();
    await followService.followUser(userA.id, userB.id);
    await followService.followUser(userB.id, userA.id);
    
    // A blocks B
    await privacyService.blockUser(userA.id, userB.id);
    
    // Verify follow relationships removed
    const isAFollowingB = await followService.isFollowing(userA.id, userB.id);
    const isBFollowingA = await followService.isFollowing(userB.id, userA.id);
    expect(isAFollowingB).toBe(false);
    expect(isBFollowingA).toBe(false);
    
    // Verify messaging blocked
    await expect(
      messageService.sendDirectMessage(userA.id, userB.id, 'Hello')
    ).rejects.toThrow(AuthorizationError);
    
    await expect(
      messageService.sendDirectMessage(userB.id, userA.id, 'Hello')
    ).rejects.toThrow(AuthorizationError);
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All 60 correctness properties implemented
- **Integration Tests**: Critical user flows covered
- **E2E Tests**: Main user journeys (follow, message, rate, clan creation)

### Test Data Management

```typescript
// Test data factory
class TestDataFactory {
  async createUser(overrides?: Partial<User>): Promise<User> {
    return this.userRepository.save({
      username: `test_${randomString()}`,
      email: `test_${randomString()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      region: Region.EU,
      status: UserStatus.ACTIVE,
      ...overrides,
    });
  }
  
  async createClan(creatorId: string, overrides?: Partial<Clan>): Promise<Clan> {
    return this.clanService.createClan(creatorId, {
      name: `Test Clan ${randomString()}`,
      description: 'Test clan description',
      ...overrides,
    });
  }
  
  async cleanup(): Promise<void> {
    // Clean up test data in correct order
    await this.activityRepository.delete({ user_id: Like('test_%') });
    await this.messageRepository.delete({ sender_id: Like('test_%') });
    await this.ratingRepository.delete({ rater_id: Like('test_%') });
    await this.clanMemberRepository.delete({});
    await this.clanRepository.delete({});
    await this.followRepository.delete({});
    await this.userRepository.delete({ username: Like('test_%') });
  }
}
```

### Continuous Integration

Test pipeline:

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test
      
      - name: Run property-based tests
        run: npm run test:property
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

