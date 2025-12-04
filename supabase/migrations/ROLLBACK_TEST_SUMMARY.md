# Rollback Test Implementation Summary

## What Was Created

A comprehensive rollback testing package for Migration 032 (Coin System Consolidation) has been created to ensure the rollback procedure works correctly on staging before production deployment.

### Files Created

1. **test_rollback_032_staging.sql** - Automated test script
   - 9 comprehensive test sections
   - 20+ automated verification checks
   - Pre/post-rollback state capture
   - Performance testing
   - Sample data inspection
   - Detailed pass/fail reporting

2. **test-rollback-staging.ps1** - PowerShell automation script
   - Interactive step-by-step execution
   - Automatic output saving
   - Color-coded results
   - Application testing guidance
   - Summary generation

3. **ROLLBACK_TEST_GUIDE.md** - Detailed testing guide
   - Step-by-step instructions
   - Expected outputs for each step
   - Common issues and solutions
   - Decision tree for results
   - Application testing checklist
   - 40-60 minute timeline

4. **ROLLBACK_TEST_CHECKLIST.md** - Manual checklist
   - Printable/fillable format
   - All verification steps
   - Issue tracking section
   - Sign-off areas
   - Attachment tracking

## Quick Start

### Fastest Way to Test Rollback

```powershell
# 1. Navigate to project root
cd D:\Projects\ggh\GangGreenHeroes

# 2. Run automated test script
.\supabase\test-rollback-staging.ps1 -SaveOutput

# 3. Follow prompts and review results
```

### What Gets Tested

The rollback test automatically verifies:

#### Database Verification (8 sections)
1. **Pre-Rollback State Capture**
   - Deprecated wallet count
   - Deprecated balance total
   - Deprecated transaction count
   - Migrated transaction count
   - GG Coin balance total

2. **Rollback Prerequisites**
   - Deprecated tables exist
   - Target tables exist
   - Migrated transactions exist
   - Helper functions exist

3. **Rollback Execution**
   - Script runs without errors
   - Completion message received
   - Duration tracking

4. **Table Restoration**
   - Green Coin tables restored
   - Deprecated tables removed
   - Table structure correct

5. **Data Integrity**
   - Wallet count matches
   - Balance total matches
   - Transaction count matches
   - No negative balances
   - No NULL balances
   - Orphaned records acceptable

6. **Transaction Cleanup**
   - Migrated transactions removed
   - GG Coin transactions reduced
   - No orphaned transactions

7. **Function Cleanup**
   - Helper functions removed
   - No migration artifacts remain

8. **Metadata Verification**
   - Table comments restored
   - No "DEPRECATED" references
   - Comments appropriate

9. **Performance Testing**
   - Balance queries < 50ms
   - Transaction queries < 200ms
   - Indexes exist

#### Application Testing (5 areas)
1. **Balance Display** - UI shows Green Coins correctly
2. **Earn Coins** - Transactions record properly
3. **Transaction History** - History displays correctly
4. **Service Integration** - greenCoin.service.ts works
5. **Real-time Updates** - Subscriptions work

**Total: 20+ automated checks + 5 application tests**

## Test Workflow

```
┌─────────────────────────────────────┐
│  1. Pre-Rollback State Capture      │
│     - Document current state        │
│     - Save metrics                  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  2. Execute Rollback Script         │
│     - Run rollback_032.sql          │
│     - Monitor for errors            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  3. Verify Table Restoration        │
│     - Check tables exist            │
│     - Verify structure              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  4. Verify Data Integrity           │
│     - Compare counts                │
│     - Check balances                │
│     - Validate quality              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  5. Verify Cleanup                  │
│     - Transactions removed          │
│     - Functions removed             │
│     - Comments restored             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  6. Test Performance                │
│     - Query times                   │
│     - Index existence               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  7. Test Application                │
│     - UI functionality              │
│     - Service methods               │
│     - Real-time updates             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  8. Generate Report                 │
│     - Document results              │
│     - Get sign-off                  │
└─────────────────────────────────────┘
```

## Expected Output

### Successful Test

