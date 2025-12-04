# Green Coins Economy Implementation

## Overview

The Green Coins economy is a core feature of the V1.0 Major Release, providing a virtual currency reward system that incentivizes climate action and community engagement on the #GangGreen platform.

**Implementation Date**: November 29, 2025  
**Status**: ✅ Complete  
**Requirements**: A7.1, A7.2, A7.4, A7.5

## Features Implemented

### 1. Green Coin Wallet (Task 15.1)

**Component**: `src/components/gamification/GreenCoinWallet.tsx`

A comprehensive wallet component that displays:
- Current Green Coin balance (real-time updates)
- Lifetime earnings and spending statistics
- Earning breakdown by source (tree planting, missions, learning, etc.)
- Transaction history with filtering
- Last updated timestamp

**Key Features**:
- Real-time balance updates via Supabase subscriptions
- Caching for improved performance (30-second TTL)
- Transaction history with pagination
- Visual breakdown of earning sources
- Responsive design with loading and error states

### 2. Transaction Recording (Task 15.2)

**Service**: `src/services/greenCoin.service.ts`

Implements comprehensive transaction tracking:
- Records all Green Coin movements (earn, spend, bonus, referral)
- Atomic wallet updates (balance, lifetime earnings, lifetime spending)
- Transaction history with pagination
- Source tracking for analytics

**Transaction Types**:
- `earn`: Rewards for verified actions
- `spend`: Purchases or redemptions
- `bonus`: Special bonuses and multipliers
- `referral`: Referral program rewards

### 3. Reward Calculation Engine (Task 15.3)

**Service**: `src/services/greenCoin.service.ts` - `calculateReward()` method

Implements flexible reward calculation with:
- Base rewards for different action types
- Impact-based scaling
- Multiplier support for bonuses
- Configurable reward rules

**Default Reward Rules**:
```typescript
{
  'tree_planting': 50 coins,
  'waste_cleanup': 30 coins,
  'learning_module': 20 coins,
  'mission_completion': 100 coins,
  'community_post': 5 coins,
  'petition_signature': 10 coins,
  'referral': 50 coins,
  'daily_login': 5 coins
}
```

### 4. Referral Tracking (Task 15.5)

**Service**: `src/services/referral.service.ts`  
**Component**: `src/components/gamification/ReferralTracker.tsx`

Complete referral program implementation:
- Unique referral code generation per user
- Referral code validation
- Automatic bonus distribution (50 Green Coins per successful referral)
- Referral statistics and leaderboard
- Social sharing integration

**Referral Features**:
- Copy referral code to clipboard
- Share via native share API or clipboard
- View referral statistics (total, successful, bonus earned)
- Recent referrals list
- Top referrers leaderboard

## Database Schema

The implementation uses the existing V1.0 database schema:

### green_coin_wallets
```sql
CREATE TABLE green_coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance INTEGER DEFAULT 0,
  lifetime_earnings INTEGER DEFAULT 0,
  lifetime_spending INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

### green_coin_transactions
```sql
CREATE TABLE green_coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  transaction_type VARCHAR(20),
  amount INTEGER,
  source VARCHAR(100),
  description TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### user_profiles (extended)
```sql
ALTER TABLE user_profiles 
  ADD COLUMN referral_code VARCHAR(20) UNIQUE,
  ADD COLUMN referred_by UUID REFERENCES users(id);
```

## API Reference

### GreenCoinService

#### `getWallet(userId: string): Promise<GreenCoinWallet | null>`
Get or create a user's Green Coin wallet.

#### `getBalance(userId: string): Promise<number>`
Get user's current balance (with caching).

#### `recordTransaction(userId, type, amount, source, description): Promise<GreenCoinTransaction | null>`
Record a Green Coin transaction and update wallet.

#### `getTransactionHistory(userId, limit, offset): Promise<TransactionHistory>`
Get paginated transaction history.

#### `calculateReward(actionType, impact?, multipliers?): number`
Calculate reward amount based on rules and multipliers.

#### `awardCoins(userId, actionType, impact?, multipliers?, description?): Promise<GreenCoinTransaction | null>`
Award Green Coins for a verified action.

#### `spendCoins(userId, amount, source, description): Promise<GreenCoinTransaction | null>`
Spend Green Coins (checks sufficient balance).

#### `awardReferralBonus(referrerId, referredUserId): Promise<GreenCoinTransaction | null>`
Award referral bonus to referrer.

#### `getEarningBreakdown(userId): Promise<Record<string, number>>`
Get earning breakdown by source.

#### `subscribeToBalance(userId, callback): () => void`
Subscribe to real-time balance updates.

### ReferralService

#### `generateReferralCode(userId: string): string`
Generate a unique referral code.

#### `getReferralCode(userId: string): Promise<string | null>`
Get or create referral code for a user.

#### `validateReferralCode(referralCode: string): Promise<string | null>`
Validate a referral code and get referrer's user ID.

#### `trackReferral(referralCode, referredUserId): Promise<boolean>`
Track a successful referral and award bonus.

#### `getReferralStats(userId): Promise<ReferralStats>`
Get referral statistics for a user.

#### `getTopReferrers(limit): Promise<Array<{userId, referralCount}>>`
Get leaderboard of top referrers.

#### `getReferrer(userId): Promise<string | null>`
Check if a user was referred by someone.

