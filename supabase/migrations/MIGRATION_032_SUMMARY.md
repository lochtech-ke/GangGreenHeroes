# Migration 032 Summary: Consolidate Green Coins into GG Coins

## Overview

This migration consolidates the platform's dual coin system into a unified GG Coins economy. It migrates all Green Coin wallet balances and transaction history into the GG Coins infrastructure while preserving historical data.

## Files Created

### 1. Migration Script
**File**: `032_consolidate_coins.sql`
- Creates GG Coin infrastructure (tables, indexes, columns)
- Migrates wallet balances from Green Coins to GG Coins (1:1 ratio)
- Migrates all transaction history with metadata tracking
- Validates migration success (balance totals, transaction counts)
- Deprecates old tables (renames to `_deprecated_*`)
- Creates helper functions for migration statistics

**Key Features**:
- Atomic transaction ensures all-or-nothing migration
- Pre-migration validation checks
- Post-migration verification
- Comprehensive error handling
- Migration metadata for traceability

### 2. Rollback Script
**File**: `rollback_032.sql`
- Restores Green Coin table names
- Removes migrated GG Coin transactions
- Drops migration helper functions
- Validates rollback success

**Safety Features**:
- Pre-rollback validation
- Preserves non-migrated data
- Comprehensive logging

### 3. Migration Guide
**File**: `MIGRATION_032_GUIDE.md`
- Complete deployment instructions
- Pre-deployment checklist
- Post-deployment verification steps
- Rollback procedures
- Troubleshooting guide
- Application code update instructions

**Sections**:
- Requirements addressed
- Data conversion details
- Deployment options (CLI and manual)
- Verification queries
- Performance monitoring
- Support information

### 4. Test Script
**File**: `test_032_migration.sql`
- Creates isolated test environment
- Generates sample data (5 users, 10 transactions)
- Runs migration in test schema
- Executes 6 comprehensive tests
- Validates performance
- Cleans up test environment

**Tests Included**:
1. Wallet count verification
2. Balance total matching
3. Transaction count matching
4. Individual user balance verification
5. Transaction metadata validation
6. Table deprecation verification

## Migration Details

### Data Conversion

| Source | Target | Conversion |
|--------|--------|------------|
| `green_coin_wallets.balance` (INTEGER) | `user_gamification.gg_coins` (DECIMAL) | 1:1 ratio |
| `green_coin_transactions` | `gg_coin_transactions` | Type mapping + metadata |

### Transaction Type Mapping

| Green Coins | GG Coins | Notes |
|-------------|----------|-------|
| earn | earn | Direct mapping |
| spend | spend | Direct mapping |
| bonus | bonus | Direct mapping |
| referral | referral | Direct mapping |
| source | reference_type | Semantic mapping |

### Migration Metadata

Each migrated transaction includes:
```json
{
  "migrated_from": "green_coins",
  "original_id": "uuid",
  "migration_date": "timestamp",
  "original_source": "action_type"
}
```

## Validation Checks

### Pre-Migration
- ✅ Source tables exist
- ✅ Target tables exist
- ✅ No NULL user_ids in source data

### During Migration
- ✅ Balance totals match
- ✅ Transaction counts match
- ✅ No data loss
- ✅ Referential integrity maintained

### Post-Migration
- ✅ Deprecated tables exist and are read-only
- ✅ Helper functions created
- ✅ Indexes optimized
- ✅ Table statistics updated

## Performance Considerations

### Expected Performance
- **Small dataset** (< 1,000 users): 1-2 minutes
- **Medium dataset** (1,000-10,000 users): 2-5 minutes
- **Large dataset** (> 10,000 users): 5-10 minutes

### Optimization Features
- Batch processing for large datasets
- Strategic indexing for common queries
- Table statistics updates
- Query plan optimization

### Performance Targets
- Balance queries: < 50ms (cached)
- Transaction recording: < 200ms
- Transaction history: < 150ms
- Migration execution: < 10 minutes for 10,000 users

## Deployment Checklist

### Pre-Deployment
- [ ] Create full database backup
- [ ] Test migration on staging environment
- [ ] Verify source data integrity
- [ ] Notify stakeholders
- [ ] Prepare monitoring and alerts
- [ ] Review rollback procedure

