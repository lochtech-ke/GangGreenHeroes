# Badge Migration Runbook

## Overview

This runbook provides step-by-step procedures for executing, monitoring, and troubleshooting the geometric badge migration. It is intended for system administrators, DevOps engineers, and technical staff responsible for the migration process.

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Migration Execution](#migration-execution)
3. [Monitoring Procedures](#monitoring-procedures)
4. [Rollback Procedures](#rollback-procedures)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Post-Migration Verification](#post-migration-verification)
7. [Emergency Contacts](#emergency-contacts)

## Pre-Migration Checklist

### System Requirements

- [ ] Database backup completed and verified
- [ ] Sufficient database storage (estimate: 2x current badge data)
- [ ] Application servers healthy and scaled appropriately
- [ ] Cache servers operational
- [ ] Monitoring dashboards configured
- [ ] Alert systems tested
- [ ] Rollback scripts tested in staging
- [ ] Team members briefed and on standby

### Database Health Check

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('ganggreen_db'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('nft_badges', 'badge_migration_log', 'badge_cache')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;
```

### Application Health Check

```bash
# Check application status
curl -f https://api.ganggreen.org/health || echo "API health check failed"

# Check database connectivity
npm run db:check

# Check cache connectivity
npm run cache:check

# Check migration service
npm run migration:status
```

### Backup Verification

```bash
# Create database backup
pg_dump ganggreen_db > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
pg_restore --list backup_pre_migration_*.sql | head -20

# Upload to secure storage
aws s3 cp backup_pre_migration_*.sql s3://ganggreen-backups/migrations/
```

### Notification Preparation

```bash
# Prepare user notification
# - Email template ready
# - In-app notification scheduled
# - Social media posts drafted
# - Status page updated
```

## Migration Execution

### Phase 1: Dry Run (Staging)

**Objective**: Test migration process without making changes

**Duration**: 30-60 minutes

**Steps**:

1. **Start Dry Run**
   ```bash
   npm run migrate-badges -- --dry-run --batch-size 100
   ```

2. **Monitor Output**
   ```bash
   # Watch logs
   tail -f logs/migration.log
   
   # Check status
   npm run migration:status
   ```

3. **Review Results**
   ```bash
   # Get dry run report
   npm run migration:report -- --migration-id <id>
   ```

4. **Verify Estimates**
   - Total badges to migrate
   - Estimated duration
   - Resource requirements
   - Potential errors

**Success Criteria**:
- Dry run completes without errors
- Estimates are reasonable
- No database locks detected
- Performance metrics acceptable

**If Dry Run Fails**:
- Review error logs
- Fix identified issues
- Re-run dry run
- Do not proceed to production

### Phase 2: Production Migration (Small Batch)

**Objective**: Migrate first 1% of badges as pilot

**Duration**: 15-30 minutes

**Steps**:

1. **Enable Maintenance Mode** (Optional)
   ```bash
   # If downtime is acceptable
   npm run maintenance:enable
   ```

2. **Start Pilot Migration**
   ```bash
   npm run migrate-badges -- \
     --batch-size 50 \
     --max-badges 1000 \
     --create-backup true \
     --delay 2000
   ```

3. **Monitor Closely**
   ```bash
   # Real-time monitoring
   watch -n 5 'npm run migration:status'
   
   # Check database performance
   watch -n 5 'psql -c "SELECT * FROM pg_stat_activity WHERE state = '\''active'\'';"'
   ```

4. **Verify Sample Badges**
   ```bash
   # Check random migrated badges
   npm run migration:verify -- --sample-size 50
   ```

**Success Criteria**:
- All pilot badges migrated successfully
- No performance degradation
- Sample verification passes
- No user complaints

**If Pilot Fails**:
- Stop migration immediately
- Review errors
- Execute rollback if needed
- Fix issues before continuing

### Phase 3: Full Production Migration

**Objective**: Migrate all remaining badges

**Duration**: 2-6 hours (depending on badge count)

**Steps**:

1. **Confirm Go/No-Go**
   - [ ] Pilot successful
   - [ ] Team ready
   - [ ] Monitoring active
   - [ ] Rollback tested
   - [ ] Stakeholders notified

2. **Start Full Migration**
   ```bash
   npm run migrate-badges -- \
     --batch-size 100 \
     --create-backup true \
     --delay 1000 \
     --skip-errors false
   ```

3. **Monitor Progress**
   ```bash
   # Terminal 1: Migration status
   watch -n 10 'npm run migration:status'
   
   # Terminal 2: Database metrics
   watch -n 10 'npm run db:metrics'
   
   # Terminal 3: Application logs
   tail -f logs/migration.log
   
   # Terminal 4: Error logs
   tail -f logs/error.log
   ```

4. **Track Key Metrics**
   - Migration progress (%)
   - Badges per minute
   - Error rate
   - Database CPU/memory
   - Application response time
   - Cache hit rate

**Checkpoints**:

Every 25% completion:
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify sample badges
- [ ] Confirm system stability
- [ ] Update stakeholders

**Success Criteria**:
- 99%+ badges migrated successfully
- Error rate < 1%
- No system instability
- Performance within acceptable range

### Phase 4: Verification

**Objective**: Verify migration completeness and correctness

**Duration**: 30-60 minutes

**Steps**:

1. **Run Verification Script**
   ```bash
   npm run verify-migration -- --comprehensive
   ```

2. **Check Statistics**
   ```sql
   -- Count migrated badges
   SELECT 
     badge_type,
     COUNT(*) as count
   FROM nft_badges
   GROUP BY badge_type;
   
   -- Check migration status
   SELECT 
     status,
     COUNT(*) as count
   FROM badge_migration_log
   GROUP BY status;
   
   -- Verify metadata
   SELECT COUNT(*) 
   FROM nft_badges 
   WHERE badge_type = 'geometric' 
     AND primary_colors IS NOT NULL
     AND migrated_at IS NOT NULL;
   ```

3. **Manual Spot Checks**
   - View 10 random badges in UI
   - Test badge rendering
   - Verify metadata display
   - Check social sharing
   - Test mobile display

4. **Generate Final Report**
   ```bash
   npm run migration:report -- \
     --migration-id <id> \
     --format pdf \
     --output migration_report.pdf
   ```

**Success Criteria**:
- Verification script passes
- All badges have geometric type
- Metadata is complete
- UI displays correctly
- No user-reported issues

## Monitoring Procedures

### Real-Time Monitoring

**Dashboard URLs**:
- Migration Dashboard: https://monitor.ganggreen.org/migration
- Database Dashboard: https://monitor.ganggreen.org/database
- Application Dashboard: https://monitor.ganggreen.org/app

**Key Metrics to Watch**:

1. **Migration Progress**
   - Current batch
   - Total progress (%)
   - Estimated completion time
   - Badges per minute

2. **Error Metrics**
   - Error count
   - Error rate (%)
   - Error types
   - Failed badge IDs

3. **Database Performance**
   - CPU usage (< 80%)
   - Memory usage (< 85%)
   - Connection count (< 80% max)
   - Query time (< 500ms avg)
   - Lock count (0 expected)

4. **Application Performance**
   - Response time (< 200ms)
   - Error rate (< 0.1%)
   - Request rate
   - Cache hit rate (> 70%)

5. **System Resources**
   - Server CPU (< 70%)
   - Server memory (< 80%)
   - Disk I/O
   - Network throughput

### Alert Thresholds

**Critical Alerts** (Immediate action required):
- Error rate > 5%
- Database CPU > 90%
- Migration stalled (no progress for 5 minutes)
- Database locks detected
- Application errors > 10/minute

**Warning Alerts** (Monitor closely):
- Error rate > 2%
- Database CPU > 80%
- Slow migration (< 50 badges/minute)
- Cache hit rate < 60%
- Response time > 500ms

### Monitoring Commands

```bash
# Get current status
npm run migration:status

# Get detailed metrics
npm run migration:metrics

# Check for errors
npm run migration:errors -- --last 100

# View recent logs
tail -n 100 logs/migration.log

# Check database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check cache status
redis-cli INFO stats
```

## Rollback Procedures

### When to Rollback

Execute rollback if:
- Error rate exceeds 5%
- Critical system failure
- Data corruption detected
- Migration cannot complete
- Stakeholder decision

### Rollback Steps

**IMPORTANT**: Rollback must be executed quickly to minimize impact.

1. **Stop Migration Immediately**
   ```bash
   # Kill migration process
   npm run migration:stop
   
   # Verify stopped
   npm run migration:status
   ```

2. **Assess Situation**
   ```bash
   # Get migration ID
   MIGRATION_ID=$(npm run migration:status --json | jq -r '.migrationId')
   
   # Check what was migrated
   npm run migration:report -- --migration-id $MIGRATION_ID
   ```

3. **Execute Rollback**
   ```bash
   # Start rollback
   npm run rollback-migration -- --migration-id $MIGRATION_ID
   
   # Monitor rollback progress
   watch -n 5 'npm run rollback:status'
   ```

4. **Verify Rollback**
   ```bash
   # Run verification
   npm run rollback:verify -- --migration-id $MIGRATION_ID
   
   # Check badge counts
   psql -c "SELECT badge_type, COUNT(*) FROM nft_badges GROUP BY badge_type;"
   ```

5. **Restore from Backup** (If rollback fails)
   ```bash
   # Stop application
   npm run app:stop
   
   # Restore database
   psql ganggreen_db < backup_pre_migration_*.sql
   
   # Verify restoration
   npm run db:verify
   
   # Restart application
   npm run app:start
   ```

6. **Clear Caches**
   ```bash
   # Clear application cache
   npm run cache:clear
   
   # Clear CDN cache (if applicable)
   npm run cdn:purge
   ```

7. **Verify System**
   ```bash
   # Check application health
   npm run health:check
   
   # Test badge rendering
   npm run test:badges
   
   # Verify user access
   curl -f https://api.ganggreen.org/badges/test
   ```

8. **Notify Stakeholders**
   - Send rollback notification
   - Update status page
   - Post on social media
   - Email affected users (if any)

### Post-Rollback Actions

1. **Root Cause Analysis**
   - Review error logs
   - Analyze failure points
   - Document lessons learned
   - Create action items

2. **Fix Issues**
   - Address identified problems
   - Test fixes in staging
   - Update runbook
   - Plan retry

3. **Communication**
   - Explain what happened
   - Share timeline for retry
   - Address user concerns
   - Update documentation

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Migration Stalls

**Symptoms**:
- No progress for > 5 minutes
- Status shows same batch
- No log activity

**Diagnosis**:
```bash
# Check if process is running
ps aux | grep migrate-badges

# Check database locks
psql -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Check system resources
top
df -h
```

**Solutions**:
1. Check for database locks and kill if needed
2. Verify sufficient disk space
3. Check network connectivity
4. Restart migration from last checkpoint

#### Issue: High Error Rate

**Symptoms**:
- Error rate > 2%
- Many failed badges
- Specific error patterns

**Diagnosis**:
```bash
# Get error details
npm run migration:errors -- --last 100

# Check error patterns
npm run migration:errors -- --group-by type

# Verify badge data
psql -c "SELECT * FROM nft_badges WHERE id IN (SELECT badge_id FROM migration_errors LIMIT 10);"
```

**Solutions**:
1. If data corruption: Stop and rollback
2. If transient errors: Enable skip-errors and continue
3. If specific badge type: Exclude and migrate separately
4. If database issues: Check database health

#### Issue: Database Performance Degradation

**Symptoms**:
- Slow queries
- High CPU usage
- Connection timeouts

**Diagnosis**:
```bash
# Check slow queries
psql -c "SELECT query, state, wait_event FROM pg_stat_activity WHERE state = 'active';"

# Check database size
psql -c "SELECT pg_size_pretty(pg_database_size('ganggreen_db'));"

# Check indexes
psql -c "SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;"
```

**Solutions**:
1. Reduce batch size
2. Increase delay between batches
3. Add missing indexes
4. Vacuum database if needed
5. Scale database resources

#### Issue: Cache Failures

**Symptoms**:
- Cache errors in logs
- Low cache hit rate
- Slow badge rendering

**Diagnosis**:
```bash
# Check cache status
redis-cli INFO

# Check cache size
redis-cli INFO memory

# Test cache connectivity
redis-cli PING
```

**Solutions**:
1. Clear cache and restart
2. Increase cache memory
3. Disable caching temporarily
4. Check cache configuration

#### Issue: Memory Leaks

**Symptoms**:
- Increasing memory usage
- Application slowdown
- Out of memory errors

**Diagnosis**:
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Check Node.js heap
node --expose-gc --inspect migrate-badges.js
```

**Solutions**:
1. Restart migration process
2. Reduce batch size
3. Add garbage collection
4. Increase server memory
5. Fix memory leaks in code

#### Issue: User-Reported Problems

**Symptoms**:
- Users can't see badges
- Badges display incorrectly
- Sharing doesn't work

**Diagnosis**:
```bash
# Check specific user
npm run badges:check -- --user-id <id>

# Verify badge rendering
npm run badges:render -- --badge-id <id>

# Check cache
npm run cache:check -- --key badge:<id>
```

**Solutions**:
1. Clear user's cache
2. Re-render specific badges
3. Verify badge metadata
4. Check CDN cache
5. Escalate if widespread

### Emergency Procedures

#### Complete System Failure

1. **Immediate Actions**:
   ```bash
   # Stop all migration processes
   killall -9 node
   
   # Enable maintenance mode
   npm run maintenance:enable
   
   # Alert team
   npm run alert:critical -- "System failure during migration"
   ```

2. **Assessment**:
   - Check system logs
   - Verify database integrity
   - Check data corruption
   - Assess impact scope

3. **Recovery**:
   - Execute rollback
   - Restore from backup if needed
   - Verify system stability
   - Resume operations

#### Data Corruption Detected

1. **Immediate Actions**:
   ```bash
   # Stop migration
   npm run migration:stop
   
   # Isolate affected data
   npm run db:isolate -- --table nft_badges
   
   # Alert team
   npm run alert:critical -- "Data corruption detected"
   ```

2. **Assessment**:
   - Identify corruption scope
   - Check backup integrity
   - Determine recovery path
   - Estimate recovery time

3. **Recovery**:
   - Restore from backup
   - Re-run migration for affected badges
   - Verify data integrity
   - Document incident

## Post-Migration Verification

### Comprehensive Verification Checklist

#### Data Verification

- [ ] All badges have badge_type = 'geometric'
- [ ] All badges have primary_colors populated
- [ ] All badges have migrated_at timestamp
- [ ] No badges lost during migration
- [ ] Metadata preserved correctly
- [ ] User associations intact
- [ ] Forest associations intact
- [ ] Tier levels correct

#### Functional Verification

- [ ] Badges render correctly in UI
- [ ] Badge details display properly
- [ ] Social sharing works
- [ ] Download functionality works
- [ ] Mobile display correct
- [ ] Cache working properly
- [ ] Search and filters work
- [ ] Leaderboards updated

#### Performance Verification

- [ ] Page load time < 3 seconds
- [ ] Badge render time < 100ms
- [ ] Cache hit rate > 70%
- [ ] Database query time < 500ms
- [ ] No memory leaks
- [ ] No performance degradation

#### User Experience Verification

- [ ] No user complaints
- [ ] Positive feedback received
- [ ] Social media sentiment positive
- [ ] Support tickets normal
- [ ] User engagement stable

### Verification Scripts

```bash
# Run all verifications
npm run verify:all

# Data verification
npm run verify:data

# Functional verification
npm run verify:functional

# Performance verification
npm run verify:performance

# Generate verification report
npm run verify:report -- --output verification_report.pdf
```

### Sign-Off Checklist

- [ ] All verification checks passed
- [ ] No critical issues outstanding
- [ ] Performance metrics acceptable
- [ ] User feedback positive
- [ ] Documentation updated
- [ ] Team debriefed
- [ ] Stakeholders notified
- [ ] Monitoring configured
- [ ] Runbook updated
- [ ] Lessons learned documented

## Monitoring Dashboards

### Migration Dashboard

**URL**: https://monitor.ganggreen.org/migration

**Panels**:
1. Migration Progress
   - Current batch
   - Total progress
   - ETA
   - Badges per minute

2. Error Tracking
   - Error count
   - Error rate
   - Error types
   - Failed badges

3. Performance Metrics
   - Generation time
   - Database query time
   - Cache hit rate
   - Memory usage

4. System Health
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network

### Database Dashboard

**URL**: https://monitor.ganggreen.org/database

**Panels**:
1. Query Performance
   - Slow queries
   - Query count
   - Average query time
   - Lock count

2. Resource Usage
   - CPU usage
   - Memory usage
   - Connection count
   - Cache hit ratio

3. Table Statistics
   - Table sizes
   - Index usage
   - Vacuum status
   - Bloat

### Application Dashboard

**URL**: https://monitor.ganggreen.org/app

**Panels**:
1. Request Metrics
   - Request rate
   - Response time
   - Error rate
   - Status codes

2. Badge Operations
   - Badge renders
   - Cache hits/misses
   - Generation time
   - Download count

3. User Activity
   - Active users
   - Badge views
   - Social shares
   - New badges earned

## Emergency Contacts

### Primary Contacts

**Migration Lead**:
- Name: [Name]
- Phone: [Phone]
- Email: [Email]
- Slack: @[username]

**Database Administrator**:
- Name: [Name]
- Phone: [Phone]
- Email: [Email]
- Slack: @[username]

**DevOps Lead**:
- Name: [Name]
- Phone: [Phone]
- Email: [Email]
- Slack: @[username]

**Product Manager**:
- Name: [Name]
- Phone: [Phone]
- Email: [Email]
- Slack: @[username]

### Escalation Path

1. **Level 1**: Migration team member
2. **Level 2**: Migration lead
3. **Level 3**: Engineering manager
4. **Level 4**: CTO
5. **Level 5**: CEO (critical only)

### Communication Channels

**Internal**:
- Slack: #migration-ops
- Email: migration-team@ganggreen.org
- Phone: [Emergency line]

**External**:
- Status Page: https://status.ganggreen.org
- Twitter: @ganggreen
- Email: support@ganggreen.org

## Appendix

### Useful Commands Reference

```bash
# Migration commands
npm run migrate-badges -- --help
npm run migration:status
npm run migration:stop
npm run migration:report

# Verification commands
npm run verify-migration
npm run verify:data
npm run verify:functional

# Rollback commands
npm run rollback-migration -- --migration-id <id>
npm run rollback:verify

# Database commands
psql -c "SELECT * FROM badge_migration_log ORDER BY created_at DESC LIMIT 1;"
psql -c "SELECT COUNT(*) FROM nft_badges WHERE badge_type = 'geometric';"

# Cache commands
redis-cli FLUSHALL
redis-cli INFO stats

# Monitoring commands
npm run metrics:migration
npm run metrics:database
npm run metrics:application
```

### Log Locations

- Migration logs: `logs/migration.log`
- Error logs: `logs/error.log`
- Database logs: `/var/log/postgresql/`
- Application logs: `logs/application.log`
- System logs: `/var/log/syslog`

### Configuration Files

- Migration config: `config/migration.json`
- Database config: `config/database.json`
- Cache config: `config/cache.json`
- Monitoring config: `config/monitoring.json`

---

**Document Version**: 1.0
**Last Updated**: November 28, 2025
**Next Review**: After migration completion

**Maintained by**: DevOps Team
**Contact**: devops@ganggreen.org

