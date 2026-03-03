# Social Features API Testing Guide

This directory contains Postman/Insomnia collections for testing the social features API endpoints.

## Collection Files

- `social-features-api.postman_collection.json` - Complete API collection for all social features

## Features Covered

### 1. Follow System
- Follow/unfollow users
- Get followers and following lists
- Follow request management (for private profiles)
- Follower/following counts

### 2. Message System
- Direct messaging between users
- Group chat (clan messaging)
- Conversation management
- Message read status
- Unread message count

### 3. Rating System
- Rate users after matches
- View user ratings and averages
- Trusted player badge system
- Comment moderation (report, hide, delete)

### 4. Clan System
- Create and manage clans
- Member management (invite, accept, remove)
- Clan announcements
- Clan statistics
- Clan leaderboard

### 5. Social Feed
- View activity feed from followed users
- Like and comment on activities
- Activity types: game listings, matches, badges, level ups, clan joins

### 6. Privacy System
- Profile visibility (public/private)
- Rating visibility
- Block/unblock users
- Notification preferences

## Setup Instructions

### For Postman

1. Open Postman
2. Click "Import" button
3. Select `social-features-api.postman_collection.json`
4. The collection will be imported with all endpoints organized by feature

### For Insomnia

1. Open Insomnia
2. Click "Import/Export" → "Import Data" → "From File"
3. Select `social-features-api.postman_collection.json`
4. The collection will be imported (Insomnia supports Postman v2.1 format)

## Environment Variables

Set up the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000` |
| `access_token` | JWT authentication token | Get from login endpoint |
| `user_id` | Current user ID | UUID from user profile |
| `other_user_id` | Another user ID for testing | UUID of test user |
| `clan_id` | Clan ID for testing | UUID of test clan |
| `activity_id` | Activity ID for testing | UUID of test activity |
| `message_id` | Message ID for testing | UUID of test message |
| `conversation_id` | Conversation ID | UUID of conversation |

## Testing Workflow

### 1. Authentication
First, authenticate to get an access token:
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

Copy the `access_token` from the response and set it in your environment variables.

### 2. Follow System Testing

**Test Flow:**
1. Follow a user → `POST /follow/:userId`
2. Check if following → `GET /follow/:userId/is-following`
3. Get followers list → `GET /follow/:userId/followers`
4. Get following list → `GET /follow/:userId/following`
5. Unfollow user → `DELETE /follow/:userId`

**Private Profile Flow:**
1. Set profile to private → `POST /privacy/profile-visibility` (visibility: PRIVATE)
2. Another user follows → `POST /follow/:userId` (creates follow request)
3. Get pending requests → `GET /follow/requests/pending`
4. Approve request → `POST /follow/requests/:requestId/approve`

### 3. Message System Testing

**Direct Message Flow:**
1. Send direct message → `POST /messages/direct`
2. Get conversations → `GET /messages/conversations`
3. Get messages with user → `GET /messages/direct/:userId`
4. Mark as read → `POST /messages/:messageId/read`
5. Check unread count → `GET /messages/unread/count`

**Group Chat Flow:**
1. Create clan → `POST /clans`
2. Send group message → `POST /messages/group`
3. Get group messages → `GET /messages/group/:clanId`
4. Delete message (admin) → `DELETE /messages/group/:messageId`

### 4. Rating System Testing

**Rating Flow:**
1. Check if can rate → `GET /ratings/can-rate/:userId/:matchId`
2. Rate user → `POST /ratings`
3. Get user ratings → `GET /ratings/user/:userId`
4. Get average rating → `GET /ratings/user/:userId/average`
5. Check trusted badge → `GET /ratings/user/:userId/trusted-badge`

**Moderation Flow:**
1. Report comment → `POST /ratings/:ratingId/report`
2. Hide comment (admin) → `POST /ratings/:ratingId/hide`
3. Delete comment (admin) → `DELETE /ratings/:ratingId`

### 5. Clan System Testing

**Clan Creation Flow:**
1. Create clan → `POST /clans`
2. Get clan details → `GET /clans/:clanId`
3. Update clan → `PATCH /clans/:clanId`
4. Get clan members → `GET /clans/:clanId/members`

**Member Management Flow:**
1. Invite member → `POST /clans/:clanId/invite`
2. Accept invitation → `POST /clans/invitations/:invitationId/accept`
3. Remove member → `DELETE /clans/:clanId/members/:userId`
4. Leave clan → `POST /clans/:clanId/leave`

**Announcements Flow:**
1. Create announcement → `POST /clans/:clanId/announcements`
2. Get announcements → `GET /clans/:clanId/announcements`
3. Delete announcement → `DELETE /clans/announcements/:announcementId`

**Leaderboard:**
- Get leaderboard → `GET /clans/leaderboard?gameType=PUBG&limit=100`

### 6. Social Feed Testing

**Feed Flow:**
1. Follow users → `POST /follow/:userId`
2. Get feed → `GET /social-feed/feed`
3. Like activity → `POST /social-feed/activities/:activityId/like`
4. Comment on activity → `POST /social-feed/activities/:activityId/comments`
5. Get activity comments → `GET /social-feed/activities/:activityId/comments`

### 7. Privacy System Testing

**Privacy Settings Flow:**
1. Set profile visibility → `POST /privacy/profile-visibility`
2. Set rating visibility → `POST /privacy/rating-visibility`
3. Update notification preferences → `POST /privacy/notification-preferences`

**Blocking Flow:**
1. Block user → `POST /privacy/block/:userId`
2. Check if blocked → `GET /privacy/is-blocked/:userId`
3. Get blocked users → `GET /privacy/blocked-users`
4. Unblock user → `DELETE /privacy/block/:userId`

## Expected Responses

### Success Responses

All successful requests return:
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Responses

Errors return appropriate HTTP status codes:

- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate or conflicting operation
- `429 Too Many Requests` - Rate limit exceeded

Error format:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

## Rate Limiting

The API implements rate limiting:

- Follow operations: 20 requests per minute
- Messages: 30 requests per minute
- Ratings: 10 requests per 5 minutes
- Comments: 20 requests per minute

## WebSocket Testing

For real-time messaging, connect to WebSocket:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for new messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
});

// Send message
socket.emit('message:send', {
  recipientId: 'user-uuid',
  content: 'Hello!'
});
```

