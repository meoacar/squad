# 🚀 Production Deployment Checklist

Complete checklist for deploying SquadBul to production.

## Pre-Deployment

### Server Setup
- [ ] Ubuntu 20.04+ server provisioned
- [ ] Domain name configured and DNS pointing to server
- [ ] SSH access configured with key-based authentication
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] Docker and Docker Compose installed
- [ ] Git installed

### Repository Setup
- [ ] Repository cloned to `/opt/squadbul`
- [ ] All scripts made executable (`chmod +x scripts/*.sh`)
- [ ] `.env.production` configured with secure values
- [ ] Secrets generated (JWT_SECRET, passwords)

### Security
- [ ] Strong passwords generated for:
  - [ ] PostgreSQL (`POSTGRES_PASSWORD`)
  - [ ] Redis (`REDIS_PASSWORD`)
  - [ ] JWT secret (`JWT_SECRET` - min 32 chars)
- [ ] SSH key-based authentication enabled
- [ ] Root login disabled
- [ ] Fail2ban installed and configured
- [ ] UFW firewall enabled

## Initial Deployment

### SSL Setup
- [ ] Domain DNS propagated (check with `nslookup your-domain.com`)
- [ ] Email configured for Let's Encrypt
- [ ] SSL setup script executed: `./scripts/ssl-setup.sh your-domain.com admin@your-domain.com`
- [ ] SSL certificate generated successfully
- [ ] HTTPS working (test at `https://your-domain.com`)
- [ ] HTTP to HTTPS redirect working

### Application Deployment
- [ ] Environment variables configured
- [ ] Docker images built successfully
- [ ] All containers started: `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Database migrations run: `docker-compose -f docker-compose.prod.yml exec backend npm run migration:run`
- [ ] Health checks passing: `./scripts/health-check.sh your-domain.com`

### Verification
- [ ] Frontend accessible at `https://your-domain.com`
- [ ] API health endpoint responding: `https://your-domain.com/api/health`
- [ ] User registration working
- [ ] User login working
- [ ] Database connections stable
- [ ] Redis cache working

## Monitoring Setup

### Automated Tasks
- [ ] Monitoring setup script executed: `./scripts/monitoring-setup.sh`
- [ ] Cron jobs configured:
  - [ ] Daily backups (2 AM)
  - [ ] SSL renewal checks (midnight)
  - [ ] Health checks (every 5 minutes)
- [ ] Log files created and writable

### UptimeRobot
- [ ] Account created at https://uptimerobot.com
- [ ] Main site monitor added (`https://your-domain.com`)
- [ ] API health monitor added (`https://your-domain.com/api/health`)
- [ ] Alert contacts configured (email, SMS, Slack)
- [ ] Test alerts sent and received

### Backup System
- [ ] Backup directory created (`/backups`)
- [ ] Manual backup test: `./scripts/backup.sh`
- [ ] Backup files created successfully
- [ ] Restore test: `./scripts/restore.sh <backup-file>`
- [ ] Backup retention configured (7 days)

## CI/CD Setup

### GitHub Actions
- [ ] GitHub repository connected
- [ ] Secrets configured:
  - [ ] `DEPLOY_HOST` - Server IP address
  - [ ] `DEPLOY_USER` - Deployment user
  - [ ] `DEPLOY_KEY` - SSH private key
  - [ ] `SLACK_WEBHOOK` - Slack webhook URL (optional)
  - [ ] `SNYK_TOKEN` - Snyk API token (optional)
- [ ] CI/CD pipeline tested with test commit
- [ ] All tests passing
- [ ] Docker images building successfully

### Deployment Pipeline
- [ ] Automated deployment working
- [ ] Health checks in pipeline passing
- [ ] Rollback procedure tested
- [ ] Deployment notifications working

## Performance Optimization

### Nginx
- [ ] Gzip compression enabled
- [ ] Rate limiting configured
- [ ] Static file caching working
- [ ] HTTP/2 enabled
- [ ] SSL/TLS optimized

### Application
- [ ] Database indexes created
- [ ] Redis caching configured
- [ ] Connection pooling enabled
- [ ] Query optimization done
- [ ] Static assets optimized

### Monitoring
- [ ] Response times acceptable (<500ms p95)
- [ ] Error rate low (<1%)
- [ ] CPU usage normal (<70%)
- [ ] Memory usage normal (<80%)
- [ ] Disk space sufficient (>20% free)

## Security Hardening

### SSL/TLS
- [ ] TLS 1.2+ only
- [ ] Strong cipher suites configured
- [ ] HSTS enabled
- [ ] SSL Labs test: A+ rating (https://www.ssllabs.com/ssltest/)

### Headers
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection enabled
- [ ] Referrer-Policy configured
- [ ] CSP headers configured (optional)

### Application
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Input validation working
- [ ] SQL injection protection verified
- [ ] XSS protection verified

## Documentation

### Internal
- [ ] Deployment guide reviewed
- [ ] Monitoring guide reviewed
- [ ] Runbooks created for common issues
- [ ] Team access documented
- [ ] Emergency contacts listed

### External
- [ ] API documentation published
- [ ] User guides updated
- [ ] Status page configured (optional)
- [ ] Support channels documented

## Post-Deployment

### Immediate (First Hour)
- [ ] Monitor logs for errors
- [ ] Check all critical paths
- [ ] Verify user flows
- [ ] Monitor resource usage
- [ ] Check alert systems

### First Day
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify backup completion
- [ ] Monitor user feedback
- [ ] Check SSL certificate

### First Week
- [ ] Review all metrics
- [ ] Analyze user behavior
- [ ] Check backup integrity
- [ ] Review security logs
- [ ] Optimize based on data

## Rollback Plan

### Preparation
- [ ] Rollback script tested: `./scripts/rollback.sh`
- [ ] Database backup before deployment
- [ ] Previous version tagged in git
- [ ] Rollback procedure documented

### Triggers
- [ ] Critical bugs identified
- [ ] Performance degradation
- [ ] Security vulnerabilities
- [ ] Data integrity issues

## Emergency Contacts

```
DevOps Lead: [Name] - [Email] - [Phone]
Backend Lead: [Name] - [Email] - [Phone]
Frontend Lead: [Name] - [Email] - [Phone]
Database Admin: [Name] - [Email] - [Phone]
Security Team: [Email]
```

## Useful Commands

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart service
docker-compose -f docker-compose.prod.yml restart backend

# Run health check
./scripts/health-check.sh your-domain.com

# Create backup
./scripts/backup.sh

# Deploy updates
./scripts/deploy.sh

# Rollback
./scripts/rollback.sh
```

## Sign-off

- [ ] DevOps Lead approval
- [ ] Backend Lead approval
- [ ] Frontend Lead approval
- [ ] Security review completed
- [ ] Stakeholder notification sent

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________
**Notes**: _______________
