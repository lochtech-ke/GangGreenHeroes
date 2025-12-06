/**
 * Error Recovery Manager
 * Orchestrates error recovery strategies with retry and circuit breaker
 * Requirements: C4.1, C4.2, C4.4, C4.5
 */

import {
  AppError,
  RecoveryStrategy,
  RecoveryResult,
  RecoveryStats,
  ErrorRecoveryManager as IErrorRecoveryManager,
  NetworkError,
  AuthError,
  DatabaseError,
  CurationError,
} from '../types/errors';
import { RetryManager, retryManager } from './retryManager';
import { CircuitBreakerRegistry, circuitBreakerRegistry } from './circuitBreaker';

/**
 * Predefined recovery strategies for common error types
 * Requirements: C4.4, C4.5
 */
export const PREDEFINED_STRATEGIES = {
  /**
   * Network error recovery strategy
   * - Retry up to 3 times with exponential backoff
   * - Use circuit breaker to prevent cascading failures
   */
  network: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error: Error, attempt: number) => {
      // Don't retry 4xx errors (client errors)
      if (error instanceof NetworkError && error.statusCode) {
        if (error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
      }
      return attempt < 3;
    },
    onRetry: (attempt: number, error: Error) => {
      console.log(`[Recovery] Network retry attempt ${attempt} for:`, error.message);
    },
  },

  /**
   * Authentication error recovery strategy
   * - Attempt token refresh
   * - Retry once after refresh
   */
  auth: {
    maxRetries: 2,
    retryDelay: 500,
    backoffMultiplier: 1,
    shouldRetry: (error: Error, attempt: number) => {
      // Only retry token expiration errors
      if (error instanceof AuthError) {
        return error.authType === 'token' && attempt < 2;
      }
      return false;
    },
    onRetry: async (attempt: number, error: Error) => {
      console.log(`[Recovery] Auth retry attempt ${attempt}, refreshing token...`);
      // Token refresh would happen here in real implementation
    },
  },

  /**
   * Database error recovery strategy
   * - Retry timeouts and connection errors
   * - Use circuit breaker for persistent failures
   */
  database: {
    maxRetries: 3,
    retryDelay: 2000,
    backoffMultiplier: 1.5,
    shouldRetry: (error: Error, attempt: number) => {
      if (error instanceof DatabaseError) {
        // Don't retry constraint violations or RLS violations
        if (error.code.includes('CONSTRAINT') || error.code.includes('RLS')) {
          return false;
        }
        // Retry timeouts and connection errors
        return attempt < 3;
      }
      return false;
    },
    onRetry: (attempt: number, error: Error) => {
      console.log(`[Recovery] Database retry attempt ${attempt} for:`, error.message);
    },
  },

  /**
   * Cache error recovery strategy
   * - Fall back to direct data fetching
   * - Single retry attempt
   */
  cache: {
    maxRetries: 1,
    retryDelay: 100,
    backoffMultiplier: 1,
    shouldRetry: (error: Error, attempt: number) => {
      // Single retry for cache errors
      return attempt < 1;
    },
    onRetry: (attempt: number, error: Error) => {
      console.log(`[Recovery] Cache fallback, fetching directly...`);
    },
  },

  /**
   * Curation error recovery strategy
   * - Fall back to chronological feed
   * - Retry scoring failures
   */
  curation: {
    maxRetries: 2,
    retryDelay: 500,
    backoffMultiplier: 2,
    shouldRetry: (error: Error, attempt: number) => {
      if (error instanceof CurationError) {
        // Don't retry validation errors
        if (error.code.includes('VALIDATION')) {
          return false;
        }
        return attempt < 2;
      }
      return false;
    },
    onRetry: (attempt: number, error: Error) => {
      console.log(`[Recovery] Curation retry attempt ${attempt} for:`, error.message);
    },
  },
} as const;

/**
 * Error Recovery Manager Implementation
 * Orchestrates recovery attempts with retry and circuit breaker patterns
 * Requirements: C4.1, C4.2, C4.4, C4.5
 */
export class ErrorRecoveryManager implements IErrorRecoveryManager {
  private retryManager: RetryManager;
  private circuitBreaker: CircuitBreakerRegistry;
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private stats: Map<string, RecoveryStats> = new Map();

  constructor(
    retryManagerInstance?: RetryManager,
    circuitBreakerInstance?: CircuitBreakerRegistry
  ) {
    this.retryManager = retryManagerInstance || retryManager;
    this.circuitBreaker = circuitBreakerInstance || circuitBreakerRegistry;

    // Register predefined strategies
    Object.entries(PREDEFINED_STRATEGIES).forEach(([key, strategy]) => {
      this.registerStrategy(key, strategy);
    });
  }

  /**
   * Attempt recovery for an error
   * Requirements: C4.1, C4.2
   */
  public async attemptRecovery(
    error: AppError,
    operation: () => Promise<any>
  ): Promise<RecoveryResult> {
    // Determine strategy based on error type
    const strategyKey = this.getStrategyKey(error);
    const strategy = this.strategies.get(strategyKey);

    if (!strategy) {
      // No recovery strategy available
      return {
        success: false,
        attempts: 0,
        finalError: error,
        recoveryTime: 0,
        strategy: 'none',
      };
    }

    // Generate operation key for circuit breaker
    const operationKey = this.getOperationKey(error);

    // Check if circuit is open
    if (this.circuitBreaker.isCircuitOpen(operationKey)) {
      return {
        success: false,
        attempts: 0,
        finalError: new Error(`Circuit breaker is open for ${operationKey}`),
        recoveryTime: 0,
        strategy: strategyKey,
      };
    }

    // Attempt recovery with retry and circuit breaker
    try {
      const result = await this.circuitBreaker.execute(
        operationKey,
        async () => {
          return await this.retryManager.retry(operation, strategyKey, strategy);
        }
      );

      // Update stats
      this.updateStats(operationKey, result);

      return result;
    } catch (circuitError) {
      // Circuit breaker prevented execution
      const result: RecoveryResult = {
        success: false,
        attempts: 0,
        finalError: circuitError as Error,
        recoveryTime: 0,
        strategy: strategyKey,
      };

      this.updateStats(operationKey, result);
      return result;
    }
  }

  /**
   * Register a custom recovery strategy
   */
  public registerStrategy(errorCode: string, strategy: RecoveryStrategy): void {
    this.strategies.set(errorCode, strategy);
    
    // Also register with retry manager
    this.retryManager.registerStrategy(errorCode, strategy);
  }

  /**
   * Check if circuit is open for operation
   */
  public isCircuitOpen(operationKey: string): boolean {
    return this.circuitBreaker.isCircuitOpen(operationKey);
  }

  /**
   * Reset circuit breaker for operation
   */
  public resetCircuit(operationKey: string): void {
    this.circuitBreaker.resetCircuit(operationKey);
  }

  /**
   * Get recovery statistics for operation
   */
  public getRecoveryStats(operationKey: string): RecoveryStats {
    return this.stats.get(operationKey) || {
      totalAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      avgRecoveryTime: 0,
    };
  }

  /**
   * Determine strategy key from error type
   */
  private getStrategyKey(error: AppError): string {
    if (error instanceof NetworkError) {
      return 'network';
    }
    if (error instanceof AuthError) {
      return 'auth';
    }
    if (error instanceof DatabaseError) {
      return 'database';
    }
    if (error instanceof CurationError) {
      return 'curation';
    }

    // Check error code
    if (error.code.includes('NETWORK')) {
      return 'network';
    }
    if (error.code.includes('AUTH')) {
      return 'auth';
    }
    if (error.code.includes('DB')) {
      return 'database';
    }
    if (error.code.includes('CACHE')) {
      return 'cache';
    }
    if (error.code.includes('CURATION')) {
      return 'curation';
    }

    return 'network'; // Default fallback
  }

  /**
   * Generate operation key for circuit breaker
   */
  private getOperationKey(error: AppError): string {
    // Use error code as base
    let key = error.code;

    // Add context for more specific tracking
    if (error.context?.component) {
      key = `${error.context.component}:${key}`;
    }

    return key;
  }

  /**
   * Update recovery statistics
   */
  private updateStats(operationKey: string, result: RecoveryResult): void {
    const currentStats = this.stats.get(operationKey) || {
      totalAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      avgRecoveryTime: 0,
      lastRecoveryAttempt: undefined,
    };

    const newStats: RecoveryStats = {
      totalAttempts: currentStats.totalAttempts + result.attempts,
      successfulRecoveries: currentStats.successfulRecoveries + (result.success ? 1 : 0),
      failedRecoveries: currentStats.failedRecoveries + (result.success ? 0 : 1),
      avgRecoveryTime:
        (currentStats.avgRecoveryTime * currentStats.totalAttempts + result.recoveryTime) /
        (currentStats.totalAttempts + result.attempts),
      lastRecoveryAttempt: new Date(),
    };

    this.stats.set(operationKey, newStats);
  }

  /**
   * Get all registered strategies
   */
  public getStrategies(): Map<string, RecoveryStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Get all recovery stats
   */
  public getAllStats(): Map<string, RecoveryStats> {
    return new Map(this.stats);
  }

  /**
   * Clear all statistics
   */
  public clearStats(): void {
    this.stats.clear();
  }

  /**
   * Reset all recovery mechanisms
   */
  public reset(): void {
    this.strategies.clear();
    this.stats.clear();
    this.circuitBreaker.clear();
    this.retryManager.reset();

    // Re-register predefined strategies
    Object.entries(PREDEFINED_STRATEGIES).forEach(([key, strategy]) => {
      this.registerStrategy(key, strategy);
    });
  }
}

// Export singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager();

/**
 * Convenience function for attempting recovery
 */
export async function attemptRecovery(
  error: AppError,
  operation: () => Promise<any>
): Promise<RecoveryResult> {
  return errorRecoveryManager.attemptRecovery(error, operation);
}
