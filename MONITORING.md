# 📊 Monitoring & Observability Guide

Complete guide for monitoring SquadBul in production.

## Overview

The monitoring stack includes:
- Health checks (automated)
- Log aggregation
- Performance metrics
- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)

## Health Checks

### Automated Health Checks

Health checks run every 5 minutes via cron:

```bash
# View health check logs
tail -f /var/log/squadbul-health.log

# Manual health check
./scripts/health-check.sh your-domain.com
```

### Endpoints

- **Frontend**: `https://your-domain.com`
- **API Health**: `https://your-domain.com/api/health`
- **Nginx Health**: `https://your-domain.com/health`

## UptimeRobot Setup

### 1. Create Account
Visit https://uptimerobot.com and create a free account.

### 2. Add Monitors

#### Main Website Monitor
- **Type**: HTTP(s)
- **URL**: `https://your-domain.com`
- **Monitoring Interval**: 5 minutes
- **Monitor Timeout**: 30 seconds

#### API Health Monitor
- **Type**: HTTP(s)
- **URL**: `https://your-domain.com/api/health`
- **Monitoring Interval**: 5 minutes
- **Monitor Timeout**: 30 seconds
- **Expected Status**: 200

### 3. Configure Alerts

#### Email Alerts
- Add your email address
- Enable notifications for:
  - Down events
  - Up events (recovery)
  - SSL certificate expiration

#### SMS Alerts (Optional)
- Add phone number
- Configure for critical alerts only

#### Slack Integration (Optional)
```bash
# Webhook URL format
https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Alert format
{
  "text": "*[{monitorFriendlyName}]* is {alertTypeFriendlyName}",
  "attachments": [{
    "color": "{alertTypeColor}",
    "fields": [{
      "title": "Status",
      "value": "{alertDetails}",
      "short": true
    }]
  }]
}
```

## Docker Logs

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend

# Since specific time
docker-compose -f docker-compose.prod.yml logs --since 2024-01-01T00:00:00 backend
```

### Log Rotation

Logs are automatically rotated with these settings:
- **Max size**: 10MB per file
- **Max files**: 3 files per service
- **Total per service**: ~30MB

### Log Locations

```bash
# Nginx logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log

# Application logs
/var/log/squadbul-backup.log
/var/log/squadbul-ssl.log
/var/log/squadbul-health.log
```

## Performance Metrics

### Container Stats

```bash
# Real-time stats
docker stats

# Specific container
docker stats squadbul-backend

# Format output
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Database Metrics

```bash
# Connection count
docker exec squadbul-postgres psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Database size
docker exec squadbul-postgres psql -U postgres -c \
  "SELECT pg_size_pretty(pg_database_size('squadbul'));"

# Table sizes
docker exec squadbul-postgres psql -U postgres -d squadbul -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
   FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"

# Slow queries
docker exec squadbul-postgres psql -U postgres -d squadbul -c \
  "SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;"
```

### Redis Metrics

```bash
# Redis info
docker exec squadbul-redis redis-cli INFO

# Memory usage
docker exec squadbul-redis redis-cli INFO memory

# Connected clients
docker exec squadbul-redis redis-cli CLIENT LIST

# Key count
docker exec squadbul-redis redis-cli DBSIZE
```

## Error Tracking with Sentry

### Setup

1. Create account at https://sentry.io
2. Create new project for Next.js
3. Get DSN from project settings

### Configuration

```bash
# Add to .env.production
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token
```

### Features

- **Error tracking**: Automatic error capture
- **Performance monitoring**: Transaction tracking
- **Release tracking**: Deploy notifications
- **Source maps**: Original code in stack traces

## Alerts & Notifications

### Critical Alerts

Immediate notification for:
- Service downtime
- Database connection failures
- High error rates (>5% of requests)
- SSL certificate expiration (<7 days)
- Disk space critical (<10% free)

### Warning Alerts

Notification within 1 hour for:
- High CPU usage (>80% for 5 minutes)
- High memory usage (>85% for 5 minutes)
- Slow response times (>2s average)
- Failed backup jobs

### Info Alerts

Daily digest for:
- Successful deployments
- Backup completion
- SSL renewal
- Performance summaries

## Dashboards

### System Dashboard

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Network connections
netstat -tulpn

# Process list
ps aux | grep node
```

### Docker Dashboard

```bash
# Container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats --no-stream

# Network inspection
docker network inspect squadbul-network

# Volume usage
docker system df -v
```

## Backup Monitoring

### Verify Backups

```bash
# List recent backups
ls -lh /backups/ | tail -10

# Check backup size
du -sh /backups/*

# Verify backup integrity
gunzip -t /backups/postgres_backup_*.sql.gz
```

### Backup Alerts

```bash
# Add to monitoring-setup.sh
if [ ! -f "/backups/postgres_backup_$(date +%Y%m%d)*.sql.gz" ]; then
    echo "❌ Backup missing for today!" | mail -s "Backup Alert" admin@your-domain.com
fi
```

## SSL Certificate Monitoring

### Check Certificate

```bash
# Certificate details
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Days until expiration
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | \
  openssl x509 -noout -checkend 604800
```

### Auto-renewal

SSL certificates auto-renew via cron:
```bash
# Check renewal logs
tail -f /var/log/squadbul-ssl.log
```

## Troubleshooting

### High CPU Usage

```bash
# Identify process
docker stats --no-stream | sort -k3 -h

# Check backend logs
docker-compose -f docker-compose.prod.yml logs --tail=100 backend

# Restart if needed
docker-compose -f docker-compose.prod.yml restart backend
```

### High Memory Usage

```bash
# Check memory by container
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# Clear Redis cache if needed
docker exec squadbul-redis redis-cli FLUSHDB
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -af --volumes

# Clean old logs
find /var/log -name "*.log" -mtime +30 -delete

# Clean old backups
find /backups -name "*.sql.gz" -mtime +7 -delete
```

### Database Connection Issues

```bash
# Check connections
docker exec squadbul-postgres psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
docker exec squadbul-postgres psql -U postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE state = 'idle' AND state_change < now() - interval '1 hour';"

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

## Best Practices

1. **Regular Reviews**: Check dashboards daily
2. **Alert Tuning**: Adjust thresholds to reduce noise
3. **Backup Testing**: Regularly test restore procedures
4. **Documentation**: Keep runbooks updated
5. **Incident Response**: Have escalation procedures
6. **Capacity Planning**: Monitor trends for scaling decisions

## Metrics to Track

### Application Metrics
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users

### Infrastructure Metrics
- CPU usage (%)
- Memory usage (%)
- Disk usage (%)
- Network I/O

### Business Metrics
- User registrations
- Active sessions
- API usage
- Feature adoption

## Support

For monitoring issues:
- Check logs first
- Review recent deployments
- Consult troubleshooting guide
- Contact DevOps team if needed
