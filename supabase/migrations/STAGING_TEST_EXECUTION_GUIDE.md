# Migration 032 Staging Test - Execution Guide

## Quick Start

This guide provides step-by-step instructions for executing the staging tests for Migration 032 (Coin System Consolidation).

## Prerequisites

- [ ] Staging database access configured
- [ ] Supabase CLI installed
- [ ] PowerShell available (for automation scripts)
- [ ] Team notified of testing schedule
- [ ] Backup of staging database created

## Step-by-Step Execution

### Step 1: Create Staging Backup (5 minutes)

```powershell
# Navigate to project root
cd D:\Projects\ggh\GangGreenHeroes

# Create backup using Supabase CLI
npx supabase db dump -f supabase/backups/staging_pre_032_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Verify backup was created
ls supabase/backups/
```

**Document**: Save backup filename in `STAGING_TEST_ISSUES.md`

### Step 2: Capture Pre-Migration State (2 minutes)

```sql
-- Connect to staging database
npx supabase db remote connect

-- Run pre-migration queries
SELECT 
  (SELECT COUNT(*) FROM green_coin_wallets) as wallet_count,
  (SELECT SUM(balance) FROM green_coin_wallets) as total_balance,
  (SELECT COUNT(*) FROM green_coin_transactions) as transaction_count;

-- Save results
\o pre_migration_state.txt
SELECT * FROM green_coin_wallets ORDER BY balance DESC LIMIT 10;
SELECT * FROM green_coin_transactions ORDER BY timestamp DESC LIMIT 20;
\o
```

**Document**: Add results to `STAGING_TEST_ISSUES.md` under "Pre-Migration State"

### Step 3: Deploy Migration (5-10 minutes)

```powershell
# Deploy migration to staging
npx supabase db push

# OR manually execute
npx supabase db execute -f supabase/migrations/032_consolidate_coins.sql

# Capture output
# Save any NOTICE, WARNING, or ERROR messages
```

**Document**: 
- Migration duration
- Any warnings or errors
- Success/failure status

### Step 4: Run Verification Script (5 minutes)

```powershell
# Option 1: Use automation script (recommended)
.\supabase\verify-staging-migration.ps1 -SaveOutput

# Option 2: Manual execution
npx supabase db execute -f supabase/migrations/verify_032_staging.sql > verification_results.txt

# Review output
cat verification_results.txt
```

**Document**: 
- All check results (PASS/WARNING/FAIL)
- Any failures or warnings
- Performance metrics

### Step 5: Application Testing (10-15 minutes)

#### 5.1 Balance Display Test
1. Open staging application
2. Navigate to user profile
3. Verify GG Coins balance displays
4. Check decimal formatting
5. Take screenshot

#### 5.2 Coin Earning Test
1. Perform an action that earns coins (e.g., plant a tree)
2. Verify coins are credited
3. Check toast notification appears
4. Verify balance updates
5. Check transaction appears in history

#### 5.3 Transaction History Test
1. Navigate to transaction history
2. Verify migrated transactions appear
3. Test pagination
4. Check amount formatting (+/- prefix)
5. Verify timestamps are relative

#### 5.4 Real-time Updates Test
1. Open application in two browser tabs
2. Earn coins in one tab
3. Verify balance updates in other tab
4. Measure update latency

#### 5.5 Error Handling Test
1. Open browser console
2. Perform various actions
3. Check for JavaScript errors
4. Verify error messages are user-friendly

**Document**: 
- Pass/fail for each test
- Screenshots of any issues
- Console errors if any
- User experience observations

### Step 6: Performance Testing (5 minutes)

```sql
-- Test balance query performance
EXPLAIN ANALYZE
SELECT gg_coins FROM user_gamification WHERE id = '[test-user-id]';

-- Test transaction history performance
EXPLAIN ANALYZE
SELECT * FROM gg_coin_transactions 
WHERE user_id = '[test-user-id]'
ORDER BY created_at DESC
LIMIT 50;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename IN ('user_gamification', 'gg_coin_transactions')
ORDER BY idx_scan DESC;
```

**Document**: 
- Query execution times
- Index usage statistics
- Any performance concerns

### Step 7: Rollback Test (15-20 minutes)

```powershell
# Option 1: Use automation script (recommended)
.\supabase\test-rollback-staging.ps1 -SaveOutput

# Option 2: Manual execution
# Execute rollback
npx supabase db execute -f supabase/migrations/rollback_032.sql

# Run rollback verification
npx supabase db execute -f supabase/migrations/test_rollback_032_staging.sql > rollback_test_results.txt

# Review results
cat rollback_test_results.txt
```

**Document**: 
- Rollback success/failure
- Data restoration verification
- Any issues during rollback
- Application functionality after rollback

### Step 8: Re-apply Migration (5 minutes)

After successful rollback test, re-apply the migration:

```powershell
# Re-deploy migration
npx supabase db execute -f supabase/migrations/032_consolidate_coins.sql

# Quick verification
npx supabase db execute -c "SELECT * FROM get_coin_migration_stats();"
```

**Document**: 
- Re-migration success
- Any differences from first migration

### Step 9: Document Results (10-15 minutes)

Update `STAGING_TEST_ISSUES.md` with:

