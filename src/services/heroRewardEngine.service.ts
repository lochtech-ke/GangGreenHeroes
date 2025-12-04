import { supabase } from './supabase';
import { ggCoinService } from './ggCoin.service';
import { gangGreenHeroBadgeService } from './gangGreenHeroBadge.service';
import type {
  DailyRewardConfig,
  RewardDistributionResult,
  UserRewardCalculation,
  HeroDailyReward,
  HeroDailyRewardRow,
  DistributeRewardsParams,
  RewardHistoryParams,
  RewardHistoryResult,
  RewardAnalytics,
  FailedRewardDistribution,
  RewardDistributionStatus,
  HeroRewardOperationResult,
  RewardRetryConfig,
} from '../types/heroReward.types';
import {
  DEFAULT_DAILY_REWARD_CONFIG,
  DEFAULT_RETRY_CONFIG,
} from '../types/heroReward.types';

/**
 * Hero Reward Engine Service
 * Handles automated daily reward distribution to Hero badge holders
 */
class HeroRewardEngineService {
  private isDistributionRunning = false;
  private lastDistributionResult: RewardDistributionResult | null = null;
  private failedDistributions: FailedRewardDistribution[] = [];
  private rewardConfig: DailyRewardConfig = DEFAULT_DAILY_REWARD_CONFIG;
  private retryConfig: RewardRetryConfig = DEFAULT_RETRY_CONFIG;

