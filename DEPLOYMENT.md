# Production Deployment Checklist

## Pre-Deployment

### Security
- [ ] Change all default passwords
- [ ] Generate strong JWT secrets (min 32 characters)
- [ ] Configure CORS with production domains
- [ ] Enable HTTPS/SSL certificates
- [ ] Review and update rate limiting
- [ ] Enable Helmet.js security headers
- [ ] Configure MongoDB authentication
- [ ] Set Redis password
- [ ] Review API endpoint permissions

### Environment Variables
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URI
- [ ] Set production Redis host
- [ ] Configure JWT secrets
- [ ] Set CORS origins
- [ ] Add third-party API keys (if using)
- [ ] Configure Sentry DSN (if using)
- [ ] Set up CDN URLs

### Database
- [ ] Create production database
- [ ] Run database migrations
- [ ] Configure database backups
- [ ] Set up connection pooling
- [ ] Verify indexes are created
- [ ] Test database performance

### Infrastructure
- [ ] Provision servers/cloud instances
- [ ] Configure load balancer
- [ ] Set up reverse proxy (Nginx)
- [ ] Configure SSL certificates
- [ ] Set up monitoring
- [ ] Configure logging aggregation
- [ ] Set up alerting
- [ ] Configure auto-scaling (if cloud)

### Application
- [ ] Build and test Docker images
- [ ] Run production build locally
- [ ] Verify environment variables
- [ ] Test API endpoints
- [ ] Test WebSocket connections
- [ ] Verify file uploads work
- [ ] Test error handling
- [ ] Check performance metrics

## Deployment

### Initial Setup
```bash
# 1. Clone repository on server
git clone <repository-url>
cd LeagueOf

# 2. Configure environment
cp .env.example .env
# Edit .env with production values

# 3. Build and start services
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

### Monitoring Setup
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Setup PM2 startup script
pm2 startup
pm2 save
```

### SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## Post-Deployment

### Verification
- [ ] Test frontend loads correctly
- [ ] Test backend health endpoint
- [ ] Verify user registration works
- [ ] Test login/logout flow
- [ ] Verify WebSocket connections
- [ ] Test all API endpoints
- [ ] Check database connectivity
- [ ] Verify Redis caching works
- [ ] Test file uploads
- [ ] Check error logging

### Performance
- [ ] Run load tests
- [ ] Check response times
- [ ] Verify caching is working
- [ ] Monitor memory usage
- [ ] Check CPU utilization
- [ ] Verify database query performance
- [ ] Test under concurrent users

### Monitoring
- [ ] Set up application monitoring
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Set up performance monitoring
- [ ] Configure alerting rules
- [ ] Test alert notifications

### Backups
- [ ] Configure automated database backups
- [ ] Test backup restoration
- [ ] Set up file storage backups
- [ ] Document backup procedures
- [ ] Configure backup retention policy

### Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document monitoring setup
- [ ] Create disaster recovery plan

## Maintenance

### Regular Tasks
- [ ] Monitor application logs
- [ ] Review error rates
- [ ] Check database performance
- [ ] Monitor disk usage
- [ ] Review security logs
- [ ] Update dependencies monthly
- [ ] Test backups weekly
- [ ] Review access logs

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Or with zero-downtime
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend
```

## Rollback Procedure

```bash
# 1. Revert to previous version
git checkout <previous-commit>

# 2. Rebuild services
docker-compose build

# 3. Restart with previous version
docker-compose up -d

# 4. Verify application is working
curl http://localhost/api/health
```

## Scaling Considerations

### Horizontal Scaling
- Use Redis for session storage (already configured)
- Configure Socket.IO with Redis adapter
- Set up load balancer
- Use shared file storage (S3, etc.)
- Configure database replication

### Database Scaling
- Enable MongoDB sharding for large datasets
- Set up read replicas
- Implement query caching
- Optimize indexes regularly

### Monitoring at Scale
- Use APM tools (New Relic, DataDog)
- Set up distributed tracing
- Monitor queue lengths
- Track WebSocket connection counts

## Security Hardening

### Server
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo vim /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Install fail2ban
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
```

### Application
- Keep dependencies updated
- Regular security audits
- Implement API rate limiting
- Use security headers
- Sanitize user inputs
- Encrypt sensitive data

## Cost Optimization

- Use CDN for static assets
- Implement efficient caching
- Optimize database queries
- Use connection pooling
- Monitor and reduce logging
- Implement lazy loading
- Compress responses

## Support

### Common Issues

**Service won't start**
- Check logs: `docker-compose logs`
- Verify environment variables
- Check port conflicts
- Verify database connectivity

**High memory usage**
- Check for memory leaks
- Review connection pooling
- Monitor cache sizes
- Check for large payloads

**Slow response times**
- Check database indexes
- Review cache hit rates
- Monitor network latency
- Check for N+1 queries

**WebSocket disconnections**
- Check nginx timeout settings
- Verify Redis pub/sub
- Monitor connection limits
- Check client reconnection logic

## Emergency Contacts

- DevOps Lead: [contact]
- Backend Lead: [contact]
- Database Admin: [contact]
- Security Team: [contact]

## Useful Commands

```bash
# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Scale service
docker-compose up -d --scale backend=3

# Execute command in container
docker-compose exec backend npm run migration

# Check container stats
docker stats

# Backup database
docker-compose exec mongodb mongodump --out=/backup

# Check disk usage
df -h
du -sh /var/lib/docker
```
