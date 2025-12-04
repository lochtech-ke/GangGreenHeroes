# GG Coin System Migration Guide

**Developer Guide for the Coin System Harmonization**

This guide documents the migration from dual coin systems (GG Coins + Green Coins) to a unified GG Coin system.

---

## Overview

### What Changed?

**Before:**
- Two separate coin systems (GG Coins and Green Coins)
- Two wallet tables (`user_gamification` and `green_coin_wallets`)
- Two transaction tables (`gg_coin_transactions` and `green_coin_transactions`)
- Inconsistent data types (DECIMAL vs INTEGER)
- Duplicate service logic

**After:**
- Single unified GG Coin system
- One wallet table (`user_gamification.gg_coins`)
- One transaction table (`gg_coin_transactions`)
- Consistent DECIMAL(10,3) precision
- Unified `ggCoin.service.ts`

---

## Database Changes

### Schema Consolidation

#### Primary Wallet Table
```sql
-- user_gamification table (already exists)
user_gamification (
  id UUID PRIMARY KEY,
  gg_coins DECIMAL(10,3) DEFAULT 0,  -- Unified balance
  total_points INTEGER,
  level INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Transaction Log Table
```sql
-- gg_coin_transactions table (already exists)
gg_coin_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  transaction_type TEXT,  -- 'earn', 'spend', 'bonus', 'referral'
  amount DECIMAL(10,3),
  balance_before DECIMAL(10,3),
  balance_after DECIMAL(10,3),
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP
)
```

#### Deprecated Tables
```sql
-- Old tables renamed with _deprecated prefix
_deprecated_green_coin_wallets
_deprecated_green_coin_transactions
```

### Migration Script

The migration was performed by `supabase/migrations/032_consolidate_coins.sql`:

1. **Migrate Balances**: Transfer all Green Coin balances to GG Coins
2. **Migrate Transactions**: Copy transaction history with metadata
3. **Verify Totals**: Ensure no data loss
4. **Deprecate Tables**: Rename old tables for reference

### Rollback

If needed, rollback is available via `supabase/migrations/rollback_032.sql`.

---

## Service Layer Changes

### New Unified Service

**File**: `src/services/ggCoin.service.ts`

This service replaces all Green Coin functionality and provides:
- Wallet operations (getWallet, getBalance)
- Transaction operations (creditCoins, debitCoins)
- Reward calculations (calculateReward, awardCoins)
- Transaction history (getTransactionHistory, getEarningBreakdown)
- Real-time subscriptions (subscribeToBalance)
- Caching with 30-second TTL

### Deprecated Service

**File**: `src/services/greenCoin.service.ts`

This service is now deprecated. All functionality has been moved to `ggCoin.service.ts`.

---

## Code Migration

### Before (Green Coins)

```typescript
import { greenCoinService } from '@/services/greenCoin.service';

// Award coins
await greenCoinService.awardCoins(userId, 50, 'tree_planting', 'Planted a tree');

// Get balance
const balance = await greenCoinService.getBalance(userId);

// Get transactions
const transactions = await greenCoinService.getTransactionHistory(userId);
```

### After (Unified GG Coins)

```typescript
import { ggCoinService } from '@/services/ggCoin.service';

// Award coins with multipliers
await ggCoinService.awardCoins(
  userId,
  'tree_planting',
  1, // impact
  [{ condition: 'verified_with_photo', factor: 1.2 }] // multipliers
);

// Get balance (cached)
const balance = await ggCoinService.getBalance(userId);

// Get transactions with pagination
const history = await ggCoinService.getTransactionHistory(userId, 50, 0);
```

### Key Differences

1. **Reward System**: Now uses action types and multipliers instead of fixed amounts
2. **Caching**: Balance queries are cached for 30 seconds
3. **Pagination**: Transaction history supports limit/offset
4. **Real-time**: Subscribe to balance updates
5. **Type Safety**: Full TypeScript support with interfaces

---

## Component Migration

### Before (Green Coin Wallet)

```typescript
import { GreenCoinWallet } from '@/components/gamification/GreenCoinWallet';

<GreenCoinWallet userId={userId} />
```

### After (GG Coin Wallet)

```typescript
import { GGCoinWallet } from '@/components/gamification/GGCoinWallet';

