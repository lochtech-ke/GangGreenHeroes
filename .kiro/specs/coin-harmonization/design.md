# Coin System Harmonization - Design

## Architecture Overview

### Current State
```
┌─────────────────────┐         ┌──────────────────────┐
│  GG Coins System    │         │  Green Coins System  │
├─────────────────────┤         ├──────────────────────┤
│ user_gamification   │         │ green_coin_wallets   │
│ - gg_coins (DECIMAL)│         │ - balance (INTEGER)  │
├─────────────────────┤         ├──────────────────────┤
│gg_coin_transactions │         │green_coin_transactions│
│ - amount (DECIMAL)  │         │ - amount (INTEGER)   │
└─────────────────────┘         └──────────────────────┘
         ↑                               ↑
         │                               │
    DB Functions                  greenCoin.service.ts
```

### Target State
```
┌──────────────────────────────────┐
│     Unified GG Coins System      │
├──────────────────────────────────┤
│      user_gamification           │
│      - gg_coins (DECIMAL 10,3)   │
├──────────────────────────────────┤
│      gg_coin_transactions        │
│      - amount (DECIMAL 10,3)     │
└──────────────────────────────────┘
                ↑
                │
         ggCoin.service.ts
         (unified service)
```

## Database Design

### P1. Schema Consolidation

**P1.1 Primary Wallet Table**

Use `user_gamification` table as single source of truth:
```sql
-- Already exists with DECIMAL support
user_gamification (
  id UUID PRIMARY KEY,
  gg_coins DECIMAL(10,3) DEFAULT 0,
  total_points INTEGER,
  level INTEGER,
  -- ... other gamification fields
)
```

**P1.2 Transaction Log Table**
Use `gg_coin_transactions` for all coin movements:
```sql
-- Already exists with DECIMAL support
gg_coin_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  transaction_type TEXT, -- 'earn', 'spend', 'bonus', 'referral'
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

**P1.3 Deprecated Tables**
Mark for read-only access:
```sql
-- Add deprecation comments
COMMENT ON TABLE green_coin_wallets IS 
  'DEPRECATED: Migrated to user_gamification.gg_coins. Read-only for historical reference.';
  
COMMENT ON TABLE green_coin_transactions IS 
  'DEPRECATED: Migrated to gg_coin_transactions. Read-only for historical reference.';
```

### P2. Migration Strategy

**P2.1 Data Migration Script**
```sql
-- Migration: Consolidate Green Coins into GG Coins
-- Run in transaction for atomicity

BEGIN;

-- Step 1: Migrate wallet balances
INSERT INTO user_gamification (id, gg_coins, updated_at)
SELECT 
  user_id,
  balance::DECIMAL(10,3),
  last_updated
FROM green_coin_wallets
ON CONFLICT (id) DO UPDATE SET
  gg_coins = user_gamification.gg_coins + EXCLUDED.gg_coins,
  updated_at = GREATEST(user_gamification.updated_at, EXCLUDED.updated_at);

-- Step 2: Migrate transaction history
INSERT INTO gg_coin_transactions (
  user_id,
  transaction_type,
  amount,
  balance_before,
  balance_after,
  reference_type,
  reference_id,
  description,
  metadata,
  created_at
)
SELECT
  user_id,
  transaction_type,
  amount::DECIMAL(10,3),
  0::DECIMAL(10,3), -- Historical, can't reconstruct
  0::DECIMAL(10,3), -- Historical, can't reconstruct
  source, -- Map source to reference_type
  NULL, -- No reference_id in old system
  description,
  jsonb_build_object('migrated_from', 'green_coins', 'original_id', id),
  timestamp
FROM green_coin_transactions
ORDER BY timestamp ASC;

-- Step 3: Verify migration
DO $$
DECLARE
  v_green_total DECIMAL(10,3);
  v_gg_total DECIMAL(10,3);
