# Rollback Guide for Migration 032

## Overview

This guide explains how to use the rollback script (`rollback_032.sql`) to reverse the coin system consolidation migration if needed.

## When to Use Rollback

Use this rollback script ONLY if:
- The migration failed during execution
- Data integrity issues were discovered immediately after migration
- Critical bugs were found in the migrated data
- You need to revert to the Green Coins system temporarily

**WARNING**: This is a destructive operation. Only use if absolutely necessary.

## Pre-Rollback Checklist

Before running the rollback:

1. **Create a full database backup**
   ```bash
   # Using Supabase CLI
   supabase db dump -f backup_before_rollback.sql
   ```

2. **Stop all application services** that interact with the coin system

3. **Notify users** about temporary maintenance (if applicable)

4. **Document the reason** for rollback for future reference

5. **Review the rollback script** to understand what it will do

## Running the Rollback

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open `supabase/migrations/rollback_032.sql`
4. Review the script carefully
5. Click "Run" to execute

### Option 2: Using Supabase CLI

```bash
# From your project root
supabase db execute -f supabase/migrations/rollback_032.sql
```

### Option 3: Using psql

```bash
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/rollback_032.sql
```

## What the Rollback Does

The rollback script performs these actions:

### 1. Pre-Rollback Validation
- Verifies deprecated tables exist
- Checks data integrity
- Validates current state
- Warns about potential data loss

### 2. Data Restoration
- Removes migrated GG Coin transactions (marked with `migrated_from: 'green_coins'`)
- Restores Green Coin table names (removes `_deprecated_` prefix)
- Recreates indexes on Green Coin tables
- Restores table and column comments
- Recreates Row-Level Security policies

### 3. Cleanup
- Drops migration helper functions
- Updates table statistics
- Creates verification report

### 4. Verification
- Compares pre and post rollback state
- Reports on restored records
- Identifies any issues

## Important Notes

### GG Coin Balances

**By default, the rollback does NOT modify GG Coin balances.**

This means:
- Users who had GG Coins before migration will keep them
- Only the migrated transactions are removed
- Green Coin balances are restored from the deprecated tables

If you want to completely reverse the balance migration:
1. Open `rollback_032.sql`
2. Find Step 7 (around line 200)
3. Uncomment the code block
4. Re-run the rollback

### Triggers and Functions

The rollback script includes placeholder code for recreating triggers. You may need to:
1. Review your original Green Coin triggers
2. Uncomment and adjust the trigger code in Section 3
3. Manually recreate any custom functions

## Post-Rollback Verification

After rollback completes, verify:

1. **Green Coin tables are accessible**
   ```sql
   SELECT COUNT(*) FROM green_coin_wallets;
   SELECT COUNT(*) FROM green_coin_transactions;
   ```

2. **Balances are correct**
   ```sql
   SELECT SUM(balance) FROM green_coin_wallets;
   ```

3. **No migrated transactions remain**
   ```sql
   SELECT COUNT(*) FROM gg_coin_transactions 
   WHERE metadata->>'migrated_from' = 'green_coins';
   -- Should return 0
   ```

4. **Application services work**
   - Test Green Coin service
   - Test wallet balance queries
   - Test transaction recording
   - Check for errors in logs

## Troubleshooting

### Error: Deprecated tables not found

**Cause**: Migration may not have completed, or rollback was already run.

**Solution**: 
- Check if tables `_deprecated_green_coin_wallets` and `_deprecated_green_coin_transactions` exist
- If they don't exist, the rollback cannot proceed
- Review migration logs to determine state

### Error: Cannot drop function

**Cause**: Function is being used by other objects.

**Solution**:
- Use `DROP FUNCTION ... CASCADE` (with caution)
- Manually identify and remove dependencies first

### Warning: Orphaned records found

**Cause**: Some wallet or transaction records reference users that no longer exist.

**Solution**:
- This is informational - orphaned records are skipped during migration
- Clean up orphaned records manually if needed:
  ```sql
  DELETE FROM green_coin_wallets 
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = user_id);
  ```

### RLS Policy errors

**Cause**: Row-Level Security policies may differ from the template.

**Solution**:
- Review your original RLS policies
- Manually recreate them after rollback
- Check Supabase dashboard for policy definitions

## Re-attempting Migration

After fixing issues:

1. **Document what went wrong** and how it was fixed

2. **Update migration script** if needed to prevent the same issue

3. **Test on staging environment** thoroughly

4. **Create fresh backup** before re-attempting

5. **Run migration again** using `032_consolidate_coins.sql`

## Rollback Verification Report

The rollback script generates a detailed report showing:
- Pre-rollback state
- Post-rollback state
- Changes made
- Actions completed
- Important notes
- Next steps

Review this report carefully to ensure rollback was successful.

## Support

If you encounter issues during rollback:

1. **Do not panic** - your data is backed up
2. **Review error messages** carefully
3. **Check the verification report** for clues
4. **Consult the migration guide** for context
5. **Restore from backup** if necessary

## Related Documentation

- [Migration 032 Guide](./MIGRATION_032_GUIDE.md) - Original migration documentation
- [Coin Harmonization Requirements](../../.kiro/specs/coin-harmonization/requirements.md)
- [Coin Harmonization Design](../../.kiro/specs/coin-harmonization/design.md)

## Rollback History

Keep a log of rollback executions:

| Date | Reason | Executed By | Result | Notes |
|------|--------|-------------|--------|-------|
| YYYY-MM-DD | [Reason] | [Name] | [Success/Failed] | [Notes] |

---

**Last Updated**: 2025-01-30
**Version**: 1.0
**Status**: Ready for use