1. **Test Execution Summary**
   - Date and time of testing
   - Who performed the tests
   - Overall status (PASS/FAIL)

2. **Issues Found**
   - Critical issues (if any)
   - Non-critical issues (if any)
   - Warnings to monitor

3. **Performance Metrics**
   - Migration duration
   - Query performance
   - Application performance

4. **Test Results**
   - Database verification results
   - Application testing results
   - Rollback testing results

5. **Recommendations**
   - Any changes needed before production
   - Monitoring requirements
   - Risk assessment

### Step 10: Team Review and Sign-off (30 minutes)

1. **Share results with team**
   - Email test results
   - Schedule review meeting
   - Present findings

2. **Get sign-offs**
   - Database team approval
   - Development team approval
   - DevOps team approval
   - Product owner approval

3. **Make go/no-go decision**
   - Review all critical issues
   - Assess risks
   - Decide on production deployment

**Document**: 
- Sign-off status
- Decision (GO/NO-GO)
- Next steps

## Expected Timeline

| Step | Duration | Cumulative |
|------|----------|------------|
| 1. Create backup | 5 min | 5 min |
| 2. Capture pre-state | 2 min | 7 min |
| 3. Deploy migration | 5-10 min | 12-17 min |
| 4. Run verification | 5 min | 17-22 min |
| 5. Application testing | 10-15 min | 27-37 min |
| 6. Performance testing | 5 min | 32-42 min |
| 7. Rollback test | 15-20 min | 47-62 min |
| 8. Re-apply migration | 5 min | 52-67 min |
| 9. Document results | 10-15 min | 62-82 min |
| 10. Team review | 30 min | 92-112 min |
| **Total** | **~1.5-2 hours** | |

## Success Criteria

Testing is successful when:

- ✅ Migration completes without errors
- ✅ All 21+ verification checks pass (or warnings are acceptable)
- ✅ Application testing passes all scenarios
- ✅ Performance is within targets
- ✅ Rollback test passes
- ✅ No critical issues found
- ✅ Team sign-off obtained

## Failure Scenarios

### Scenario 1: Migration Fails
**Action**: 
1. Document error message
2. Rollback immediately
3. Investigate root cause
4. Fix in development
5. Retest on staging

### Scenario 2: Verification Checks Fail
**Action**:
1. Document which checks failed
2. Investigate data discrepancies
3. Determine if critical or acceptable
4. If critical: rollback and fix
5. If acceptable: document and monitor

### Scenario 3: Application Errors
**Action**:
1. Document specific errors
2. Check if migration-related or pre-existing
3. If migration-related: rollback
4. Fix application code
5. Retest

### Scenario 4: Rollback Fails
**Action**:
1. Document rollback error
2. Restore from backup
3. Fix rollback script
4. Test rollback again
5. Do not proceed to production until rollback works

## Quick Commands Reference

```powershell
# Connect to staging database
npx supabase db remote connect

# Execute migration
npx supabase db execute -f supabase/migrations/032_consolidate_coins.sql

# Run verification
npx supabase db execute -f supabase/migrations/verify_032_staging.sql

# Execute rollback
npx supabase db execute -f supabase/migrations/rollback_032.sql

# Test rollback
npx supabase db execute -f supabase/migrations/test_rollback_032_staging.sql

# Get migration stats
npx supabase db execute -c "SELECT * FROM get_coin_migration_stats();"

# Check table status
npx supabase db execute -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%green_coin%';"
```

## Files to Update

After testing, update these files:

1. **STAGING_TEST_ISSUES.md** - Main issues documentation
2. **STAGING_VERIFICATION_CHECKLIST.md** - Fill out checklist
3. **ROLLBACK_TEST_CHECKLIST.md** - Fill out rollback checklist
4. **.kiro/specs/coin-harmonization/tasks.md** - Update task status

## Support

### Need Help?

**Documentation**:
- [Verification Guide](./VERIFY_STAGING_GUIDE.md)
- [Rollback Test Guide](./ROLLBACK_TEST_GUIDE.md)
- [Migration Guide](./MIGRATION_032_GUIDE.md)
- [Issues Documentation](./STAGING_TEST_ISSUES.md)

**Contact**:
- Database Team: database-team@ganggreen.com
- DevOps Team: devops@ganggreen.com
- Emergency: emergency@ganggreen.com

## Tips for Success

1. **Don't rush** - Take time to verify each step
2. **Document everything** - Screenshots, logs, observations
3. **Test during low traffic** - Minimize impact on staging users
4. **Have rollback ready** - Know how to rollback quickly
5. **Get team involved** - Don't test alone
6. **Monitor closely** - Watch for any anomalies
7. **Ask questions** - If unsure, ask before proceeding

## Post-Testing Actions

### If Tests Pass ✅
1. Update task status to complete
2. Schedule production deployment
3. Prepare production rollback plan
4. Notify stakeholders
5. Update documentation

### If Tests Fail ❌
1. Document all failures
2. Rollback staging
3. Investigate root causes
4. Fix issues in development
5. Retest on staging
6. Reschedule production deployment

---

**Guide Version**: 1.0  
**Created**: 2025-01-30  
**Migration**: 032 - Coin System Consolidation  
**Status**: Ready for Use ✅