BEGIN
  SELECT SUM(balance) INTO v_green_total FROM green_coin_wallets;
  SELECT SUM(gg_coins) INTO v_gg_total FROM user_gamification;
  
  IF v_green_total != v_gg_total THEN
    RAISE EXCEPTION 'Migration verification failed: totals do not match';
  END IF;
END $$;

-- Step 4: Mark old tables as deprecated
ALTER TABLE green_coin_wallets RENAME TO _deprecated_green_coin_wallets;
ALTER TABLE green_coin_transactions RENAME TO _deprecated_green_coin_transactions;

COMMIT;
```

**P2.2 Rollback Script**
```sql
-- Rollback: Restore Green Coins tables
BEGIN;

ALTER TABLE _deprecated_green_coin_wallets RENAME TO green_coin_wallets;
ALTER TABLE _deprecated_green_coin_transactions RENAME TO green_coin_transactions;

-- Remove migrated GG Coins (if needed)
-- This is destructive - only use if migration failed immediately

COMMIT;
```

## Service Layer Design

### P3. Unified GG Coin Service

**P3.1 Service Interface**
```typescript
// src/services/ggCoin.service.ts

export interface GGCoinWallet {
  userId: string;
  balance: number; // DECIMAL as number
  totalPoints: number;
  level: number;
  lastUpdated: Date;
}

export interface GGCoinTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus' | 'referral';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface RewardRule {
  actionType: string;
  baseReward: number;
  multipliers?: RewardMultiplier[];
}

export interface RewardMultiplier {
  condition: string;
  factor: number;
}

export interface TransactionHistory {
  transactions: GGCoinTransaction[];
  total: number;
  hasMore: boolean;
}

class GGCoinService {
  // Wallet operations
  getWallet(userId: string): Promise<GGCoinWallet | null>;
  getBalance(userId: string): Promise<number>;
  
  // Transaction operations
  creditCoins(userId: string, amount: number, type: string, 
              description: string, metadata?: any): Promise<GGCoinTransaction | null>;
  debitCoins(userId: string, amount: number, type: string,
             description: string, metadata?: any): Promise<GGCoinTransaction | null>;
  
  // Reward operations
  calculateReward(actionType: string, impact?: number, 
                  multipliers?: RewardMultiplier[]): number;
  awardCoins(userId: string, actionType: string, impact?: number,
             multipliers?: RewardMultiplier[]): Promise<GGCoinTransaction | null>;
  
  // History and analytics
  getTransactionHistory(userId: string, limit?: number, 
                        offset?: number): Promise<TransactionHistory>;
  getEarningBreakdown(userId: string): Promise<Record<string, number>>;
  
  // Real-time updates
  subscribeToBalance(userId: string, callback: (balance: number) => void): () => void;
  
  // Cache management
  clearCache(userId?: string): void;
}
```

**P3.2 Core Implementation**
```typescript
class GGCoinService {
  private balanceCache = new Map<string, { balance: number; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds
  
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

  async getBalance(userId: string): Promise<number> {
    // Check cache
    const cached = this.balanceCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.balance;
    }

    // Query database
    const { data, error } = await supabase
      .from('user_gamification')
      .select('gg_coins')
      .eq('id', userId)
      .single();

    if (error || !data) return 0;

    const balance = parseFloat(data.gg_coins) || 0;
    
    // Update cache
    this.balanceCache.set(userId, { balance, timestamp: Date.now() });
    
    return balance;
  }

  async creditCoins(
    userId: string,
    amount: number,
    type: string,
    description: string,
    metadata?: any
  ): Promise<GGCoinTransaction | null> {
    // Use database function for atomicity
    const { data, error } = await supabase.rpc('credit_gg_coins', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: type,
      p_description: description,
      p_metadata: metadata || null,
    });

    if (error || !data?.success) {
      console.error('[GGCoinService] Credit failed:', error || data?.error);
      return null;
    }

    // Clear cache
    this.balanceCache.delete(userId);

