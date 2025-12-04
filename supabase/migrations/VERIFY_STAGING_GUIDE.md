# Migration 032 Staging Verification Guide

## Quick Start

### Option 1: Using PowerShell Script (Recommended)
```powershell
# Navigate to project root
cd /path/to/ganggreen-platform

# Run verification script
.\supabase\verify-staging-migration.ps1

# Save output to file
.\supabase\verify-staging-migration.ps1 -SaveOutput
```

### Option 2: Using Supabase CLI
```bash
# Make sure you're linked to staging project
npx supabase link --project-ref <staging-project-ref>

# Run verification
npx supabase db execute -f supabase/migrations/verify_032_staging.sql
```

### Option 3: Using psql Directly
```bash
# Connect to staging database
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/verify_032_staging.sql
```

## What Gets Verified

### 1. Table Structure (3 checks)
- ✓ Deprecated tables exist (`_deprecated_green_coin_*`)
- ✓ Target tables exist (`user_gamification`, `gg_coin_transactions`)
- ✓ `gg_coins` column exists with correct precision (DECIMAL 10,3)

### 2. Data Migration (1 check)
- ✓ Migration statistics match expectations

### 3. Balance Consistency (4 checks)
- ✓ Total balances match between source and target
- ✓ No negative balances
- ✓ No NULL balances
- ✓ Balance precision is valid (3 decimal places)

### 4. Transaction Migration (5 checks)
- ✓ Transaction counts match
- ✓ All transaction types are valid
- ✓ No NULL amounts
- ✓ No zero amounts (warning only)
- ✓ All migrated transactions have metadata

### 5. Referential Integrity (3 checks)
- ✓ No orphaned wallet records
- ✓ No orphaned transaction records
- ✓ All migrated users have wallets

### 6. Indexes and Performance (1 check)
- ✓ Required indexes exist
- Performance test results for balance queries
- Performance test results for transaction history

### 7. Data Quality (1 check)
- ✓ No duplicate transactions
- Transaction type distribution analysis
- Amount range analysis (min, max, avg, median)

### 8. Sample Data (Visual inspection)
- Top 5 wallets by balance
- Most recent 5 transactions
- Comparison with original data

### 9. Helper Functions (1 check)
- ✓ `is_migrated_transaction` function exists
- ✓ `get_coin_migration_stats` function exists

### 10. Deprecation (2 checks)
- ✓ Deprecated tables have comments
- ✓ Tables are renamed with `_deprecated_` prefix

## Interpreting Results

### Status Indicators

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| ✓ PASS | Check passed successfully | None - proceed |
| ⚠ WARNING | Check passed with warnings | Review and document |
| ✗ FAIL | Check failed | Investigate and fix |

### Common Issues and Solutions

#### Issue: Balance Mismatch
**Status**: ✗ FAIL - Balance totals don't match

**Possible Causes**:
- Orphaned wallet records (users deleted)
- Concurrent transactions during migration
- Data corruption in source tables

**Solution**:
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

#### Issue: Transaction Count Mismatch
**Status**: ✗ FAIL - Transaction counts don't match

**Possible Causes**:
- Orphaned transactions (users deleted)
- Constraint violations during migration
- Invalid transaction data

**Solution**:
```sql
-- Find missing transactions
SELECT COUNT(*) as source_count 
FROM _deprecated_green_coin_transactions;

SELECT COUNT(*) as migrated_count 
FROM gg_coin_transactions 
WHERE metadata->>'migrated_from' = 'green_coins';

-- Check for orphaned transactions
SELECT COUNT(*) as orphaned
FROM _deprecated_green_coin_transactions gct
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = gct.user_id);
```

#### Issue: Missing Indexes
**Status**: ✗ FAIL - Required indexes don't exist

**Solution**:
```sql
-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_gg_coin_transactions_user_time 
  ON gg_coin_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gg_coin_transactions_type 
  ON gg_coin_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_gg_coin_transactions_reference 
  ON gg_coin_transactions(reference_type, reference_id);
```

#### Issue: Negative Balances
**Status**: ✗ FAIL - Found negative balances

**Possible Causes**:
- Data corruption in source
- Race condition during migration
- Incorrect transaction processing

**Solution**:
```sql
-- Find users with negative balances
SELECT id, gg_coins 
FROM user_gamification 
WHERE gg_coins < 0;

-- Investigate transaction history
SELECT * FROM gg_coin_transactions 
WHERE user_id = '<user-id>' 
ORDER BY created_at DESC;

-- Fix if needed (with caution)
UPDATE user_gamification 
SET gg_coins = 0 
WHERE gg_coins < 0;
```

## Performance Benchmarks

### Expected Performance

| Operation | Target | Acceptable | Action Required |
|-----------|--------|------------|-----------------|
| Balance Query | < 50ms | < 100ms | > 100ms |
| Transaction Insert | < 200ms | < 500ms | > 500ms |
| Transaction History | < 100ms | < 200ms | > 200ms |
| Migration Duration | < 5 min | < 10 min | > 10 min |

### Performance Issues

If queries are slower than expected:

```sql
-- Update statistics
ANALYZE user_gamification;
ANALYZE gg_coin_transactions;

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

-- Rebuild indexes if needed
REINDEX TABLE gg_coin_transactions;
```

## Application Testing Checklist

After database verification passes, test the application:

### 1. Balance Display
- [ ] Open user profile/wallet page
- [ ] Verify GG Coin balance displays correctly
- [ ] Check decimal formatting (hide .000, show .500)
- [ ] Verify thousand separators for large amounts
- [ ] Check loading states work

