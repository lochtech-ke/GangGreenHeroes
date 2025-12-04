import { heroBenefitsService } from './heroBenefits.service';
import { gangGreenHeroBadgeService } from './gangGreenHeroBadge.service';
import { ggCoinService } from './ggCoin.service';

/**
 * Hero Platform Integration Service
 * Integrates Hero badge benefits across platform features
 */
class HeroPlatformIntegrationService {
  /**
   * Apply Hero multiplier to initiative participation rewards
   * @param userId - User ID
   * @param baseReward - Base GG Coin reward amount
   * @param initiativeId - Initiative ID for tracking
   * @returns Multiplied reward amount
   */
  async applyInitiativeRewardMultiplier(
    userId: string,
    baseReward: number,
    initiativeId: string
  ): Promise<number> {
    try {
      // Check if user is a Hero badge holder
      const isHero = await gangGreenHeroBadgeService.isHeroUser(userId);
      
      if (!isHero) {
        return baseReward;
      }

      // Apply Hero reward multiplier
      const multipliedReward = await heroBenefitsService.applyRewardMultiplier({
        userId,
        baseReward,
        context: `initiative_${initiativeId}`,
      });

      console.log(`[HeroPlatformIntegration] Applied Hero multiplier: ${baseReward} -> ${multipliedReward} GG Coins`);

      return multipliedReward;
    } catch (error) {
      console.error('[HeroPlatformIntegration] Error applying initiative multiplier:', error);
      return baseReward;
    }
  }

  /**
   * Apply Hero fee discount to marketplace transactions
   * @param userId - User ID
   * @param baseFee - Base transaction fee
   * @param transactionType - Type of transaction
   * @returns Discounted fee amount
   */
  async applyMarketplaceFeeDiscount(
    userId: string,
    baseFee: number,
    transactionType: string
  ): Promise<number> {
    try {
      // Check if user is a Hero badge holder
      const isHero = await gangGreenHeroBadgeService.isHeroUser(userId);
      
      if (!isHero) {
        return baseFee;
      }

      // Apply Hero fee discount
      const discountedFee = await heroBenefitsService.calculateFeeDiscount({
        userId,
        baseFee,
        transactionType,
      });

      console.log(`[HeroPlatformIntegration] Applied Hero fee discount: ${baseFee} -> ${discountedFee}`);

      return discountedFee;
    } catch (error) {
      console.error('[HeroPlatformIntegration] Error applying fee discount:', error);
      return baseFee;
    }
  }