```
========================================================================
ROLLBACK TEST FOR MIGRATION 032
========================================================================

PRE-ROLLBACK STATE CAPTURED
========================================
  deprecated_wallet_count: 1234
  deprecated_wallet_balance_total: 123456.000
  deprecated_transaction_count: 5678
  migrated_transaction_count: 5678
  gg_coin_balance_total: 123456.000

EXECUTING ROLLBACK
========================================
Rollback script executed
Duration: 4.23 seconds

ROLLBACK VERIFICATION
========================================================================

1. Table Restoration Check
  ✓ PASS | Deprecated tables removed
  ✓ PASS | Green Coin tables restored

2. Wallet Count Check
  ✓ PASS | Wallet count matches | 1234 = 1234

3. Balance Total Check
  ✓ PASS | Balance total matches | 123456.000 ≈ 123456.000

4. Transaction Count Check
  ✓ PASS | Transaction count matches | 5678 = 5678

5. Migrated Transaction Cleanup Check
  ✓ PASS | All migrated transactions removed | 5678 removed

6. Data Integrity Check
  ✓ PASS | No orphaned wallets
  ✓ PASS | No orphaned transactions
  ✓ PASS | No negative balances
  ✓ PASS | No NULL balances

7. Helper Function Cleanup Check
  ✓ PASS | Helper functions removed

8. Table Comment Check
  ✓ PASS | Wallet table comment restored
  ✓ PASS | Transaction table comment restored

========================================================================
✓ ROLLBACK TEST PASSED
All critical checks passed successfully
========================================================================
```

### Failed Test

```
3. Balance Total Check
  ✗ FAIL | Balance total mismatch | 123456.000 != 120000.000 (diff: 3456.000)

6. Data Integrity Check
  ✗ FAIL | 5 negative balances found
  ⚠ WARNING | 10 orphaned wallets found

========================================================================
✗ ROLLBACK TEST FAILED
One or more critical checks failed - review above
========================================================================
```

## Interpreting Results

### Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| ✓ PASS | Check passed | Continue testing |
| ⚠ WARNING | Passed with warnings | Review and document |
| ✗ FAIL | Check failed | Investigate immediately |

### Critical vs Non-Critical

**Critical Failures** (Must fix):
- Balance totals don't match (> 1% difference)
- Negative balances found
- NULL balances found
- Tables not restored
- Migrated transactions remain
- Rollback script errors

**Non-Critical Warnings** (Can proceed):
- Orphaned records (if expected)
- Helper functions still exist (can be manually dropped)
- Comments not perfectly restored
- Performance slightly slower than target

## Decision Matrix

| Test Result | Database Status | Application Status | Decision |
|-------------|----------------|-------------------|----------|
| All PASS | ✅ | ✅ | ✅ PROCEED |
| Minor WARNING | ✅ | ✅ | ⚠️ PROCEED WITH MONITORING |
| Major WARNING | ⚠️ | ✅ | ⚠️ INVESTIGATE THEN DECIDE |
| Any FAIL | ❌ | - | ❌ DO NOT PROCEED |
| All PASS | ✅ | ❌ | ❌ FIX APPLICATION FIRST |

## Common Issues

### Issue 1: Balance Mismatch

**Symptom**: Balance totals don't match

**Quick Check**:
```sql
-- Find discrepancies
SELECT 
  user_id,
  balance as green_balance,
  gg_coins as gg_balance,
  (gg_coins - balance::DECIMAL) as difference
FROM _deprecated_green_coin_wallets gcw
JOIN user_gamification ug ON gcw.user_id = ug.id
WHERE ABS(gg_coins - balance::DECIMAL) > 0.001;
```

**Common Causes**:
- Orphaned records
- Concurrent transactions
- Data corruption

**Fix**: Investigate specific users, may need to re-run migration

### Issue 2: Rollback Script Fails

**Symptom**: ERROR during rollback execution

**Quick Check**:
```sql
-- Check current state
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%green_coin%';
```

**Common Causes**:
- Migration not applied
- Permissions issue
- Syntax error

**Fix**: Review error message, check prerequisites, try manual steps

