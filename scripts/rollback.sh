#!/bin/bash

# Rollback Script - Reverts to previous deployment
# Usage: ./scripts/rollback.sh

set -e

echo "⚠️  Starting rollback process..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script should be run as root or with sudo"
    exit 1
fi

# Confirm rollback
read -p "Are you sure you want to rollback? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

# Get previous commit
CURRENT_COMMIT=$(git rev-parse HEAD)
PREVIOUS_COMMIT=$(git rev-parse HEAD~1)

echo "📋 Current commit: $CURRENT_COMMIT"
echo "📋 Rolling back to: $PREVIOUS_COMMIT"

# Checkout previous commit
git checkout $PREVIOUS_COMMIT

# Rebuild and restart services
echo "🏗️  Rebuilding services..."
docker-compose -f docker-compose.prod.yml build

echo "🔄 Restarting services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Health check
echo "🏥 Running health checks..."
./scripts/health-check.sh $DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ Rollback completed successfully!"
    echo "📊 Service status:"
    docker-compose -f docker-compose.prod.yml ps
else
    echo "❌ Rollback health check failed"
    echo "⚠️  Manual intervention may be required"
    exit 1
fi
