# Migration 032: Consolidate Green Coins into GG Coins

## Overview

This migration consolidates the dual coin system (Green Coins and GG Coins) into a single unified GG Coins system. It migrates all Green Coin wallet balances and transaction history into the GG Coins infrastructure.

## Requirements Addressed

- **B2.1**: Use `user_gamification.gg_coins` as single source of truth for balances
- **B2.2**: Use `gg_coin_transactions` as single transaction log
- **B2.3**: Migrate existing Green Coin data to GG Coins
- **B2.4**: Maintain referential integrity
- **B6.1**: Migrate data without downtime
- **B6.2**: Preserve all historical data
- **B6.3**: Validate migration success

## Migration Details

### What This Migration Does

1. **Creates GG Coin Infrastructure** (if not exists)
   - `gg_coin_transactions` table with DECIMAL(10,3) precision
   - Indexes for performance optimization
   - `gg_coins` column in `user_gamification` table

2. **Migrates Wallet Balances**
   - Converts integer Green Coins to decimal GG Coins (1:1 ratio)
   - Merges with existing GG Coin balances if any
   - Preserves last_updated timestamps

3. **Migrates Transaction History**
   - Converts all Green Coin transactions to GG Coin format
   - Maps transaction types (earn, spend, bonus, referral)
   - Adds migration metadata for traceability
   - Preserves original timestamps

4. **Validates Migration**
   - Verifies total balances match
   - Confirms transaction counts match
   - Checks for data integrity

5. **Deprecates Old Tables**
   - Renames tables to `_deprecated_green_coin_*`
   - Adds deprecation comments
   - Keeps tables read-only for historical reference

### Data Conversion

| Green Coins | GG Coins | Notes |
|-------------|----------|-------|
| 100 (INTEGER) | 100.000 (DECIMAL) | 1:1 conversion ratio |
| balance | gg_coins | Column mapping |
| transaction_type | transaction_type | Direct mapping |
| source | reference_type | Semantic mapping |
| reference_id | reference_id | Direct mapping |

### Migration Metadata

Each migrated transaction includes metadata:
```json
{
  "migrated_from": "green_coins",
  "original_id": "uuid-of-original-transaction",
  "migration_date": "2025-01-30T...",
  "original_source": "tree_planting"
}
```

## Pre-Deployment Checklist

### 1. Backup Database
```bash
# Create full database backup
pg_dump -h [HOST] -U [USER] -d [DATABASE] -F c -f backup_pre_032_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
pg_restore --list backup_pre_032_*.dump | head -20
```

### 2. Verify Source Data
```sql
-- Check Green Coin wallet count
SELECT COUNT(*) as wallet_count FROM green_coin_wallets;

-- Check total Green Coin balance
SELECT SUM(balance) as total_balance FROM green_coin_wallets;

-- Check Green Coin transaction count
SELECT COUNT(*) as transaction_count FROM green_coin_transactions;

-- Check for any NULL user_ids (data integrity)
SELECT COUNT(*) FROM green_coin_wallets WHERE user_id IS NULL;
SELECT COUNT(*) FROM green_coin_transactions WHERE user_id IS NULL;
```

### 3. Test on Staging
```bash
# Deploy to staging environment first
psql -h [STAGING_HOST] -U [USER] -d [DATABASE] -f supabase/migrations/032_consolidate_coins.sql

# Verify migration on staging
psql -h [STAGING_HOST] -U [USER] -d [DATABASE] -c "SELECT * FROM get_coin_migration_stats();"

# Test rollback on staging
psql -h [STAGING_HOST] -U [USER] -d [DATABASE] -f supabase/migrations/rollback_032.sql
```

### 4. Notify Stakeholders
- [ ] Inform development team
- [ ] Notify support team
- [ ] Prepare user communication (if needed)
- [ ] Schedule maintenance window (optional)

### 5. Prepare Monitoring
- [ ] Set up database performance monitoring
- [ ] Configure error alerting
- [ ] Prepare rollback procedure
- [ ] Have DBA on standby

## Deployment Instructions

### Option 1: Using Supabase CLI (Recommended)
```bash
# Navigate to project root
cd /path/to/ganggreen-platform

# Deploy migration
npx supabase db push

# Verify deployment
npx supabase db remote commit list
```

