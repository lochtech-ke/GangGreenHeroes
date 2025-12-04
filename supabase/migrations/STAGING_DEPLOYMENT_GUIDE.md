# Migration 032 - Staging Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Migration 032 (Coin System Consolidation) to the staging environment.

## Prerequisites

### Required Tools
- ✅ Supabase CLI installed (`npx supabase`)
- ✅ Node.js and npm installed
- ✅ PowerShell (Windows) or Bash (Mac/Linux)
- ✅ Access to Supabase project

### Required Access
- ✅ Supabase account with project access
- ✅ Admin permissions on staging database
- ✅ Ability to run SQL queries

### Completed Tasks
- ✅ Task 1.1: Migration script created and validated
- ✅ Task 1.2 (Subtask 1): Staging backup created

## Deployment Options

### Option 1: Automated Deployment (Recommended)

Use the PowerShell deployment script for automated deployment with safety checks.

#### Windows (PowerShell)
```powershell
# 1. Dry run first (see what would happen)
.\supabase\deploy-migration-032-staging.ps1 -DryRun

# 2. Deploy to staging
.\supabase\deploy-migration-032-staging.ps1

# 3. Deploy with automatic verification
.\supabase\deploy-migration-032-staging.ps1 -Verify
```

#### Mac/Linux (Bash)
```bash
# Convert PowerShell script to bash or use manual method below
```

### Option 2: Manual Deployment via Supabase CLI

Step-by-step manual deployment using Supabase CLI.

#### Step 1: Authenticate
```bash
# Login to Supabase (opens browser)
npx supabase login
```

#### Step 2: Link Project
```bash
# Link to your staging project
npx supabase link --project-ref wobpryllvdjaapzjbsxx
```

#### Step 3: Deploy Migration
```bash
# Push all pending migrations
npx supabase db push

# Or execute specific migration file
npx supabase db execute -f supabase/migrations/032_consolidate_coins.sql
```

#### Step 4: Verify Deployment
```bash
# Run verification queries
npx supabase db execute -f supabase/backups/verify_032_[timestamp].sql
```

### Option 3: Manual Deployment via Supabase Dashboard

Use the web interface for manual deployment.

#### Step 1: Open SQL Editor
1. Go to https://app.supabase.com
2. Select project: `wobpryllvdjaapzjbsxx`
3. Click "SQL Editor" in left sidebar
4. Click "New query"

#### Step 2: Execute Migration
1. Open `supabase/migrations/032_consolidate_coins.sql`
2. Copy entire content
3. Paste into SQL Editor
4. Click "Run" (or Ctrl+Enter)
5. Wait for completion (~2-5 minutes)

#### Step 3: Verify Results
1. Create new query
2. Copy verification queries (see below)
3. Run and check results

## Verification Queries

Run these queries after deployment to verify success:

### 1. Check Migration Statistics
```sql
SELECT * FROM get_coin_migration_stats();
```

Expected output:
- `total_wallets_migrated`: [count of wallets]
- `total_balance_migrated`: [sum of balances]
- `total_transactions_migrated`: [count of transactions]
- `current_gg_coin_total`: [should match total_balance_migrated]
- `total_gg_coin_transactions`: [should match total_transactions_migrated]

### 2. Verify Deprecated Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '_deprecated_green_coin%'
ORDER BY table_name;
```

Expected output:
- `_deprecated_green_coin_transactions`
- `_deprecated_green_coin_wallets`

### 3. Check Data Integrity
```sql
-- Verify wallet migration
SELECT 
  (SELECT COUNT(*) FROM _deprecated_green_coin_wallets) as old_wallets,
  (SELECT COUNT(DISTINCT user_id) FROM gg_coin_transactions 
   WHERE metadata->>'migrated_from' = 'green_coins') as migrated_users;

-- Verify balance totals
SELECT 
  (SELECT COALESCE(SUM(balance), 0) FROM _deprecated_green_coin_wallets) as old_total,
  (SELECT COALESCE(SUM(gg_coins), 0) FROM user_gamification) as new_total,
  ABS((SELECT COALESCE(SUM(balance), 0) FROM _deprecated_green_coin_wallets) - 
      (SELECT COALESCE(SUM(gg_coins), 0) FROM user_gamification)) as difference;
