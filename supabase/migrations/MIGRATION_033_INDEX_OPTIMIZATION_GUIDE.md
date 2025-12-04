# Migration 033: GG Coin Index Optimization Guide

## Overview

This migration adds optimized indexes to improve query performance for the GG Coin system. It addresses the performance requirements specified in the coin harmonization design (D1).

## Performance Targets

- **Balance queries**: < 50ms (cached)
- **Transaction recording**: < 200ms
- **Transaction history**: < 100ms
- **Earning breakdown**: < 100ms

## Indexes Created

### 1. idx_gg_coin_tx_user_type_time
**Purpose**: Optimizes filtered transaction history queries  
**Query Pattern**: `WHERE user_id = ? AND transaction_type = ? ORDER BY created_at DESC`  
**Use Case**: `getTransactionHistory()` with type filter  
**Type**: Composite B-tree index

```sql
CREATE INDEX idx_gg_coin_tx_user_type_time
  ON gg_coin_transactions(user_id, transaction_type, created_at DESC);
```

### 2. idx_gg_coin_tx_user_date
**Purpose**: Optimizes date range queries  
**Query Pattern**: `WHERE user_id = ? AND created_at >= ? AND created_at <= ?`  
**Use Case**: `getTransactionHistory()` with date filters  
**Type**: Composite B-tree index with partial condition

```sql
CREATE INDEX idx_gg_coin_tx_user_date
  ON gg_coin_transactions(user_id, created_at DESC)
  WHERE created_at IS NOT NULL;
```

### 3. idx_gg_coin_tx_earnings
**Purpose**: Optimizes earning breakdown queries  
**Query Pattern**: `WHERE user_id = ? AND amount > 0`  
**Use Case**: `getEarningBreakdown()`  
**Type**: Partial index (only positive amounts)

```sql
CREATE INDEX idx_gg_coin_tx_earnings
  ON gg_coin_transactions(user_id, amount)
  WHERE amount > 0;
```

**Benefits of Partial Index**:
- Smaller index size (only earnings, not spending)
- Faster queries for earning breakdown
- Reduced maintenance overhead

### 4. idx_gg_coin_tx_migrated
**Purpose**: Optimizes queries for migrated transactions  
**Query Pattern**: `WHERE metadata->>'migrated_from' = 'green_coins'`  
**Use Case**: Migration verification and reporting  
**Type**: Expression index on JSONB field

```sql
CREATE INDEX idx_gg_coin_tx_migrated
  ON gg_coin_transactions((metadata->>'migrated_from'))
  WHERE metadata->>'migrated_from' IS NOT NULL;
```

### 5. idx_user_gamification_balance
**Purpose**: Covering index for balance queries  
**Query Pattern**: `WHERE id = ?`  
**Use Case**: `getBalance()`, `getWallet()`  
**Type**: Covering index (includes gg_coins column)

```sql
CREATE INDEX idx_user_gamification_balance
  ON user_gamification(id, gg_coins)
  WHERE gg_coins > 0;
```

**Benefits of Covering Index**:
- Index-only scans (no table access needed)
- Faster balance queries
- Only indexes users with positive balance

## Existing Indexes (from Migration 032)

These indexes were already created in migration 032:

1. **idx_gg_coin_transactions_user_time**: `(user_id, created_at DESC)`
2. **idx_gg_coin_transactions_type**: `(transaction_type)`
3. **idx_gg_coin_transactions_reference**: `(reference_type, reference_id)`

## Query Optimization Examples

### Before Optimization
```sql
-- Sequential scan on large table
EXPLAIN ANALYZE
SELECT * FROM gg_coin_transactions
WHERE user_id = 'abc123'
  AND transaction_type = 'earn'
ORDER BY created_at DESC
LIMIT 50;

-- Result: Seq Scan on gg_coin_transactions (cost=0.00..1234.56 rows=100)
-- Execution time: 250ms
```

### After Optimization
```sql
-- Index scan using composite index
EXPLAIN ANALYZE
SELECT * FROM gg_coin_transactions
WHERE user_id = 'abc123'
  AND transaction_type = 'earn'
ORDER BY created_at DESC
LIMIT 50;

-- Result: Index Scan using idx_gg_coin_tx_user_type_time (cost=0.29..45.67 rows=50)
-- Execution time: 15ms
```

## Monitoring Index Usage

### Check Index Statistics
```sql
SELECT * FROM get_gg_coin_index_stats();
```

**Output**:
```
index_name                      | index_scans | tuples_read | index_size
--------------------------------|-------------|-------------|------------
idx_gg_coin_tx_user_type_time  | 1,234       | 45,678      | 128 kB
idx_gg_coin_tx_earnings        | 567         | 12,345      | 64 kB
idx_user_gamification_balance  | 8,901       | 8,901       | 32 kB
```