  /**
   * Apply Hero content priority boost to social feed posts
   * @param userId - User ID
   * @param contentId - Content/post ID
   * @param contentType - Type of content
   * @returns Priority boost level
   */
  async applyContentPriorityBoost(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<number> {
    try {
      // Check if user is a Hero badge holder
      const isHero = await gangGreenHeroBadgeService.isHeroUser(userId);
      
      if (!isHero) {
        return 0;
      }

      // Apply Hero content priority boost
      const priorityBoost = await heroBenefitsService.applyContentPriority({
        userId,
        contentId,
        contentType,
      });

      console.log(`[HeroPlatformIntegration] Applied Hero content priority boost: +${priorityBoost}`);

      return priorityBoost;
    } catch (error) {
      console.error('[HeroPlatformIntegration] Error applying content priority:', error);
      return 0;
    }
  }

  /**
   * Reward user for initiative participation with Hero multiplier
   * @param userId - User ID
   * @param initiativeId - Initiative ID
   * @param baseReward - Base reward amount
   * @param activityDescription - Description of the activity
   * @returns Result with actual reward amount credited
   */
  async rewardInitiativeParticipation(params: {
    userId: string;
    initiativeId: string;
    baseReward: number;
    activityDescription: string;
    metadata?: any;
  }): Promise<{ success: boolean; rewardAmount: number; wasMultiplied: boolean; error?: string }> {
    try {
      const { userId, initiativeId, baseReward, activityDescription, metadata } = params;

      // Apply Hero multiplier if applicable
      const finalReward = await this.applyInitiativeRewardMultiplier(userId, baseReward, initiativeId);
      const wasMultiplied = finalReward > baseReward;

      // Credit GG Coins
      const creditResult = await ggCoinService.creditCoins({
        userId,
        amount: finalReward,
        transactionType: 'achievement_reward',
        referenceType: 'achievement',
        referenceId: initiativeId,
        description: wasMultiplied
          ? `${activityDescription} (Hero bonus applied: ${baseReward} → ${finalReward} GG Coins)`
          : activityDescription,
        metadata: {
          ...metadata,
          base_reward: baseReward,
          final_reward: finalReward,
          hero_multiplier_applied: wasMultiplied,
          initiative_id: initiativeId,
        },
      });

      if (!creditResult || !creditResult.success) {
        return {
          success: false,
          rewardAmount: 0,
          wasMultiplied: false,
          error: creditResult?.error || 'Failed to credit GG Coins',
        };
      }

      return {
        success: true,
        rewardAmount: finalReward,
        wasMultiplied,
      };
    } catch (error) {
      console.error('[HeroPlatformIntegration] Error rewarding initiative participation:', error);
      return {
        success: false,
        rewardAmount: 0,
        wasMultiplied: false,
        error: error instanceof Error ? error.message : 'Failed to reward participation',
      };
    }
  }

  /**
   * Calculate marketplace transaction fee with Hero discount
   * @param userId - User ID
   * @param transactionAmount - Transaction amount
   * @param baseFeePercentage - Base fee percentage (e.g., 0.05 for 5%)
   * @returns Fee amount after Hero discount
   */
  async calculateMarketplaceFee(params: {
    userId: string;
    transactionAmount: number;
    baseFeePercentage: number;
    transactionType: string;
  }): Promise<{ fee: number; discount: number; wasDiscounted: boolean }> {
    try {
      const { userId, transactionAmount, baseFeePercentage, transactionType } = params;

      // Calculate base fee
      const baseFee = transactionAmount * baseFeePercentage;

      // Apply Hero discount if applicable
      const finalFee = await this.applyMarketplaceFeeDiscount(userId, baseFee, transactionType);
      const discount = baseFee - finalFee;
      const wasDiscounted = discount > 0;

      return {
        fee: finalFee,
        discount,
        wasDiscounted,
      };
    } catch (error) {
      console.error('[HeroPlatformIntegration] Error calculating marketplace fee:', error);
      const baseFee = params.transactionAmount * params.baseFeePercentage;
      return {
        fee: baseFee,
        discount: 0,
        wasDiscounted: false,
      };
    }
  }

  /**
   * Get Hero status and benefits for a user
   * @param userId - User ID
   * @returns Hero status and available benefits
   */
  async getUserHeroStatus(userId: string): Promise<{
    isHero: boolean;
    benefits?: {
      initiativeMultiplier: number;
      marketplaceDiscount: number;
      contentPriorityBoost: number;
      dailyReward: number;
    };
    holder?: any;
  }> {
    try {
      const heroStatus = await gangGreenHeroBadgeService.getHeroStatus(userId);

      if (!heroStatus.isHero) {
        return { isHero: false };
      }

      const benefits = await heroBenefitsService.getHeroBenefits();
      const config = await gangGreenHeroBadgeService.getHeroBadgeConfig();

      return {
        isHero: true,
        benefits: {
          initiativeMultiplier: benefits.enhancedRewards.initiativeMultiplier,
          marketplaceDiscount: benefits.platformPrivileges.reducedFees,
          contentPriorityBoost: benefits.socialBenefits.contentPriority,
          dailyReward: config?.dailyGGCoinReward || 0,
        },
        holder: heroStatus.holder,
      };
    } catch (error) {
      console.error('[HeroPlatformIntegration] Error getting Hero status:', error);
      return { isHero: false };
    }
  }

  /**
   * Check if user has access to exclusive Hero features
   * @param userId - User ID
   * @param featureName - Feature name to check
   * @returns True if user has access
   */
  async hasExclusiveFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    try {
      return await heroBenefitsService.hasExclusiveFeatureAccess(userId, featureName);
    } catch (error) {
      console.error('[HeroPlatformIntegration] Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get user's total benefit value from Hero badge
   * @param userId - User ID
   * @returns Total value generated from Hero benefits
   */
  async getUserBenefitValue(userId: string): Promise<number> {
    try {
      return await heroBenefitsService.getTotalBenefitValue(userId);
    } catch (error) {
      console.error('[HeroPlatformIntegration] Error getting benefit value:', error);
      return 0;
    }
  }

  /**
   * Apply Hero benefits to social feed content
   * Boosts content visibility for Hero users
   * @param posts - Array of posts to process
   * @returns Posts with priority scores adjusted
   */
  async applySocialFeedPriority(posts: any[]): Promise<any[]> {
    try {
      const processedPosts = await Promise.all(
        posts.map(async (post) => {
          const priorityBoost = await this.applyContentPriorityBoost(
            post.user_id,
            post.id,
            'social_post'
          );

          return {
            ...post,
            priority_score: (post.priority_score || 0) + priorityBoost,
            is_hero_content: priorityBoost > 0,
          };
        })
      );

      // Sort by priority score descending
      return processedPosts.sort((a, b) => b.priority_score - a.priority_score);
    } catch (error) {
      console.error('[HeroPlatformIntegration] Error applying social feed priority:', error);
      return posts;
    }
  }
}

// Export singleton instance
export const heroPlatformIntegrationService = new HeroPlatformIntegrationService();
