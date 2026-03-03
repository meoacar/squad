# Implementation Plan: Social Features

## Overview

Bu implementation plan, oyun platformu için kapsamlı sosyal etkileşim özelliklerini adım adım hayata geçirir. Sistem 7 modüler yapıdan oluşur: Follow, Message, Rating, Clan, SocialFeed, Privacy ve Moderation. Her modül bağımsız olarak geliştirilebilir ve test edilebilir.

Teknoloji stack: NestJS backend, Next.js frontend, PostgreSQL, Redis, WebSocket, TypeORM.

## Tasks

- [x] 1. Database schema ve core infrastructure kurulumu
  - [x] 1.1 Veritabanı migration dosyalarını oluştur
    - 11 yeni tablo için migration dosyaları: follows, follow_requests, conversations, messages, message_reads, ratings, rating_reports, clans, clan_members, clan_invitations, clan_announcements, activities, activity_likes, activity_comments, blocks, notification_preferences
    - Mevcut users tablosuna yeni alanlar ekle: rating_average, rating_count, has_trusted_badge, rating_hidden, follower_count, following_count
    - Tüm index'leri ve constraint'leri tanımla
    - _Requirements: 1.1, 3.1, 5.1, 7.1, 11.1, 14.1_
  
  - [ ]* 1.2 Database schema için property test yaz
    - **Property 28: Clan Name Validation**
    - **Validates: Requirements 7.1**
  
  - [x] 1.3 TypeORM entity sınıflarını oluştur
    - Follow, FollowRequest, Conversation, Message, MessageRead, Rating, RatingReport, Clan, ClanMember, ClanInvitation, ClanAnnouncement, Activity, ActivityLike, ActivityComment, Block, NotificationPreferences entity'lerini tanımla
    - Her entity için ilişkileri ve validation decorator'larını ekle
    - _Requirements: 1.1, 3.1, 5.1, 7.1, 11.1, 14.1_
  
  - [x] 1.4 Error handling sınıflarını oluştur
    - ValidationError, AuthorizationError, NotFoundError, ConflictError, RateLimitError sınıflarını implement et
    - Global exception filter'ı oluştur
    - _Requirements: Tüm requirements için hata yönetimi_
  
  - [x] 1.5 Rate limiting konfigürasyonunu ekle
    - Follow, Message, Rating, Comment için rate limit tanımla
    - ThrottlerGuard konfigürasyonunu ayarla
    - _Requirements: 3.2, 5.4_

- [x] 2. Follow System implementasyonu
  - [x] 2.1 FollowModule, FollowService ve FollowController oluştur
    - followUser, unfollowUser, getFollowers, getFollowing, getFollowerCount, getFollowingCount, isFollowing metodlarını implement et
    - Private profile için follow request logic'i ekle
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 14.1, 14.2_
  
  - [ ]* 2.2 Follow System için property testler yaz
    - **Property 1: Follow Relationship Creation**
    - **Property 2: Duplicate Follow Prevention**
    - **Property 3: Follow Relationship Counting**
    - **Property 4: Unfollow Restores State**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6**
  
  - [ ]* 2.3 Follow System için unit testler yaz
    - Self-follow rejection testi
    - Duplicate follow rejection testi
    - Follow notification testi
    - Blocked user follow rejection testi
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 2.4 Follow request yönetimi ekle
    - sendFollowRequest, approveFollowRequest, rejectFollowRequest, getPendingFollowRequests metodlarını implement et
    - _Requirements: 14.2_
  
  - [ ]* 2.5 Follow request için property test yaz
    - **Property 56: Private Profile Follow Approval**
    - **Validates: Requirements 14.2**

- [x] 3. Checkpoint - Follow System tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Message System implementasyonu
  - [x] 4.1 MessageModule, MessageService ve MessageController oluştur
    - sendDirectMessage, getDirectMessages, getConversations metodlarını implement et
    - Message delivery ve storage logic'i ekle
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 4.2 Message System için property testler yaz
    - **Property 9: Match-Based Messaging Enablement**
    - **Property 10: Block Prevents Messaging**
    - **Property 11: Message Length Validation**
    - **Property 12: Message Notification Creation**
    - **Validates: Requirements 3.1, 3.4, 3.5, 3.6**
  
  - [x] 4.3 WebSocket gateway oluştur
    - Real-time message delivery için WebSocket implementasyonu
    - Connection management ve authentication
    - _Requirements: 3.2, 4.5_
  
  - [x] 4.4 Group chat fonksiyonlarını ekle
    - sendGroupMessage, getGroupMessages, deleteGroupMessage metodlarını implement et
    - Clan membership kontrolü ekle
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 4.5 Group chat için property testler yaz
    - **Property 13: Clan Group Chat Access**
    - **Property 14: Clan Membership Access Round Trip**
    - **Property 15: Group Chat Size Limit**
    - **Property 16: Admin Message Deletion Permission**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**
  
  - [x] 4.6 Message read tracking ekle
    - markAsRead, getUnreadCount metodlarını implement et
    - _Requirements: 13.3, 13.4_
  
  - [ ]* 4.7 Message read tracking için property test yaz
    - **Property 52: Unread Message Count**
    - **Property 53: Read Status Update**
    - **Validates: Requirements 13.3, 13.4**

