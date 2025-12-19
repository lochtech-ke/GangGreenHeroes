import { supabase } from './supabase';

/**
 * GG Coin Service
 * Unified service for managing GG Coins (decimal-based reward currency)
 * 
 * This service consolidates the functionality from the deprecated Green Coin service
 * and provides a single source of truth for all coin operations.
 * 
 * Features:
 * - Wallet operations (getWallet, getBalance)
 * - Transaction operations (creditCoins, debitCoins)
 * - Reward calculations with multipliers
 * - Transaction history with pagination
 * - Real-time balance subscriptions
 * - Balance caching with 30-second TTL
 * 
 * Note: All amounts support decimal precision up to 3 places (e.g., 0.001, 10.500)
 */

export interface GGCoinWallet {
  userId: string;
  balance: number; // DECIMAL(10,3) as number
  totalPoints: number;
  level: number;
  lastUpdated: Date;
}

export interface GGCoinTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus' | 'referral';
  amount: number; // DECIMAL(10,3) as number
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  success?: boolean;
  error?: string;
  transaction_id?: string;
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

export interface TransactionFilters {
  type?: 'earn' | 'spend' | 'bonus' | 'referral';
  startDate?: Date;
  endDate?: Date;
}

/**
 * Centralized reward rules configuration
 * Defines base rewards and multipliers for all action types
 */
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

class GGCoinService {
  private balanceCache = new Map<string, { balance: number; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Get user's GG Coin wallet information
   * @param userId - User ID
   * @returns Wallet information or null if not found
   */
  async getWallet(userId: string): Promise<GGCoinWallet | null> {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('id, gg_coins, total_points, level, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[GGCoinService] Error fetching wallet:', error);
        return null;
      }

      if (!data) {
        console.warn('[GGCoinService] Wallet not found for user:', userId);
        return null;
      }

      return {
        userId: data.id,
        balance: parseFloat(data.gg_coins) || 0,
        totalPoints: data.total_points || 0,
        level: data.level || 1,
        lastUpdated: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('[GGCoinService] Exception fetching wallet:', error);
      return null;
    }
  }

  /**
   * Get user's GG Coin balance (with caching)
   * @param userId - User ID
   * @returns Current balance
   */
  async getBalance(userId: string): Promise<number> {
    // Check cache first
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

    if (error || !data) {
      console.error('[GGCoinService] Error fetching balance:', error);
      return 0;
    }

    const balance = parseFloat(data.gg_coins) || 0;

    // Update cache
    this.balanceCache.set(userId, { balance, timestamp: Date.now() });

    return balance;
  }

