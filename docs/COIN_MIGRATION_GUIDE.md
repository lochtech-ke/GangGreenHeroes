# Coin System Migration Guide

## Overview

This guide helps developers migrate from the deprecated Green Coin system to the unified GG Coin system.

**Migration Date**: January 30, 2025  
**Deprecation**: Green Coin Service (greenCoin.service.ts)  
**Replacement**: GG Coin Service (ggCoin.service.ts)  
**Removal Planned**: January 31, 2026

## What Changed?

### Before (Dual System)
- **Green Coins**: Integer-based, stored in `green_coin_wallets`
- **GG Coins**: Decimal-based (DECIMAL 10,3), stored in `user_gamification.gg_coins`
- Two separate services, transaction tables, and UI components
- Confusion about which coin to use

### After (Unified System)
- **GG Coins Only**: Single decimal-based currency (DECIMAL 10,3)
- Stored in `user_gamification.gg_coins`
- Single service: `ggCoin.service.ts`
- Single transaction table: `gg_coin_transactions`
- Consistent UI showing "GG Coins" everywhere

## Migration Steps for Developers

### Step 1: Update Imports

**Before:**
```typescript
import { greenCoinService } from './services/greenCoin.service';
```

**After:**
```typescript
import { ggCoinService } from './services/ggCoin.service';
```

### Step 2: Update Method Calls

#### Get Wallet
**Before:**
```typescript
const wallet = await greenCoinService.getWallet(userId);
// Returns: { userId, balance, lifetimeEarnings, lifetimeSpending, lastUpdated }
```

**After:**
```typescript
const wallet = await ggCoinService.getWallet(userId);
// Returns: { userId, balance, totalPoints, level, lastUpdated }
```

**Note**: `lifetimeEarnings` and `lifetimeSpending` are no longer tracked. Use transaction history instead.

#### Get Balance
**Before:**
```typescript
const balance = await greenCoinService.getBalance(userId);
// Returns: number (integer)
```

**After:**
```typescript
const balance = await ggCoinService.getBalance(userId);
// Returns: number (decimal with up to 3 places)
```

**Note**: Balance now supports decimal precision (e.g., 123.456).

#### Award Coins
**Before:**
```typescript
const transaction = await greenCoinService.awardCoins(
  userId,
  'tree_planting',
  10, // impact
  [{ condition: 'verified', factor: 1.5 }], // multipliers
  'Planted 10 trees'
);
```

**After:**
```typescript
const transaction = await ggCoinService.awardCoins(
  userId,
  'tree_planting',
  10, // impact
  [{ condition: 'verified', factor: 1.5 }] // multipliers
);
// Description is auto-generated based on action type
```

#### Record Transaction (Credit)
**Before:**
```typescript
const transaction = await greenCoinService.recordTransaction(
  userId,
  'earn',
  50,
  'tree_planting',
  'Planted a tree'
);
```

**After:**
```typescript
const transaction = await ggCoinService.creditCoins(
  userId,
  50,
  'earn',
  'Planted a tree',
  { actionType: 'tree_planting' } // optional metadata
);
```

#### Spend Coins (Debit)
**Before:**
```typescript
const transaction = await greenCoinService.spendCoins(
  userId,
  100,
  'badge_purchase',
  'Purchased gold badge'
);
```

**After:**
```typescript
const transaction = await ggCoinService.debitCoins(
  userId,
  100,
  'spend',
  'Purchased gold badge',
  { itemType: 'badge', itemId: 'gold-badge' } // optional metadata
);
```

#### Get Transaction History
**Before:**
```typescript
const history = await greenCoinService.getTransactionHistory(userId, 20, 0);
// Returns: { transactions, total, hasMore }
```

**After:**
```typescript
const history = await ggCoinService.getTransactionHistory(
  userId,
  20, // limit
  0,  // offset
  { type: 'earn' } // optional filters
);
// Returns: { transactions, total, hasMore }
```

**Note**: Filtering is now supported via the fourth parameter.