- [x] 5. Checkpoint - Message System tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Rating System implementasyonu
  - [x] 6.1 RatingModule, RatingService ve RatingController oluştur
    - rateUser, canRateUser, getUserRatings, getAverageRating, getRatingCount metodlarını implement et
    - Match completion kontrolü ekle
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 6.2 Rating System için property testler yaz
    - **Property 17: One Rating Per Match**
    - **Property 18: Rating Value Validation**
    - **Property 19: Comment Length Validation**
    - **Property 20: Average Rating Calculation**
    - **Property 21: Rating Data Display**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.6, 5.7**
  
  - [x] 6.3 Trusted Player Badge logic'i ekle
    - updateTrustedPlayerBadge, hasTrustedPlayerBadge metodlarını implement et
    - Otomatik badge award/removal logic'i
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 6.4 Trusted Badge için property testler yaz
    - **Property 22: Trusted Badge Award Threshold**
    - **Property 23: Trusted Badge Removal Threshold**
    - **Property 24: Badge Visibility**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [x] 6.5 Rating comment moderation ekle
    - flagComment, reportComment, hideComment, deleteComment metodlarını implement et
    - Profanity detection logic'i ekle
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ]* 6.6 Comment moderation için property testler yaz
    - **Property 25: Comment Profanity Flagging**
    - **Property 26: Flagged Comment Visibility**
    - **Property 27: Report Threshold Auto-Hide**
    - **Property 59: User Report Capability**
    - **Property 60: Admin Comment Deletion**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

- [x] 7. Checkpoint - Rating System tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Clan System implementasyonu
  - [x] 8.1 ClanModule, ClanService ve ClanController oluştur
    - createClan, updateClan, deleteClan, getClan, getUserClan metodlarını implement et
    - Clan name uniqueness ve validation kontrolü
    - _Requirements: 7.1, 7.2, 7.3, 8.1_
  
  - [ ]* 8.2 Clan creation için property testler yaz
    - **Property 28: Clan Name Validation**
    - **Property 29: Clan Member Limit**
    - **Property 30: Creator Admin Assignment**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  
  - [x] 8.3 Clan member management ekle
    - inviteMember, acceptInvitation, rejectInvitation, removeMember, leaveClan, getClanMembers metodlarını implement et
    - Admin permission kontrolü
    - _Requirements: 7.4, 7.5, 7.6, 7.7, 8.2_
  
  - [ ]* 8.4 Clan member management için property testler yaz
    - **Property 31: Admin Invitation Permission**
    - **Property 32: Admin Removal Permission**
    - **Property 33: Invitation Notification**
    - **Property 34: Invitation Acceptance Membership**
    - **Validates: Requirements 7.4, 7.5, 7.6, 7.7**
  
  - [x] 8.5 Clan statistics ve profile ekle
    - getClanStats metodunu implement et
    - Total matches, average rating, badges hesaplama
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ]* 8.6 Clan statistics için property testler yaz
    - **Property 35: Clan Profile Required Data**
    - **Property 36: Clan Statistics Aggregation**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
  
  - [x] 8.6 Clan announcements ekle
    - createAnnouncement, getAnnouncements, deleteAnnouncement metodlarını implement et
    - 30 günlük expiration logic'i
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 8.6_
  
  - [ ]* 8.7 Clan announcements için property testler yaz
    - **Property 37: Announcement Chronological Display**
    - **Property 42: Admin Announcement Permission**
    - **Property 43: Announcement Length Validation**
    - **Property 44: Announcement Notification**
    - **Property 45: Admin Announcement Deletion Permission**
    - **Validates: Requirements 8.6, 10.1, 10.2, 10.3, 10.5**
  
  - [x] 8.8 Clan leaderboard ekle
    - getClanLeaderboard metodunu implement et
    - Game type filtering ve ranking logic'i
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 8.9 Clan leaderboard için property testler yaz
    - **Property 38: Leaderboard Ranking**
    - **Property 39: Leaderboard Size Limit**
    - **Property 40: Leaderboard Data Display**
    - **Property 41: Leaderboard Game Type Filtering**
    - **Validates: Requirements 9.1, 9.2, 9.4, 9.5**