  /**
   * Credit GG Coins to a user's wallet
   * Uses database function for atomicity
   * @param userId - User ID
   * @param amount - Amount to credit (positive number with up to 3 decimal places)
   * @param type - Transaction type
   * @param description - Transaction description
   * @param metadata - Optional metadata
   * @returns Transaction details or null on failure
   */
  async creditCoins(
    userId: string,
    amount: number,
    type: string,
    description: string,
    metadata?: any
  ): Promise<GGCoinTransaction | null> {
    try {
      // Validate amount
      if (amount <= 0) {
        console.error('[GGCoinService] Invalid credit amount:', amount);
        return null;
      }

      // Round to 3 decimal places
      const roundedAmount = Math.round(amount * 1000) / 1000;

      // Use database function for atomicity
      const { data, error } = await supabase.rpc('credit_gg_coins', {
        p_user_id: userId,
        p_amount: roundedAmount,
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
        amount: roundedAmount,
        balanceBefore: data.balance_before,
        balanceAfter: data.balance_after,
        description,
        metadata,
        timestamp: new Date(),
        success: true,
        transaction_id: data.transaction_id,
      };
    } catch (error) {
      console.error('[GGCoinService] Exception crediting coins:', error);
      return null;
    }
  }

  /**
   * Debit GG Coins from a user's wallet
   * Uses database function for atomicity and balance validation
   * @param userId - User ID
   * @param amount - Amount to debit (positive number with up to 3 decimal places)
   * @param type - Transaction type
   * @param description - Transaction description
   * @param metadata - Optional metadata
   * @returns Transaction details or null on failure
   */
  async debitCoins(
    userId: string,
    amount: number,
    type: string,
    description: string,
    metadata?: any
  ): Promise<GGCoinTransaction | null> {
    try {
      // Validate amount
      if (amount <= 0) {
        console.error('[GGCoinService] Invalid debit amount:', amount);
        return null;
      }

      // Round to 3 decimal places
      const roundedAmount = Math.round(amount * 1000) / 1000;

      // Use database function for atomicity
      const { data, error } = await supabase.rpc('debit_gg_coins', {
        p_user_id: userId,
        p_amount: roundedAmount,
        p_transaction_type: type,
        p_description: description,
        p_metadata: metadata || null,
      });

      if (error || !data?.success) {
        console.error('[GGCoinService] Debit failed:', error || data?.error);
        return null;
      }

      // Clear cache
      this.balanceCache.delete(userId);

      // Return transaction details
      return {
        id: data.transaction_id,
        userId,
        type: type as any,
        amount: -roundedAmount, // Negative for debit
        balanceBefore: data.balance_before,
        balanceAfter: data.balance_after,
        description,
        metadata,
        timestamp: new Date(),
        success: true,
        transaction_id: data.transaction_id,
      };
    } catch (error) {
      console.error('[GGCoinService] Exception debiting coins:', error);
      return null;
    }
  }

  /**
   * Calculate reward for an action based on rules and multipliers
   * @param actionType - Type of action (e.g., 'tree_planting')
   * @param impact - Impact multiplier (e.g., number of trees planted)
   * @param multipliers - Additional multipliers to apply
   * @returns Calculated reward amount (rounded to 3 decimal places)
   */
  calculateReward(
    actionType: string,
    impact?: number,
    multipliers?: RewardMultiplier[]
  ): number {
    const rule = REWARD_RULES[actionType];
    if (!rule) {
      console.warn('[GGCoinService] No reward rule found for action type:', actionType);
      return 0;
    }

    let reward = rule.baseReward;

    // Apply impact scaling
    if (impact !== undefined) {
      // Return 0 for zero or negative impact
      if (impact <= 0) {
        return 0;
      }
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

  /**
   * Calculate level based on total points
   * Formula: Level = Floor(Total Points / 100) + 1
   * Example: 0-99 pts = Lvl 1, 100-199 pts = Lvl 2
   */
  private calculateLevel(totalPoints: number): number {
    return Math.floor(totalPoints / 100) + 1;
  }

  /**
   * Add experience points to user's gamification profile
   * Updates total_points and recalculates level
   * @param userId - User ID
   * @param points - Points to add
   */
  async addExperience(userId: string, points: number): Promise<void> {
    try {
      if (points <= 0) return;

      // Get current gamification state
      const { data: current, error: fetchError } = await supabase
        .from('user_gamification')
        .select('total_points, level')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[GGCoinService] Error fetching gamification state:', fetchError);
        return;
      }

      const currentPoints = current?.total_points || 0;
      const newTotalPoints = currentPoints + points;
      const newLevel = this.calculateLevel(newTotalPoints);
      
      // Calculate points needed for next level
      // Next level starts at (newLevel) * 100
      const nextLevelThreshold = newLevel * 100;
      const experienceToNextLevel = nextLevelThreshold - newTotalPoints;

      // Update user_gamification
      const { error: updateError } = await supabase
        .from('user_gamification')
        .upsert({
          id: userId,
          total_points: newTotalPoints,
          level: newLevel,
          experience_to_next_level: experienceToNextLevel,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('[GGCoinService] Error updating experience:', updateError);
      } else {
        // If level increased, we could emit an event or create a notification here
        if (current && newLevel > current.level) {
          console.log(`[GGCoinService] User ${userId} leveled up to ${newLevel}!`);
        }
      }
    } catch (error) {
      console.error('[GGCoinService] Exception adding experience:', error);
    }
  }

  /**
   * Award GG Coins for a verified action
   * Combines reward calculation with coin crediting and experience updates
   * @param userId - User ID
   * @param actionType - Type of action
   * @param impact - Impact multiplier
   * @param multipliers - Additional multipliers
   * @returns Transaction details or null on failure
   */
  async awardCoins(
    userId: string,
    actionType: string,
    impact?: number,
    multipliers?: RewardMultiplier[]
  ): Promise<GGCoinTransaction | null> {
    const amount = this.calculateReward(actionType, impact, multipliers);

    if (amount <= 0) {
      console.warn('[GGCoinService] Calculated reward is 0 or negative:', amount);
      return null;
    }

    const description = `Earned ${amount.toFixed(3)} GG Coins for ${actionType}`;

    const transaction = await this.creditCoins(
      userId,
      amount,
      'earn',
      description,
      { actionType, impact, multipliers }
    );

    if (transaction) {
      // Add experience points (1 Coin = 1 Point rule)
      // We use Math.floor to keep points as integers, or we could support decimal points
      // For now, let's just use the rounded amount as points
      await this.addExperience(userId, Math.round(amount));
    }

    return transaction;
  }

  /**
   * Map database transaction type to service transaction type
   * @param dbType - Database transaction type
   * @returns Service transaction type
   */
  private mapTransactionType(dbType: string): 'earn' | 'spend' | 'bonus' | 'referral' {
    // Map various database types to our simplified types
    if (dbType.includes('credit') || dbType.includes('reward')) {
      return 'earn';
    }
    if (dbType.includes('debit') || dbType.includes('purchase')) {
      return 'spend';
    }
    if (dbType.includes('referral')) {
      return 'referral';
    }
    if (dbType.includes('bonus')) {
      return 'bonus';
    }
    // Default to earn for positive amounts, spend for negative
    return 'earn';
  }

  /**
   * Map service transaction type to database transaction_type pattern
   * @param serviceType - Service transaction type
   * @returns Database transaction type
   */
  private getTypePattern(serviceType: 'earn' | 'spend' | 'bonus' | 'referral'): string {
    // Map service types to database transaction_type values
    switch (serviceType) {
      case 'earn':
        return 'earn';
      case 'spend':
        return 'spend';
      case 'bonus':
        return 'bonus';
      case 'referral':
        return 'referral';
      default:
        return 'earn';
    }
  }
}

// Export singleton instance
export const ggCoinService = new GGCoinService();