<GGCoinWallet userId={userId} showTransactions={true} />
```

### New Components

1. **GGCoinWallet**: Displays balance with real-time updates
2. **TransactionHistory**: Shows paginated transaction list
3. **CoinEarnedToast**: Notification when coins are earned

---

## Reward Rules

### Centralized Configuration

All reward rules are now centralized in `ggCoin.service.ts`:

```typescript
private rewardRules = new Map<string, RewardRule>([
  ['tree_planting', { actionType: 'tree_planting', baseReward: 50 }],
  ['waste_cleanup', { actionType: 'waste_cleanup', baseReward: 30 }],
  ['learning_module', { actionType: 'learning_module', baseReward: 20 }],
  ['mission_completion', { actionType: 'mission_completion', baseReward: 100 }],
  ['community_post', { actionType: 'community_post', baseReward: 5 }],
  ['petition_signature', { actionType: 'petition_signature', baseReward: 10 }],
  ['referral', { actionType: 'referral', baseReward: 50 }],
  ['daily_login', { actionType: 'daily_login', baseReward: 5 }],
]);
```

### Multiplier System

Rewards support multipliers for:
- **Verification**: Photo verification, native species
- **Streaks**: 7-day (1.5x), 30-day (2.0x)
- **Badge Tiers**: Gold (1.2x), Platinum (1.5x)
- **Impact Scaling**: Multiple trees, waste collected

---

## Integration Updates

### Tree Planting Service

```typescript
// src/services/treeWallet.service.ts

async plantTree(userId: string, treeData: PlantTreeData): Promise<Tree | null> {
  const tree = await this.createTreeRecord(userId, treeData);
  if (!tree) return null;

  // Award GG Coins with multipliers
  const multipliers: RewardMultiplier[] = [];
  if (treeData.photoUrl) {
    multipliers.push({ condition: 'verified_with_photo', factor: 1.2 });
  }
  if (treeData.isNativeSpecies) {
    multipliers.push({ condition: 'native_species', factor: 1.5 });
  }

  await ggCoinService.awardCoins(userId, 'tree_planting', 1, multipliers);
  return tree;
}
```

### Mission Service

```typescript
// src/services/mission.service.ts

async completeMission(userId: string, missionId: string): Promise<boolean> {
  const success = await this.markMissionComplete(userId, missionId);
  if (!success) return false;

  // Award GG Coins
  await ggCoinService.creditCoins(
    userId,
    100,
    'earn',
    `Completed mission: ${mission.title}`,
    { missionId, missionTitle: mission.title }
  );

  return true;
}
```

### Education Service

```typescript
// src/services/education.service.ts

async completeLesson(userId: string, lessonId: string, score: number): Promise<boolean> {
  const success = await this.markLessonComplete(userId, lessonId, score);
  if (!success) return false;

  // Award GG Coins with perfect score multiplier
  const multipliers: RewardMultiplier[] = [];
  if (score >= 100) {
    multipliers.push({ condition: 'quiz_perfect_score', factor: 1.5 });
  }

  await ggCoinService.awardCoins(userId, 'learning_module', 1, multipliers);
  return true;
}
```

---

## Testing

### Unit Tests

```typescript
// src/services/ggCoin.service.test.ts

describe('GGCoinService', () => {
  it('should calculate base reward correctly', () => {
    const reward = ggCoinService.calculateReward('tree_planting');
    expect(reward).toBe(50);
  });

  it('should apply multipliers', () => {
    const reward = ggCoinService.calculateReward(
      'tree_planting',
      1,
      [{ condition: 'verified_with_photo', factor: 1.2 }]
    );
    expect(reward).toBe(60);
  });

  it('should round to 3 decimal places', () => {
    const reward = ggCoinService.calculateReward('tree_planting', 1.3333);
    expect(reward).toBe(66.665);
  });
});
```

### Component Tests

```typescript
// src/components/gamification/GGCoinWallet.test.tsx

