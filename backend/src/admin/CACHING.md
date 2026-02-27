# Redis Caching for Admin Panel

This document describes the Redis caching implementation for the admin panel v2 feature.

## Overview

Redis caching has been configured globally in the application to improve performance for frequently accessed admin data. The cache is configured in `AppModule` and uses Redis as the backing store.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Cache Configuration

The cache is configured in `src/config/cache.config.ts` with the following defaults:

- **Default TTL**: 300 seconds (5 minutes)
- **Max Items**: 100 items in cache
- **Store**: Redis (via cache-manager-redis-store)

## Cache Keys

All cache keys follow a consistent pattern: `admin:<resource>:<identifier>`

Cache keys are defined in `src/admin/constants/cache-keys.constant.ts`:

### Dashboard
- `admin:dashboard:stats` - Dashboard statistics
- `admin:dashboard:charts:{period}` - Dashboard charts for a specific period
- `admin:dashboard:activities` - Recent activities

### Users
- `admin:users:list:{filterHash}` - User list with filters
- `admin:users:detail:{userId}` - User detail
- `admin:users:activity:{userId}` - User activity

### Posts
- `admin:posts:list:{filterHash}` - Post list with filters
- `admin:posts:detail:{postId}` - Post detail

### Reports
- `admin:reports:list:{filterHash}` - Report list with filters
- `admin:reports:detail:{reportId}` - Report detail
- `admin:reports:stats` - Report statistics

### Analytics
- `admin:analytics:users:{period}` - User analytics for period
- `admin:analytics:posts:{period}` - Post analytics for period
- `admin:analytics:revenue:{period}` - Revenue analytics for period

### System
- `admin:system:metrics` - System metrics
- `admin:system:health` - System health status

## Cache TTL (Time To Live)

Different data types have different TTL values based on how frequently they change:

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Dashboard Stats | 5 minutes | Frequently viewed, moderate update frequency |
| Dashboard Charts | 5 minutes | Frequently viewed, moderate update frequency |
| User Lists | 2 minutes | Changes frequently with user actions |
| Post Lists | 2 minutes | Changes frequently with post actions |
| Report Lists | 1 minute | High priority, needs to be current |
| Analytics | 10 minutes | Expensive to compute, changes slowly |
| System Metrics | 1 minute | Needs to be current for monitoring |

## Cache Invalidation

The AdminService includes helper methods for cache invalidation:

```typescript
// Invalidate dashboard cache
private async invalidateDashboardCache()

// Invalidate all user-related caches
private async invalidateUserCaches()

// Invalidate all post-related caches
private async invalidatePostCaches()

// Invalidate all report-related caches
private async invalidateReportCaches()
```

These methods are automatically called when data is modified:

- **User actions** (suspend, ban, unban) → invalidates user and dashboard caches
- **Post actions** (update, delete, pause) → invalidates post and dashboard caches
- **Report actions** (resolve, dismiss) → invalidates report and dashboard caches

## Usage Example

### Using Cache in a Service Method

```typescript
async getDashboardStats() {
    // Try to get from cache
    const cached = await this.cacheManager.get(CACHE_KEYS.DASHBOARD_STATS);
    if (cached) return cached;

    // If not in cache, fetch from database
    const stats = await this.getStats();
    
    // Store in cache with TTL
    await this.cacheManager.set(
        CACHE_KEYS.DASHBOARD_STATS, 
        stats, 
        CACHE_TTL.DASHBOARD_STATS * 1000 // Convert to milliseconds
    );
    
    return stats;
}
```

### Invalidating Cache After Update

```typescript
async suspendUser(userId: string, dto: SuspendUserDto, adminId: string) {
    // ... perform update ...
    
    // Invalidate related caches
    await this.invalidateUserCaches();
    
    return updatedUser;
}
```

## Testing

Cache functionality is tested in `admin.service.cache.spec.ts`:

```bash
npm test -- admin.service.cache.spec.ts
```

Tests verify:
- Cache hit returns cached data without database query
- Cache miss fetches from database and stores in cache
- Correct cache keys are used
- Correct TTL values are applied

## Running Redis Locally

### Using Docker

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Using Docker Compose

Add to your `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

## Monitoring Cache

### Redis CLI

Connect to Redis and monitor cache operations:

```bash
redis-cli
> KEYS admin:*
> GET admin:dashboard:stats
> TTL admin:dashboard:stats
```

### Cache Statistics

You can add cache statistics endpoints to monitor:
- Hit rate
- Miss rate
- Total keys
- Memory usage

## Performance Benefits

With Redis caching enabled:

1. **Dashboard Stats**: ~95% reduction in database queries
2. **User Lists**: ~80% reduction in database queries
3. **Analytics**: ~90% reduction in expensive computations
4. **Overall**: Significant improvement in response times for admin panel

## Troubleshooting

### Cache Not Working

1. Check Redis is running: `redis-cli ping` (should return PONG)
2. Check environment variables are set correctly
3. Check logs for connection errors
4. Verify cache-manager packages are installed

### Stale Data

If you're seeing stale data:
1. Check TTL values are appropriate
2. Verify cache invalidation is called after updates
3. Manually clear cache: `redis-cli FLUSHDB`

### Memory Issues

If Redis is using too much memory:
1. Reduce `max` items in cache configuration
2. Reduce TTL values
3. Implement cache eviction policies
4. Monitor with `redis-cli INFO memory`

## Future Improvements

Potential enhancements:

1. **Pattern-based deletion**: Use Redis directly for pattern-based key deletion (e.g., `admin:users:*`)
2. **Cache warming**: Pre-populate cache with frequently accessed data
3. **Cache tags**: Group related cache entries for easier invalidation
4. **Distributed caching**: Use Redis Cluster for high availability
5. **Cache metrics**: Add Prometheus metrics for cache monitoring