#### Subscribe to Balance Updates
**Before:**
```typescript
const unsubscribe = greenCoinService.subscribeToBalance(userId, (balance) => {
  console.log('New balance:', balance);
});
```

**After:**
```typescript
const unsubscribe = ggCoinService.subscribeToBalance(userId, (balance) => {
  console.log('New balance:', balance);
});
```

**Note**: API is identical, but now subscribes to `user_gamification` table.

#### Calculate Reward
**Before:**
```typescript
const reward = greenCoinService.calculateReward(
  'tree_planting',
  10,
  [{ condition: 'verified', factor: 1.5 }]
);
// Returns: integer
```

**After:**
```typescript
const reward = ggCoinService.calculateReward(
  'tree_planting',
  10,
  [{ condition: 'verified', factor: 1.5 }]
);
// Returns: decimal (rounded to 3 places)
```

**Note**: Rewards now support decimal precision.

### Step 3: Update UI Components

#### Wallet Component
**Before:**
```typescript
import { GreenCoinWallet } from './components/gamification/GreenCoinWallet';

<GreenCoinWallet userId={userId} />
```

**After:**
```typescript
import { GGCoinWallet } from './components/gamification/GGCoinWallet';

<GGCoinWallet userId={userId} showTransactions={false} />
```

#### Transaction History
**Before:**
```typescript
// No dedicated component, embedded in GreenCoinWallet
```

**After:**
```typescript
import { TransactionHistory } from './components/gamification/TransactionHistory';

<TransactionHistory 
  userId={userId} 
  showFilters={true}
  pageSize={20}
/>
```

#### Toast Notifications
**Before:**
```typescript
// Custom implementation
```

**After:**
```typescript
import { CoinEarnedToast } from './components/common/CoinEarnedToast';

<CoinEarnedToast
  amount={50.5}
  reason="Planted a tree"
  onClose={() => setShowToast(false)}
  position="top-right"
/>
```

### Step 4: Update Text References

Search your codebase for these terms and replace:

- "Green Coin" → "GG Coin"
- "Green Coins" → "GG Coins"
- "green coin" → "GG coin"
- "green coins" → "GG coins"
- "greenCoin" → "ggCoin"

**Command to find references:**
```bash
# Windows (PowerShell)
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Select-String "green.?coin" -CaseSensitive

# Unix/Mac
grep -r "green.*coin" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/
```

### Step 5: Update Database Queries

If you have any direct database queries (not recommended), update them:

**Before:**
```typescript
const { data } = await supabase
  .from('green_coin_wallets')
  .select('balance')
  .eq('user_id', userId)
  .single();
```

**After:**
```typescript
const { data } = await supabase
  .from('user_gamification')
  .select('gg_coins')
  .eq('id', userId)
  .single();
```

**Note**: Always prefer using `ggCoinService` over direct database queries.

## Data Type Changes

### Balance Precision

**Before (Green Coins):**
- Type: INTEGER
- Example: 100
- Range: -2,147,483,648 to 2,147,483,647

**After (GG Coins):**
- Type: DECIMAL(10,3)
- Example: 100.500
- Range: -9,999,999.999 to 9,999,999.999
- Precision: 3 decimal places

### Transaction Amounts

**Before:**
```typescript
interface GreenCoinTransaction {
  amount: number; // integer
}
```

**After:**
```typescript
interface GGCoinTransaction {
  amount: number; // decimal with 3 places
  balanceBefore: number; // new field
  balanceAfter: number; // new field
}
```

### Formatting

**Display whole numbers without decimals:**
```typescript
// Before: 100
// After: 100 (not 100.000)

function formatBalance(amount: number): string {
  if (amount % 1 === 0) {
    return amount.toLocaleString();
  }
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}
```

## Breaking Changes

### 1. Wallet Structure Changed

**Removed Fields:**
- `lifetimeEarnings` - Use transaction history instead
- `lifetimeSpending` - Use transaction history instead

**Added Fields:**
- `totalPoints` - Gamification points (separate from coins)
- `level` - User level (separate from coins)