describe('GGCoinWallet', () => {
  it('should display balance correctly', async () => {
    render(<GGCoinWallet userId="test-user" />);
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  it('should hide decimals for whole numbers', () => {
    // Test decimal formatting
  });
});
```

---

## Performance Considerations

### Caching Strategy

- **Balance Cache**: 30-second TTL for fast queries
- **Invalidation**: Cache clears on transactions
- **Real-time**: Supabase subscriptions for live updates

### Query Optimization

```sql
-- Indexes for fast queries
CREATE INDEX idx_gg_coin_transactions_user_time 
  ON gg_coin_transactions(user_id, created_at DESC);

CREATE INDEX idx_gg_coin_transactions_type 
  ON gg_coin_transactions(transaction_type);
```

### Performance Targets

- Balance queries: < 50ms (cached)
- Transaction recording: < 200ms
- Pagination: < 100ms
- Real-time updates: < 2 seconds

---

## Security

### Row-Level Security

```sql
-- Users can only view their own transactions
CREATE POLICY "Users view own transactions"
  ON gg_coin_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can create transactions
CREATE POLICY "System creates transactions"
  ON gg_coin_transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### Transaction Safety

- **Atomic Operations**: All transactions use database functions
- **Negative Balance Prevention**: Can't spend more than you have
- **Audit Trail**: Complete transaction history
- **Rollback Support**: Failed transactions don't affect balance

---

## Troubleshooting

### Common Issues

#### Balance Not Updating
- Check cache TTL (30 seconds)
- Verify transaction was successful
- Check browser console for errors

#### Transaction Failed
- Verify user has sufficient balance (for debits)
- Check database connection
- Review error logs

#### Multipliers Not Applying
- Verify multiplier conditions are met
- Check reward rule configuration
- Review calculation logic

### Debug Tools

```typescript
// Clear cache manually
ggCoinService.clearCache(userId);

// Check transaction details
const history = await ggCoinService.getTransactionHistory(userId, 10, 0);
console.log('Recent transactions:', history);

// Verify balance
const balance = await ggCoinService.getBalance(userId);
console.log('Current balance:', balance);
```

---

## Rollback Procedure

If issues arise, rollback is available:

1. **Stop Application**: Prevent new transactions
2. **Run Rollback Script**: `supabase/migrations/rollback_032.sql`
3. **Verify Data**: Check balances and transactions
4. **Restart Application**: Resume normal operations
5. **Investigate Issue**: Fix problem before re-attempting migration

---

## Future Enhancements

### Planned Features

- **User-to-User Transfers**: Send coins to friends
- **Coin Marketplace**: Trade coins for items
- **Staking**: Earn interest on coins
- **Governance Voting**: Use coins for voting power
- **Leaderboard Rewards**: Bonus coins for top performers

### API Improvements

- **Batch Operations**: Award coins to multiple users
- **Scheduled Rewards**: Automatic daily/weekly rewards
- **Webhook Support**: External integrations
- **GraphQL API**: Alternative query interface

---

## Support

### For Developers

- **Technical Guide**: [docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md](./TECHNICAL_GUIDE_NOVEMBER_19_2025.md)
- **Architecture**: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- **Spec**: [.kiro/specs/coin-harmonization/](../.kiro/specs/coin-harmonization/)

### For Issues

- **GitHub Issues**: Report bugs and feature requests
- **Email**: dev@ganggreen.org
- **Slack**: #dev-support channel

---

## Changelog

### Version 1.0.0 (December 2025)

**Added:**
- Unified GG Coin service
- Decimal precision support (3 places)
- Reward multiplier system
- Real-time balance updates
- Transaction history with pagination
- Caching for performance

**Changed:**
- Consolidated two coin systems into one
- Migrated all balances and transactions
- Updated all service integrations
- Refreshed UI components

**Deprecated:**
- Green Coin service
- Green Coin wallet component
- Separate transaction tables

**Removed:**
- None (deprecated items kept for reference)

---

## References

- **Requirements**: [.kiro/specs/coin-harmonization/requirements.md](../.kiro/specs/coin-harmonization/requirements.md)
- **Design**: [.kiro/specs/coin-harmonization/design.md](../.kiro/specs/coin-harmonization/design.md)
- **Tasks**: [.kiro/specs/coin-harmonization/tasks.md](../.kiro/specs/coin-harmonization/tasks.md)
- **Migration Script**: [supabase/migrations/032_consolidate_coins.sql](../supabase/migrations/032_consolidate_coins.sql)

---

*Last Updated: December 2025*
*Version: 1.0.0*
*Status: ✅ Complete*
