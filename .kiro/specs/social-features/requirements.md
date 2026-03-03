# Requirements Document

## Introduction

Bu belge, oyun platformu için sosyal etkileşim özelliklerini tanımlar. Kullanıcılar birbirlerini takip edebilecek, mesajlaşabilecek, değerlendirebilecek, clan oluşturabilecek ve sosyal bir feed üzerinden aktiviteleri takip edebilecekler.

## Glossary

- **User**: Platformda kayıtlı bir oyuncu hesabı
- **Follow_System**: Kullanıcıların diğer kullanıcıları takip etmesini sağlayan sistem
- **Follower**: Bir kullanıcıyı takip eden kullanıcı
- **Following**: Bir kullanıcının takip ettiği kullanıcı
- **Message_System**: Kullanıcılar arası mesajlaşma sistemini yöneten bileşen
- **Direct_Message**: İki kullanıcı arasındaki özel mesajlaşma
- **Group_Chat**: Birden fazla kullanıcının katıldığı grup mesajlaşması
- **Rating_System**: Kullanıcıların birbirlerini değerlendirmesini sağlayan sistem
- **Rating**: 1-5 yıldız arası bir değerlendirme ve opsiyonel yorum
- **Match**: Kabul edilmiş bir oyun ilanı eşleşmesi
- **Clan**: Birden fazla kullanıcının oluşturduğu takım/grup
- **Clan_Profile**: Bir clan'ın bilgilerini, üyelerini ve istatistiklerini gösteren sayfa
- **Social_Feed**: Kullanıcıların ve takip ettikleri kişilerin aktivitelerini gösteren akış
- **Activity**: Sosyal feed'de görüntülenebilecek bir kullanıcı eylemi
- **Badge**: Kullanıcının başarılarını gösteren rozet
- **Trusted_Player_Badge**: Yüksek rating ortalamasına sahip kullanıcılara verilen özel rozet
- **Notification_System**: Kullanıcılara bildirim gönderen sistem
- **Leaderboard**: Clan'ları sıralayan liste sistemi

## Requirements

### Requirement 1: Kullanıcı Takip Etme

**User Story:** As a User, I want to follow other players, so that I can stay updated on their activities and new game listings.

#### Acceptance Criteria

1. WHEN a User selects to follow another User, THE Follow_System SHALL create a follow relationship
2. WHEN a User attempts to follow themselves, THE Follow_System SHALL reject the request
3. WHEN a User attempts to follow a User they already follow, THE Follow_System SHALL return an error message
4. THE Follow_System SHALL display the count of Followers for each User
5. THE Follow_System SHALL display the count of Following for each User
6. WHEN a User unfollows another User, THE Follow_System SHALL remove the follow relationship

### Requirement 2: Takip Edilen Kullanıcıların İlanlarını Görüntüleme

**User Story:** As a User, I want to see new game listings from users I follow, so that I can quickly find games with players I trust.

#### Acceptance Criteria

1. WHEN a Following creates a new game listing, THE Social_Feed SHALL display it to their Followers
2. THE Social_Feed SHALL display listings in reverse chronological order
3. WHEN a User views their feed, THE Social_Feed SHALL show only listings from users they follow
4. THE Social_Feed SHALL include the timestamp of when each listing was created

### Requirement 3: Direkt Mesajlaşma

**User Story:** As a User, I want to send direct messages to other players after a match is accepted, so that I can coordinate game details.

#### Acceptance Criteria

1. WHEN a Match is accepted, THE Message_System SHALL enable Direct_Message between the participants
2. WHEN a User sends a Direct_Message, THE Message_System SHALL deliver it to the recipient within 5 seconds
3. THE Message_System SHALL store message history for at least 90 days
4. WHEN a User blocks another User, THE Message_System SHALL prevent Direct_Message between them
5. THE Message_System SHALL support text messages up to 2000 characters
6. WHEN a User receives a Direct_Message, THE Notification_System SHALL send a notification

### Requirement 4: Grup Sohbetleri

**User Story:** As a Clan member, I want to participate in group chats, so that I can communicate with my team.

#### Acceptance Criteria

1. WHERE a Clan exists, THE Message_System SHALL provide a Group_Chat for all clan members
2. WHEN a User joins a Clan, THE Message_System SHALL grant them access to the Clan's Group_Chat
3. WHEN a User leaves a Clan, THE Message_System SHALL revoke their access to the Clan's Group_Chat
4. THE Message_System SHALL support Group_Chat with up to 50 participants
5. WHEN a message is sent in Group_Chat, THE Message_System SHALL deliver it to all active members within 5 seconds
6. WHERE a User has admin privileges in a Clan, THE Message_System SHALL allow them to delete messages from the Group_Chat

### Requirement 5: Kullanıcı Değerlendirme

**User Story:** As a User, I want to rate other players after a match, so that the community can identify reliable players.

#### Acceptance Criteria

1. WHEN a Match is completed, THE Rating_System SHALL allow each participant to rate the other participants once
2. THE Rating_System SHALL accept ratings between 1 and 5 stars inclusive
3. WHERE a User provides a rating, THE Rating_System SHALL optionally accept a text comment up to 500 characters
4. WHEN a User submits a rating, THE Rating_System SHALL update the recipient's average rating within 10 seconds
5. THE Rating_System SHALL calculate average rating using all received ratings for a User
6. THE Rating_System SHALL display the average rating with one decimal precision
7. WHEN a User views another User's profile, THE Rating_System SHALL display the average rating and total number of ratings received

### Requirement 6: Güvenilir Oyuncu Rozetleri

**User Story:** As a User, I want to see trusted player badges on profiles, so that I can identify reliable players quickly.

#### Acceptance Criteria

1. WHEN a User's average rating reaches 4.5 stars or higher AND they have received at least 20 ratings, THE Rating_System SHALL award a Trusted_Player_Badge
2. WHEN a User's average rating falls below 4.3 stars, THE Rating_System SHALL remove the Trusted_Player_Badge
3. THE Rating_System SHALL display the Trusted_Player_Badge on the User's profile
4. THE Rating_System SHALL display the Trusted_Player_Badge next to the User's name in game listings

### Requirement 7: Clan Oluşturma ve Yönetimi

**User Story:** As a User, I want to create and manage a clan, so that I can build a team with other players.

#### Acceptance Criteria

1. WHEN a User creates a Clan, THE Clan_Profile SHALL require a unique clan name between 3 and 30 characters
2. THE Clan_Profile SHALL support up to 50 members per Clan
3. WHEN a Clan is created, THE Clan_Profile SHALL assign the creator as the clan admin
4. WHERE a User has admin privileges, THE Clan_Profile SHALL allow them to invite other Users to the Clan
5. WHERE a User has admin privileges, THE Clan_Profile SHALL allow them to remove members from the Clan
6. WHEN a User receives a Clan invitation, THE Notification_System SHALL send a notification
7. WHEN a User accepts a Clan invitation, THE Clan_Profile SHALL add them as a member

### Requirement 8: Clan Profil Sayfası

**User Story:** As a User, I want to view clan profile pages, so that I can see clan information, members, and achievements.

#### Acceptance Criteria

1. THE Clan_Profile SHALL display the clan name, description, and creation date
2. THE Clan_Profile SHALL display a list of all current members
3. THE Clan_Profile SHALL display the total number of matches completed by clan members
4. THE Clan_Profile SHALL display the average rating of all clan members
5. THE Clan_Profile SHALL display any Badges earned by the Clan
6. WHERE a Clan has announcements, THE Clan_Profile SHALL display them in reverse chronological order

### Requirement 9: Clan Sıralaması

**User Story:** As a User, I want to see clan rankings, so that I can compare clans and find competitive teams.

#### Acceptance Criteria

1. THE Leaderboard SHALL rank Clans based on total completed matches
2. THE Leaderboard SHALL display the top 100 Clans
3. THE Leaderboard SHALL update rankings every 24 hours
4. THE Leaderboard SHALL display each Clan's rank, name, member count, and total matches
5. WHEN a User views the Leaderboard, THE Leaderboard SHALL allow filtering by game type