```

Expected: `difference` should be 0 or very close to 0 (< 0.001)

### 4. Check Transaction Migration
```sql
-- Count transactions by type
SELECT 
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
GROUP BY transaction_type
ORDER BY count DESC;
```

### 5. Verify No Negative Balances
```sql
SELECT COUNT(*) as negative_balance_count
FROM user_gamification
WHERE gg_coins < 0;
```

Expected: 0

### 6. Check for Orphaned Records
```sql
-- Check for transactions without valid users
SELECT COUNT(*) as orphaned_transactions
FROM gg_coin_transactions ggt
WHERE metadata->>'migrated_from' = 'green_coins'
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ggt.user_id);
```

Expected: 0

## Success Criteria

Migration is successful when:

- ✅ All verification queries return expected results
- ✅ No errors in migration output
- ✅ Deprecated tables exist and are renamed
- ✅ Balance totals match (within rounding tolerance)
- ✅ Transaction counts match
- ✅ No negative balances
- ✅ No orphaned records
- ✅ Migration statistics function works

## Testing Application Functionality

After successful migration, test these scenarios:

### 1. Balance Queries
```typescript
// Test getting user balance
const balance = await ggCoinService.getBalance(userId);
console.log('Balance:', balance);
```

### 2. Transaction Recording
```typescript
// Test crediting coins
const tx = await ggCoinService.creditCoins(
  userId,
  10.5,
  'earn',
  'Test transaction'
);
console.log('Transaction:', tx);
```

### 3. Transaction History
```typescript
// Test getting transaction history
const history = await ggCoinService.getTransactionHistory(userId, 20, 0);
console.log('History:', history);
```

### 4. UI Display
- Check that wallet component shows correct balance
- Verify transaction history displays properly
- Confirm no "Green Coins" references in UI

## Rollback Procedure

If migration fails or causes issues:

### Option 1: Using Rollback Script
```bash
# Execute rollback
npx supabase db execute -f supabase/migrations/rollback_032.sql
```

### Option 2: Using Supabase Dashboard
1. Open SQL Editor
2. Copy content of `supabase/migrations/rollback_032.sql`
3. Paste and execute
4. Verify rollback success

### Option 3: Restore from Backup
```bash
# If rollback script fails, restore from backup
# (Requires backup file from Task 1.2 Subtask 1)
```

### Verify Rollback
```sql
-- Check that original tables are restored
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('green_coin_wallets', 'green_coin_transactions')
ORDER BY table_name;

-- Verify balances match backup
SELECT COUNT(*), SUM(balance) 
FROM green_coin_wallets;
```

## Troubleshooting

### Issue: "Extension postgis does not exist"
**Solution**: PostGIS should already be enabled. If not, contact Supabase support.

### Issue: "Permission denied"
**Solution**: Ensure you're authenticated and have admin access to the project.

### Issue: "Relation already exists"
**Solution**: Migration may have partially run. Check which tables exist and consider rollback.

### Issue: Migration timeout
**Solution**: 
- Increase statement timeout in Supabase dashboard
- Contact Supabase support for large datasets
- Consider batched migration approach

### Issue: Balance mismatch
**Solution**:
```sql
-- Investigate specific users with discrepancies
SELECT 
  gcw.user_id,
  gcw.balance as green_balance,
  ug.gg_coins as gg_balance,
  (ug.gg_coins - gcw.balance::DECIMAL) as difference
FROM _deprecated_green_coin_wallets gcw
JOIN user_gamification ug ON gcw.user_id = ug.id
WHERE ABS(ug.gg_coins - gcw.balance::DECIMAL) > 0.001
ORDER BY ABS(ug.gg_coins - gcw.balance::DECIMAL) DESC
LIMIT 10;
```

### Issue: Transaction count mismatch
**Solution**:
```sql
-- Check for failed inserts
SELECT 
  (SELECT COUNT(*) FROM _deprecated_green_coin_transactions) as source_count,
  (SELECT COUNT(*) FROM gg_coin_transactions 
   WHERE metadata->>'migrated_from' = 'green_coins') as migrated_count;

-- Look for specific missing transactions
SELECT gct.*
FROM _deprecated_green_coin_transactions gct
WHERE NOT EXISTS (
  SELECT 1 FROM gg_coin_transactions ggt
  WHERE ggt.metadata->>'original_id' = gct.id::TEXT
)
LIMIT 10;
```

## Performance Monitoring

After deployment, monitor these metrics:

### Database Performance
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
  idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename IN ('user_gamification', 'gg_coin_transactions')
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_gamification', 'gg_coin_transactions', 
                    '_deprecated_green_coin_wallets', '_deprecated_green_coin_transactions')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Application Performance
- Balance query response time (target: < 50ms cached)
- Transaction recording time (target: < 200ms)
- Transaction history query time (target: < 100ms)
- UI load time (target: < 2 seconds)

## Documentation

After successful deployment, document:

### Deployment Log
- Deployment timestamp
- Migration duration
- Any warnings or issues encountered
- Verification results
- Performance metrics

### Issues Log
- Any unexpected behavior
- Workarounds applied
- Items to address before production

### Lessons Learned
- What went well
- What could be improved
- Recommendations for production deployment

## Next Steps

After successful staging deployment:

1. ✅ Mark Task 1.2 Subtask 2 as complete
2. ✅ Proceed to Task 1.2 Subtask 3: Verify migration success
3. ✅ Proceed to Task 1.2 Subtask 4: Test rollback
4. ✅ Document findings
5. ✅ Prepare for production deployment

## Support

### Resources
- Migration Guide: `supabase/migrations/MIGRATION_032_GUIDE.md`
- Rollback Guide: `supabase/migrations/ROLLBACK_032_GUIDE.md`
- Design Document: `.kiro/specs/coin-harmonization/design.md`
- Requirements: `.kiro/specs/coin-harmonization/requirements.md`

### Contact
- Database Team: [contact info]
- DevOps Team: [contact info]
- Emergency: [contact info]

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-30  
**Author**: Kiro AI Agent  
**Status**: Ready for Use
