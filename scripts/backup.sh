#!/bin/bash

# Automated Backup Script for PostgreSQL and Redis
# Add to crontab: 0 2 * * * /path/to/backup.sh

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
POSTGRES_CONTAINER="squadbul-postgres"
REDIS_CONTAINER="squadbul-redis"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "🔄 Starting backup process at $(date)"

# PostgreSQL Backup
echo "📦 Backing up PostgreSQL database..."
docker exec $POSTGRES_CONTAINER pg_dump -U postgres -d squadbul | \
    gzip > "$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql.gz"

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL backup completed: postgres_backup_$TIMESTAMP.sql.gz"
else
    echo "❌ PostgreSQL backup failed"
    exit 1
fi

# Redis Backup
echo "📦 Backing up Redis data..."
docker exec $REDIS_CONTAINER redis-cli --rdb /data/dump.rdb SAVE
docker cp $REDIS_CONTAINER:/data/dump.rdb "$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb"

if [ $? -eq 0 ]; then
    echo "✅ Redis backup completed: redis_backup_$TIMESTAMP.rdb"
else
    echo "❌ Redis backup failed"
    exit 1
fi

# Cleanup old backups
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "postgres_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "redis_backup_*.rdb" -mtime +$RETENTION_DAYS -delete

# Calculate backup sizes
POSTGRES_SIZE=$(du -h "$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql.gz" | cut -f1)
REDIS_SIZE=$(du -h "$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb" | cut -f1)

echo "📊 Backup Summary:"
echo "   PostgreSQL: $POSTGRES_SIZE"
echo "   Redis: $REDIS_SIZE"
echo "   Location: $BACKUP_DIR"
echo "✅ Backup process completed at $(date)"

# Optional: Upload to cloud storage (uncomment and configure)
# aws s3 cp "$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql.gz" s3://your-bucket/backups/
# aws s3 cp "$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb" s3://your-bucket/backups/