### 2. Transaction Recording
- [ ] Perform action that earns coins (plant tree, complete mission)
- [ ] Verify coins are credited immediately
- [ ] Check balance updates in real-time
- [ ] Verify toast notification appears
- [ ] Check transaction appears in history

### 3. Transaction History
- [ ] Open transaction history page
- [ ] Verify migrated transactions appear
- [ ] Check pagination works correctly
- [ ] Verify amounts display with +/- prefix
- [ ] Check timestamps are relative (e.g., "2 hours ago")
- [ ] Test filtering by type (if implemented)

### 4. Real-time Updates
- [ ] Open wallet in one browser tab
- [ ] Earn coins in another tab/device
- [ ] Verify balance updates in first tab within 2 seconds
- [ ] Check subscription cleanup on unmount

### 5. Error Handling
- [ ] Monitor browser console for errors
- [ ] Check application logs for warnings
- [ ] Verify error messages are user-friendly
- [ ] Test with network disconnection

### 6. UI Consistency
- [ ] Search codebase for "Green Coin" references
- [ ] Verify all text says "GG Coins"
- [ ] Check navigation labels
- [ ] Verify help text and tooltips
- [ ] Check email templates (if applicable)

## Rollback Decision Tree

```
Did verification pass all critical checks?
├─ YES → Proceed with application testing
│   └─ Did application testing pass?
│       ├─ YES → Migration successful! ✓
│       └─ NO → Investigate application issues
│           └─ Can issues be fixed quickly?
│               ├─ YES → Fix and retest
│               └─ NO → Consider rollback
│
└─ NO → Are failures critical?
    ├─ YES → ROLLBACK IMMEDIATELY
    │   └─ Run: psql -f supabase/migrations/rollback_032.sql
    │
    └─ NO (warnings only) → Document and proceed
        └─ Monitor closely in production
```

## Critical vs Non-Critical Failures

### Critical Failures (Require Rollback)
- ✗ Balance totals don't match (> 1% difference)
- ✗ Negative balances found
- ✗ Orphaned wallet records
- ✗ Orphaned transaction records
- ✗ Missing required indexes
- ✗ Helper functions don't exist
- ✗ Transaction types invalid

### Non-Critical Warnings (Can Proceed)
- ⚠ Zero-amount transactions found
- ⚠ Some users without wallets (if they have no transactions)
- ⚠ Duplicate transactions (if intentional)
- ⚠ Performance slightly slower than target

## Monitoring After Verification

### Database Metrics to Monitor
```sql
-- Check transaction rate
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as transaction_count
FROM gg_coin_transactions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Check error rate
SELECT 
  COUNT(*) FILTER (WHERE amount < 0) as negative_amounts,
  COUNT(*) FILTER (WHERE amount = 0) as zero_amounts,
  COUNT(*) as total_transactions
FROM gg_coin_transactions
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check balance distribution
SELECT 
  CASE 
    WHEN gg_coins = 0 THEN '0'
    WHEN gg_coins < 100 THEN '1-99'
    WHEN gg_coins < 1000 THEN '100-999'
    WHEN gg_coins < 10000 THEN '1000-9999'
    ELSE '10000+'
  END as balance_range,
  COUNT(*) as user_count
FROM user_gamification
GROUP BY balance_range
ORDER BY balance_range;
```

### Application Metrics to Monitor
- Balance query response time
- Transaction recording success rate
- Real-time update latency
- Error rate in logs
- User support tickets

## Success Criteria

Migration verification is successful when:

- ✅ All critical checks pass (✓ PASS status)
- ✅ Warnings are documented and acceptable
- ✅ Performance is within acceptable range
- ✅ Sample data looks correct
- ✅ Application testing passes
- ✅ No increase in error rates
- ✅ User experience is smooth

## Next Steps After Successful Verification

1. **Document Results**
   - Save verification output
   - Note any warnings
   - Record performance metrics

2. **Update Application Code**
   - Deploy new `ggCoin.service.ts`
   - Update UI components
   - Remove Green Coin references

3. **Monitor Production**
   - Set up alerts for errors
   - Monitor performance metrics
   - Track user feedback

4. **Plan Cleanup**
   - Schedule deprecated table archival
   - Plan Green Coin service removal
   - Update documentation

## Support and Resources

### Documentation
- [Migration Guide](./MIGRATION_032_GUIDE.md)
- [Requirements](.kiro/specs/coin-harmonization/requirements.md)
- [Design](.kiro/specs/coin-harmonization/design.md)
- [Tasks](.kiro/specs/coin-harmonization/tasks.md)

### Useful Queries
```sql
-- Get migration statistics
SELECT * FROM get_coin_migration_stats();

-- Check recent transactions
SELECT * FROM gg_coin_transactions 
ORDER BY created_at DESC 
LIMIT 20;

-- Find users with highest balances
SELECT id, gg_coins 
FROM user_gamification 
ORDER BY gg_coins DESC 
LIMIT 10;

-- Check transaction type distribution
SELECT 
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM gg_coin_transactions
GROUP BY transaction_type
ORDER BY count DESC;
```

### Contact
- **Database Team**: database-team@ganggreen.com
- **DevOps Team**: devops@ganggreen.com
- **Emergency**: emergency@ganggreen.com

---

**Last Updated**: 2025-01-30  
**Migration Version**: 032  
**Status**: Ready for Verification