**Migration:**
```typescript
// Before
const earnings = wallet.lifetimeEarnings;

// After
const history = await ggCoinService.getTransactionHistory(userId);
const earnings = history.transactions
  .filter(tx => tx.type !== 'spend')
  .reduce((sum, tx) => sum + tx.amount, 0);
```

### 2. Transaction Structure Changed

**New Required Fields:**
- `balanceBefore` - Balance before transaction
- `balanceAfter` - Balance after transaction

**Changed Fields:**
- `source` → `referenceType` (renamed)
- Added `referenceId` for linking to other entities
- Added `metadata` JSONB field for flexible data

### 3. Method Signatures Changed

**recordTransaction() split into two methods:**
```typescript
// Before
recordTransaction(userId, 'earn', amount, source, description)
recordTransaction(userId, 'spend', amount, source, description)

// After
creditCoins(userId, amount, type, description, metadata)
debitCoins(userId, amount, type, description, metadata)
```

### 4. Reward Calculation Returns Decimal

```typescript
// Before
const reward = calculateReward('tree_planting', 10); // Returns: 500

// After
const reward = calculateReward('tree_planting', 10); // Returns: 500.000
```

## Database Migration

The database migration (032_consolidate_coins.sql) handles:

1. ✅ Migrating all Green Coin balances to GG Coins (1:1 ratio)
2. ✅ Migrating all transaction history
3. ✅ Preserving all data (zero data loss)
4. ✅ Marking old tables as deprecated
5. ✅ Creating indexes for performance
6. ✅ Adding helper functions

**Migration is automatic** - no manual data migration needed.

**Old tables are preserved** as `_deprecated_green_coin_wallets` and `_deprecated_green_coin_transactions` for reference.

## Testing Your Migration

### 1. Unit Tests

Update your tests to use `ggCoinService`:

```typescript
import { ggCoinService } from './services/ggCoin.service';

describe('Coin Operations', () => {
  it('should credit coins correctly', async () => {
    const transaction = await ggCoinService.creditCoins(
      'test-user',
      50.5,
      'earn',
      'Test credit'
    );
    
    expect(transaction).toBeDefined();
    expect(transaction.amount).toBe(50.5);
  });
});
```

### 2. Integration Tests

Test the full flow:

```typescript
it('should handle complete coin flow', async () => {
  const userId = 'test-user';
  
  // Get initial balance
  const initialBalance = await ggCoinService.getBalance(userId);
  
  // Award coins
  await ggCoinService.awardCoins(userId, 'tree_planting', 1);
  
  // Verify balance increased
  const newBalance = await ggCoinService.getBalance(userId);
  expect(newBalance).toBeGreaterThan(initialBalance);
  
  // Verify transaction recorded
  const history = await ggCoinService.getTransactionHistory(userId, 1, 0);
  expect(history.transactions).toHaveLength(1);
  expect(history.transactions[0].type).toBe('earn');
});
```

### 3. UI Tests

Test components render correctly:

```typescript
import { render, screen } from '@testing-library/react';
import { GGCoinWallet } from './GGCoinWallet';

it('should display GG Coins balance', async () => {
  render(<GGCoinWallet userId="test-user" />);
  
  await waitFor(() => {
    expect(screen.getByText(/GG Coins/i)).toBeInTheDocument();
    expect(screen.queryByText(/Green Coins/i)).not.toBeInTheDocument();
  });
});
```

## Performance Considerations

### Caching

Both services use caching, but with different strategies:

**Green Coin Service:**
- Cache TTL: 30 seconds
- In-memory Map
- Manual invalidation

**GG Coin Service:**
- Cache TTL: 30 seconds
- In-memory Map
- Automatic invalidation on transactions
- Better cache hit rate

### Database Queries

**Optimizations in GG Coin Service:**
- Indexed queries on `user_id` and `created_at`
- Efficient pagination with `LIMIT` and `OFFSET`
- Transaction type filtering with index
- Reference lookups with composite index

**Performance Targets:**
- Balance queries: < 50ms (cached)
- Transaction recording: < 200ms
- Pagination: < 100ms
- Real-time updates: < 2 seconds

