/**
 * Distribution Cycle Types
 * Types for managing distribution cycles
 */

// Distribution Cycle Status
export type CycleStatus = 'pending' | 'calculating' | 'completed' | 'distributed';

// Distribution Cycle
export interface DistributionCycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  total_token_pool: number;
  tokens_distributed: number;
  contributors_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface DistributionCycleRow {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  status: string;
  total_token_pool: number;
  tokens_distributed: number;
  contributors_count: number;
  created_at: string;
  completed_at: string | null;
}

// Cycle Creation Parameters
export interface CycleCreationParams {
  start_date: string;
  end_date: string;
  total_token_pool: number;
}

// Cycle Execution Result
export interface CycleExecutionResult {
  cycle_id: string;
  cycle_number: number;
  status: CycleStatus;
  contributors_analyzed: number;
  contributors_rewarded: number;
  tokens_distributed: number;
  flags_raised: number;
  execution_time_ms: number;
  completed_at: string;
}

// Cycle Progress
export interface CycleProgress {
  cycle_id: string;
  cycle_number: number;
  status: CycleStatus;
  progress_percentage: number;
  current_step: 'analyzing' | 'calculating' | 'distributing' | 'completed';
  contributors_processed: number;
  total_contributors: number;
  estimated_completion: string | null;
}

// Cycle Summary
export interface CycleSummary {
  cycle_id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  total_token_pool: number;
  tokens_distributed: number;
  tokens_remaining: number;
  contributors_count: number;
  top_contributor: {
    user_id: string;
    github_username: string;
    tokens_earned: number;
  } | null;
  distribution_date: string | null;
}

// Service Response Types
export interface DistributionCycleResponse<T = any> {
  data: T | null;
  error: DistributionCycleError | Error | null;
  metadata?: {
    cycle_id?: string;
    processing_time_ms?: number;
  };
}

// Error Types
export enum DistributionCycleErrorCode {
  CYCLE_NOT_FOUND = 'CYCLE_NOT_FOUND',
  INVALID_CYCLE_STATUS = 'INVALID_CYCLE_STATUS',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  CYCLE_OVERLAP = 'CYCLE_OVERLAP',
  CREATION_FAILED = 'CREATION_FAILED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  DISTRIBUTION_FAILED = 'DISTRIBUTION_FAILED',
  FINALIZATION_FAILED = 'FINALIZATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export class DistributionCycleError extends Error {
  constructor(
    public code: DistributionCycleErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DistributionCycleError';
  }
}

// Cycle Timeline Event
export interface CycleTimelineEvent {
  id: string;
  cycle_id: string;
  event_type: 'created' | 'started' | 'analyzed' | 'completed' | 'distributed' | 'error';
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

// Cycle Validation Result
export interface CycleValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  can_execute: boolean;
}
