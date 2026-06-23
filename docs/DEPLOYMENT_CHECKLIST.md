# Production Deployment Checklist

Use this checklist to ensure your authentication service is production-ready.

## Pre-Deployment

### Security
- [ ] Generate new JWT secrets using `node scripts/generateSecrets.js --save`
- [ ] Never commit `.env` to version control
- [ ] Add `.env` to `.gitignore`
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Configure Redis with authentication
- [ ] Set up firewall rules (only expose necessary ports)
- [ ] Enable CORS with specific origins (not `*`)
- [ ] Configure rate limiting
- [ ] Set up HTTPS/TLS certificates
- [ ] Enable security headers (HSTS, CSP, etc.)
- [ ] Review and minimize exposed error messages

### Environment Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URL
- [ ] Configure production Redis URL
- [ ] Set up email service (SMTP)
- [ ] Configure Twilio for SMS OTP
- [ ] Set up Eureka/Service Discovery
- [ ] Configure allowed CORS origins
- [ ] Set up logging service (e.g., Winston, Datadog)

### Database
- [ ] Run `npx prisma migrate deploy` (not `migrate dev`)
- [ ] Create database indexes for performance
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Set up database monitoring
- [ ] Test database failover

### Redis
- [ ] Configure Redis persistence (RDB/AOF)
- [ ] Set up Redis cluster for high availability
- [ ] Configure Redis memory policies
- [ ] Enable Redis authentication
- [ ] Set up Redis monitoring

## Deployment

### Infrastructure
- [ ] Choose deployment platform (AWS, GCP, Azure, DigitalOcean, etc.)
- [ ] Set up load balancer
- [ ] Configure auto-scaling
- [ ] Set up health checks
- [ ] Configure SSL/TLS termination
- [ ] Set up CDN (if needed)

### Application
- [ ] Build Docker image
- [ ] Test Docker image locally
- [ ] Push image to container registry
- [ ] Deploy to production
- [ ] Verify service is running
- [ ] Test health endpoint: `/health`
- [ ] Verify Eureka registration
- [ ] Check application logs

### Monitoring
- [ ] Set up application monitoring (New Relic, Datadog, etc.)
- [ ] Configure error tracking (Sentry, Bugsnag)
- [ ] Set up log aggregation (ELK, Splunk, CloudWatch)
- [ ] Configure alerts for critical errors
- [ ] Set up uptime monitoring
- [ ] Monitor database performance
- [ ] Monitor Redis performance
- [ ] Track API response times
- [ ] Monitor error rates

### Security
- [ ] Run security scan (npm audit, Snyk)
- [ ] Perform penetration testing
- [ ] Set up Web Application Firewall (WAF)
- [ ] Enable DDoS protection
- [ ] Configure IP whitelisting (if needed)
- [ ] Set up audit logging
- [ ] Enable request signing (optional)
- [ ] Implement rate limiting at load balancer

## Post-Deployment

### Testing
- [ ] Test login flow
- [ ] Test registration flow
- [ ] Test OTP verification (SMS & Email)
- [ ] Test password reset flow
- [ ] Test refresh token rotation
- [ ] Test logout (single device)
- [ ] Test logout (all devices)
- [ ] Test session management
- [ ] Test token blacklist
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Load testing (JMeter, k6, Artillery)

### Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document backup/restore procedures
- [ ] Create incident response plan

### Operations
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up automated token cleanup (cron job)
- [ ] Create monitoring dashboards
- [ ] Set up on-call rotation
- [ ] Document escalation procedures

## Maintenance

### Regular Tasks
- [ ] Rotate JWT secrets every 90 days
- [ ] Review and update dependencies monthly
- [ ] Run security scans weekly
- [ ] Review logs for suspicious activity
- [ ] Monitor database performance
- [ ] Clean up expired tokens (daily via cron)
- [ ] Review and update rate limits
- [ ] Backup verification (weekly)

### Monthly
- [ ] Review access logs
- [ ] Audit user sessions
- [ ] Update documentation
- [ ] Review and update security policies
- [ ] Performance optimization review
- [ ] Cost optimization review

### Quarterly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Disaster recovery drill
- [ ] Review and update incident response plan
- [ ] Capacity planning review

## Emergency Procedures

### Service Down
1. Check health endpoint: `curl https://api.yourapp.com/health`
2. Check application logs
3. Check database connectivity
4. Check Redis connectivity
5. Restart service if needed
6. Notify team if critical

### Database Issues
1. Check database connections
2. Review slow queries
3. Check database resources (CPU, memory, disk)
4. Failover to replica if needed
5. Restore from backup if necessary

### Security Incident
1. Isolate affected systems
2. Preserve evidence (logs)
3. Rotate all JWT secrets
4. Invalidate all user sessions
5. Force password reset for affected users
6. Notify security team
7. Document incident

## Rollback Plan

### If Deployment Fails
1. Keep previous version running
2. Roll back database migrations if needed
3. Switch traffic to previous version
4. Investigate and fix issues
5. Re-deploy when ready

### Database Rollback
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back "migration_name"

# Or reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Performance Optimization

### Before Launch
- [ ] Enable database query logging
- [ ] Add database indexes
- [ ] Enable Redis caching
- [ ] Optimize JWT token size
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets

### After Launch
- [ ] Monitor API response times
- [ ] Identify slow endpoints
- [ ] Optimize database queries
- [ ] Add caching where needed
- [ ] Scale horizontally if needed

## Compliance

### Data Protection
- [ ] Implement data encryption at rest
- [ ] Enable encryption in transit (TLS)
- [ ] Set up data retention policies
- [ ] Implement data deletion on request
- [ ] Document data processing activities

### Privacy
- [ ] Create privacy policy
- [ ] Implement consent management
- [ ] Set up data export functionality
- [ ] Implement right to be forgotten
- [ ] Document PII handling

## Cost Optimization

### Infrastructure
- [ ] Right-size instances
- [ ] Use reserved instances (AWS) / committed use discounts (GCP)
- [ ] Optimize database storage
- [ ] Use Redis memory efficiently
- [ ] Implement auto-scaling
- [ ] Set up cost alerts

### Application
- [ ] Optimize database queries
- [ ] Reduce unnecessary API calls
- [ ] Implement efficient caching
- [ ] Compress responses
- [ ] Use connection pooling

## Sign-Off

### Technical Lead
- [ ] Code review completed
- [ ] Security review completed
- [ ] Performance testing passed
- [ ] Documentation complete

### DevOps
- [ ] Infrastructure provisioned
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Deployment pipeline tested

### Security Team
- [ ] Security scan passed
- [ ] Penetration test passed
- [ ] Compliance requirements met
- [ ] Security policies documented

### Product Owner
- [ ] Features verified
- [ ] User acceptance testing passed
- [ ] Documentation reviewed
- [ ] Ready for production

---

## Quick Start Commands

```bash
# 1. Generate secrets
npm run generate:secrets

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run migrations
npm run prisma:migrate

# 5. Start application
npm start

# 6. Test health endpoint
curl http://localhost:8000/health

# 7. Clean up expired tokens (run daily via cron)
npm run cleanup:tokens
```

## Support Contacts

- **DevOps Team**: devops@yourapp.com
- **Security Team**: security@yourapp.com
- **On-Call**: +1-xxx-xxx-xxxx
- **Escalation**: cto@yourapp.com

## Useful Links

- [API Documentation](./API_GATEWAY.md)
- [Architecture Diagram](https://your-wiki/architecture)
- [Monitoring Dashboard](https://monitoring.yourapp.com)
- [Log Aggregation](https://logs.yourapp.com)
- [Incident Management](https://incidents.yourapp.com)