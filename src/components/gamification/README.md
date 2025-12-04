# Gamification Components

This directory contains components related to the gamification and reward systems of the #GangGreen platform.

## Components

### GGCoinWallet (New - Unified Coin System)

**File**: `GGCoinWallet.tsx`  
**Purpose**: Display user's GG Coin balance with real-time updates and proper formatting

**Note**: This is the new unified wallet component created as part of Migration 032 (Coin System Harmonization). It replaces the legacy GreenCoinWallet component.

**Features**:
- Real-time balance updates via Supabase subscriptions
- Smart decimal formatting (hide .000 for whole numbers)
- Thousand separators for large amounts (1,234.567)
- Level and total points display
- Loading and error states with retry functionality
- Responsive design
- Accessibility compliant (ARIA labels, keyboard navigation)

**Usage**:
```tsx
import { GGCoinWallet } from './components/gamification/GGCoinWallet';

// Basic usage
<GGCoinWallet userId={user.id} />

// With custom styling
<GGCoinWallet 
  userId={user.id} 
  className="my-custom-class"
  showTransactions={false}
/>
```

**Props**:
- `userId` (required): User ID to display wallet for
- `showTransactions` (optional): Whether to show transaction history (default: false)
- `className` (optional): Additional CSS classes

**Requirements**: B5.1, B5.2

---

### GreenCoinWallet (Legacy - Backward Compatibility)

**File**: `GreenCoinWallet.tsx`  
**Purpose**: Display user's GG Coin balance, transaction history, and earning breakdown

**Note**: This component has been updated to use ggCoinService as part of Migration 032 (Coin System Harmonization). The component name is kept for backward compatibility but now displays GG Coins instead of Green Coins. **New implementations should use GGCoinWallet instead.**

**Features**:
- Real-time balance updates
- Lifetime earnings and spending statistics
- Earning breakdown by source
- Transaction history with toggle view
- Decimal precision display (up to 3 decimal places)
- Loading and error states
- Responsive design

**Usage**:
```tsx
import { GreenCoinWallet } from './components/gamification/GreenCoinWallet';

<GreenCoinWallet />
```

**Requirements**: A7.2

---

### ReferralTracker

**File**: `ReferralTracker.tsx`  
**Purpose**: Display user's referral code, statistics, and recent referrals

**Features**:
- Unique referral code display
- Copy to clipboard functionality
- Social sharing integration
- Referral statistics (total, successful, bonus earned)
- Recent referrals list
- Empty state for new users

**Usage**:
```tsx
import { ReferralTracker } from './components/gamification/ReferralTracker';

<ReferralTracker />
```

**Requirements**: A7.5

---

### GGCoinBalance

**File**: `GGCoinBalance.tsx`  
**Purpose**: Display user's GG Coin balance (legacy system)

**Note**: This is the legacy GG Coins system (decimal-based). The new Green Coins system (integer-based) is used for the V1.0 Platform Vision.

---

## Services

### ggCoin.service.ts (Unified Coin Service)

**Migration Notice**: As of Migration 032, the Green Coin and GG Coin systems have been consolidated into a single unified service: `ggCoinService`. The old `greenCoin.service.ts` is deprecated.

Handles GG Coin wallet management, transactions, and reward calculations.

**Key Methods**:
- `getWallet(userId)`: Get or create wallet
- `getBalance(userId)`: Get current balance (with caching)
- `creditCoins(...)`: Credit coins to user (earn, bonus, referral)
- `debitCoins(...)`: Debit coins from user (spend)
- `calculateReward(...)`: Calculate reward amount with multipliers
- `awardCoins(...)`: Award coins for action with automatic reward calculation
- `getTransactionHistory(...)`: Get transaction history with pagination
- `getEarningBreakdown(userId)`: Get earning breakdown by type
- `subscribeToBalance(...)`: Real-time balance updates
- `clearCache(userId?)`: Clear balance cache

**Decimal Precision**: GG Coins support up to 3 decimal places (e.g., 10.500 GG Coins)

### referral.service.ts

Handles referral code generation, tracking, and bonus distribution.

**Key Methods**:
- `generateReferralCode(userId)`: Generate unique code
- `getReferralCode(userId)`: Get or create code
- `validateReferralCode(code)`: Validate code
- `trackReferral(...)`: Track successful referral
- `getReferralStats(userId)`: Get referral statistics
- `getTopReferrers(limit)`: Get leaderboard

## Integration Examples

### Award Coins for Mission Completion

```typescript
import { ggCoinService } from '../../services/ggCoin.service';

// After mission verification
await ggCoinService.awardCoins(
  userId,
  'mission_completion',
  1,
  undefined,
  `Completed mission: ${missionTitle}`
);
```

### Track Referral During Registration