### Deployment
- [ ] Run migration script
- [ ] Monitor for errors
- [ ] Verify migration statistics
- [ ] Check application logs
- [ ] Test core functionality

### Post-Deployment
- [ ] Verify data integrity
- [ ] Test application features
- [ ] Monitor performance metrics
- [ ] Update application code
- [ ] Update documentation
- [ ] Communicate changes to users

## Application Code Updates Required

### Service Layer
```typescript
// Replace greenCoin.service.ts with ggCoin.service.ts
import { ggCoinService } from './services/ggCoin.service';

// Update method calls
const balance = await ggCoinService.getBalance(userId);
await ggCoinService.creditCoins(userId, amount, type, description);
```

### UI Components
```typescript
// Replace GreenCoinWallet with GGCoinWallet
<GGCoinWallet userId={userId} />

// Update display text
"GG Coins" instead of "Green Coins"
```

### API Endpoints
- Deprecate `/api/green-coins/*` endpoints
- Use `/api/gg-coins/*` endpoints
- Add deprecation warnings to old endpoints

## Rollback Procedure

### When to Rollback
- Migration fails with errors
- Data integrity issues detected
- Application errors after deployment
- Within 1 hour of deployment

### Rollback Steps
1. Stop application traffic (optional)
2. Execute `rollback_032.sql`
3. Verify Green Coin tables restored
4. Restore from backup if needed
5. Resume application traffic
6. Investigate root cause

## Success Criteria

Migration is successful when:
- ✅ All Green Coin wallets migrated to GG Coins
- ✅ All Green Coin transactions migrated
- ✅ Total balances match (within 0.001 tolerance)
- ✅ Transaction counts match exactly
- ✅ Old tables deprecated and renamed
- ✅ No data loss or corruption
- ✅ Application functionality verified
- ✅ Performance within targets
- ✅ No increase in error rates

## Helper Functions Created

### `is_migrated_transaction(metadata JSONB)`
Returns TRUE if transaction was migrated from Green Coins.

### `get_coin_migration_stats()`
Returns migration statistics:
- Total wallets migrated
- Total balance migrated
- Total transactions migrated
- Current GG Coin total
- Total GG Coin transactions

## Troubleshooting

### Common Issues

**Issue**: Migration timeout
**Solution**: Increase statement timeout, run during low traffic

**Issue**: Balance mismatch
**Solution**: Check for rounding issues, investigate specific users

**Issue**: Transaction count mismatch
**Solution**: Check for constraint violations, review error logs

**Issue**: Application errors
**Solution**: Verify service code updated, clear caches, restart servers

**Issue**: Performance degradation
**Solution**: Update statistics, rebuild indexes, check query plans

## Next Steps

1. **Week 1**: Deploy migration to production
2. **Week 2-3**: Update application code to use GG Coins
3. **Week 4**: Remove Green Coin service code
4. **Month 2**: Archive deprecated tables
5. **Month 3**: Complete documentation updates

## Support

### Contact Information
- **Database Team**: database-team@ganggreen.com
- **DevOps Team**: devops@ganggreen.com
- **Emergency**: emergency@ganggreen.com

### Useful Queries
```sql
-- Get migration status
SELECT * FROM get_coin_migration_stats();

-- Check migrated transactions
SELECT COUNT(*), transaction_type 
FROM gg_coin_transactions 
WHERE metadata->>'migrated_from' = 'green_coins'
GROUP BY transaction_type;

-- Find users with highest balances
SELECT user_id, gg_coins 
FROM user_gamification 
ORDER BY gg_coins DESC 
LIMIT 10;
```

## References

- [Requirements](.kiro/specs/coin-harmonization/requirements.md)
- [Design](.kiro/specs/coin-harmonization/design.md)
- [Tasks](.kiro/specs/coin-harmonization/tasks.md)
- [Migration Guide](MIGRATION_032_GUIDE.md)

---

**Status**: ✅ Ready for Testing  
**Version**: 1.0  
**Date**: 2025-01-30  
**Author**: Kiro AI Agent