### Option 2: Manual Deployment
```bash
# Connect to production database
psql -h [PROD_HOST] -U [USER] -d [DATABASE]

# Run migration
\i supabase/migrations/032_consolidate_coins.sql

# Check for errors
\echo :LAST_ERROR_MESSAGE

# Verify migration
SELECT * FROM get_coin_migration_stats();
```

### Expected Output
```
NOTICE:  Pre-migration validation passed
NOTICE:  Migrated 1234 wallet balances
NOTICE:  Migrated 5678 transactions
NOTICE:  Migration verification passed:
NOTICE:    - Green Coin wallets: 1234
NOTICE:    - Total balance migrated: 123456.000 GG Coins
NOTICE:    - Transactions migrated: 5678
NOTICE:    - Total GG Coin transactions: 5678
NOTICE:  Marked old tables as deprecated and renamed
========================================
MIGRATION 032 COMPLETED SUCCESSFULLY
========================================
```

### Estimated Duration
- Small dataset (< 1,000 users): 1-2 minutes
- Medium dataset (1,000-10,000 users): 2-5 minutes
- Large dataset (> 10,000 users): 5-10 minutes

## Post-Deployment Verification

### 1. Verify Migration Statistics
```sql
-- Get migration summary
SELECT * FROM get_coin_migration_stats();

-- Expected output:
--   total_wallets_migrated: [count]
--   total_balance_migrated: [amount]
--   total_transactions_migrated: [count]
--   current_gg_coin_total: [amount]
--   total_gg_coin_transactions: [count]
```

### 2. Verify Data Integrity
```sql
-- Check that deprecated tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '_deprecated_green_coin%';

-- Verify no data loss
SELECT 
  (SELECT COUNT(*) FROM _deprecated_green_coin_wallets) as old_wallets,
  (SELECT COUNT(DISTINCT user_id) FROM gg_coin_transactions WHERE metadata->>'migrated_from' = 'green_coins') as migrated_users;

-- Check balance totals
SELECT 
  (SELECT SUM(balance) FROM _deprecated_green_coin_wallets) as old_total,
  (SELECT SUM(gg_coins) FROM user_gamification) as new_total;
```

### 3. Test Application Functionality
```bash
# Test balance queries
curl -X GET "https://your-api.com/api/coins/balance" \
  -H "Authorization: Bearer [TOKEN]"

# Test transaction recording
curl -X POST "https://your-api.com/api/coins/credit" \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.5, "type": "earn", "description": "Test transaction"}'

# Test transaction history
curl -X GET "https://your-api.com/api/coins/transactions" \
  -H "Authorization: Bearer [TOKEN]"
```

### 4. Monitor Performance
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT gg_coins FROM user_gamification WHERE id = '[user-id]';

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('user_gamification', 'gg_coin_transactions')
ORDER BY idx_scan DESC;
```

### 5. Verify RLS Policies
```sql
-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claim.sub = '[user-id]';

-- Should return user's own transactions
SELECT COUNT(*) FROM gg_coin_transactions WHERE user_id = '[user-id]';

-- Should not return other users' transactions
SELECT COUNT(*) FROM gg_coin_transactions WHERE user_id != '[user-id]';

RESET ROLE;
```

## Rollback Procedure

### When to Rollback
- Migration fails with errors
- Data integrity issues detected
- Application errors after deployment
- Performance degradation
- Within 1 hour of deployment

### Rollback Steps
```bash
# 1. Stop application traffic (optional)
# Update load balancer or feature flags

# 2. Execute rollback script
psql -h [PROD_HOST] -U [USER] -d [DATABASE] -f supabase/migrations/rollback_032.sql

# 3. Verify rollback
psql -h [PROD_HOST] -U [USER] -d [DATABASE] -c "SELECT COUNT(*) FROM green_coin_wallets;"

# 4. Restore from backup (if needed)
pg_restore -h [PROD_HOST] -U [USER] -d [DATABASE] -c backup_pre_032_*.dump

# 5. Resume application traffic
```

### Post-Rollback Actions
1. Investigate root cause of failure
2. Fix issues in development environment
3. Test fix on staging
4. Schedule new deployment window
5. Update deployment documentation

## Application Code Updates

### Required Changes

#### 1. Update Service Imports
```typescript
// OLD - Remove these imports
import { greenCoinService } from './services/greenCoin.service';

// NEW - Use unified service
import { ggCoinService } from './services/ggCoin.service';
```

#### 2. Update Balance Queries
```typescript
// OLD
const balance = await greenCoinService.getBalance(userId);

