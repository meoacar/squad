# Bull Queue Setup for Admin Panel

This document describes the Bull queue infrastructure for background job processing in the admin panel.

## Overview

The admin panel uses Bull (backed by Redis) to handle background jobs such as:
- Bulk user actions (suspend, ban)
- Sending notifications
- Bulk data exports
- Daily statistics calculation
- Analytics report generation

## Architecture

### Queues

We have two main queues:

1. **admin** - Handles admin-related background jobs
   - Bulk suspend users
   - Bulk ban users
   - Send notifications
   - Bulk data exports

2. **analytics** - Handles analytics and reporting jobs
   - Daily stats calculation
   - Analytics report generation

### Components

#### Processors

- **AdminProcessor** (`queues/admin.processor.ts`)
  - Processes admin queue jobs
  - Handles bulk operations with progress tracking
  - Implements retry logic with exponential backoff

- **AnalyticsProcessor** (`queues/analytics.processor.ts`)
  - Processes analytics queue jobs
  - Calculates daily statistics
  - Generates analytics reports

#### Services

- **QueueService** (`services/queue.service.ts`)
  - Provides methods to add jobs to queues
  - Monitors job status and queue statistics
  - Handles queue cleanup

- **SchedulerService** (`services/scheduler.service.ts`)
  - Schedules recurring jobs using cron
  - Daily stats calculation (midnight)
  - Queue cleanup (hourly)
  - Queue health monitoring (every 5 minutes)

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional
```

### Redis Connection

Bull is configured in `app.module.ts` to use the same Redis instance as the cache:

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    redis: {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD'),
    },
  }),
  inject: [ConfigService],
})
```

## Usage Examples

### Adding Jobs Programmatically

```typescript
// In your service
constructor(private readonly queueService: QueueService) {}

// Bulk suspend users
await this.queueService.addBulkSuspendJob({
  userIds: ['user1', 'user2', 'user3'],
  dto: { days: 7, reason: 'Spam', notifyUser: true },
  adminId: 'admin-id',
});

// Send notification
await this.queueService.addNotificationJob({
  userId: 'user-id',
  type: 'suspend',
  message: 'Your account has been suspended',
  details: { reason: 'Spam', days: 7 },
});

// Generate analytics report
await this.queueService.addAnalyticsReportJob({
  type: 'users',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  adminId: 'admin-id',
});
```

### Monitoring Jobs

```typescript
// Get job status
const status = await this.queueService.getJobStatus('admin', 'job-id');

// Get queue statistics
const stats = await this.queueService.getQueueStats('admin');
// Returns: { waiting, active, completed, failed, delayed, total }
```

### API Endpoints

#### Get Queue Statistics
```
GET /api/v1/admin/queues/stats
```

Response:
```json
{
  "admin": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 3,
    "delayed": 0,
    "total": 110
  },
  "analytics": {
    "waiting": 0,
    "active": 1,
    "completed": 50,
    "failed": 0,
    "delayed": 0,
    "total": 51
  }
}
```

#### Get Job Status
```
GET /api/v1/admin/queues/:queueName/jobs/:jobId
```

Response:
```json
{
  "id": "123",
  "name": "bulk-suspend",
  "data": { "userIds": [...], "dto": {...} },
  "progress": 75,
  "state": "active",
  "attemptsMade": 1,
  "processedOn": 1234567890,
  "finishedOn": null,
  "failedReason": null,
  "returnvalue": null
}
```

#### Clean Queue
```
POST /api/v1/admin/queues/:queueName/clean
Body: { "grace": 86400000 }  // Optional, default 24 hours
```

## Job Types

### Admin Queue Jobs

#### bulk-suspend
Suspends multiple users in the background.

**Data:**
```typescript
{
  userIds: string[];
  dto: SuspendUserDto;
  adminId: string;
}
```

**Options:**
- Attempts: 3
- Backoff: Exponential (2s delay)

#### bulk-ban
Bans multiple users in the background.

