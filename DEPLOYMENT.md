# 🚀 Deployment Guide

Complete guide for deploying SquadBul to production.

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name configured with DNS pointing to your server
- Root or sudo access

## Quick Start

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Clone repository
git clone https://github.com/your-org/squadbul.git
cd squadbul
```

### 2. Configure Environment

```bash
# Copy and edit production environment file
cp .env.production .env.production.local
nano .env.production.local

# Required variables:
# - POSTGRES_PASSWORD (strong password)
# - REDIS_PASSWORD (strong password)
# - JWT_SECRET (min 32 characters)
# - DOMAIN (your domain name)
# - EMAIL (your email for SSL)
```

### 3. SSL Setup

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Setup SSL with Let's Encrypt
sudo ./scripts/ssl-setup.sh your-domain.com admin@your-domain.com
```

### 4. Deploy Application

```bash
# Deploy to production
sudo ./scripts/deploy.sh
```

### 5. Setup Monitoring

```bash
# Configure automated backups and health checks
sudo ./scripts/monitoring-setup.sh
```

## Architecture

```
┌─────────────┐
│   Internet  │
└──────┬──────┘
       │
┌──────▼──────────────────────────────┐
│  Nginx (Port 80/443)                │
│  - SSL Termination                  │
│  - Rate Limiting                    │
│  - Gzip Compression                 │
└──────┬──────────────────────────────┘
       │
       ├─────────────┬─────────────────┐
       │             │                 │
┌──────▼──────┐ ┌───▼────────┐ ┌─────▼─────┐
│  Frontend   │ │  Backend   │ │  Redis    │
│  (Next.js)  │ │  (NestJS)  │ │  (Cache)  │
│  Port 3000  │ │  Port 3001 │ └───────────┘
└─────────────┘ └──────┬─────┘
                       │
                ┌──────▼──────┐
                │  PostgreSQL │
                │  (Database) │
                └─────────────┘
```

## Docker Services

### Production Stack (docker-compose.prod.yml)

- **postgres**: PostgreSQL 16 database
- **redis**: Redis 7 cache and queue
- **backend**: NestJS API server
- **frontend**: Next.js web application
- **nginx**: Reverse proxy with SSL

## Scripts

### Deployment

```bash
# Full deployment
./scripts/deploy.sh

# SSL setup
./scripts/ssl-setup.sh your-domain.com admin@your-domain.com

# SSL renewal (automated via cron)
./scripts/ssl-renew.sh
```

### Backup & Restore

```bash
# Create backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh /backups/postgres_backup_20240101_120000.sql.gz

# Backups are stored in: /backups
# Retention: 7 days (configurable in backup.sh)
```

### Monitoring

```bash
# Health check
./scripts/health-check.sh your-domain.com

# Setup automated monitoring
./scripts/monitoring-setup.sh
```

## CI/CD Pipeline

GitHub Actions workflows are configured for:

### 1. CI/CD Pipeline (.github/workflows/ci-cd.yml)

- **Backend Tests**: Unit tests, integration tests, linting
- **Frontend Tests**: Unit tests, E2E tests, build verification
- **Docker Build**: Multi-stage optimized images
- **Deployment**: Automated deployment to production

### 2. Security Scan (.github/workflows/security-scan.yml)

- **Dependency Scan**: npm audit, Snyk
- **Docker Scan**: Trivy vulnerability scanning
- **Code Scan**: CodeQL static analysis

### Required GitHub Secrets

```bash
DEPLOY_HOST=your-server-ip
DEPLOY_USER=deploy-user
DEPLOY_KEY=ssh-private-key
SLACK_WEBHOOK=slack-webhook-url (optional)
SNYK_TOKEN=snyk-api-token (optional)
```

## Monitoring Setup

### UptimeRobot Configuration

1. Create account at https://uptimerobot.com
2. Add monitors:
   - **Main Site**: https://your-domain.com (every 5 min)
   - **API Health**: https://your-domain.com/api/health (every 5 min)
3. Configure alerts:
   - Email notifications
   - SMS alerts (optional)
   - Slack integration (optional)

### Automated Tasks (Cron)

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup.sh

# SSL renewal check at midnight
0 0 * * * /path/to/scripts/ssl-renew.sh

# Health check every 5 minutes
*/5 * * * * /path/to/scripts/health-check.sh
```

## Performance Optimization

### Nginx Configuration

- **Gzip compression** for text assets
- **Rate limiting** to prevent abuse
- **Connection pooling** with keepalive
- **Static file caching** (1 year)
- **HTTP/2** enabled

### Docker Optimization

- **Multi-stage builds** for minimal image size
- **Layer caching** for faster builds
- **Health checks** for all services
- **Resource limits** configured
- **Log rotation** enabled

### Database Optimization

- **Connection pooling** in TypeORM
- **Query optimization** with indexes
- **Regular backups** with compression
- **Automated cleanup** of old data

## Security

### SSL/TLS

- **Let's Encrypt** certificates
- **TLS 1.2/1.3** only
- **HSTS** enabled
- **Auto-renewal** via cron

### Headers

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security

### Rate Limiting

- API: 10 requests/second
- General: 30 requests/second
- Connection limit: 10 per IP

## Troubleshooting

### Check Service Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Restart Services

```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Issues

```bash
# Connect to database
docker exec -it squadbul-postgres psql -U postgres -d squadbul

# Check connections
docker exec squadbul-postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

### SSL Issues

```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiry
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Scaling

### Horizontal Scaling

```yaml
# Add more backend instances
backend:
  deploy:
    replicas: 3
```

### Database Scaling

- Consider PostgreSQL replication
- Use read replicas for heavy read workloads
- Implement connection pooling (PgBouncer)

### Caching Strategy

- Redis for session storage
- API response caching
- Static asset CDN

## Maintenance

### Regular Tasks

- **Daily**: Automated backups
- **Weekly**: Review logs and metrics
- **Monthly**: Security updates
- **Quarterly**: Performance review

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./scripts/deploy.sh
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/squadbul/issues
- Documentation: https://docs.your-domain.com
- Email: support@your-domain.com
