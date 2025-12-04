# Rollback Test Guide for Migration 032

## Overview

This guide provides step-by-step instructions for testing the rollback procedure for Migration 032 (Coin System Consolidation) on the staging environment.

**Purpose**: Verify that the rollback script works correctly and can safely restore the Green Coin system if needed.

**Environment**: STAGING ONLY (Never test rollback on production)

**Duration**: 30-45 minutes

## Prerequisites

Before starting the rollback test:

- ✅ Migration 032 has been successfully applied to staging
- ✅ Staging verification has been completed
- ✅ All verification checks passed
- ✅ Supabase CLI is installed and configured
- ✅ You have database access credentials
- ✅ You have a recent database backup

## What Gets Tested

The rollback test verifies:

1. **Table Restoration** - Green Coin tables are restored from deprecated state
2. **Data Integrity** - All wallet and transaction data is preserved
3. **Transaction Cleanup** - Migrated transactions are removed from GG Coins
4. **Function Cleanup** - Helper functions are removed
5. **Comment Restoration** - Table comments are restored
6. **Performance** - Queries perform within acceptable limits
7. **Application Compatibility** - Green Coin service works correctly

## Quick Start

### Option 1: Automated Testing (Recommended)

```powershell
# Navigate to project root
cd D:\Projects\ggh\GangGreenHeroes

# Run automated test script
.\supabase\test-rollback-staging.ps1 -SaveOutput

# Follow the prompts
```

### Option 2: Manual Testing

```powershell
# 1. Capture pre-rollback state
npx supabase db execute -f supabase/migrations/test_rollback_032_staging.sql

# 2. Execute rollback
npx supabase db execute -f supabase/migrations/rollback_032.sql

# 3. Verify rollback success
npx supabase db execute -c "SELECT COUNT(*) FROM green_coin_wallets;"
```

## Detailed Testing Steps

### Step 1: Pre-Rollback State Capture (5 min)

**Purpose**: Document the current state before rollback

**Actions**:
1. Open terminal in project root
2. Run pre-rollback state capture:

```sql
-- Capture current state
SELECT 
    'deprecated_wallets' as metric,
    COUNT(*) as value
FROM _deprecated_green_coin_wallets
UNION ALL
SELECT 
    'deprecated_balance',
    COALESCE(SUM(balance), 0)
FROM _deprecated_green_coin_wallets
UNION ALL
SELECT 
    'deprecated_transactions',
    COUNT(*)
FROM _deprecated_green_coin_transactions
UNION ALL
SELECT 
    'migrated_transactions',
    COUNT(*)
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
UNION ALL
SELECT 
    'gg_coin_balance_total',
    COALESCE(SUM(gg_coins), 0)
FROM user_gamification;
```

**Expected Output**:
```
metric                      | value
---------------------------+--------
deprecated_wallets          | 1234
deprecated_balance          | 123456
deprecated_transactions     | 5678
migrated_transactions       | 5678
gg_coin_balance_total       | 123456
```

**Document**: Save these values for comparison

### Step 2: Execute Rollback Script (5-10 min)

**Purpose**: Run the rollback procedure

**Actions**:
1. Create a backup point (optional but recommended):
```powershell
npx supabase db dump -f backup_before_rollback_test.sql
```

2. Execute rollback script:
```powershell
npx supabase db execute -f supabase/migrations/rollback_032.sql
```

**Expected Output**:
- Script should complete without errors
- You should see progress messages
- Final message: "ROLLBACK 032 COMPLETED SUCCESSFULLY"

**Watch For**:
- ❌ Any ERROR messages
- ⚠️ WARNING messages (review but may be acceptable)
- ✅ SUCCESS messages

**Duration**: Should complete in < 5 minutes

### Step 3: Verify Table Restoration (5 min)

**Purpose**: Confirm Green Coin tables are restored

**Actions**:
1. Check table existence:
```sql
-- Should return 2 rows
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('green_coin_wallets', 'green_coin_transactions');
```

