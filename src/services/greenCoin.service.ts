import { supabase } from './supabase';

/**
 * @deprecated This service has been consolidated into ggCoin.service.ts as part of Migration 032.
 * 
 * Green Coin Service
 * Handles Green Coin wallet management, transactions, and reward calculations
 * for the V1.0 Major Release
 * 
 * DEPRECATION NOTICE:
 * - This service is deprecated as of Migration 032 (Coin System Harmonization)
 * - All Green Coin functionality has been migrated to GG Coins
 * - Use ggCoinService instead: import { ggCoinService } from './ggCoin.service'
 * - This file will be removed in a future release
 * - Migration date: 2025-11-30
 * - Removal planned: 2026-01-31
 * 
 * Migration Guide:
 * - greenCoinService.getWallet() -> ggCoinService.getWallet()
 * - greenCoinService.getBalance() -> ggCoinService.getBalance()
 * - greenCoinService.recordTransaction() -> ggCoinService.creditCoins() or debitCoins()
 * - greenCoinService.awardCoins() -> ggCoinService.awardCoins()
 * - greenCoinService.spendCoins() -> ggCoinService.debitCoins()
 * - greenCoinService.getTransactionHistory() -> ggCoinService.getTransactionHistory()
 * - greenCoinService.getEarningBreakdown() -> ggCoinService.getEarningBreakdown()
 * - greenCoinService.subscribeToBalance() -> ggCoinService.subscribeToBalance()
 * 
 * Note: This is different from GG Coins (decimal-based). Green Coins are integer-based
 * and used for the Platform Vision 2025 reward economy.
 */

export interface GreenCoinWallet {
  userId: string;
  balance: number;
  lifetimeEarnings: number;
  lifetimeSpending: number;
  lastUpdated: Date;
}

export interface GreenCoinTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus' | 'referral';
  amount: number;
  source: string;
  description: string;
  timestamp: Date;
}

export interface RewardRule {
  actionType: string;
  baseReward: number;
  multipliers?: {
    condition: string;
    factor: number;
  }[];
}

export interface TransactionHistory {
  transactions: GreenCoinTransaction[];
  total: number;
  hasMore: boolean;
}

class GreenCoinService {
  private balanceCache: Map<string, { balance: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private deprecationWarningShown = false;

  // Reward rules for different action types
  private rewardRules: Map<string, RewardRule> = new Map([
    ['tree_planting', { actionType: 'tree_planting', baseReward: 50 }],
    ['waste_cleanup', { actionType: 'waste_cleanup', baseReward: 30 }],
    ['learning_module', { actionType: 'learning_module', baseReward: 20 }],
    ['mission_completion', { actionType: 'mission_completion', baseReward: 100 }],
    ['community_post', { actionType: 'community_post', baseReward: 5 }],
    ['petition_signature', { actionType: 'petition_signature', baseReward: 10 }],
    ['referral', { actionType: 'referral', baseReward: 50 }],
    ['daily_login', { actionType: 'daily_login', baseReward: 5 }],
  ]);

  /**
   * Show deprecation warning (once per session)
   */
  private showDeprecationWarning(methodName: string): void {
    if (!this.deprecationWarningShown) {
      console.warn(
        `%c[DEPRECATION WARNING] greenCoinService.${methodName}() is deprecated`,
        'color: orange; font-weight: bold;',
        '\n\nThis service has been consolidated into ggCoinService as part of Migration 032.',
        '\n\nPlease update your code:',
        '\n  import { ggCoinService } from "./ggCoin.service";',
        '\n  greenCoinService.${methodName}() -> ggCoinService.${methodName}()',
        '\n\nThis service will be removed in a future release (planned: 2026-01-31).',
        '\n\nSee migration guide: supabase/migrations/DEPLOYMENT_GUIDE_032.md'
      );
      this.deprecationWarningShown = true;
    }
  }

  /**
   * Get or create a user's Green Coin wallet
   * @deprecated Use ggCoinService.getWallet() instead
   */
  async getWallet(userId: string): Promise<GreenCoinWallet | null> {
    this.showDeprecationWarning('getWallet');
    try {
      const { data, error } = await supabase
        .from('green_coin_wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[GreenCoinService] Error fetching wallet:', error);
        return null;
      }

      if (!data) {
        // Create wallet if it doesn't exist
        return await this.createWallet(userId);
      }

      return {
        userId: data.user_id,
        balance: data.balance,
        lifetimeEarnings: data.lifetime_earnings,
        lifetimeSpending: data.lifetime_spending,
        lastUpdated: new Date(data.last_updated),
      };
    } catch (error) {
      console.error('[GreenCoinService] Exception fetching wallet:', error);
      return null;
    }
  }

