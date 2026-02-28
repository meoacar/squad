#!/bin/bash

# SSL Setup Script with Let's Encrypt
# Usage: ./scripts/ssl-setup.sh your-domain.com admin@your-domain.com

set -e

DOMAIN=${1:-your-domain.com}
EMAIL=${2:-admin@your-domain.com}

echo "🔐 Setting up SSL for $DOMAIN"

# Check if domain is provided
if [ "$DOMAIN" = "your-domain.com" ]; then
    echo "❌ Error: Please provide your domain name"
    echo "Usage: ./scripts/ssl-setup.sh your-domain.com admin@your-domain.com"
    exit 1
fi

# Update nginx configuration with actual domain
echo "📝 Updating nginx configuration..."
sed -i.bak "s/your-domain.com/$DOMAIN/g" docker/nginx/nginx.conf

# Start nginx without SSL first
echo "🚀 Starting nginx for certificate generation..."
docker-compose -f docker-compose.prod.yml up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 5

# Generate SSL certificate
echo "🔑 Generating SSL certificate..."
docker-compose -f docker-compose.prod.yml exec nginx \
    certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Reload nginx with SSL
echo "🔄 Reloading nginx with SSL..."
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "✅ SSL setup completed successfully!"
echo "📋 Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "🔄 Certificate will auto-renew via cron job"
