/**
 * GG Coin Types
 * Types for the GG Coin reward system
 * 
 * Note: All GG Coin amounts support decimal precision up to 3 decimal places (0.001)
 * Examples: 1.000, 0.500, 0.250, 0.005
 */

export type GGCoinTransactionType =
  | 'credit'
  | 'debit'
  | 'purchase_reward'
  | 'referral_bonus'
  | 'achievement_reward'
  | 'admin_adjustment'
  | 'hero_daily_reward';

export type GGCoinReferenceType =
  | 'badge_purchase'
  | 'referral'
  | 'achievement'
  | 'admin'
  | 'hero_reward'
  | 'welcome_bonus'
  | 'retroactive_allocation'
  | 'other';

export interface GGCoinTransaction {
  id: string;
  user_id: string;
  transaction_type: GGCoinTransactionType;
  /** Transaction amount with 3 decimal places precision (positive for credit, negative for debit) */
  amount: number;
  /** Balance before transaction with 3 decimal places precision */
  balance_before: number;
  /** Balance after transaction with 3 decimal places precision */
  balance_after: number;
  reference_type?: GGCoinReferenceType;
  reference_id?: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface GGCoinBalance {
  user_id: string;
  /** GG Coin balance with 3 decimal places precision */
  balance: number;
  last_updated: string;
}

export interface CreditGGCoinsParams {
  userId: string;
  /** Amount to credit with 3 decimal places precision (e.g., 0.500, 1.250) */
  amount: number;
  transactionType: GGCoinTransactionType;
  referenceType?: GGCoinReferenceType;
  referenceId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface DebitGGCoinsParams {
  userId: string;
  /** Amount to debit with 3 decimal places precision (e.g., 0.500, 1.250) */
  amount: number;
  transactionType: GGCoinTransactionType;
  referenceType?: GGCoinReferenceType;
  referenceId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GGCoinOperationResult {
  success: boolean;
  transaction_id?: string;
  /** Balance before operation with 3 decimal places precision */
  balance_before?: number;
  /** Balance after operation with 3 decimal places precision */
  balance_after?: number;
  /** Amount credited with 3 decimal places precision */
  amount_credited?: number;
  /** Amount debited with 3 decimal places precision */
  amount_debited?: number;
  error?: string;
}

// Extended transaction type with operation result properties
export interface GGCoinTransactionResult extends GGCoinTransaction {
  success?: boolean;
  error?: string;
}