    // Return transaction details
    return {
      id: data.transaction_id,
      userId,
      type: type as any,
      amount,
      balanceBefore: data.balance_before,
      balanceAfter: data.balance_after,
      description,
      metadata,
      timestamp: new Date(),
    };
  }

  calculateReward(
    actionType: string,
    impact?: number,
    multipliers?: RewardMultiplier[]
  ): number {
    const rule = this.rewardRules.get(actionType);
    if (!rule) return 0;

    let reward = rule.baseReward;

    // Apply impact scaling
    if (impact !== undefined && impact > 0) {
      reward = reward * impact;
    }

    // Apply multipliers
    if (multipliers) {
      for (const mult of multipliers) {
        reward = reward * mult.factor;
      }
    }

    // Round to 3 decimal places
    return Math.round(reward * 1000) / 1000;
  }
}

export const ggCoinService = new GGCoinService();
```

### P4. Reward System Design

**P4.1 Reward Rules Configuration**
```typescript
// Centralized reward configuration
export const REWARD_RULES: Record<string, RewardRule> = {
  // Environmental Actions
  tree_planting: {
    actionType: 'tree_planting',
    baseReward: 50,
    multipliers: [
      { condition: 'verified_with_photo', factor: 1.2 },
      { condition: 'native_species', factor: 1.5 },
    ],
  },
  waste_cleanup: {
    actionType: 'waste_cleanup',
    baseReward: 30,
    multipliers: [
      { condition: 'kg_collected', factor: 1.0 }, // 1 coin per kg
    ],
  },
  
  // Educational Actions
  learning_module: {
    actionType: 'learning_module',
    baseReward: 20,
    multipliers: [
      { condition: 'quiz_perfect_score', factor: 1.5 },
      { condition: 'advanced_difficulty', factor: 2.0 },
    ],
  },
  
  // Community Actions
  mission_completion: {
    actionType: 'mission_completion',
    baseReward: 100,
    multipliers: [
      { condition: 'team_participation', factor: 1.3 },
      { condition: 'early_completion', factor: 1.2 },
    ],
  },
  community_post: {
    actionType: 'community_post',
    baseReward: 5,
    multipliers: [
      { condition: 'with_media', factor: 1.5 },
      { condition: 'high_engagement', factor: 2.0 },
    ],
  },
  
  // Engagement Actions
  petition_signature: {
    actionType: 'petition_signature',
    baseReward: 10,
  },
  referral: {
    actionType: 'referral',
    baseReward: 50,
    multipliers: [
      { condition: 'referred_user_active', factor: 2.0 },
    ],
  },
  daily_login: {
    actionType: 'daily_login',
    baseReward: 5,
    multipliers: [
      { condition: 'streak_7_days', factor: 1.5 },
      { condition: 'streak_30_days', factor: 2.0 },
    ],
  },
};
```

**P4.2 Dynamic Multiplier System**
```typescript
export interface MultiplierContext {
  userId: string;
  actionType: string;
  impact?: number;
  metadata?: Record<string, any>;
}

export class RewardCalculator {
  async calculateWithMultipliers(context: MultiplierContext): Promise<number> {
    const rule = REWARD_RULES[context.actionType];
    if (!rule) return 0;

    let reward = rule.baseReward;

    // Apply impact scaling
    if (context.impact) {
      reward *= context.impact;
    }

    // Apply user-specific multipliers
    const userMultipliers = await this.getUserMultipliers(context.userId);
    for (const mult of userMultipliers) {
      reward *= mult.factor;
    }

    // Apply action-specific multipliers
    if (rule.multipliers) {
      for (const mult of rule.multipliers) {
        if (this.checkCondition(mult.condition, context)) {
          reward *= mult.factor;
        }
      }
    }

    return Math.round(reward * 1000) / 1000;
  }

