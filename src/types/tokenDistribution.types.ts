/**
 * Token Distribution Types
 * Types for managing governance token distribution to contributors
 */

// Token Distribution Record
export interface TokenDistribution {
  id: string;
  cycle_id: string;
  user_id: string;
  github_username: string;
  tokens_awarded: number;
  contribution_score: number;
  distribution_type: 'automated' | 'manual_bonus';
  justification: string | null;
  distributed_by: string | null;
  distributed_at: string;
}

export interface TokenDistributionRow {
  id: string;
  cycle_id: string;
  user_id: string;
  github_username: string;
  tokens_awarded: number;
  contribution_score: number;
  distribution_type: string;
  justification: string | null;
  distributed_by: string | null;
  distributed_at: string;
}

// Distribution Configuration
export interface DistributionConfig {
  id: string;
  cycle_frequency: 'weekly' | 'monthly' | 'quarterly';
  token_pool_per_cycle: number;
  minimum_contribution_threshold: number;
  max_tokens_per_contributor: number;
  commit_weight: number;
  pr_merged_weight: number;
  review_weight: number;
  documentation_weight: number;
  lines_of_code_multiplier: number;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface DistributionConfigRow {
  id: string;
  cycle_frequency: string;
  token_pool_per_cycle: number;
  minimum_contribution_threshold: number;
  max_tokens_per_contributor: number;
  commit_weight: number;
  pr_merged_weight: number;
  review_weight: number;
  documentation_weight: number;
  lines_of_code_multiplier: number;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

// Manual Token Award
export interface ManualTokenAward {
  id: string;
  user_id: string;
  tokens_awarded: number;
  awarded_by: string;
  justification: string;
  category: 'architecture' | 'mentorship' | 'documentation' | 'community' | 'other';
  awarded_at: string;
}

export interface ManualTokenAwardRow {
  id: string;
  user_id: string;
  tokens_awarded: number;
  awarded_by: string;
  justification: string;
  category: string;
  awarded_at: string;
}

// Distribution Summary
export interface DistributionSummary {
  cycle_id: string;
  cycle_number: number;
  status: 'pending' | 'calculating' | 'completed' | 'distributed';
  total_token_pool: number;
  tokens_distributed: number;
  tokens_remaining: number;
  contributors_count: number;
  average_tokens_per_contributor: number;
  median_tokens: number;
  distribution_date: string | null;
}

// Token Allocation Map
export type TokenAllocationMap = Map<string, number>;

// Service Response Types
export interface TokenDistributionResponse<T = any> {
  data: T | null;
  error: TokenDistributionError | Error | null;
  metadata?: {
    cycle_id?: string;
    total_tokens_distributed?: number;
    contributors_count?: number;
    processing_time_ms?: number;
  };
}

// Error Types
export enum TokenDistributionErrorCode {
  CYCLE_NOT_FOUND = 'CYCLE_NOT_FOUND',
  CYCLE_ALREADY_DISTRIBUTED = 'CYCLE_ALREADY_DISTRIBUTED',
  INVALID_CYCLE_STATUS = 'INVALID_CYCLE_STATUS',
  INSUFFICIENT_TOKEN_POOL = 'INSUFFICIENT_TOKEN_POOL',
  INVALID_TOKEN_AMOUNT = 'INVALID_TOKEN_AMOUNT',
  MISSING_JUSTIFICATION = 'MISSING_JUSTIFICATION',
  TOKEN_AWARD_FAILED = 'TOKEN_AWARD_FAILED',
  DISTRIBUTION_FAILED = 'DISTRIBUTION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export class TokenDistributionError extends Error {
  constructor(
    public code: TokenDistributionErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TokenDistributionError';
  }
}

// Distribution History with Cycle Info
export interface DistributionHistoryItem extends TokenDistribution {
  cycle_number: number;
  cycle_start_date: string;
  cycle_end_date: string;
}

// Distribution Statistics
export interface DistributionStatistics {
  total_cycles: number;
  total_tokens_distributed: number;
  total_contributors: number;
  average_tokens_per_cycle: number;
  average_contributors_per_cycle: number;
  largest_distribution: {
    cycle_id: string;
    cycle_number: number;
    tokens_distributed: number;
  };
  most_active_contributor: {
    user_id: string;
    github_username: string;
    total_tokens_earned: number;
    cycles_participated: number;
  };
}

// Configuration Change Log
export interface ConfigurationChange {
  id: string;
  config_id: string;
  changed_by: string;
  changes: Record<string, { old_value: any; new_value: any }>;
  changed_at: string;
}

// Distribution Validation Result
export interface DistributionValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  total_allocation: number;
  exceeds_pool: boolean;
  contributors_over_cap: string[];
}
