# Migration 032 - Data Validation Guide

## Overview

This document describes the comprehensive data validation checks implemented in the coin consolidation migration (032_consolidate_coins.sql). These validations ensure data integrity, prevent data loss, and provide detailed reporting throughout the migration process.

## Validation Phases

### Phase 1: Pre-Migration Validation

These checks run **before** any data is migrated to catch issues early.

#### 1. Table Existence Validation
- **Check**: Verifies all required tables exist
- **Tables**: `green_coin_wallets`, `green_coin_transactions`, `user_gamification`, `users`
- **Action on Failure**: Migration aborts with exception
- **Rationale**: Cannot proceed without source and target tables

#### 2. NULL User ID Validation
- **Check**: Ensures no wallet records have NULL user_id
- **Action on Failure**: Migration aborts with exception
- **Rationale**: user_id is required for referential integrity

#### 3. Orphaned Wallet Records
- **Check**: Identifies wallets where user_id doesn't exist in users table
- **Action on Failure**: Warning logged, records skipped during migration
- **Rationale**: Cannot migrate data for non-existent users

#### 4. Negative Balance Validation
- **Check**: Ensures no wallet has negative balance
- **Action on Failure**: Migration aborts with exception
- **Rationale**: Negative balances indicate data corruption

#### 5. NULL Balance Validation
- **Check**: Ensures no wallet has NULL balance
- **Action on Failure**: Migration aborts with exception
- **Rationale**: Balance is a required field

#### 6. Duplicate Wallet Validation
- **Check**: Ensures each user has only one wallet record
- **Action on Failure**: Migration aborts with exception
- **Rationale**: Multiple wallets per user would cause data inconsistency

#### 7. Transaction Required Fields
- **Check**: Ensures transactions have non-NULL user_id, amount, and transaction_type
- **Action on Failure**: Migration aborts with exception
- **Rationale**: These fields are required for valid transactions

#### 8. Orphaned Transaction Records
- **Check**: Identifies transactions where user_id doesn't exist in users table
- **Action on Failure**: Warning logged, records skipped during migration
- **Rationale**: Cannot migrate transactions for non-existent users

#### 9. Transaction Type Validation
- **Check**: Identifies non-standard transaction types
- **Action on Failure**: Warning logged, types normalized during migration
- **Standard Types**: earn, spend, bonus, referral, transfer
- **Mapping Rules**:
  - `reward` → `earn`
  - `purchase` → `spend`
  - `refund` → `bonus`
  - Unknown → `earn` (default)

#### 10. Zero-Amount Transactions
- **Check**: Identifies transactions with zero amount
- **Action on Failure**: Warning logged, transactions migrated as-is
- **Rationale**: May indicate data quality issues but not critical

#### 11. Data Type Compatibility
- **Check**: Validates INTEGER to DECIMAL(10,3) conversion
- **Action on Failure**: Migration aborts with exception
- **Rationale**: Ensures no data loss during type conversion

#### 12. Value Range Validation
- **Check**: Ensures balances don't exceed DECIMAL(10,3) capacity (9,999,999.999)
- **Action on Failure**: Migration aborts with exception
- **Rationale**: Prevents overflow errors

#### 13. Timestamp Validation
- **Check**: Identifies transactions with NULL timestamps
- **Action on Failure**: Warning logged, NULL timestamps set to migration date
- **Rationale**: Timestamp is important but can be defaulted

#### 14. Future-Dated Transactions
- **Check**: Identifies transactions with future timestamps
- **Action on Failure**: Warning logged, transactions migrated as-is
- **Rationale**: May be valid for scheduled transactions

#### 15. Balance Consistency Check
- **Check**: Compares total wallet balance with sum of transaction amounts
- **Action on Failure**: Warning logged if mismatch detected
- **Rationale**: Helps identify incomplete transaction history

### Phase 2: Migration Validation

These checks run **during** the migration to ensure data quality.

#### 16. Valid Wallet Selection
- **Filter**: Only migrates wallets that:
  - Have valid user_id (exists in users table)
  - Have non-NULL balance
  - Have non-negative balance
- **Result**: Skipped records are logged

#### 17. Valid Transaction Selection
- **Filter**: Only migrates transactions that:
  - Have valid user_id (exists in users table)
  - Have non-NULL required fields
  - Have valid transaction type
- **Result**: Skipped records are logged

#### 18. Transaction Type Normalization
- **Process**: Converts non-standard types to standard types
- **Logging**: All normalizations are logged in metadata
- **Traceability**: Original type preserved in metadata