// NEW
const balance = await ggCoinService.getBalance(userId);
```

#### 3. Update Transaction Recording
```typescript
// OLD
await greenCoinService.recordTransaction(
  userId, 'earn', 50, 'tree_planting', 'Planted a tree'
);

// NEW
await ggCoinService.creditCoins(
  userId, 50, 'earn', 'Planted a tree', 
  { referenceType: 'tree_planting' }
);
```

#### 4. Update UI Components
```typescript
// OLD
<GreenCoinWallet userId={userId} />

// NEW
<GGCoinWallet userId={userId} />
```

### Deprecation Timeline
- **Week 1**: Migration deployed, both systems work
- **Week 2-3**: Update application code to use GG Coins
- **Week 4**: Remove Green Coin service code
- **Month 2**: Archive deprecated tables

## Troubleshooting

### Issue: Migration Timeout
**Symptom**: Migration takes longer than expected
**Solution**:
```sql
-- Increase statement timeout
SET statement_timeout = '10min';

-- Run migration in batches (if needed)
-- Contact DBA for assistance
```

### Issue: Balance Mismatch
**Symptom**: Total balances don't match after migration
**Solution**:
```sql
-- Check for rounding issues
SELECT 
  user_id,
  balance as green_balance,
  gg_coins as gg_balance,
  (gg_coins - balance::DECIMAL) as difference
FROM _deprecated_green_coin_wallets gcw
JOIN user_gamification ug ON gcw.user_id = ug.id
WHERE ABS(gg_coins - balance::DECIMAL) > 0.001;

-- Investigate specific users with discrepancies
```

### Issue: Transaction Count Mismatch
**Symptom**: Number of migrated transactions doesn't match source
**Solution**:
```sql
-- Check for failed inserts
SELECT COUNT(*) as source_count FROM _deprecated_green_coin_transactions;
SELECT COUNT(*) as migrated_count 
FROM gg_coin_transactions 
WHERE metadata->>'migrated_from' = 'green_coins';

-- Check for constraint violations in logs
SELECT * FROM error_logs 
WHERE component = 'migration_032' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Issue: Application Errors
**Symptom**: Application throws errors after migration
**Solution**:
1. Check application logs for specific errors
2. Verify service code is updated
3. Clear application caches
4. Restart application servers
5. Check database connection pool

### Issue: Performance Degradation
**Symptom**: Queries are slower after migration
**Solution**:
```sql
-- Update table statistics
ANALYZE user_gamification;
ANALYZE gg_coin_transactions;

-- Rebuild indexes if needed
REINDEX TABLE gg_coin_transactions;

-- Check for missing indexes
SELECT * FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND relname IN ('user_gamification', 'gg_coin_transactions');
```

## Success Criteria

Migration is successful when:
- ✅ All Green Coin wallets migrated to GG Coins
- ✅ All Green Coin transactions migrated to GG Coin transactions
- ✅ Total balances match (within rounding tolerance)
- ✅ Transaction counts match exactly
- ✅ Old tables renamed and marked as deprecated
- ✅ No data loss or corruption
- ✅ Application functionality verified
- ✅ Performance within acceptable limits (< 200ms for balance queries)
- ✅ No increase in error rates

## Support

### Contact Information
- **Database Team**: database-team@ganggreen.com
- **DevOps Team**: devops@ganggreen.com
- **Emergency**: emergency@ganggreen.com

### Useful Queries
```sql
-- Get migration status
SELECT * FROM get_coin_migration_stats();

-- Check for migrated transactions
SELECT COUNT(*), transaction_type 
FROM gg_coin_transactions 
WHERE metadata->>'migrated_from' = 'green_coins'
GROUP BY transaction_type;

-- Find users with highest balances
SELECT user_id, gg_coins 
FROM user_gamification 
ORDER BY gg_coins DESC 
LIMIT 10;

-- Check recent transactions
SELECT * FROM gg_coin_transactions 
ORDER BY created_at DESC 
LIMIT 20;
```

## References

- [Requirements Document](.kiro/specs/coin-harmonization/requirements.md)
- [Design Document](.kiro/specs/coin-harmonization/design.md)
- [GG Coin Service](../../src/services/ggCoin.service.ts)
- [Green Coin Service (Deprecated)](../../src/services/greenCoin.service.ts)

---

**Migration Version**: 032  
**Date**: 2025-01-30  
**Author**: Kiro AI Agent  
**Status**: Ready for Deployment