  /**
   * Create a new wallet for a user
   */
  private async createWallet(userId: string): Promise<GreenCoinWallet | null> {
    try {
      const { data, error } = await supabase
        .from('green_coin_wallets')
        .insert({
          user_id: userId,
          balance: 0,
          lifetime_earnings: 0,
          lifetime_spending: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('[GreenCoinService] Error creating wallet:', error);
        return null;
      }

      return {
        userId: data.user_id,
        balance: data.balance,
        lifetimeEarnings: data.lifetime_earnings,
        lifetimeSpending: data.lifetime_spending,
        lastUpdated: new Date(data.last_updated),
      };
    } catch (error) {
      console.error('[GreenCoinService] Exception creating wallet:', error);
      return null;
    }
  }

  /**
   * Get user's balance (with caching)
   * @deprecated Use ggCoinService.getBalance() instead
   */
  async getBalance(userId: string): Promise<number> {
    this.showDeprecationWarning('getBalance');
    // Check cache first
    const cached = this.balanceCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.balance;
    }

    const wallet = await this.getWallet(userId);
    if (!wallet) return 0;

    // Update cache
    this.balanceCache.set(userId, {
      balance: wallet.balance,
      timestamp: Date.now(),
    });

    return wallet.balance;
  }

  /**
   * Record a Green Coin transaction
   */
  async recordTransaction(
    userId: string,
    type: 'earn' | 'spend' | 'bonus' | 'referral',
    amount: number,
    source: string,
    description: string
  ): Promise<GreenCoinTransaction | null> {
    try {
      // Start a transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('green_coin_transactions')
        .insert({
          user_id: userId,
          transaction_type: type,
          amount,
          source,
          description,
        })
        .select()
        .single();

      if (transactionError) {
        console.error('[GreenCoinService] Error recording transaction:', transactionError);
        return null;
      }

      // Update wallet balance
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        console.error('[GreenCoinService] Wallet not found for user:', userId);
        return null;
      }

      const newBalance = type === 'spend' ? wallet.balance - amount : wallet.balance + amount;
      const newLifetimeEarnings = type !== 'spend' ? wallet.lifetimeEarnings + amount : wallet.lifetimeEarnings;
      const newLifetimeSpending = type === 'spend' ? wallet.lifetimeSpending + amount : wallet.lifetimeSpending;

      const { error: updateError } = await supabase
        .from('green_coin_wallets')
        .update({
          balance: newBalance,
          lifetime_earnings: newLifetimeEarnings,
          lifetime_spending: newLifetimeSpending,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('[GreenCoinService] Error updating wallet:', updateError);
        return null;
      }

      // Clear cache
      this.balanceCache.delete(userId);

      return {
        id: transactionData.id,
        userId: transactionData.user_id,
        type: transactionData.transaction_type as 'earn' | 'spend' | 'bonus' | 'referral',
        amount: transactionData.amount,
        source: transactionData.source,
        description: transactionData.description,
        timestamp: new Date(transactionData.timestamp),
      };
    } catch (error) {
      console.error('[GreenCoinService] Exception recording transaction:', error);
      return null;
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TransactionHistory> {
    try {
      const { data, error, count } = await supabase
        .from('green_coin_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[GreenCoinService] Error fetching transaction history:', error);
        return { transactions: [], total: 0, hasMore: false };
      }

      const transactions: GreenCoinTransaction[] = (data || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        type: t.transaction_type as 'earn' | 'spend' | 'bonus' | 'referral',
        amount: t.amount,
        source: t.source,
        description: t.description,
        timestamp: new Date(t.timestamp),
      }));

      return {
        transactions,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('[GreenCoinService] Exception fetching transaction history:', error);
      return { transactions: [], total: 0, hasMore: false };
    }
  }

