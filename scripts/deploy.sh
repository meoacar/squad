#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting deployment process..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script should be run as root or with sudo"
    exit 1
fi

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.production file not found"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "⏸️  Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

echo "▶️  Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run migration:run

# Health check
echo "🏥 Running health checks..."
./scripts/health-check.sh $DOMAIN

# Cleanup
echo "🧹 Cleaning up old Docker images..."
docker system prune -af --volumes

echo "✅ Deployment completed successfully!"
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps
