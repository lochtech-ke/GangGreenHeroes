/**
 * Badge Purchase Types
 * Types for NFT badge purchase system with Paystack integration
 */

export type BadgePurchaseStatus = 'pending' | 'success' | 'failed' | 'abandoned';

export interface BadgePurchase {
  id: string;
  user_id: string;
  badge_id?: string;
  badge_type: string;
  tier: string;
  amount_kes: number;
  paystack_reference: string;
  paystack_access_code?: string;
  payment_status: BadgePurchaseStatus;
  gg_coins_awarded: number;
  gg_coins_credited: boolean;
  transaction_hash?: string;
  badge_svg?: string;
  badge_metadata?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface InitiatePurchaseParams {
  userId: string;
  badgeType: string;
  tier: string;
  email: string;
  metadata?: Record<string, any>;
  style?: 'geometric' | 'classic';
}

export interface InitiatePurchaseResult {
  success: boolean;
  purchase?: BadgePurchase;
  paystack_authorization_url?: string;
  paystack_access_code?: string;
  paystack_reference?: string;
  error?: string;
}

export interface CompletePurchaseParams {
  reference: string;
  userId: string;
}

export interface CompletePurchaseResult {
  success: boolean;
  purchase?: BadgePurchase;
  gg_coins_earned?: number;
  error?: string;
}

export interface VerifyAndRewardParams {
  reference: string;
  paystackData: any;
}

export interface VerifyAndRewardResult {
  success: boolean;
  purchase?: BadgePurchase;
  gg_coins_credited?: boolean;
  error?: string;
}

export const BADGE_PRICE_KES = 200;
export const BADGE_PURCHASE_GG_COIN_REWARD = 1;