  /**
   * Distribute daily rewards to all active Hero badge holders
   * Main function called by cron job or manual trigger
   */
  async distributeDailyRewards(params: DistributeRewardsParams = {}): Promise<RewardDistributionResult> {
    const startTime = Date.now();
    const targetDate = params.targetDate || new Date().toISOString().split('T')[0];
    const isDryRun = params.dryRun || false;

    try {
      console.log(`[HeroRewardEngineService] Starting daily reward distribution for ${targetDate} (dry run: ${isDryRun})`);

      if (this.isDistributionRunning && !isDryRun) {
        console.warn('[HeroRewardEngineService] Distribution already running, skipping');
        return {
          success: false,
          totalHolders: 0,
          successfulDistributions: 0,
          failedDistributions: 0,
          totalAmountDistributed: 0,
          errors: ['Distribution already in progress'],
          distributionDate: targetDate,
          processingTimeMs: Date.now() - startTime,
        };
      }

      if (!isDryRun) {
        this.isDistributionRunning = true;
      }

      // Get Hero badge configuration for reward amount
      const heroBadgeConfig = await gangGreenHeroBadgeService.getHeroBadgeConfig();
      if (!heroBadgeConfig) {
        throw new Error('Hero badge configuration not found');
      }

      // Update reward config with current settings
      this.rewardConfig.baseAmount = heroBadgeConfig.dailyGGCoinReward;

      // Get all active Hero badge holders
      const holdersResult = await gangGreenHeroBadgeService.getHeroHolders(1000, 0, 'active');
      if (!holdersResult.success || !holdersResult.holders) {
        throw new Error('Failed to fetch Hero badge holders');
      }

      const holders = holdersResult.holders;
      console.log(`[HeroRewardEngineService] Found ${holders.length} active Hero badge holders`);

      // Filter holders if specific userIds provided
      const targetHolders = params.userIds 
        ? holders.filter(h => params.userIds!.includes(h.userId))
        : holders;

      if (targetHolders.length === 0) {
        console.log('[HeroRewardEngineService] No eligible holders found');
        return {
          success: true,
          totalHolders: holders.length,
          successfulDistributions: 0,
          failedDistributions: 0,
          totalAmountDistributed: 0,
          errors: [],
          distributionDate: targetDate,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Check for existing rewards for this date
      const existingRewards = await this.getExistingRewards(targetDate, targetHolders.map(h => h.userId));
      const holdersWithoutRewards = targetHolders.filter(h => !existingRewards.includes(h.userId));

      console.log(`[HeroRewardEngineService] ${holdersWithoutRewards.length} holders need rewards for ${targetDate}`);

      let successfulDistributions = 0;
      let failedDistributions = 0;
      let totalAmountDistributed = 0;
      const errors: string[] = [];

      // Process rewards in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < holdersWithoutRewards.length; i += batchSize) {
        const batch = holdersWithoutRewards.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (holder) => {
          try {
            // Calculate reward for this user
            const rewardCalculation = await this.calculateUserReward(holder.userId, targetDate);
            
            if (!isDryRun) {
              // Distribute the reward
              const distributionResult = await this.distributeRewardToUser(
                holder.userId,
                rewardCalculation,
                targetDate
              );
              
              if (distributionResult.success) {
                successfulDistributions++;
                totalAmountDistributed += rewardCalculation.totalAmount;
              } else {
                failedDistributions++;
                errors.push(`Failed to distribute to ${holder.userId}: ${distributionResult.error}`);
                
                // Track failed distribution for retry
                this.trackFailedDistribution({
                  userId: holder.userId,
                  rewardDate: targetDate,
                  calculatedAmount: rewardCalculation.totalAmount,
                  errorType: 'system_error',
                  errorMessage: distributionResult.error || 'Unknown error',
                  attemptCount: 1,
                  lastAttempt: new Date().toISOString(),
                });
              }
            } else {
              // Dry run - just count and accumulate
              successfulDistributions++;
              totalAmountDistributed += rewardCalculation.totalAmount;
            }
          } catch (error) {
            failedDistributions++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Error processing ${holder.userId}: ${errorMessage}`);
            console.error(`[HeroRewardEngineService] Error processing reward for ${holder.userId}:`, error);
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches to prevent overwhelming the system
        if (i + batchSize < holdersWithoutRewards.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const result: RewardDistributionResult = {
        success: true,
        totalHolders: holders.length,
        successfulDistributions,
        failedDistributions,
        totalAmountDistributed,
        errors,
        distributionDate: targetDate,
        processingTimeMs: Date.now() - startTime,
      };

      if (!isDryRun) {
        this.lastDistributionResult = result;
      }

      console.log(`[HeroRewardEngineService] Distribution completed: ${successfulDistributions} successful, ${failedDistributions} failed`);

      return result;
    } catch (error) {
      console.error('[HeroRewardEngineService] Distribution exception:', error);
      
      const result: RewardDistributionResult = {
        success: false,
        totalHolders: 0,
        successfulDistributions: 0,
        failedDistributions: 0,
        totalAmountDistributed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        distributionDate: targetDate,
        processingTimeMs: Date.now() - startTime,
      };

      if (!isDryRun) {
        this.lastDistributionResult = result;
      }

      return result;
    } finally {
      if (!isDryRun) {
        this.isDistributionRunning = false;
      }
    }
  }

  /**
   * Calculate reward amount for a specific user
   * Considers consecutive days and activity level
   */
  async calculateUserReward(userId: string, targetDate: string): Promise<UserRewardCalculation> {
    try {
      console.log(`[HeroRewardEngineService] Calculating reward for user ${userId} on ${targetDate}`);

      // Get user's Hero badge holder record
      const heroStatus = await gangGreenHeroBadgeService.getHeroStatus(userId);
      if (!heroStatus.isHero || !heroStatus.holder) {
        throw new Error('User is not a Hero badge holder');
      }

      const holder = heroStatus.holder;
      
      // Calculate consecutive days
      const consecutiveDays = await this.calculateConsecutiveDays(userId, targetDate);
      
      // Get activity multiplier
      const activityMultiplier = await this.calculateActivityMultiplier(userId);
      
      // Calculate base amount
      const baseAmount = this.rewardConfig.baseAmount;
      
      // Calculate consecutive days bonus
      const consecutiveDayMultiplier = this.getConsecutiveDayMultiplier(consecutiveDays);
      
      // Calculate bonus amount
      const bonusAmount = baseAmount * (consecutiveDayMultiplier - 1) + 
                         baseAmount * (activityMultiplier - 1);
      
      // Calculate total amount
      let totalAmount = baseAmount + bonusAmount;
      
      // Apply maximum daily reward limit
      if (totalAmount > this.rewardConfig.maxDailyReward) {
        totalAmount = this.rewardConfig.maxDailyReward;
      }

      const calculation: UserRewardCalculation = {
        userId,
        baseAmount,
        bonusAmount: totalAmount - baseAmount,
        totalAmount,
        consecutiveDays,
        activityMultiplier,
        lastRewardDate: holder.lastRewardDate,
      };

      console.log(`[HeroRewardEngineService] Calculated reward for ${userId}: ${totalAmount} GG Coins`);

      return calculation;
    } catch (error) {
      console.error(`[HeroRewardEngineService] Error calculating reward for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Distribute reward to a specific user
   * Creates GG coin transaction and updates Hero badge holder record
   */
  private async distributeRewardToUser(
    userId: string,
    calculation: UserRewardCalculation,
    targetDate: string
  ): Promise<HeroRewardOperationResult> {
    try {
      console.log(`[HeroRewardEngineService] Distributing ${calculation.totalAmount} GG Coins to ${userId}`);

      // Credit GG Coins
      const creditResult = await ggCoinService.creditCoins({
        userId,
        amount: calculation.totalAmount,
        transactionType: 'hero_daily_reward',
        referenceType: 'hero_reward',
        referenceId: `hero_daily_${targetDate}_${userId}`,
        description: `Daily Hero badge reward for ${targetDate} (${calculation.consecutiveDays} consecutive days)`,
        metadata: {
          rewardDate: targetDate,
          baseAmount: calculation.baseAmount,
          bonusAmount: calculation.bonusAmount,
          consecutiveDays: calculation.consecutiveDays,
          activityMultiplier: calculation.activityMultiplier,
        },
      });

      if (!creditResult || !creditResult.success) {
        throw new Error(creditResult?.error || 'Failed to credit GG Coins');
      }

      // Record daily reward
      const { data: rewardRecord, error: rewardError } = await supabase
        .from('hero_daily_rewards')
        .insert({
          user_id: userId,
          reward_date: targetDate,
          base_amount: calculation.baseAmount,
          bonus_amount: calculation.bonusAmount,
          total_amount: calculation.totalAmount,
          consecutive_days: calculation.consecutiveDays,
          activity_multiplier: calculation.activityMultiplier,
          gg_coin_transaction_id: creditResult?.transaction_id,
        })
        .select()
        .single();

      if (rewardError) {
        console.error('[HeroRewardEngineService] Error recording daily reward:', rewardError);
        throw new Error(rewardError.message);
      }

      // Update Hero badge holder record
      // First get current total
      const { data: holderData } = await supabase
        .from('hero_badge_holders')
        .select('total_rewards_earned')
        .eq('user_id', userId)
        .single();

      const currentTotal = holderData?.total_rewards_earned || 0;
      const newTotal = currentTotal + calculation.totalAmount;

      const { error: updateError } = await supabase
        .from('hero_badge_holders')
        .update({
          last_reward_date: targetDate,
          total_rewards_earned: newTotal,
          consecutive_reward_days: calculation.consecutiveDays,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('[HeroRewardEngineService] Error updating holder record:', updateError);
        // Don't throw here as the reward was already distributed
      }

      console.log(`[HeroRewardEngineService] Successfully distributed reward to ${userId}`);

      return {
        success: true,
        data: this.transformRewardRow(rewardRecord),
      };
    } catch (error) {
      console.error(`[HeroRewardEngineService] Error distributing reward to ${userId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to distribute reward',
      };
    }
  }

  /**
   * Get reward history for a user
   * Returns paginated list of daily rewards and associated transactions
   */
  async getRewardHistory(params: RewardHistoryParams): Promise<RewardHistoryResult> {
    try {
      console.log(`[HeroRewardEngineService] Fetching reward history for user ${params.userId}`);

      let query = supabase
        .from('hero_daily_rewards')
        .select('*')
        .eq('user_id', params.userId)
        .order('reward_date', { ascending: false });

      if (params.startDate) {
        query = query.gte('reward_date', params.startDate);
      }

      if (params.endDate) {
        query = query.lte('reward_date', params.endDate);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
      }

      const { data: rewards, error } = await query;

      if (error) {
        console.error('[HeroRewardEngineService] Error fetching reward history:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      const transformedRewards = rewards?.map(row => this.transformRewardRow(row)) || [];
      const totalAmount = transformedRewards.reduce((sum, reward) => sum + reward.totalAmount, 0);

      // Get associated GG coin transactions
      const transactionIds = rewards?.map(r => r.gg_coin_transaction_id).filter(Boolean) || [];
      let transactions: any[] = [];

      if (transactionIds.length > 0) {
        const { data: transactionData } = await supabase
          .from('gg_coin_transactions')
          .select('*')
          .in('id', transactionIds)
          .order('created_at', { ascending: false });

        transactions = transactionData || [];
      }

      return {
        success: true,
        rewards: transformedRewards,
        transactions,
        total: rewards?.length || 0,
        totalAmount,
      };
    } catch (error) {
      console.error('[HeroRewardEngineService] Exception fetching reward history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reward history',
      };
    }
  }

  /**
   * Get reward analytics for a date range
   * Returns aggregated statistics about reward distributions
   */
  async getRewardAnalytics(startDate: string, endDate: string): Promise<RewardAnalytics> {
    try {
      console.log(`[HeroRewardEngineService] Fetching reward analytics from ${startDate} to ${endDate}`);

      const { data: rewards, error } = await supabase
        .from('hero_daily_rewards')
        .select('*')
        .gte('reward_date', startDate)
        .lte('reward_date', endDate);

      if (error) {
        throw new Error(error.message);
      }

      const totalRewardsDistributed = rewards?.length || 0;
      const totalAmountDistributed = rewards?.reduce((sum, r) => sum + r.total_amount, 0) || 0;
      const averageRewardAmount = totalRewardsDistributed > 0 ? totalAmountDistributed / totalRewardsDistributed : 0;
      const uniqueRecipients = new Set(rewards?.map(r => r.user_id) || []).size;
      const distributionDays = new Set(rewards?.map(r => r.reward_date) || []).size;
      const consecutiveDaysBonuses = rewards?.filter(r => r.consecutive_days > 1).length || 0;
      const activityBonuses = rewards?.filter(r => r.activity_multiplier > 1.0).length || 0;

      return {
        totalRewardsDistributed,
        totalAmountDistributed,
        averageRewardAmount,
        uniqueRecipients,
        distributionDays,
        consecutiveDaysBonuses,
        activityBonuses,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      console.error('[HeroRewardEngineService] Exception fetching analytics:', error);
      throw error;
    }
  }

  /**
   * Retry failed reward distributions
   * Attempts to redistribute rewards that previously failed
   */
  async retryFailedDistributions(): Promise<RewardDistributionResult> {
    try {
      console.log(`[HeroRewardEngineService] Retrying ${this.failedDistributions.length} failed distributions`);

      if (this.failedDistributions.length === 0) {
        return {
          success: true,
          totalHolders: 0,
          successfulDistributions: 0,
          failedDistributions: 0,
          totalAmountDistributed: 0,
          errors: [],
          distributionDate: new Date().toISOString().split('T')[0],
          processingTimeMs: 0,
        };
      }

      const startTime = Date.now();
      let successfulRetries = 0;
      let failedRetries = 0;
      let totalAmountDistributed = 0;
      const errors: string[] = [];

      // Process failed distributions
      for (const failedDistribution of [...this.failedDistributions]) {
        try {
          // Check if max retries exceeded
          if (failedDistribution.attemptCount >= this.retryConfig.maxRetries) {
            console.log(`[HeroRewardEngineService] Max retries exceeded for ${failedDistribution.userId}`);
            continue;
          }

          // Calculate reward again (in case config changed)
          const rewardCalculation = await this.calculateUserReward(
            failedDistribution.userId,
            failedDistribution.rewardDate
          );

          // Attempt distribution
          const distributionResult = await this.distributeRewardToUser(
            failedDistribution.userId,
            rewardCalculation,
            failedDistribution.rewardDate
          );

          if (distributionResult.success) {
            successfulRetries++;
            totalAmountDistributed += rewardCalculation.totalAmount;
            
            // Remove from failed distributions
            this.failedDistributions = this.failedDistributions.filter(
              fd => fd.userId !== failedDistribution.userId || fd.rewardDate !== failedDistribution.rewardDate
            );
          } else {
            failedRetries++;
            errors.push(`Retry failed for ${failedDistribution.userId}: ${distributionResult.error}`);
            
            // Update failed distribution record
            failedDistribution.attemptCount++;
            failedDistribution.lastAttempt = new Date().toISOString();
            failedDistribution.errorMessage = distributionResult.error || 'Unknown error';
          }
        } catch (error) {
          failedRetries++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Retry error for ${failedDistribution.userId}: ${errorMessage}`);
          console.error(`[HeroRewardEngineService] Retry error for ${failedDistribution.userId}:`, error);
        }
      }

      console.log(`[HeroRewardEngineService] Retry completed: ${successfulRetries} successful, ${failedRetries} failed`);

      return {
        success: true,
        totalHolders: this.failedDistributions.length,
        successfulDistributions: successfulRetries,
        failedDistributions: failedRetries,
        totalAmountDistributed,
        errors,
        distributionDate: new Date().toISOString().split('T')[0],
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[HeroRewardEngineService] Exception retrying failed distributions:', error);
      throw error;
    }
  }

  /**
   * Get current reward distribution status
   * Returns information about ongoing and recent distributions
   */
  getDistributionStatus(): RewardDistributionStatus {
    return {
      isRunning: this.isDistributionRunning,
      lastResult: this.lastDistributionResult || undefined,
      failedDistributions: [...this.failedDistributions],
    };
  }

  /**
   * Update reward configuration
   * Admin function to modify reward parameters
   */
  updateRewardConfig(config: Partial<DailyRewardConfig>): void {
    this.rewardConfig = { ...this.rewardConfig, ...config };
    console.log('[HeroRewardEngineService] Reward configuration updated:', this.rewardConfig);
  }

  /**
   * Calculate consecutive reward days for a user
   */
  private async calculateConsecutiveDays(userId: string, targetDate: string): Promise<number> {
    try {
      const targetDateObj = new Date(targetDate);
      let consecutiveDays = 1;
      const checkDate = new Date(targetDateObj);
      checkDate.setDate(checkDate.getDate() - 1);

      // Look back to find consecutive days
      for (let i = 0; i < this.rewardConfig.maxConsecutiveDays; i++) {
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('hero_daily_rewards')
          .select('id')
          .eq('user_id', userId)
          .eq('reward_date', checkDateStr)
          .single();

        if (error || !data) {
          break;
        }

        consecutiveDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      return Math.min(consecutiveDays, this.rewardConfig.maxConsecutiveDays);
    } catch (error) {
      console.error(`[HeroRewardEngineService] Error calculating consecutive days for ${userId}:`, error);
      return 1;
    }
  }

  /**
   * Calculate activity multiplier for a user
   * Based on recent platform engagement
   */
  private async calculateActivityMultiplier(userId: string): Promise<number> {
    try {
      // This is a simplified implementation
      // In a real system, you'd analyze user activity across various platform features
      
      // For now, return base multiplier with some randomization for testing
      const baseMultiplier = 1.0;
      const maxBonus = this.rewardConfig.bonusMultipliers.activityLevel - 1.0;
      
      // TODO: Implement actual activity analysis
      // - Initiative participation
      // - Social engagement
      // - Platform usage frequency
      // - Recent actions
      
      return baseMultiplier + (Math.random() * maxBonus);
    } catch (error) {
      console.error(`[HeroRewardEngineService] Error calculating activity multiplier for ${userId}:`, error);
      return 1.0;
    }
  }

  /**
   * Get consecutive day multiplier based on streak length
   */
  private getConsecutiveDayMultiplier(consecutiveDays: number): number {
    const multipliers = this.rewardConfig.bonusMultipliers.consecutiveDays;
    const index = Math.min(consecutiveDays - 1, multipliers.length - 1);
    return multipliers[index] || 1.0;
  }

  /**
   * Get existing rewards for a date and user list
   */
  private async getExistingRewards(targetDate: string, userIds: string[]): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('hero_daily_rewards')
        .select('user_id')
        .eq('reward_date', targetDate)
        .in('user_id', userIds);

      if (error) {
        console.error('[HeroRewardEngineService] Error checking existing rewards:', error);
        return [];
      }

      return data?.map(r => r.user_id) || [];
    } catch (error) {
      console.error('[HeroRewardEngineService] Exception checking existing rewards:', error);
      return [];
    }
  }

  /**
   * Track a failed reward distribution for retry
   */
  private trackFailedDistribution(failedDistribution: FailedRewardDistribution): void {
    // Remove any existing record for the same user/date
    this.failedDistributions = this.failedDistributions.filter(
      fd => fd.userId !== failedDistribution.userId || fd.rewardDate !== failedDistribution.rewardDate
    );

    // Add the new failed distribution
    this.failedDistributions.push(failedDistribution);

    // Limit the number of tracked failures to prevent memory issues
    if (this.failedDistributions.length > 1000) {
      this.failedDistributions = this.failedDistributions.slice(-1000);
    }
  }

  /**
   * Transform database row to typed reward object
   */
  private transformRewardRow(row: HeroDailyRewardRow): HeroDailyReward {
    return {
      id: row.id,
      userId: row.user_id,
      rewardDate: row.reward_date,
      baseAmount: row.base_amount,
      bonusAmount: row.bonus_amount,
      totalAmount: row.total_amount,
      consecutiveDays: row.consecutive_days,
      activityMultiplier: row.activity_multiplier,
      ggCoinTransactionId: row.gg_coin_transaction_id,
      createdAt: row.created_at,
    };
  }
}

// Export singleton instance
export const heroRewardEngineService = new HeroRewardEngineService();