2. Check deprecated tables are gone:
```sql
-- Should return 0 rows
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '_deprecated_green_coin%';
```

3. Verify table structure:
```sql
-- Check wallet table
\d green_coin_wallets

-- Check transaction table
\d green_coin_transactions
```

**Expected Results**:
- ✅ `green_coin_wallets` exists
- ✅ `green_coin_transactions` exists
- ✅ No `_deprecated_*` tables
- ✅ Columns match original schema

### Step 4: Verify Data Integrity (10 min)

**Purpose**: Ensure all data was preserved correctly

**Actions**:
1. Check wallet count:
```sql
SELECT COUNT(*) as wallet_count FROM green_coin_wallets;
```
Should match pre-rollback `deprecated_wallets` count

2. Check balance total:
```sql
SELECT COALESCE(SUM(balance), 0) as total_balance 
FROM green_coin_wallets;
```
Should match pre-rollback `deprecated_balance` total

3. Check transaction count:
```sql
SELECT COUNT(*) as transaction_count 
FROM green_coin_transactions;
```
Should match pre-rollback `deprecated_transactions` count

4. Check for data quality issues:
```sql
-- No negative balances
SELECT COUNT(*) as negative_balances 
FROM green_coin_wallets 
WHERE balance < 0;
-- Should be 0

-- No NULL balances
SELECT COUNT(*) as null_balances 
FROM green_coin_wallets 
WHERE balance IS NULL;
-- Should be 0

-- No orphaned wallets
SELECT COUNT(*) as orphaned_wallets
FROM green_coin_wallets gcw
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = gcw.user_id);
-- Should be 0 or match known orphaned count
```

**Expected Results**:
- ✅ All counts match pre-rollback values
- ✅ No negative balances
- ✅ No NULL balances
- ✅ Orphaned records match expected count

### Step 5: Verify Transaction Cleanup (5 min)

**Purpose**: Confirm migrated transactions were removed

**Actions**:
1. Check for remaining migrated transactions:
```sql
SELECT COUNT(*) as remaining_migrated_tx
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins';
```
Should be 0

2. Check GG Coin transaction count:
```sql
SELECT COUNT(*) as gg_tx_count 
FROM gg_coin_transactions;
```
Should be reduced by the number of migrated transactions

3. Verify GG Coin balances (optional):
```sql
SELECT COALESCE(SUM(gg_coins), 0) as gg_balance_total 
FROM user_gamification;
```
Note: This may or may not change depending on rollback configuration

**Expected Results**:
- ✅ No migrated transactions remain
- ✅ GG Coin transaction count reduced appropriately
- ✅ GG Coin balances handled correctly

### Step 6: Verify Function Cleanup (2 min)

**Purpose**: Confirm helper functions were removed

**Actions**:
```sql
-- Check for migration helper functions
SELECT proname 
FROM pg_proc 
WHERE proname IN ('get_coin_migration_stats', 'is_migrated_transaction');
```

**Expected Results**:
- ✅ No rows returned (functions removed)
- ⚠️ If functions exist, they should be manually dropped

### Step 7: Verify Comments and Metadata (2 min)

**Purpose**: Confirm table comments were restored

**Actions**:
```sql
-- Check wallet table comment
SELECT obj_description('green_coin_wallets'::regclass);

-- Check transaction table comment
SELECT obj_description('green_coin_transactions'::regclass);
```

**Expected Results**:
- ✅ Comments do NOT contain "DEPRECATED"
- ✅ Comments describe Green Coin functionality
- ✅ Comments are appropriate for active tables

### Step 8: Performance Testing (5 min)

**Purpose**: Verify queries perform acceptably

**Actions**:
1. Test balance query:
```sql
EXPLAIN ANALYZE
SELECT balance FROM green_coin_wallets 
WHERE user_id = 'test-user-id';
```
Should complete in < 50ms

2. Test transaction history query:
```sql
EXPLAIN ANALYZE
SELECT * FROM green_coin_transactions 
WHERE user_id = 'test-user-id'
ORDER BY timestamp DESC 
LIMIT 50;
```
Should complete in < 200ms