  private async getUserMultipliers(userId: string): Promise<RewardMultiplier[]> {
    const multipliers: RewardMultiplier[] = [];

    // Check streak multiplier
    const streak = await this.getUserStreak(userId);
    if (streak >= 30) {
      multipliers.push({ condition: 'streak_30', factor: 2.0 });
    } else if (streak >= 7) {
      multipliers.push({ condition: 'streak_7', factor: 1.5 });
    }

    // Check badge tier multiplier
    const badgeTier = await this.getUserBadgeTier(userId);
    if (badgeTier === 'platinum') {
      multipliers.push({ condition: 'platinum_badge', factor: 1.5 });
    } else if (badgeTier === 'gold') {
      multipliers.push({ condition: 'gold_badge', factor: 1.2 });
    }

    return multipliers;
  }

  private checkCondition(condition: string, context: MultiplierContext): boolean {
    // Implement condition checking logic
    switch (condition) {
      case 'verified_with_photo':
        return !!context.metadata?.photoUrl;
      case 'native_species':
        return !!context.metadata?.isNativeSpecies;
      case 'with_media':
        return !!context.metadata?.hasMedia;
      default:
        return false;
    }
  }
}
```

## UI Component Design

### P5. Wallet Component

**P5.1 GG Coin Wallet Display**
```typescript
// src/components/gamification/GGCoinWallet.tsx

interface GGCoinWalletProps {
  userId: string;
  showTransactions?: boolean;
}

export const GGCoinWallet: React.FC<GGCoinWalletProps> = ({ 
  userId, 
  showTransactions = false 
}) => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
    
    // Subscribe to real-time updates
    const unsubscribe = ggCoinService.subscribeToBalance(userId, (newBalance) => {
      setBalance(newBalance);
    });

    return unsubscribe;
  }, [userId]);

  const loadBalance = async () => {
    setLoading(true);
    const bal = await ggCoinService.getBalance(userId);
    setBalance(bal);
    setLoading(false);
  };

  const formatBalance = (amount: number): string => {
    // Hide decimals if whole number
    if (amount % 1 === 0) {
      return amount.toLocaleString();
    }
    // Show up to 3 decimals
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  };

  return (
    <div className="gg-coin-wallet">
      <div className="wallet-header">
        <h3>GG Coins</h3>
        {loading ? (
          <div className="skeleton-loader" />
        ) : (
          <div className="balance">
            <span className="amount">{formatBalance(balance)}</span>
            <span className="currency">GG</span>
          </div>
        )}
      </div>
      
      {showTransactions && (
        <TransactionHistory userId={userId} />
      )}
    </div>
  );
};
```

**P5.2 Transaction History Component**
```typescript
// src/components/gamification/TransactionHistory.tsx

export const TransactionHistory: React.FC<{ userId: string }> = ({ userId }) => {
  const [history, setHistory] = useState<TransactionHistory | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadHistory();
  }, [userId, page]);

  const loadHistory = async () => {
    const result = await ggCoinService.getTransactionHistory(
      userId,
      PAGE_SIZE,
      page * PAGE_SIZE
    );
    setHistory(result);
  };

  const formatAmount = (amount: number, type: string): string => {
    const prefix = type === 'spend' ? '-' : '+';
    return `${prefix}${Math.abs(amount).toFixed(3)}`;
  };

  return (
    <div className="transaction-history">
      <h4>Recent Transactions</h4>
      <div className="transactions-list">
        {history?.transactions.map((tx) => (
          <div key={tx.id} className={`transaction ${tx.type}`}>
            <div className="tx-info">
              <span className="tx-description">{tx.description}</span>
              <span className="tx-date">
                {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
              </span>
            </div>
            <div className="tx-amount">
              {formatAmount(tx.amount, tx.type)}
            </div>
          </div>
        ))}
      </div>
      
      {history && history.hasMore && (
        <button onClick={() => setPage(page + 1)}>
          Load More
        </button>
      )}
    </div>
  );
};
```

### P6. Earning Feedback

**P6.1 Coin Earned Toast**
```typescript
// src/components/common/CoinEarnedToast.tsx

interface CoinEarnedToastProps {
  amount: number;
  reason: string;
  onClose: () => void;
}