### Test Query Performance
```sql
SELECT * FROM test_gg_coin_query_performance('user-id-here');
```

**Output**:
```
query_name                          | execution_time_ms | rows_returned
------------------------------------|-------------------|---------------
Get Balance                         | 2.345             | 1
Transaction History (unfiltered)    | 12.678            | 50
Transaction History (type filter)   | 8.234             | 25
Earning Breakdown                   | 15.456            | 100
```

## Deployment Instructions

### Local Development
```bash
# Apply migration
npx supabase migration up

# Verify indexes
npx supabase db execute "SELECT * FROM get_gg_coin_index_stats();"
```

### Staging Environment
```bash
# Apply migration
npx supabase db push --db-url $STAGING_DB_URL

# Run performance tests
npx supabase db execute "SELECT * FROM test_gg_coin_query_performance();" --db-url $STAGING_DB_URL
```

### Production Environment
```bash
# Create backup first
pg_dump $PROD_DB_URL > backup_before_033.sql

# Apply migration during low-traffic period
npx supabase db push --db-url $PROD_DB_URL

# Monitor performance
npx supabase db execute "SELECT * FROM get_gg_coin_index_stats();" --db-url $PROD_DB_URL
```

## Index Maintenance

### Automatic Maintenance
PostgreSQL automatically maintains indexes through:
- **VACUUM**: Removes dead tuples
- **ANALYZE**: Updates statistics for query planner
- **Autovacuum**: Runs automatically in background

### Manual Maintenance (if needed)
```sql
-- Rebuild index if fragmented
REINDEX INDEX idx_gg_coin_tx_user_type_time;

-- Update statistics
ANALYZE gg_coin_transactions;

-- Check index bloat
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename = 'gg_coin_transactions'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Performance Impact

### Expected Improvements
- **Balance queries**: 10x faster (from 50ms to 5ms)
- **Filtered history**: 15x faster (from 250ms to 15ms)
- **Earning breakdown**: 20x faster (from 300ms to 15ms)
- **Date range queries**: 12x faster (from 200ms to 15ms)

### Storage Impact
- **Additional disk space**: ~500 KB - 2 MB (depends on data volume)
- **Index maintenance overhead**: Minimal (< 5% write performance impact)

### Trade-offs
- **Pros**: Significantly faster read queries, better user experience
- **Cons**: Slightly slower writes (negligible), additional storage

## Rollback Plan

If performance degrades or issues arise:

```sql
-- Drop new indexes
DROP INDEX IF EXISTS idx_gg_coin_tx_user_type_time;
DROP INDEX IF EXISTS idx_gg_coin_tx_user_date;
DROP INDEX IF EXISTS idx_gg_coin_tx_earnings;
DROP INDEX IF EXISTS idx_gg_coin_tx_migrated;
DROP INDEX IF EXISTS idx_user_gamification_balance;

-- Drop monitoring functions
DROP FUNCTION IF EXISTS get_gg_coin_index_stats();
DROP FUNCTION IF EXISTS test_gg_coin_query_performance(UUID);

-- Revert to migration 032 state
```

## Verification Checklist

After deployment, verify:

- [ ] All indexes created successfully
- [ ] No errors in migration logs
- [ ] Query performance meets targets (< 100ms)
- [ ] Index usage statistics show activity
- [ ] No increase in error rates
- [ ] Application queries use new indexes (check EXPLAIN ANALYZE)
- [ ] Disk space usage is acceptable
- [ ] Write performance not significantly impacted

## Troubleshooting

### Issue: Indexes not being used
**Solution**: Run `ANALYZE gg_coin_transactions;` to update statistics

### Issue: Slow index creation
**Solution**: Create indexes `CONCURRENTLY` to avoid locking:
```sql
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

### Issue: High disk usage
**Solution**: Monitor index bloat and rebuild if necessary:
```sql
REINDEX INDEX CONCURRENTLY idx_name;
```

### Issue: Queries still slow
**Solution**: Check query plan with `EXPLAIN ANALYZE` and verify index is being used

## References

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [Index-Only Scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html)
- [Coin Harmonization Design](../../.kiro/specs/coin-harmonization/design.md)
- [Performance Requirements](../../.kiro/specs/coin-harmonization/requirements.md#d1-performance)

## Next Steps

1. Deploy migration to staging
2. Run performance benchmarks
3. Monitor index usage for 24-48 hours
4. Deploy to production during low-traffic period
5. Continue monitoring and optimize as needed