3. Check indexes:
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('green_coin_wallets', 'green_coin_transactions');
```

**Expected Results**:
- ✅ Balance queries < 50ms
- ✅ Transaction queries < 200ms
- ✅ All indexes exist

### Step 9: Application Testing (10-15 min)

**Purpose**: Verify the application works with restored Green Coins

**Test Checklist**:

#### 9.1 Balance Display
- [ ] Open user profile page
- [ ] Verify Green Coin balance displays
- [ ] Check balance is correct
- [ ] Verify formatting (no decimals for integers)

#### 9.2 Earn Coins
- [ ] Complete an action that earns coins (e.g., plant tree)
- [ ] Verify coins are credited
- [ ] Check toast notification appears
- [ ] Verify balance updates

#### 9.3 Transaction History
- [ ] Open transaction history
- [ ] Verify transactions display
- [ ] Check pagination works
- [ ] Verify amounts are correct
- [ ] Check timestamps are formatted

#### 9.4 Service Integration
- [ ] Test `greenCoin.service.ts` methods
- [ ] Verify `getBalance()` works
- [ ] Test `creditCoins()` works
- [ ] Test `debitCoins()` works
- [ ] Check error handling

#### 9.5 Real-time Updates (if applicable)
- [ ] Open two browser tabs
- [ ] Earn coins in one tab
- [ ] Verify balance updates in other tab

**Expected Results**:
- ✅ All UI components work correctly
- ✅ Balances display accurately
- ✅ Transactions record properly
- ✅ No console errors
- ✅ Real-time updates work

## Verification Checklist

Use this checklist to track your testing progress:

### Database Verification
- [ ] Pre-rollback state captured
- [ ] Rollback script executed successfully
- [ ] Green Coin tables restored
- [ ] Deprecated tables removed
- [ ] Wallet count matches
- [ ] Balance total matches
- [ ] Transaction count matches
- [ ] No negative balances
- [ ] No NULL balances
- [ ] Orphaned records acceptable
- [ ] Migrated transactions removed
- [ ] Helper functions removed
- [ ] Table comments restored
- [ ] Indexes exist
- [ ] Performance acceptable

### Application Verification
- [ ] Balance display works
- [ ] Earn coins works
- [ ] Transaction history works
- [ ] Service methods work
- [ ] Real-time updates work
- [ ] No console errors
- [ ] Error handling works

### Documentation
- [ ] Test results documented
- [ ] Issues logged (if any)
- [ ] Screenshots captured
- [ ] Team notified
- [ ] Sign-off obtained

## Common Issues and Solutions

### Issue 1: Rollback Script Fails

**Symptoms**:
- ERROR messages during rollback
- Script stops mid-execution
- Tables not restored

**Solutions**:
1. Check error message for specific issue
2. Verify migration 032 was applied
3. Check database permissions
4. Review rollback script for syntax errors
5. Try running sections individually

**Recovery**:
```sql
-- Check current state
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%green_coin%';

-- If partially rolled back, may need manual intervention
```

### Issue 2: Data Count Mismatch

**Symptoms**:
- Wallet/transaction counts don't match
- Balance totals differ

**Solutions**:
1. Check for orphaned records:
```sql
SELECT COUNT(*) FROM green_coin_wallets gcw
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = gcw.user_id);
```

2. Account for orphaned records in comparison
3. Verify no concurrent transactions during rollback

**Acceptable**:
- Difference equals orphaned record count
- Small differences (< 1%) due to rounding

### Issue 3: Performance Issues

**Symptoms**:
- Queries slower than expected
- Timeouts

**Solutions**:
1. Update statistics:
```sql
ANALYZE green_coin_wallets;
ANALYZE green_coin_transactions;
```

2. Rebuild indexes:
```sql
REINDEX TABLE green_coin_wallets;
REINDEX TABLE green_coin_transactions;
```

3. Check for missing indexes:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'green_coin_wallets';
```

### Issue 4: Application Errors

