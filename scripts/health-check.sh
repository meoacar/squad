#!/bin/bash

# Health Check Script for Monitoring
# Can be used with UptimeRobot or other monitoring services

set -e

DOMAIN=${1:-localhost}
API_URL="https://$DOMAIN/api/health"
FRONTEND_URL="https://$DOMAIN"

echo "🏥 Running health checks..."

# Check API health
echo "Checking API: $API_URL"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ "$API_STATUS" -eq 200 ]; then
    echo "✅ API is healthy (Status: $API_STATUS)"
else
    echo "❌ API is unhealthy (Status: $API_STATUS)"
    exit 1
fi

# Check Frontend
echo "Checking Frontend: $FRONTEND_URL"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)

if [ "$FRONTEND_STATUS" -eq 200 ]; then
    echo "✅ Frontend is healthy (Status: $FRONTEND_STATUS)"
else
    echo "❌ Frontend is unhealthy (Status: $FRONTEND_STATUS)"
    exit 1
fi

# Check Docker containers
echo "Checking Docker containers..."
CONTAINERS=$(docker-compose -f docker-compose.prod.yml ps --services --filter "status=running")

REQUIRED_SERVICES=("postgres" "redis" "backend" "frontend" "nginx")
for service in "${REQUIRED_SERVICES[@]}"; do
    if echo "$CONTAINERS" | grep -q "^$service$"; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
        exit 1
    fi
done

echo "✅ All health checks passed!"