## Testing Checklist

### Follow System
- [ ] Follow public profile user
- [ ] Follow private profile user (creates request)
- [ ] Approve follow request
- [ ] Reject follow request
- [ ] Unfollow user
- [ ] Get followers list with pagination
- [ ] Get following list with pagination
- [ ] Verify follower/following counts
- [ ] Attempt to follow self (should fail)
- [ ] Attempt duplicate follow (should fail)

### Message System
- [ ] Send direct message
- [ ] Receive direct message
- [ ] Get conversation list
- [ ] Get messages with pagination
- [ ] Mark message as read
- [ ] Get unread count
- [ ] Send group message
- [ ] Delete group message (admin)
- [ ] Attempt to message blocked user (should fail)
- [ ] Verify message length limit (2000 chars)

### Rating System
- [ ] Rate user after match
- [ ] View user ratings
- [ ] Calculate average rating
- [ ] Award trusted badge (4.5+ rating, 20+ ratings)
- [ ] Remove trusted badge (below 4.3)
- [ ] Report inappropriate comment
- [ ] Hide comment (admin)
- [ ] Delete comment (admin)
- [ ] Attempt duplicate rating (should fail)
- [ ] Verify rating range (1-5)

### Clan System
- [ ] Create clan
- [ ] Update clan details
- [ ] Invite member
- [ ] Accept invitation
- [ ] Reject invitation
- [ ] Remove member
- [ ] Leave clan
- [ ] Create announcement
- [ ] Delete announcement
- [ ] View leaderboard
- [ ] Verify member limit (50)
- [ ] Verify name length (3-30 chars)

### Social Feed
- [ ] View personal feed
- [ ] View user activities
- [ ] Like activity
- [ ] Unlike activity
- [ ] Comment on activity
- [ ] Delete own comment
- [ ] Verify activity types
- [ ] Verify chronological order
- [ ] Verify 30-day filter

### Privacy System
- [ ] Set profile to private
- [ ] Set profile to public
- [ ] Hide rating
- [ ] Show rating
- [ ] Block user
- [ ] Unblock user
- [ ] Update notification preferences
- [ ] Verify block removes follows
- [ ] Verify block prevents messaging

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Ensure `access_token` is set in environment variables
   - Token may have expired, login again

2. **404 Not Found**
   - Verify the resource ID exists
   - Check if the endpoint path is correct

3. **409 Conflict**
   - Resource already exists (e.g., already following)
   - Try the opposite operation (e.g., unfollow first)

4. **429 Rate Limit**
   - Wait for the rate limit window to reset
   - Reduce request frequency

### Debug Mode

Enable debug logging in the backend:
```bash
NODE_ENV=development npm run start:dev
```

## Additional Resources

- [API Documentation](../docs/api.md)
- [Requirements Document](../.kiro/specs/social-features/requirements.md)
- [Design Document](../.kiro/specs/social-features/design.md)
- [WebSocket Events](../docs/websocket-events.md)