```typescript
import { referralService } from '../../services/referral.service';

// Check for referral code in URL
const referralCode = new URLSearchParams(window.location.search).get('ref');

if (referralCode) {
  // Track referral after successful registration
  await referralService.trackReferral(referralCode, newUserId);
}
```

### Display Balance in Header

```typescript
import { ggCoinService } from '../../services/ggCoin.service';

const [balance, setBalance] = useState(0);

useEffect(() => {
  if (user?.id) {
    ggCoinService.getBalance(user.id).then(setBalance);
    
    // Subscribe to real-time updates
    const unsubscribe = ggCoinService.subscribeToBalance(user.id, setBalance);
    return unsubscribe;
  }
}, [user?.id]);
```

## Styling

All components use Tailwind CSS for styling with the following color scheme:

- **GG Coins**: `green-600` (primary), `green-50` (background)
- **Earnings**: `green-600`
- **Spending**: `red-600`
- **Bonuses**: `yellow-600`
- **Referrals**: `blue-600`

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance

## Performance

- Balance caching (30-second TTL)
- Real-time updates via Supabase subscriptions
- Lazy loading of transaction history
- Optimized re-renders with React.memo (where needed)

## Testing

Test files should be co-located with components:
- `GreenCoinWallet.test.tsx`
- `ReferralTracker.test.tsx`

Test coverage should include:
- Component rendering
- User interactions (copy, share, toggle)
- Real-time updates
- Loading and error states
- Edge cases (no transactions, no referrals)

---

### BadgeDisplay

**File**: `BadgeDisplay.tsx`  
**Purpose**: Display user's earned badges and progression through badge tiers

**Features**:
- Show earned and locked badges
- Display progression tiers (Steward, Platinum, Hero)
- Progress tracking for locked badges
- Tier filtering
- Badge criteria display
- Responsive grid layout

**Usage**:
```tsx
import { BadgeDisplay } from './components/gamification/BadgeDisplay';

<BadgeDisplay userId={userId} showProgress={true} />
```

**Requirements**: A9.1, A9.2

---

### Leaderboard

**File**: `Leaderboard.tsx`  
**Purpose**: Display rankings by various metrics with different timeframes and scopes

**Features**:
- Multiple metric types (Green Coins, Trees Planted, Community Impact)
- Timeframe filtering (Daily, Weekly, Monthly, All Time)
- Scope filtering (Global, County, Community)
- Current user rank highlighting
- Top 3 special styling
- Responsive design

**Usage**:
```tsx
import { Leaderboard } from './components/gamification/Leaderboard';

<Leaderboard 
  currentUserId={userId}
  defaultType="green_coins"
  defaultTimeframe="monthly"
  limit={50}
/>
```

**Requirements**: A9.3

---

### StreakTracker

**File**: `StreakTracker.tsx`  
**Purpose**: Track consecutive daily activity and award bonus points

**Features**:
- Current and longest streak display
- Milestone tracking with bonus rewards
- Activity calendar visualization
- Next milestone progress
- Streak status indicators
- Activity tips

**Usage**:
```tsx
import { StreakTracker } from './components/gamification/StreakTracker';

<StreakTracker userId={userId} showHistory={true} />
```

**Requirements**: A9.4

---

### ChallengeCard

**File**: `ChallengeCard.tsx`  
**Purpose**: Display active challenges and team scores

**Features**:
- Individual, team, and community challenges
- Progress tracking
- Team standings display
- Time remaining countdown
- Join/participation status
- Reward display
- Compact and full view modes

**Usage**:
```tsx
import { ChallengeCard } from './components/gamification/ChallengeCard';

<ChallengeCard 
  challenge={challenge}
  userId={userId}
  onJoin={handleJoin}
  onViewDetails={handleViewDetails}
/>
```

**Requirements**: A9.5

---

## Future Enhancements

- [ ] GG Coin marketplace for redemptions
- [ ] Coin gifting between users
- [ ] Seasonal multipliers
- [ ] Notification system for coin events
- [ ] Challenge creation interface
- [ ] Team management features
- [ ] Badge customization
- [ ] Leaderboard prizes and rewards

## Related Documentation

- [Coin Harmonization Spec](.kiro/specs/coin-harmonization/)
- [GG Coin Service](../../services/ggCoin.service.ts)
- [Migration 032 Guide](../../../supabase/migrations/MIGRATION_032_GUIDE.md)
- [Green Coins Implementation Guide (Legacy)](../../../docs/GREEN_COINS_IMPLEMENTATION.md)
- [V1.0 Design Document](../../../.kiro/specs/v1-major-release/design.md)
- [Technical Guide](../../../docs/TECHNICAL_GUIDE_NOVEMBER_27_2025.md)
