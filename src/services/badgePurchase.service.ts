import { supabase } from './supabase';
import { paystackService } from './paystack.service';
import { ggCoinService } from './ggCoin.service';
import { badgeSvgService } from './badgeSvg.service';
import { createBadgeMetadata } from '../utils/badgeMetadata';
import type {
  BadgePurchase,
  InitiatePurchaseParams,
  InitiatePurchaseResult,
  CompletePurchaseParams,
  CompletePurchaseResult,
  VerifyAndRewardParams,
  VerifyAndRewardResult,
} from '../types/badgePurchase.types';
import type { BadgeTier, ForestType, AchievementType } from '../types/badge.types';
import { BADGE_PRICE_KES } from '../types/badgePurchase.types';

/**
 * Badge Purchase Service
 * Handles NFT badge purchases with Paystack integration and GG Coin rewards
 */
class BadgePurchaseService {
  /**
   * Initiate a badge purchase
   * Creates a purchase record and initializes Paystack payment
   */
  async initiatePurchase(params: InitiatePurchaseParams): Promise<InitiatePurchaseResult> {
    const { userId, badgeType, tier, email, metadata, style } = params;

    try {
      console.log(`[BadgePurchaseService] Initiating purchase for user ${userId}`);

      // Generate unique reference
      const reference = paystackService.generateReference();

      // Calculate GG Coin reward based on purchase amount
      const ggCoinsAwarded = ggCoinService.calculatePurchaseReward(BADGE_PRICE_KES);

      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('badge_purchases')
        .insert({
          user_id: userId,
          badge_type: badgeType,
          tier: tier,
          amount_kes: BADGE_PRICE_KES,
          paystack_reference: reference,
          payment_status: 'pending',
          gg_coins_awarded: ggCoinsAwarded,
          metadata: {
            ...(metadata || {}),
            style: style || 'classic', // Default to classic if not specified
          },
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('[BadgePurchaseService] Error creating purchase record:', purchaseError);
        return {
          success: false,
          error: 'Failed to create purchase record',
        };
      }

      console.log(`[BadgePurchaseService] Purchase record created:`, purchase.id);

      // Initialize Paystack payment
      try {
        const paystackResponse = await this.initializePaystackPayment({
          email,
          amount: BADGE_PRICE_KES,
          reference,
          metadata: {
            purchase_id: purchase.id,
            badge_type: badgeType,
            tier: tier,
            user_id: userId,
          },
        });

        // Update purchase with Paystack access code
        if (paystackResponse.access_code) {
          await supabase
            .from('badge_purchases')
            .update({ paystack_access_code: paystackResponse.access_code })
            .eq('id', purchase.id);
        }

        return {
          success: true,
          purchase: purchase as BadgePurchase,
          paystack_authorization_url: paystackResponse.authorization_url,
          paystack_access_code: paystackResponse.access_code,
          paystack_reference: reference,
        };
      } catch (paystackError) {
        console.error('[BadgePurchaseService] Paystack initialization error:', paystackError);
        
        // Update purchase status to failed
        await supabase
          .from('badge_purchases')
          .update({ payment_status: 'failed' })
          .eq('id', purchase.id);

        return {
          success: false,
          error: paystackError instanceof Error ? paystackError.message : 'Payment initialization failed',
        };
      }
    } catch (error) {
      console.error('[BadgePurchaseService] Initiate purchase exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate purchase',
      };
    }
  }

  /**
   * Complete a badge purchase after payment verification
   * Called from the frontend after Paystack callback
   */
  async completePurchase(params: CompletePurchaseParams): Promise<CompletePurchaseResult> {
    const { reference, userId } = params;

    try {
      console.log(`[BadgePurchaseService] Completing purchase for reference ${reference}`);

      // Fetch purchase record
      const { data: purchase, error: fetchError } = await supabase
        .from('badge_purchases')
        .select('*')
        .eq('paystack_reference', reference)
        .eq('user_id', userId)
        .single();

      if (fetchError || !purchase) {
        console.error('[BadgePurchaseService] Purchase not found:', fetchError);
        return {
          success: false,
          error: 'Purchase not found',
        };
      }

      // Check if already completed
      if (purchase.payment_status === 'success') {
        console.log('[BadgePurchaseService] Purchase already completed');
        return {
          success: true,
          purchase: purchase as BadgePurchase,
          gg_coins_earned: purchase.gg_coins_awarded,
        };
      }

      // Verify payment with Paystack
      const verificationResult = await paystackService.verifyPayment(reference);

      if (!verificationResult.status || verificationResult.data?.status !== 'success') {
        console.error('[BadgePurchaseService] Payment verification failed');
        
        // Update status to failed
        await supabase
          .from('badge_purchases')
          .update({ payment_status: 'failed' })
          .eq('id', purchase.id);

        return {
          success: false,
          error: 'Payment verification failed',
        };
      }

      console.log('[BadgePurchaseService] Payment verified successfully');

      // Update purchase status
      const { data: updatedPurchase, error: updateError } = await supabase
        .from('badge_purchases')
        .update({
          payment_status: 'success',
          completed_at: new Date().toISOString(),
        })
        .eq('id', purchase.id)
        .select()
        .single();

      if (updateError) {
        console.error('[BadgePurchaseService] Error updating purchase:', updateError);
        return {
          success: false,
          error: 'Failed to update purchase status',
        };
      }

      // Credit GG Coins (will be handled by webhook, but we can try here as backup)
      if (!purchase.gg_coins_credited) {
        const ggCoinsToCredit = purchase.gg_coins_awarded || ggCoinService.calculatePurchaseReward(purchase.amount_kes);
        
        const creditResult = await ggCoinService.creditCoins(
          userId,
          ggCoinsToCredit,
          'earn',
          `Earned ${ggCoinsToCredit} GG Coins for purchasing ${purchase.badge_type} ${purchase.tier} badge (${purchase.amount_kes} KES)`,
          {
            badge_type: purchase.badge_type,
            tier: purchase.tier,
            amount_kes: purchase.amount_kes,
            referenceType: 'badge_purchase',
            referenceId: purchase.id,
          }
        );

        if (creditResult && creditResult.success) {
          await supabase
            .from('badge_purchases')
            .update({ gg_coins_credited: true })
            .eq('id', purchase.id);
        }
      }

      // Generate badge SVG
      // Extract forest and achievement from metadata or use defaults
      const forest = (purchase.metadata?.forest as ForestType) || 'kakamega';
      const achievement = (purchase.metadata?.achievement as AchievementType) || 'tree_planter';
      const achievementCount = purchase.metadata?.achievement_count || 1;
      const style = purchase.metadata?.style || 'classic'; // Extract style from metadata

      await this.generateBadgeSVG({
        purchaseId: purchase.id,
        userId: userId,
        tier: purchase.tier as BadgeTier,
        forest,
        achievement,
        achievementCount,
        style,
      });

      return {
        success: true,
        purchase: updatedPurchase as BadgePurchase,
        gg_coins_earned: updatedPurchase.gg_coins_awarded,
      };
    } catch (error) {
      console.error('[BadgePurchaseService] Complete purchase exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete purchase',
      };
    }
  }

  /**
   * Verify payment and reward GG Coins
   * Called from Paystack webhook for server-side processing
   */
  async verifyAndReward(params: VerifyAndRewardParams): Promise<VerifyAndRewardResult> {
    const { reference, paystackData } = params;

    try {
      console.log(`[BadgePurchaseService] Verifying and rewarding for reference ${reference}`);

      // Fetch purchase record
      const { data: purchase, error: fetchError } = await supabase
        .from('badge_purchases')
        .select('*')
        .eq('paystack_reference', reference)
        .single();

      if (fetchError || !purchase) {
        console.error('[BadgePurchaseService] Purchase not found:', fetchError);
        return {
          success: false,
          error: 'Purchase not found',
        };
      }

      // Check if already processed
      if (purchase.gg_coins_credited) {
        console.log('[BadgePurchaseService] GG Coins already credited');
        return {
          success: true,
          purchase: purchase as BadgePurchase,
          gg_coins_credited: true,
        };
      }

      // Update purchase status
      await supabase
        .from('badge_purchases')
        .update({
          payment_status: 'success',
          completed_at: new Date().toISOString(),
          metadata: {
            ...purchase.metadata,
            paystack_data: paystackData,
          },
        })
        .eq('id', purchase.id);

      // Calculate GG Coins to credit (use stored amount or calculate from purchase amount)
      const ggCoinsToCredit = purchase.gg_coins_awarded || ggCoinService.calculatePurchaseReward(purchase.amount_kes);

      // Credit GG Coins
      const creditResult = await ggCoinService.creditCoins(
        purchase.user_id,
        ggCoinsToCredit,
        'earn',
        `Earned ${ggCoinsToCredit} GG Coins for purchasing ${purchase.badge_type} ${purchase.tier} badge (${purchase.amount_kes} KES)`,
        {
          badge_type: purchase.badge_type,
          tier: purchase.tier,
          amount_kes: purchase.amount_kes,
          paystack_reference: reference,
          referenceType: 'badge_purchase',
          referenceId: purchase.id,
        }
      );

      if (!creditResult || !creditResult.success) {
        console.error('[BadgePurchaseService] Failed to credit GG Coins:', creditResult?.error);
        return {
          success: false,
          error: creditResult?.error || 'Failed to credit GG Coins',
        };
      }

      // Mark coins as credited
      await supabase
        .from('badge_purchases')
        .update({ gg_coins_credited: true })
        .eq('id', purchase.id);

      console.log(`[BadgePurchaseService] Successfully credited ${ggCoinsToCredit} GG Coins`);

      return {
        success: true,
        purchase: purchase as BadgePurchase,
        gg_coins_credited: true,
      };
    } catch (error) {
      console.error('[BadgePurchaseService] Verify and reward exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify and reward',
      };
    }
  }

  /**
   * Initialize Paystack payment
   * Calls Supabase Edge Function to create payment
   */
  private async initializePaystackPayment(params: {
    email: string;
    amount: number;
    reference: string;
    metadata: any;
  }): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initialize-paystack-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: params.email,
          amount: paystackService.toKobo(params.amount),
          reference: params.reference,
          metadata: params.metadata,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to initialize payment: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get purchase by reference
   */
  async getPurchaseByReference(reference: string): Promise<BadgePurchase | null> {
    try {
      const { data, error } = await supabase
        .from('badge_purchases')
        .select('*')
        .eq('paystack_reference', reference)
        .single();

      if (error) {
        console.error('[BadgePurchaseService] Error fetching purchase:', error);
        return null;
      }

      return data as BadgePurchase;
    } catch (error) {
      console.error('[BadgePurchaseService] Exception fetching purchase:', error);
      return null;
    }
  }

  /**
   * Get user's purchase history
   */
  async getUserPurchases(userId: string, limit: number = 50): Promise<BadgePurchase[]> {
    try {
      const { data, error} = await supabase
        .from('badge_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[BadgePurchaseService] Error fetching purchases:', error);
        return [];
      }

      return data as BadgePurchase[];
    } catch (error) {
      console.error('[BadgePurchaseService] Exception fetching purchases:', error);
      return [];
    }
  }

