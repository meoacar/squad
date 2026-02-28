#!/bin/bash

# Monitoring Setup Script
# Sets up cron jobs for automated tasks

set -e

echo "📊 Setting up monitoring and automation..."

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Make scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Setup cron jobs
echo "⏰ Setting up cron jobs..."

# Create temporary cron file
CRON_FILE=$(mktemp)

# Add existing cron jobs
crontab -l > "$CRON_FILE" 2>/dev/null || true

# Add new cron jobs if they don't exist
if ! grep -q "backup.sh" "$CRON_FILE"; then
    echo "# Daily backup at 2 AM" >> "$CRON_FILE"
    echo "0 2 * * * $SCRIPT_DIR/backup.sh >> /var/log/squadbul-backup.log 2>&1" >> "$CRON_FILE"
fi

if ! grep -q "ssl-renew.sh" "$CRON_FILE"; then
    echo "# SSL renewal check daily at midnight" >> "$CRON_FILE"
    echo "0 0 * * * $SCRIPT_DIR/ssl-renew.sh >> /var/log/squadbul-ssl.log 2>&1" >> "$CRON_FILE"
fi

if ! grep -q "health-check.sh" "$CRON_FILE"; then
    echo "# Health check every 5 minutes" >> "$CRON_FILE"
    echo "*/5 * * * * $SCRIPT_DIR/health-check.sh >> /var/log/squadbul-health.log 2>&1" >> "$CRON_FILE"
fi

# Install new cron jobs
crontab "$CRON_FILE"
rm "$CRON_FILE"

echo "✅ Cron jobs installed:"
crontab -l | grep squadbul

# Create log directory
mkdir -p /var/log
touch /var/log/squadbul-backup.log
touch /var/log/squadbul-ssl.log
touch /var/log/squadbul-health.log

echo ""
echo "📋 Monitoring Setup Complete!"
echo ""
echo "Automated tasks configured:"
echo "  • Daily backups at 2:00 AM"
echo "  • SSL renewal checks at midnight"
echo "  • Health checks every 5 minutes"
echo ""
echo "Log files:"
echo "  • Backups: /var/log/squadbul-backup.log"
echo "  • SSL: /var/log/squadbul-ssl.log"
echo "  • Health: /var/log/squadbul-health.log"
echo ""
echo "UptimeRobot Setup:"
echo "  1. Go to https://uptimerobot.com"
echo "  2. Add HTTP(s) monitor for: https://$DOMAIN"
echo "  3. Add HTTP(s) monitor for: https://$DOMAIN/api/health"
echo "  4. Set check interval to 5 minutes"
echo "  5. Configure alert contacts (email, SMS, Slack)"