export const CoinEarnedToast: React.FC<CoinEarnedToastProps> = ({
  amount,
  reason,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="coin-earned-toast">
      <div className="toast-icon">🪙</div>
      <div className="toast-content">
        <div className="toast-amount">+{amount.toFixed(3)} GG Coins</div>
        <div className="toast-reason">{reason}</div>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};
```

## Integration Points

### P7. Service Integration

**P7.1 Tree Planting Integration**
```typescript
// src/services/treeWallet.service.ts

async plantTree(userId: string, treeData: PlantTreeData): Promise<Tree | null> {
  // Plant tree
  const tree = await this.createTreeRecord(userId, treeData);
  if (!tree) return null;

  // Award GG Coins
  const multipliers: RewardMultiplier[] = [];
  if (treeData.photoUrl) {
    multipliers.push({ condition: 'verified_with_photo', factor: 1.2 });
  }
  if (treeData.isNativeSpecies) {
    multipliers.push({ condition: 'native_species', factor: 1.5 });
  }

  await ggCoinService.awardCoins(
    userId,
    'tree_planting',
    1,
    multipliers
  );

  return tree;
}
```

**P7.2 Mission Completion Integration**
```typescript
// src/services/mission.service.ts

async completeMission(userId: string, missionId: string): Promise<boolean> {
  // Mark mission complete
  const success = await this.markMissionComplete(userId, missionId);
  if (!success) return false;

  // Award GG Coins
  const mission = await this.getMission(missionId);
  const reward = mission.green_coin_reward || 100;

  await ggCoinService.creditCoins(
    userId,
    reward,
    'earn',
    `Completed mission: ${mission.title}`,
    { missionId, missionTitle: mission.title }
  );

  return true;
}
```

**P7.3 Learning Module Integration**
```typescript
// src/services/education.service.ts

async completeLesson(userId: string, lessonId: string, score: number): Promise<boolean> {
  // Mark lesson complete
  const success = await this.markLessonComplete(userId, lessonId, score);
  if (!success) return false;

  // Award GG Coins with multiplier for perfect score
  const multipliers: RewardMultiplier[] = [];
  if (score >= 100) {
    multipliers.push({ condition: 'quiz_perfect_score', factor: 1.5 });
  }

  await ggCoinService.awardCoins(
    userId,
    'learning_module',
    1,
    multipliers
  );

  return true;
}
```

## Testing Strategy

### P8. Test Coverage

**P8.1 Unit Tests**
```typescript
// src/services/ggCoin.service.test.ts

describe('GGCoinService', () => {
  describe('getBalance', () => {
    it('should return cached balance within TTL', async () => {
      // Test caching logic
    });

    it('should fetch fresh balance after TTL expires', async () => {
      // Test cache expiration
    });
  });

  describe('creditCoins', () => {
    it('should credit coins and return transaction', async () => {
      // Test successful credit
    });

    it('should handle database errors gracefully', async () => {
      // Test error handling
    });

    it('should clear cache after credit', async () => {
      // Test cache invalidation
    });
  });

  describe('calculateReward', () => {
    it('should calculate base reward correctly', () => {
      const reward = ggCoinService.calculateReward('tree_planting');
      expect(reward).toBe(50);
    });

    it('should apply impact multiplier', () => {
      const reward = ggCoinService.calculateReward('tree_planting', 10);
      expect(reward).toBe(500);
    });

    it('should apply custom multipliers', () => {
      const reward = ggCoinService.calculateReward(
        'tree_planting',
        1,
        [{ condition: 'test', factor: 2.0 }]
      );
      expect(reward).toBe(100);
    });

    it('should round to 3 decimal places', () => {
      const reward = ggCoinService.calculateReward('tree_planting', 1.3333);
      expect(reward).toBe(66.665);
    });
  });
});
```

**P8.2 Integration Tests**
```typescript
// src/services/ggCoin.integration.test.ts

describe('GGCoin Integration', () => {
  it('should maintain balance consistency across transactions', async () => {
    const userId = 'test-user';
    
    // Credit 100 coins
    await ggCoinService.creditCoins(userId, 100, 'earn', 'Test credit');
    let balance = await ggCoinService.getBalance(userId);
    expect(balance).toBe(100);

    // Debit 30 coins
    await ggCoinService.debitCoins(userId, 30, 'spend', 'Test debit');
    balance = await ggCoinService.getBalance(userId);
    expect(balance).toBe(70);
  });

  it('should prevent negative balances', async () => {
    const userId = 'test-user';
    
    // Try to debit more than balance
    const result = await ggCoinService.debitCoins(userId, 1000, 'spend', 'Test');
    expect(result).toBeNull();
  });
});
```

## Deployment Plan

### P9. Migration Execution

**P9.1 Pre-Deployment Checklist**
- [ ] Full database backup created
- [ ] Migration script tested on staging
- [ ] Rollback script prepared and tested
- [ ] Monitoring alerts configured
- [ ] Support team briefed
- [ ] User communication prepared

**P9.2 Deployment Steps**
1. Enable maintenance mode (optional)
2. Create database backup
3. Run migration script
4. Verify migration success
5. Deploy new service code
6. Update UI components
7. Run smoke tests
8. Monitor for errors
9. Disable maintenance mode

**P9.3 Post-Deployment Verification**
```sql
-- Verify total balances match
SELECT 
  'GG Coins Total' as metric,
  SUM(gg_coins) as value
FROM user_gamification
UNION ALL
SELECT 
  'Green Coins Total (deprecated)',
  SUM(balance)
FROM _deprecated_green_coin_wallets;

-- Verify transaction counts
SELECT 
  'GG Transactions' as metric,
  COUNT(*) as value
FROM gg_coin_transactions
UNION ALL
SELECT 
  'Green Transactions (deprecated)',
  COUNT(*)
FROM _deprecated_green_coin_transactions;

-- Check for orphaned records
SELECT COUNT(*) as orphaned_wallets
FROM _deprecated_green_coin_wallets gcw
WHERE NOT EXISTS (
  SELECT 1 FROM user_gamification ug WHERE ug.id = gcw.user_id
);
```

## Performance Optimization

### P10. Caching Strategy

**P10.1 Balance Caching**
- Cache TTL: 30 seconds
- Invalidate on transaction
- Use Map for in-memory storage
- Consider Redis for distributed systems

**P10.2 Query Optimization**
```sql
-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_gg_coin_transactions_user_time 
  ON gg_coin_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gg_coin_transactions_type 
  ON gg_coin_transactions(transaction_type);

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM gg_coin_transactions
WHERE user_id = 'test-user'
ORDER BY created_at DESC
LIMIT 50;
```

## Security Considerations

### P11. Security Measures

**P11.1 Row-Level Security**
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

**P11.2 Audit Trail**
All transactions logged with:
- User ID
- Transaction type
- Amount
- Balance before/after
- Timestamp
- Metadata (source, reason, etc.)

## Documentation Updates

### P12. Required Documentation

**P12.1 Developer Documentation**
- Migration guide
- API reference for ggCoin.service
- Integration examples
- Testing guide

**P12.2 User Documentation**
- Wiki updates (remove Green Coins references)
- FAQ about coin consolidation
- Transaction history guide

**P12.3 API Documentation**
- Deprecation notices for Green Coin endpoints
- New GG Coin endpoint documentation
- Migration timeline

## Success Criteria

### P13. Validation Metrics

**Technical Success:**
- Zero data loss during migration
- All tests passing (>90% coverage)
- No increase in error rates
- Response times within SLA

**User Success:**
- Clear UI showing GG Coins only
- Transaction history accessible
- Real-time balance updates working
- No user-reported balance discrepancies

**Business Success:**
- Simplified codebase
- Reduced maintenance overhead
- Improved developer velocity
- Better user engagement metrics
