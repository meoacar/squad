#!/bin/bash

# SSL Certificate Renewal Script
# Add to crontab: 0 0 * * * /path/to/ssl-renew.sh

set -e

echo "🔄 Checking SSL certificate renewal..."

# Renew certificates
docker-compose -f docker-compose.prod.yml exec nginx \
    certbot renew --quiet

# Reload nginx if certificates were renewed
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "✅ SSL renewal check completed"