### Requirement 10: Clan Duyuruları

**User Story:** As a clan admin, I want to post announcements, so that I can communicate important information to all members.

#### Acceptance Criteria

1. WHERE a User has admin privileges in a Clan, THE Clan_Profile SHALL allow them to create announcements
2. THE Clan_Profile SHALL support announcements up to 1000 characters
3. WHEN an announcement is created, THE Notification_System SHALL notify all clan members
4. THE Clan_Profile SHALL display announcements for 30 days after creation
5. WHERE a User has admin privileges, THE Clan_Profile SHALL allow them to delete announcements

### Requirement 11: Sosyal Feed Aktiviteleri

**User Story:** As a User, I want to see a feed of activities from users I follow, so that I can stay engaged with the community.

#### Acceptance Criteria

1. WHEN a Following creates a new game listing, THE Social_Feed SHALL create an Activity
2. WHEN a Following completes a Match, THE Social_Feed SHALL create an Activity
3. WHEN a Following earns a Badge, THE Social_Feed SHALL create an Activity
4. WHEN a Following levels up, THE Social_Feed SHALL create an Activity
5. WHEN a Following joins a Clan, THE Social_Feed SHALL create an Activity
6. THE Social_Feed SHALL display Activities in reverse chronological order
7. THE Social_Feed SHALL display Activities from the last 30 days
8. WHEN a User views their Social_Feed, THE Social_Feed SHALL show only Activities from users they follow

### Requirement 12: Sosyal Feed Etkileşimleri

**User Story:** As a User, I want to like and comment on feed activities, so that I can engage with the community.

#### Acceptance Criteria

1. WHEN a User views an Activity, THE Social_Feed SHALL allow them to like it once
2. WHEN a User likes an Activity they already liked, THE Social_Feed SHALL remove the like
3. THE Social_Feed SHALL display the total number of likes for each Activity
4. WHEN a User views an Activity, THE Social_Feed SHALL allow them to add a comment up to 500 characters
5. THE Social_Feed SHALL display comments in chronological order
6. WHEN a User's Activity receives a like or comment, THE Notification_System SHALL send a notification
7. WHERE a User created a comment, THE Social_Feed SHALL allow them to delete it

### Requirement 13: Mesaj Bildirimleri

**User Story:** As a User, I want to receive notifications for new messages, so that I don't miss important communications.

#### Acceptance Criteria

1. WHEN a User receives a Direct_Message, THE Notification_System SHALL create a notification
2. WHEN a message is sent in a Group_Chat the User is part of, THE Notification_System SHALL create a notification
3. THE Notification_System SHALL display unread message count
4. WHEN a User views a message, THE Notification_System SHALL mark the notification as read
5. THE Notification_System SHALL support in-app notifications
6. WHERE a User has enabled email notifications, THE Notification_System SHALL send email notifications for messages

### Requirement 14: Gizlilik Kontrolleri

**User Story:** As a User, I want to control my privacy settings, so that I can manage who can interact with me.

#### Acceptance Criteria

1. THE Follow_System SHALL allow Users to set their profile as public or private
2. WHERE a User has a private profile, THE Follow_System SHALL require approval for follow requests
3. THE Message_System SHALL allow Users to block other Users
4. WHEN a User blocks another User, THE Follow_System SHALL remove any existing follow relationships between them
5. THE Rating_System SHALL allow Users to hide their rating from public view
6. WHERE a User has hidden their rating, THE Rating_System SHALL display it only to the User themselves

### Requirement 15: Değerlendirme Yorumlarının Moderasyonu

**User Story:** As a platform administrator, I want to moderate rating comments, so that I can maintain a respectful community.

#### Acceptance Criteria

1. THE Rating_System SHALL flag comments containing profanity or offensive language
2. WHERE a comment is flagged, THE Rating_System SHALL hide it from public view pending review
3. THE Rating_System SHALL allow Users to report inappropriate comments
4. WHEN a comment receives 3 or more reports, THE Rating_System SHALL automatically hide it pending review
5. THE Rating_System SHALL allow administrators to permanently delete inappropriate comments