- [x] 9. Checkpoint - Clan System tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Social Feed System implementasyonu
  - [x] 10.1 SocialFeedModule, SocialFeedService ve SocialFeedController oluştur
    - createActivity, getUserFeed, getUserActivities metodlarını implement et
    - Activity type enum ve data structure tanımla
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_
  
  - [ ]* 10.2 Social Feed için property testler yaz
    - **Property 5: Feed Visibility Filtering**
    - **Property 6: Chronological Ordering**
    - **Property 7: Feed Item Timestamp Presence**
    - **Property 8: Time-Based Filtering**
    - **Property 46: Activity Generation**
    - **Validates: Requirements 2.2, 2.3, 2.4, 10.4, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8**
  
  - [x] 10.3 Activity interaction ekle
    - likeActivity, unlikeActivity, commentOnActivity, deleteComment metodlarını implement et
    - getActivityLikes, getActivityComments, hasUserLiked metodlarını implement et
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ]* 10.4 Activity interaction için property testler yaz
    - **Property 47: Like Toggle Behavior**
    - **Property 48: Like Count Accuracy**
    - **Property 49: Comment Length Validation**
    - **Property 50: Activity Interaction Notification**
    - **Property 51: Comment Ownership Deletion**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.6, 12.7**
  
  - [x] 10.5 Event listener'ları ekle
    - Game listing creation, match completion, badge earned, level up, clan joined event'leri için listener'lar
    - Otomatik activity creation logic'i
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11. Checkpoint - Social Feed System tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Privacy System implementasyonu
  - [x] 12.1 PrivacyModule, PrivacyService ve PrivacyController oluştur
    - setProfileVisibility, getProfileVisibility metodlarını implement et
    - setRatingVisibility, canViewRating metodlarını implement et
    - _Requirements: 14.1, 14.2, 14.5, 14.6_
  
  - [ ]* 12.2 Privacy settings için property testler yaz
    - **Property 55: Profile Visibility Setting**
    - **Property 58: Rating Visibility Control**
    - **Validates: Requirements 14.1, 14.5, 14.6**
  
  - [x] 12.3 Block functionality ekle
    - blockUser, unblockUser, isBlocked, getBlockedUsers metodlarını implement et
    - Follow relationship removal logic'i
    - _Requirements: 14.3, 14.4_
  
  - [ ]* 12.4 Block functionality için property test yaz
    - **Property 57: Block Removes Follow Relationships**
    - **Validates: Requirements 14.4**
  
  - [x] 12.5 Notification preferences ekle
    - updateNotificationPreferences, getNotificationPreferences metodlarını implement et
    - Email ve push notification ayarları
    - _Requirements: 13.5, 13.6_
  
  - [ ]* 12.6 Notification preferences için property test yaz
    - **Property 54: Email Notification Preference**
    - **Validates: Requirements 13.6**

- [x] 13. Checkpoint - Privacy System tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Notification System enhancement
  - [x] 14.1 Mevcut NotificationService'e yeni notification tipleri ekle
    - NEW_FOLLOWER, FOLLOW_REQUEST, FOLLOW_REQUEST_ACCEPTED, DIRECT_MESSAGE, GROUP_MESSAGE, CLAN_INVITATION, CLAN_ANNOUNCEMENT, ACTIVITY_LIKED, ACTIVITY_COMMENTED, NEW_RATING, BADGE_EARNED enum değerlerini ekle
    - _Requirements: 3.6, 7.6, 10.3, 12.6, 13.1, 13.2_
  
  - [x] 14.2 Email notification service entegrasyonu
    - Email template'leri oluştur
    - User preference kontrolü ile email gönderimi
    - _Requirements: 13.6_
  
  - [x] 14.3 Graceful degradation ekle
    - Push notification failure handling
    - In-app notification fallback
    - _Requirements: 13.5_