## Usage Examples

### Display Green Coin Wallet

```tsx
import { GreenCoinWallet } from '../components/gamification/GreenCoinWallet';

function MyPage() {
  return (
    <div>
      <GreenCoinWallet />
    </div>
  );
}
```

### Award Coins for Action

```typescript
import { greenCoinService } from '../services/greenCoin.service';

// Award coins for tree planting
await greenCoinService.awardCoins(
  userId,
  'tree_planting',
  1, // impact (1 tree)
  undefined,
  'Planted 1 tree in Kakamega Forest'
);

// Award coins with multiplier
await greenCoinService.awardCoins(
  userId,
  'mission_completion',
  1,
  [{ condition: 'first_mission', factor: 1.5 }],
  'Completed first mission with 50% bonus'
);
```

### Track Referral

```typescript
import { referralService } from '../services/referral.service';

// During registration
const referralCode = searchParams.get('ref');
if (referralCode) {
  await referralService.trackReferral(referralCode, newUserId);
}
```

### Display Referral Tracker

```tsx
import { ReferralTracker } from '../components/gamification/ReferralTracker';

function MyPage() {
  return (
    <div>
      <ReferralTracker />
    </div>
  );
}
```

## Integration Points

### 1. Mission Completion
When a mission is verified, award Green Coins:
```typescript
const mission = await missionService.getMission(missionId);
await greenCoinService.awardCoins(
  userId,
  'mission_completion',
  1,
  undefined,
  `Completed mission: ${mission.title}`
);
```

### 2. Learning Module Completion
When a user completes a learning module:
```typescript
const module = await educationService.getLearningModule(moduleId);
await greenCoinService.awardCoins(
  userId,
  'learning_module',
  1,
  undefined,
  `Completed learning module: ${module.title}`
);
```

### 3. User Registration
During registration, check for referral code:
```typescript
const referralCode = searchParams.get('ref');
if (referralCode) {
  // Track referral after successful registration
  await referralService.trackReferral(referralCode, newUser.id);
}
```

### 4. Dashboard Display
Add Green Coin balance to user dashboard:
```typescript
const balance = await greenCoinService.getBalance(userId);
```

## Performance Considerations

### Caching
- Balance caching with 30-second TTL
- Reduces database queries for frequently accessed data
- Cache invalidation on wallet updates

### Real-time Updates
- Supabase subscriptions for live balance updates
- Efficient channel management
- Automatic cache updates on changes

### Transaction History
- Pagination support (default 50 items)
- Indexed queries for fast retrieval
- Optimized for recent transactions

## Security Considerations

### Transaction Integrity
- Atomic wallet updates (balance, lifetime earnings, lifetime spending)
- Transaction logging for audit trail
- Balance validation before spending

### Referral Fraud Prevention
- Self-referral prevention
- Unique referral codes per user
- Referral tracking with timestamps
- Bonus awarded only once per referral

### Data Privacy
- User IDs used instead of personal information
- Transaction descriptions sanitized
- Referral data anonymized in leaderboards

## Testing

### Unit Tests
Test coverage for:
- Reward calculation logic
- Transaction recording
- Referral code generation and validation
- Balance calculations

### Integration Tests
Test scenarios:
- Complete action → award coins → update balance
- Referral flow → track referral → award bonus
- Spend coins → check balance → update wallet

### Property-Based Tests
Property tests for:
- Reward calculation consistency
- Balance integrity (earnings - spending = balance)
- Referral bonus distribution

## Future Enhancements

### Planned Features
1. **Green Coin Marketplace**: Redeem coins for rewards, badges, or real-world benefits
2. **Streak Bonuses**: Daily login streaks with increasing rewards
3. **Team Challenges**: Pool coins for team-based competitions
4. **Coin Gifting**: Transfer coins between users
5. **Seasonal Multipliers**: Special events with bonus multipliers
6. **Achievement Milestones**: Bonus coins for reaching milestones

### Optimization Opportunities
1. **Redis Caching**: Distributed caching for production scale
2. **Batch Processing**: Bulk coin awards for large events
3. **Analytics Dashboard**: Admin view of coin economy metrics
4. **Rate Limiting**: Prevent abuse of coin-earning actions

## Troubleshooting

### Common Issues

**Issue**: Balance not updating in real-time
- **Solution**: Check Supabase subscription connection, verify user ID

**Issue**: Referral bonus not awarded
- **Solution**: Verify referral code is valid, check for self-referral, ensure user profile has referred_by field

**Issue**: Transaction history not loading
- **Solution**: Check database connection, verify user has transactions, check pagination parameters

**Issue**: Reward calculation returns 0
- **Solution**: Verify action type exists in reward rules, check impact and multiplier values

## Support

For issues or questions:
- Check the [Technical Guide](./TECHNICAL_GUIDE_NOVEMBER_27_2025.md)
- Review the [V1.0 Design Document](../.kiro/specs/v1-major-release/design.md)
- Contact the development team

## Changelog

### Version 1.0.0 (November 29, 2025)
- ✅ Initial implementation of Green Coins economy
- ✅ Green Coin Wallet component
- ✅ Transaction recording system
- ✅ Reward calculation engine
- ✅ Referral tracking system
- ✅ Real-time balance updates
- ✅ Earning breakdown analytics