#### 19. Timestamp Defaulting
- **Process**: NULL timestamps set to NOW()
- **Logging**: Defaulted timestamps noted in metadata
- **Rationale**: Ensures all transactions have valid timestamps

### Phase 3: Post-Migration Verification

These checks run **after** migration to verify success.

#### 20. Wallet Count Verification
- **Check**: Compares source wallet count with migrated count
- **Expected**: Migrated count = Source count - Orphaned count
- **Action on Failure**: Warning logged with details

#### 21. Balance Total Verification
- **Check**: Compares total Green Coin balance with migrated GG Coin balance
- **Expected**: Totals should match (accounting for orphaned records)
- **Action on Failure**: Warning logged with difference

#### 22. Negative Balance Check
- **Check**: Ensures no negative balances in target table
- **Action on Failure**: Migration aborts with exception
- **Rationale**: Critical data integrity issue

#### 23. NULL Balance Check
- **Check**: Identifies NULL balances in target table
- **Action on Failure**: Warning logged
- **Rationale**: Should not occur but not critical

#### 24. Transaction Count Verification
- **Check**: Compares source transaction count with migrated count
- **Expected**: Migrated count = Source count - Orphaned count
- **Action on Failure**: Warning logged with details

#### 25. User Reference Integrity
- **Check**: Ensures all migrated transactions reference valid users
- **Action on Failure**: Migration aborts with exception
- **Rationale**: Critical referential integrity requirement

#### 26. Transaction Type Integrity
- **Check**: Ensures all migrated transactions have valid types
- **Action on Failure**: Migration aborts with exception
- **Rationale**: Invalid types would break application logic

#### 27. Amount Precision Check
- **Check**: Identifies transactions with NULL or zero amounts
- **Action on Failure**: Warning logged
- **Rationale**: May indicate data quality issues

## Validation Results Reporting

### Success Indicators
- ✓ All critical validations passed
- ✓ No data loss detected
- ✓ All counts match expected values
- ✓ No integrity violations

### Warning Indicators
- ⚠ Orphaned records skipped (expected behavior)
- ⚠ Non-standard transaction types normalized
- ⚠ NULL timestamps defaulted
- ⚠ Balance totals don't match (may indicate incomplete history)

### Failure Indicators
- ✗ Critical validation failed
- ✗ Data integrity violation detected
- ✗ Migration aborted

## Validation Logs

All validation results are logged using PostgreSQL RAISE NOTICE and RAISE WARNING statements. Review the migration output for:

1. **Pre-Migration Validation Summary**: Lists all checks and their results
2. **Migration Progress**: Shows counts of migrated vs skipped records
3. **Post-Migration Verification**: Detailed comparison of source and target data
4. **Final Status**: Overall success/failure with recommendations

## Handling Validation Failures

### Critical Failures (Migration Aborts)
1. Review the error message
2. Fix the underlying data issue
3. Re-run the migration

### Warnings (Migration Continues)
1. Review the warning details
2. Verify the behavior is expected
3. Document any data quality issues
4. Consider cleanup after migration

## Testing Validation

To test the validation logic:

```sql
-- Run the test migration script
\i supabase/migrations/test_032_migration.sql

-- Check validation results
SELECT * FROM get_coin_migration_stats();
```

## Rollback Considerations

If validation fails after migration:

1. Use the rollback script: `rollback_032.sql`
2. Fix the data issues
3. Re-run the migration
4. Verify all validations pass

## Best Practices

1. **Always review validation logs** before considering migration complete
2. **Test on staging** with production-like data first
3. **Document any warnings** for future reference
4. **Monitor application** after migration for any issues
5. **Keep deprecated tables** for at least 30 days as backup

## Validation Checklist

Before running migration:
- [ ] Database backup created
- [ ] Staging environment tested
- [ ] Validation logic reviewed
- [ ] Rollback script tested

During migration:
- [ ] Monitor validation output
- [ ] Note any warnings
- [ ] Verify counts match expectations

After migration:
- [ ] Review final verification summary
- [ ] Check application functionality
- [ ] Monitor for errors
- [ ] Document any issues

## Support

For issues or questions about validation:
1. Review this guide
2. Check migration logs
3. Consult MIGRATION_032_GUIDE.md
4. Contact database administrator

## Version History

- **v1.0** (2025-01-30): Initial comprehensive validation implementation
  - 27 validation checks across 3 phases
  - Detailed logging and reporting
  - Graceful handling of edge cases