- [x] 15. Frontend - Follow System UI
  - [x] 15.1 Follow/Unfollow button component oluştur
    - User profile'da follow/unfollow butonu
    - Follower/following count display
    - _Requirements: 1.1, 1.4, 1.5, 1.6_
  
  - [x] 15.2 Followers/Following list sayfaları oluştur
    - Pagination ile follower listesi
    - Pagination ile following listesi
    - _Requirements: 1.4, 1.5_
  
  - [x] 15.3 Follow request management UI
    - Pending follow requests listesi
    - Approve/reject butonları
    - _Requirements: 14.2_

- [x] 16. Frontend - Message System UI
  - [x] 16.1 Direct message conversation UI oluştur
    - Message list component
    - Message input component
    - Real-time message updates (WebSocket)
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [x] 16.2 Conversations list sayfası oluştur
    - Tüm conversation'ları listele
    - Unread count badge
    - Last message preview
    - _Requirements: 3.3, 13.3_
  
  - [x] 16.3 Group chat UI oluştur
    - Clan group chat sayfası
    - Member list sidebar
    - Admin message deletion
    - _Requirements: 4.1, 4.5, 4.6_

- [x] 17. Frontend - Rating System UI
  - [x] 17.1 Rating submission modal oluştur
    - 1-5 star rating selector
    - Optional comment textarea
    - Match completion sonrası gösterim
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 17.2 Rating display component oluştur
    - Average rating display
    - Rating count display
    - Trusted Player Badge display
    - _Requirements: 5.6, 5.7, 6.3, 6.4_
  
  - [x] 17.3 Rating list ve comment moderation UI
    - User profile'da received ratings listesi
    - Comment report butonu
    - Admin için comment moderation panel
    - _Requirements: 5.7, 15.3, 15.5_

- [x] 18. Frontend - Clan System UI
  - [x] 18.1 Clan creation form oluştur
    - Clan name input (3-30 karakter)
    - Description textarea
    - Avatar upload
    - _Requirements: 7.1_
  
  - [x] 18.2 Clan profile sayfası oluştur
    - Clan bilgileri display
    - Member list
    - Statistics display
    - Announcements section
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 18.3 Clan management UI (admin only)
    - Member invitation form
    - Member removal button
    - Announcement creation form
    - _Requirements: 7.4, 7.5, 10.1, 10.2_
  
  - [x] 18.4 Clan leaderboard sayfası oluştur
    - Top 100 clans listesi
    - Game type filter
    - Rank, name, member count, total matches display
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [x] 19. Frontend - Social Feed UI
  - [x] 19.1 Social feed sayfası oluştur
    - Activity card component
    - Infinite scroll pagination
    - Activity type icons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.6, 11.7, 11.8_
  
  - [x] 19.2 Activity interaction UI ekle
    - Like button ve count
    - Comment section
    - Comment input
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.7_

- [x] 20. Frontend - Privacy Settings UI
  - [x] 20.1 Privacy settings sayfası oluştur
    - Profile visibility toggle (public/private)
    - Rating visibility toggle
    - Blocked users list
    - _Requirements: 14.1, 14.5, 14.6_
  
  - [x] 20.2 Notification preferences UI
    - Email notification toggles
    - Push notification toggles
    - Per-category preferences
    - _Requirements: 13.6_
  
  - [x] 20.3 Block user functionality
    - Block button on user profiles
    - Unblock button on blocked users list
    - _Requirements: 14.3, 14.4_

- [x] 21. Integration ve wiring
  - [x] 21.1 Tüm modülleri AppModule'e ekle
    - Module imports ve dependency injection
    - _Requirements: Tüm requirements_
  
  - [x] 21.2 API endpoint'lerini test et
    - Postman/Insomnia collection oluştur
    - Tüm endpoint'leri manuel test et
    - _Requirements: Tüm requirements_
  
  - [x] 21.3 Frontend-backend entegrasyonunu tamamla
    - API client service'leri oluştur
    - Error handling ve loading states
    - _Requirements: Tüm requirements_
  
  - [ ]* 21.4 Integration testler yaz
    - Follow-to-feed flow testi
    - Block cascading effects testi
    - Clan creation to group chat flow testi
    - _Requirements: 1.1, 2.1, 4.1, 7.1, 14.4_

- [x] 22. Final checkpoint - Tüm testleri çalıştır
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties (60 properties total)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Frontend tasks can be parallelized with backend tasks after API contracts are defined
- WebSocket implementation is critical for real-time messaging
- Rate limiting should be configured before production deployment
- Database migrations should be reviewed carefully before running
