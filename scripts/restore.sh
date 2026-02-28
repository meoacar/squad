#!/bin/bash

# Database Restore Script
# Usage: ./scripts/restore.sh postgres_backup_20240101_120000.sql.gz

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Backup file not specified"
    echo "Usage: ./scripts/restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh /backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1
POSTGRES_CONTAINER="squadbul-postgres"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will restore the database from backup"
echo "   Backup file: $BACKUP_FILE"
echo "   This will overwrite the current database!"
read -p "Are you sure? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🔄 Starting restore process..."

# Stop backend to prevent connections
echo "⏸️  Stopping backend service..."
docker-compose -f docker-compose.prod.yml stop backend

# Restore database
echo "📦 Restoring PostgreSQL database..."
gunzip -c "$BACKUP_FILE" | docker exec -i $POSTGRES_CONTAINER \
    psql -U postgres -d squadbul

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
else
    echo "❌ Database restore failed"
    exit 1
fi

# Start backend
echo "▶️  Starting backend service..."
docker-compose -f docker-compose.prod.yml start backend

echo "✅ Restore process completed at $(date)"