**Symptoms**:
- Console errors
- Balance not displaying
- Transactions failing

**Solutions**:
1. Check browser console for errors
2. Verify `greenCoin.service.ts` is being used
3. Check API endpoints
4. Verify database connection
5. Clear browser cache
6. Restart development server

## Decision Tree

```
Rollback test complete
    ↓
All database checks pass?
    ├─ YES → Test application
    │         ↓
    │    Application works?
    │         ├─ YES → ✅ ROLLBACK SUCCESSFUL
    │         │         Document success
    │         │         Re-apply migration if needed
    │         │
    │         └─ NO → Fix application issues
    │                  Re-test application
    │
    └─ NO → Critical failures?
              ├─ YES → ❌ ROLLBACK FAILED
              │         Investigate immediately
              │         Fix rollback script
              │         Re-test procedure
              │
              └─ NO → Document warnings
                       Proceed with caution
                       Monitor closely
```

## Success Criteria

Rollback test is successful when:

- ✅ All database verification checks pass
- ✅ Data integrity maintained (counts match)
- ✅ Performance within targets
- ✅ Application functions correctly
- ✅ No critical errors
- ✅ Team sign-off obtained

## Next Steps After Successful Test

### Immediate Actions
1. ✅ Document test results
2. ✅ Fill out verification checklist
3. ✅ Save test output files
4. ✅ Notify team of success

### Short-term Actions
1. Re-apply migration 032 if needed
2. Verify migration success again
3. Proceed with production planning
4. Update rollback documentation

### Long-term Actions
1. Archive test results
2. Update runbooks
3. Train team on rollback procedure
4. Document lessons learned

## Rollback Decision Matrix

| Scenario | Action | Rationale |
|----------|--------|-----------|
| All checks pass, app works | ✅ Proceed to production | Rollback verified |
| Minor warnings, app works | ⚠️ Proceed with monitoring | Acceptable risk |
| Data mismatch < 1% | ⚠️ Investigate but proceed | Likely orphaned records |
| Data mismatch > 1% | ❌ Do not proceed | Data integrity issue |
| Performance issues | ⚠️ Optimize then proceed | Can be fixed |
| Application errors | ❌ Do not proceed | Must fix first |
| Rollback script fails | ❌ Do not proceed | Critical issue |

## Support and Escalation

### Level 1: Self-Service
- Review this guide
- Check common issues section
- Review error messages
- Check logs

### Level 2: Team Support
- Contact database team
- Share test output
- Provide error details
- Request guidance

### Level 3: Emergency
- Critical rollback failure
- Data loss detected
- Production impact
- Contact: emergency@ganggreen.com

## Files Reference

| File | Purpose |
|------|---------|
| `rollback_032.sql` | Main rollback script |
| `test_rollback_032_staging.sql` | Automated test script |
| `test-rollback-staging.ps1` | PowerShell automation |
| `ROLLBACK_TEST_GUIDE.md` | This guide |

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| Pre-rollback capture | 5 min |
| Execute rollback | 5-10 min |
| Database verification | 15-20 min |
| Application testing | 10-15 min |
| Documentation | 5-10 min |
| **Total** | **40-60 min** |

## Tips for Success

1. **Test during low traffic** - Minimize impact
2. **Save all output** - Use `-SaveOutput` flag
3. **Document everything** - Screenshots, logs, results
4. **Don't rush** - Take time to verify thoroughly
5. **Get sign-off** - Ensure team agreement
6. **Have backup ready** - Know how to restore if needed
7. **Monitor closely** - Watch for issues

## Conclusion

This rollback test is a critical step in validating the migration procedure. Take your time, follow each step carefully, and document all results. A successful rollback test gives confidence that we can safely proceed with production migration, knowing we have a tested recovery procedure if needed.

**Remember**: It's better to find issues during testing than in production!

---

**Guide Version**: 1.0  
**Created**: 2025-01-30  
**Migration**: 032 - Coin System Consolidation  
**Status**: Ready for Use ✅