  /**
   * Calculate reward for an action based on rules and multipliers
   */
  calculateReward(
    actionType: string,
    impact?: number,
    multipliers?: { condition: string; factor: number }[]
  ): number {
    const rule = this.rewardRules.get(actionType);
    if (!rule) {
      console.warn('[GreenCoinService] No reward rule found for action type:', actionType);
      return 0;
    }

    let reward = rule.baseReward;

    // Apply impact-based scaling if provided
    if (impact !== undefined && impact > 0) {
      reward = Math.floor(reward * impact);
    }

    // Apply multipliers
    if (multipliers && multipliers.length > 0) {
      for (const multiplier of multipliers) {
        reward = Math.floor(reward * multiplier.factor);
      }
    }

    return reward;
  }

  /**
   * Award Green Coins for a verified action
   * @deprecated Use ggCoinService.awardCoins() instead
   */
  async awardCoins(
    userId: string,
    actionType: string,
    impact?: number,
    multipliers?: { condition: string; factor: number }[],
    description?: string
  ): Promise<GreenCoinTransaction | null> {
    this.showDeprecationWarning('awardCoins');
    const amount = this.calculateReward(actionType, impact, multipliers);
    
    if (amount <= 0) {
      console.warn('[GreenCoinService] Calculated reward is 0 or negative:', amount);
      return null;
    }

    return await this.recordTransaction(
      userId,
      'earn',
      amount,
      actionType,
      description || `Earned ${amount} Green Coins for ${actionType}`
    );
  }

  /**
   * Spend Green Coins
   */
  async spendCoins(
    userId: string,
    amount: number,
    source: string,
    description: string
  ): Promise<GreenCoinTransaction | null> {
    // Check if user has sufficient balance
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      console.error('[GreenCoinService] Insufficient balance:', { balance, amount });
      return null;
    }

    return await this.recordTransaction(userId, 'spend', amount, source, description);
  }

  /**
   * Award referral bonus
   */
  async awardReferralBonus(
    referrerId: string,
    referredUserId: string
  ): Promise<GreenCoinTransaction | null> {
    const rule = this.rewardRules.get('referral');
    if (!rule) return null;

    return await this.recordTransaction(
      referrerId,
      'referral',
      rule.baseReward,
      'referral',
      `Referral bonus for inviting user ${referredUserId}`
    );
  }

  /**
   * Get earning breakdown by source
   */
  async getEarningBreakdown(userId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('green_coin_transactions')
        .select('source, amount')
        .eq('user_id', userId)
        .in('transaction_type', ['earn', 'bonus', 'referral']);

      if (error) {
        console.error('[GreenCoinService] Error fetching earning breakdown:', error);
        return {};
      }

      const breakdown: Record<string, number> = {};
      for (const transaction of data || []) {
        breakdown[transaction.source] = (breakdown[transaction.source] || 0) + transaction.amount;
      }

      return breakdown;
    } catch (error) {
      console.error('[GreenCoinService] Exception fetching earning breakdown:', error);
      return {};
    }
  }

  /**
   * Subscribe to balance changes for real-time updates
   */
  subscribeToBalance(userId: string, callback: (balance: number) => void) {
    const channel = supabase
      .channel(`green_coins_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'green_coin_wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newBalance = payload.new.balance || 0;
          
          // Update cache
          this.balanceCache.set(userId, {
            balance: newBalance,
            timestamp: Date.now(),
          });
          
          callback(newBalance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Clear balance cache
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.balanceCache.delete(userId);
    } else {
      this.balanceCache.clear();
    }
  }
}

// Export singleton instance
export const greenCoinService = new GreenCoinService();