## Troubleshooting

### Issue: "Cannot find module 'ggCoin.service'"

**Solution:**
```bash
# Ensure the file exists
ls src/services/ggCoin.service.ts

# If missing, pull latest code
git pull origin main
```

### Issue: Balance shows as integer instead of decimal

**Solution:**
Check your formatting function:
```typescript
// Correct
const formatted = amount.toLocaleString(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

// Incorrect
const formatted = Math.floor(amount).toString();
```

### Issue: Transactions not appearing in history

**Solution:**
Verify you're querying the correct table:
```typescript
// Correct
await ggCoinService.getTransactionHistory(userId);

// Incorrect (old table)
await supabase.from('green_coin_transactions').select('*');
```

### Issue: Real-time updates not working

**Solution:**
Check subscription setup:
```typescript
// Ensure cleanup
useEffect(() => {
  const unsubscribe = ggCoinService.subscribeToBalance(userId, callback);
  return () => unsubscribe(); // Important!
}, [userId]);
```

### Issue: Deprecation warnings in console

**Solution:**
This is expected if you're still using `greenCoinService`. Migrate to `ggCoinService` to remove warnings.

## Rollback Plan

If you need to rollback:

1. **Revert code changes:**
   ```bash
   git revert <migration-commit>
   ```

2. **Restore database:**
   ```bash
   psql -f supabase/migrations/rollback_032.sql
   ```

3. **Verify rollback:**
   ```sql
   SELECT tablename FROM pg_tables WHERE tablename LIKE 'green_coin%';
   ```

## Support

### Documentation
- [Design Document](.kiro/specs/coin-harmonization/design.md)
- [Requirements](.kiro/specs/coin-harmonization/requirements.md)
- [Deployment Guide](../supabase/migrations/DEPLOYMENT_GUIDE_032.md)

### Getting Help
- Check the [FAQ](#faq) below
- Review the [troubleshooting](#troubleshooting) section
- Contact the engineering team

## FAQ

**Q: Will my users lose their coin balance?**  
A: No, all balances are preserved at a 1:1 ratio. 100 Green Coins = 100.000 GG Coins.

**Q: What happens to transaction history?**  
A: All transaction history is migrated and preserved. Migrated transactions are marked in metadata.

**Q: Can I still access old Green Coin data?**  
A: Yes, old tables are preserved as `_deprecated_green_coin_wallets` and `_deprecated_green_coin_transactions`.

**Q: When will greenCoin.service.ts be removed?**  
A: Planned removal date is January 31, 2026. You have one year to migrate.

**Q: Do I need to update my database manually?**  
A: No, the migration script handles everything automatically.

**Q: What if I find a bug after migration?**  
A: Report it immediately. We have a rollback plan ready if needed.

**Q: Can I use both services during migration?**  
A: Yes, but it's not recommended. Migrate completely to avoid confusion.

**Q: How do I test my migration?**  
A: Test on staging first, then use the smoke tests in the deployment guide.

## Checklist

Use this checklist to track your migration progress:

- [ ] Read this migration guide completely
- [ ] Update all imports from `greenCoinService` to `ggCoinService`
- [ ] Update all method calls to new API
- [ ] Update UI components to use new components
- [ ] Replace all "Green Coin" text with "GG Coin"
- [ ] Update database queries (if any)
- [ ] Update tests to use new service
- [ ] Test on local environment
- [ ] Test on staging environment
- [ ] Review and fix any deprecation warnings
- [ ] Update documentation
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Verify functionality
- [ ] Mark migration complete

## Timeline

- **January 30, 2025**: Migration deployed, Green Coin Service deprecated
- **February 2025 - January 2026**: Migration period (both services available)
- **January 31, 2026**: Green Coin Service removed

**Migrate as soon as possible to avoid last-minute issues!**

---

**Document Version**: 1.0  
**Last Updated**: January 30, 2025  
**Migration**: 032_consolidate_coins.sql  
**Contact**: Engineering Team