**Data:**
```typescript
{
  userIds: string[];
  dto: BanUserDto;
  adminId: string;
}
```

**Options:**
- Attempts: 3
- Backoff: Exponential (2s delay)

#### send-notification
Sends notification to a user.

**Data:**
```typescript
{
  userId: string;
  type: 'suspend' | 'ban' | 'warning';
  message: string;
  details?: any;
}
```

**Options:**
- Attempts: 5
- Backoff: Exponential (1s delay)

#### bulk-export
Exports data to CSV/Excel.

**Data:**
```typescript
{
  type: 'users' | 'posts' | 'reports' | 'payments';
  filters: any;
  adminId: string;
}
```

**Options:**
- Attempts: 2
- Timeout: 5 minutes

### Analytics Queue Jobs

#### daily-stats
Calculates daily statistics.

**Data:**
```typescript
{
  date?: Date;  // Optional, defaults to yesterday
}
```

**Options:**
- Attempts: 3
- Backoff: Exponential (5s delay)

#### generate-report
Generates analytics report.

**Data:**
```typescript
{
  type: 'users' | 'posts' | 'revenue' | 'engagement';
  startDate: Date;
  endDate: Date;
  adminId: string;
}
```

**Options:**
- Attempts: 2
- Timeout: 10 minutes

## Scheduled Jobs

### Daily Stats (Midnight)
Automatically calculates statistics for the previous day.

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async scheduleDailyStats()
```

### Queue Cleanup (Hourly)
Removes completed/failed jobs older than 24 hours.

```typescript
@Cron(CronExpression.EVERY_HOUR)
async scheduleQueueCleanup()
```

### Queue Health Monitoring (Every 5 minutes)
Monitors queue health and logs warnings if too many failed jobs.

```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async monitorQueueHealth()
```

## Error Handling

All processors implement proper error handling:

1. **Logging**: Errors are logged with context
2. **Retry Logic**: Jobs retry with exponential backoff
3. **Partial Success**: Bulk operations track success/failure per item
4. **Progress Tracking**: Long-running jobs report progress

Example from bulk-suspend:

```typescript
const results = {
  success: [] as string[],
  failed: [] as { userId: string; error: string }[],
};

for (let i = 0; i < userIds.length; i++) {
  try {
    await this.adminService.suspendUser(userId, dto, adminId);
    results.success.push(userId);
    await job.progress(((i + 1) / userIds.length) * 100);
  } catch (error) {
    results.failed.push({ userId, error: error.message });
  }
}
```

## Monitoring

### Bull Board (Optional)

You can add Bull Board for a web UI to monitor queues:

```bash
npm install @bull-board/api @bull-board/nestjs
```

Then configure in your module.

### Logs

All processors log important events:
- Job start/completion
- Progress updates
- Errors and failures
- Queue statistics

Check your application logs for queue activity.

## Best Practices

1. **Job Size**: Keep job data small, store large data in database
2. **Idempotency**: Design jobs to be safely retried
3. **Timeouts**: Set appropriate timeouts for long-running jobs
4. **Cleanup**: Regularly clean old completed/failed jobs
5. **Monitoring**: Monitor queue depth and failed job count
6. **Error Handling**: Always handle errors gracefully
7. **Progress**: Report progress for long-running jobs

## Troubleshooting

### Jobs Not Processing

1. Check Redis connection
2. Verify queue processors are registered in module
3. Check application logs for errors

### High Failed Job Count

1. Check error logs for failure reasons
2. Verify external dependencies (database, APIs)
3. Consider increasing retry attempts or timeout

### Memory Issues

1. Clean old jobs more frequently
2. Reduce job data size
3. Increase Redis memory limit

## Future Enhancements

- [ ] Implement actual notification sending (email, push)
- [ ] Add file storage integration for exports
- [ ] Implement engagement analytics
- [ ] Add Bull Board for web UI
- [ ] Add job priority support
- [ ] Implement job rate limiting
- [ ] Add dead letter queue for failed jobs
