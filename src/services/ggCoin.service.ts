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
   * Award GG Coins for a verified action
   * Combines reward calculation with coin crediting
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

    return await this.creditCoins(
      userId,
      amount,
      'earn',
      description,
      { actionType, impact, multipliers }
    );
  }

  /**
   * Format GG Coins for display
   * @param amount - Amount to format
   * @returns Formatted string with 3 decimal places
   */
  formatGGCoins(amount: number): string {
    return amount.toFixed(3);
  }

  /**
   * Calculate purchase reward based on badge price
   * @param badgePrice - Price of the badge
   * @returns Reward amount (10% of purchase price)
   */
  calculatePurchaseReward(badgePrice: number): number {
    const reward = badgePrice * 0.1; // 10% cashback
    return Math.round(reward * 1000) / 1000; // Round to 3 decimal places
  }

  /**
   * Get transaction history for a user with pagination and filtering
   * @param userId - User ID
   * @param limit - Number of transactions to fetch (default: 50)
   * @param offset - Offset for pagination (default: 0)
   * @param filters - Optional filters for type and date range
   * @returns Transaction history with pagination info
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    filters?: TransactionFilters
  ): Promise<TransactionHistory> {
    try {
      // Build query
      let query = supabase
        .from('gg_coin_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply type filter
      if (filters?.type) {
        // Map service type to database transaction_type patterns
        const typePattern = this.getTypePattern(filters.type);
        query = query.eq('transaction_type', typePattern);
      }

      // Apply date range filters
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      // Apply ordering and pagination
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[GGCoinService] Error fetching transaction history:', error);
        return { transactions: [], total: 0, hasMore: false };
      }

      const transactions: GGCoinTransaction[] = (data || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        type: this.mapTransactionType(t.transaction_type),
        amount: parseFloat(t.amount) || 0,
        balanceBefore: parseFloat(t.balance_before) || 0,
        balanceAfter: parseFloat(t.balance_after) || 0,
        referenceType: t.reference_type,
        referenceId: t.reference_id,
        description: t.description || '',
        metadata: t.metadata,
        timestamp: new Date(t.created_at),
      }));

      return {
        transactions,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('[GGCoinService] Exception fetching transaction history:', error);
      return { transactions: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get earning breakdown by action type
   * @param userId - User ID
   * @returns Object mapping action types to total earnings
   */
  async getEarningBreakdown(userId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('gg_coin_transactions')
        .select('metadata, amount')
        .eq('user_id', userId)
        .gt('amount', 0); // Only positive amounts (earnings)

      if (error) {
        console.error('[GGCoinService] Error fetching earning breakdown:', error);
        return {};
      }

      const breakdown: Record<string, number> = {};
      for (const transaction of data || []) {
        const actionType = transaction.metadata?.actionType || 'other';
        const amount = parseFloat(transaction.amount) || 0;
        breakdown[actionType] = (breakdown[actionType] || 0) + amount;
      }

      return breakdown;
    } catch (error) {
      console.error('[GGCoinService] Exception fetching earning breakdown:', error);
      return {};
    }
  }

  /**
   * Subscribe to balance changes for real-time updates
   * @param userId - User ID
   * @param callback - Callback function to receive balance updates
   * @returns Unsubscribe function
   */
  subscribeToBalance(userId: string, callback: (balance: number) => void): () => void {
    const channel = supabase
      .channel(`gg_coins_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_gamification',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          try {
            const newBalance = parseFloat(payload.new.gg_coins) || 0;

            // Update cache
            this.balanceCache.set(userId, {
              balance: newBalance,
              timestamp: Date.now(),
            });

            callback(newBalance);
          } catch (error) {
            console.error('[GGCoinService] Error processing balance update:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[GGCoinService] Subscribed to balance updates for user: ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[GGCoinService] Channel error for user: ${userId}`);
        } else if (status === 'TIMED_OUT') {
          console.error(`[GGCoinService] Subscription timed out for user: ${userId}`);
        } else if (status === 'CLOSED') {
          console.log(`[GGCoinService] Subscription closed for user: ${userId}`);
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
        console.log(`[GGCoinService] Unsubscribed from balance updates for user: ${userId}`);
      } catch (error) {
        console.error('[GGCoinService] Error unsubscribing from balance updates:', error);
      }
    };
  }

  /**
   * Clear balance cache for a user or all users
   * @param userId - Optional user ID to clear specific cache
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.balanceCache.delete(userId);
    } else {
      this.balanceCache.clear();
    }
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