### Issue 3: Application Errors

**Symptom**: UI doesn't work after rollback

**Quick Check**:
- Check browser console
- Verify service is using `greenCoin.service.ts`
- Check API endpoints

**Common Causes**:
- Code still using GG Coins
- Cache not cleared
- Service not updated

**Fix**: Update code, clear cache, restart server

## Next Steps After Testing

### If Test Passes ✅

1. **Immediate** (Day 1)
   - Document test results
   - Fill out checklist
   - Get team sign-off
   - Save all output files

2. **Short-term** (Week 1)
   - Re-apply migration 032 if needed
   - Verify migration success
   - Plan production deployment
   - Update documentation

3. **Long-term** (Month 1)
   - Deploy to production
   - Monitor metrics
   - Archive test results
   - Document lessons learned

### If Test Fails ❌

1. **Immediate**
   - Stop all migration activities
   - Document failure details
   - Investigate root cause
   - Fix rollback script

2. **Short-term**
   - Re-test rollback
   - Verify fix works
   - Update documentation
   - Re-plan deployment

3. **Long-term**
   - Review migration strategy
   - Improve testing procedures
   - Update runbooks
   - Train team

## Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `test_rollback_032_staging.sql` | Automated test script | Run after rollback |
| `test-rollback-staging.ps1` | PowerShell automation | Easiest way to test |
| `ROLLBACK_TEST_GUIDE.md` | Detailed guide | For step-by-step instructions |
| `ROLLBACK_TEST_CHECKLIST.md` | Manual checklist | For documentation |
| `ROLLBACK_TEST_SUMMARY.md` | This file | Quick reference |

## Estimated Time

| Task | Duration |
|------|----------|
| Pre-rollback capture | 5 min |
| Execute rollback | 5-10 min |
| Database verification | 15-20 min |
| Application testing | 10-15 min |
| Documentation | 5-10 min |
| **Total** | **40-60 min** |

## Success Criteria

Rollback test is successful when:

- ✅ All 20+ database checks pass
- ✅ All 5 application tests pass
- ✅ Performance within targets
- ✅ No critical errors
- ✅ Team sign-off obtained
- ✅ Documentation complete

## Support

### Documentation
- [Detailed Test Guide](./ROLLBACK_TEST_GUIDE.md)
- [Manual Checklist](./ROLLBACK_TEST_CHECKLIST.md)
- [Rollback Script](./rollback_032.sql)
- [Migration Guide](./MIGRATION_032_GUIDE.md)

### Useful Queries
```sql
-- Check current state
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%green_coin%';

-- Get wallet count
SELECT COUNT(*) FROM green_coin_wallets;

-- Get balance total
SELECT SUM(balance) FROM green_coin_wallets;

-- Check for issues
SELECT COUNT(*) FROM green_coin_wallets WHERE balance < 0;
```

### Contact
- Database Team: database-team@ganggreen.com
- DevOps Team: devops@ganggreen.com
- Emergency: emergency@ganggreen.com

## Tips for Success

1. **Test during low traffic** - Minimize impact on staging
2. **Save all output** - Use `-SaveOutput` flag
3. **Document everything** - Screenshots, logs, results
4. **Don't rush** - Take time to verify thoroughly
5. **Get sign-off** - Ensure team agreement
6. **Have backup ready** - Know how to restore
7. **Monitor closely** - Watch for issues

## Conclusion

This rollback testing package provides everything needed to confidently verify the rollback procedure works correctly. The automated scripts, detailed guides, and comprehensive checklists ensure thorough testing and proper documentation.

**Key Benefits**:
- ✅ Automated testing saves time
- ✅ Comprehensive checks catch issues
- ✅ Clear documentation for team
- ✅ Confidence in rollback procedure
- ✅ Ready for production deployment

**Remember**: A successful rollback test means we can proceed with production migration knowing we have a tested recovery procedure if needed!

---

**Package Version**: 1.0  
**Created**: 2025-01-30  
**Migration**: 032 - Coin System Consolidation  
**Task**: 1.2 - Test rollback on staging  
**Status**: Complete ✅
