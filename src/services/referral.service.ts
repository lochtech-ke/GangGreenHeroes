import { supabase } from './supabase';
import { ggCoinService } from './ggCoin.service';

/**
 * Referral Service
 * Handles referral code generation, tracking, and bonus distribution
 * 
 * Requirements: A7.5 - Implement referral code generation, track successful referrals, award referral bonuses
 * Updated: Now uses GG Coins (decimal-based) instead of Green Coins
 */

export interface ReferralData {
  referrerId: string;
  referralCode: string;
  referredUserId: string;
  referredAt: Date;
  bonusAwarded: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalBonusEarned: number;
  recentReferrals: ReferralData[];
}

class ReferralService {
  /**
   * Generate a unique referral code for a user
   */
  generateReferralCode(userId: string): string {
    // Create a short, unique code based on user ID and timestamp
    const timestamp = Date.now().toString(36);
    const userPart = userId.substring(0, 8).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6);
    
    return `GG-${userPart}-${timestamp}-${randomPart}`.toUpperCase();
  }

  /**
   * Get or create referral code for a user
   */
  async getReferralCode(userId: string): Promise<string | null> {
    try {
      // Check if user already has a referral code
      const { data, error } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[ReferralService] Error fetching referral code:', error);
        return null;
      }

      if (data?.referral_code) {
        return data.referral_code;
      }

      // Generate new referral code
      const newCode = this.generateReferralCode(userId);

      // Update user profile with new code
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ referral_code: newCode })
        .eq('user_id', userId);

      if (updateError) {
        console.error('[ReferralService] Error updating referral code:', updateError);
        return null;
      }

      return newCode;
    } catch (error) {
      console.error('[ReferralService] Exception getting referral code:', error);
      return null;
    }
  }

  /**
   * Validate a referral code and get the referrer's user ID
   */
  async validateReferralCode(referralCode: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (error) {
        console.error('[ReferralService] Error validating referral code:', error);
        return null;
      }

      return data?.user_id || null;
    } catch (error) {
      console.error('[ReferralService] Exception validating referral code:', error);
      return null;
    }
  }

  /**
   * Track a successful referral
   */
  async trackReferral(referralCode: string, referredUserId: string): Promise<boolean> {
    try {
      // Validate referral code and get referrer ID
      const referrerId = await this.validateReferralCode(referralCode);
      if (!referrerId) {
        console.error('[ReferralService] Invalid referral code:', referralCode);
        return false;
      }

      // Prevent self-referral
      if (referrerId === referredUserId) {
        console.error('[ReferralService] Self-referral not allowed');
        return false;
      }

      // Update referred user's profile with referrer ID
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ referred_by: referrerId })
        .eq('user_id', referredUserId);

      if (updateError) {
        console.error('[ReferralService] Error updating referred_by:', updateError);
        return false;
      }

      // Award referral bonus to referrer using GG Coins
      const transaction = await ggCoinService.creditCoins(
        referrerId,
        50, // Base referral reward from REWARD_RULES
        'referral',
        `Referral bonus for inviting user ${referredUserId}`,
        { referredUserId }
      );
      
      if (!transaction) {
        console.error('[ReferralService] Failed to award referral bonus');
        return false;
      }

      console.log(`[ReferralService] Referral tracked: ${referrerId} referred ${referredUserId}`);
      return true;
    } catch (error) {
      console.error('[ReferralService] Exception tracking referral:', error);
      return false;
    }
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      // Get all users referred by this user
      const { data: referredUsers, error } = await supabase
        .from('user_profiles')
        .select('user_id, created_at')
        .eq('referred_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ReferralService] Error fetching referral stats:', error);
        return {
          totalReferrals: 0,
          successfulReferrals: 0,
          totalBonusEarned: 0,
          recentReferrals: [],
        };
      }

      const totalReferrals = referredUsers?.length || 0;

      // Get referral transactions from GG Coin transactions to calculate bonus earned
      const { data: transactions, error: txError } = await supabase
        .from('gg_coin_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('transaction_type', 'referral');

      if (txError) {
        console.error('[ReferralService] Error fetching referral transactions:', txError);
      }

      const totalBonusEarned = transactions?.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) || 0;
      const successfulReferrals = transactions?.length || 0;

      // Get referral code for recent referrals
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('user_id', userId)
        .maybeSingle();

      const referralCode = userProfile?.referral_code || '';

      const recentReferrals: ReferralData[] = (referredUsers || []).slice(0, 10).map(user => ({
        referrerId: userId,
        referralCode,
        referredUserId: user.user_id,
        referredAt: new Date(user.created_at),
        bonusAwarded: true, // If they're in the list, bonus was awarded
      }));

      return {
        totalReferrals,
        successfulReferrals,
        totalBonusEarned,
        recentReferrals,
      };
    } catch (error) {
      console.error('[ReferralService] Exception getting referral stats:', error);
      return {
        totalReferrals: 0,
        successfulReferrals: 0,
        totalBonusEarned: 0,
        recentReferrals: [],
      };
    }
  }

  /**
   * Get leaderboard of top referrers
   */
  async getTopReferrers(limit: number = 10): Promise<Array<{ userId: string; referralCount: number }>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('referred_by')
        .not('referred_by', 'is', null);

      if (error) {
        console.error('[ReferralService] Error fetching top referrers:', error);
        return [];
      }

      // Count referrals per user
      const referralCounts: Record<string, number> = {};
      for (const profile of data || []) {
        if (profile.referred_by) {
          referralCounts[profile.referred_by] = (referralCounts[profile.referred_by] || 0) + 1;
        }
      }

      // Sort and return top referrers
      return Object.entries(referralCounts)
        .map(([userId, count]) => ({ userId, referralCount: count }))
        .sort((a, b) => b.referralCount - a.referralCount)
        .slice(0, limit);
    } catch (error) {
      console.error('[ReferralService] Exception getting top referrers:', error);
      return [];
    }
  }

  /**
   * Check if a user was referred by someone
   */
  async getReferrer(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('referred_by')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[ReferralService] Error fetching referrer:', error);
        return null;
      }

      return data?.referred_by || null;
    } catch (error) {
      console.error('[ReferralService] Exception getting referrer:', error);
      return null;
    }
  }
}

// Export singleton instance
export const referralService = new ReferralService();