  /**
   * Generate badge SVG after successful purchase
   */
  async generateBadgeSVG(params: {
    purchaseId: string;
    userId: string;
    tier: BadgeTier;
    forest: ForestType;
    achievement: AchievementType;
    achievementCount?: number;
    style?: 'geometric' | 'classic';
  }): Promise<{ success: boolean; svg?: string; error?: string }> {
    try {
      console.log(`[BadgePurchaseService] Generating badge SVG for purchase ${params.purchaseId}`);

      // Create badge metadata
      const metadata = createBadgeMetadata({
        tier: params.tier,
        forest: params.forest,
        achievement: params.achievement,
        achievementCount: params.achievementCount || 1,
        userId: params.userId,
      });

      // Generate badge configuration
      const badgeConfig = {
        id: params.purchaseId,
        tier: params.tier,
        forest: params.forest,
        achievement: params.achievement,
        metadata,
        animated: params.tier === 'diamond', // Enable animations for diamond tier
        style: params.style || 'classic', 
      };

      // Generate badge SVG
      const result = await badgeSvgService.generateBadge(badgeConfig);

      if (!result.success || !result.svg) {
        console.error('[BadgePurchaseService] Badge generation failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to generate badge',
        };
      }

      // Store badge SVG in database
      const { error: updateError } = await supabase
        .from('badge_purchases')
        .update({
          badge_svg: result.svg,
          badge_metadata: result.metadata,
        })
        .eq('id', params.purchaseId);

      if (updateError) {
        console.error('[BadgePurchaseService] Error storing badge SVG:', updateError);
        return {
          success: false,
          error: 'Failed to store badge SVG',
        };
      }

      console.log('[BadgePurchaseService] Badge SVG generated and stored successfully');

      return {
        success: true,
        svg: result.svg,
      };
    } catch (error) {
      console.error('[BadgePurchaseService] Exception generating badge SVG:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate badge SVG',
      };
    }
  }

  /**
   * Get badge SVG for a purchase
   */
  async getBadgeSVG(purchaseId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('badge_purchases')
        .select('badge_svg')
        .eq('id', purchaseId)
        .single();

      if (error || !data) {
        console.error('[BadgePurchaseService] Error fetching badge SVG:', error);
        return null;
      }

      return data.badge_svg;
    } catch (error) {
      console.error('[BadgePurchaseService] Exception fetching badge SVG:', error);
      return null;
    }
  }
}

// Export singleton instance
export const badgePurchaseService = new BadgePurchaseService();
