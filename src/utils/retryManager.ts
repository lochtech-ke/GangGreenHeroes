/**
 * Retry Manager
 * Implements retry mechanism with exponential backoff for transient failures
 * Requirements: C4.1, C4.2
 */

import { RecoveryStrategy, RecoveryResult } from '../types/errors';

/**
 * Default retry strategies for common error types
 */
export const DEFAULT_STRATEGIES: Record<string, RecoveryStrategy> = {
  network: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    backoffMultiplier: 2,
    shouldRetry: (error: Error, attempt: number) => {
      // Retry network errors up to max attempts
      return attempt < 3;
    },
  },
  auth: {
    maxRetries: 2,
    retryDelay: 500,
    backoffMultiplier: 2,
    shouldRetry: (error: Error, attempt: number) => {
      // Only retry token expiration, not invalid credentials
      const message = error.message.toLowerCase();
      return attempt < 2 && (message.includes('token') || message.includes('expired'));
    },
  },
  database: {
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds
    backoffMultiplier: 1.5,
    shouldRetry: (error: Error, attempt: number) => {
      // Retry timeouts and connection errors, not constraint violations
      const message = error.message.toLowerCase();
      return attempt < 3 && (message.includes('timeout') || message.includes('connection'));
    },
  },
  curation: {
    maxRetries: 2,
    retryDelay: 500,
    backoffMultiplier: 2,
    shouldRetry: (error: Error, attempt: number) => {
      // Retry scoring failures, not validation errors
      const message = error.message.toLowerCase();
      return attempt < 2 && !message.includes('validation');
    },
  },
};

/**
 * Retry Manager Implementation
 * Handles automatic retry with exponential backoff
 */
export class RetryManager {
  private strategies: Map<string, RecoveryStrategy> = new Map();

  constructor() {
    // Register default strategies
    Object.entries(DEFAULT_STRATEGIES).forEach(([key, strategy]) => {
      this.strategies.set(key, strategy);
    });
  }

  /**
   * Attempt operation with retry logic
   * Requirements: C4.1, C4.2
   */
  public async retry<T>(
    operation: () => Promise<T>,
    strategyKey: string = 'network',
    customStrategy?: Partial<RecoveryStrategy>
  ): Promise<RecoveryResult & { data?: T }> {
    const strategy = this.getStrategy(strategyKey, customStrategy);
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < strategy.maxRetries) {
      try {
        // Execute the operation
        const data = await operation();
        
        // Success!
        const recoveryTime = Date.now() - startTime;
        
        if (strategy.onSuccess) {
          strategy.onSuccess(attempt);
        }

        return {
          success: true,
          attempts: attempt + 1,
          recoveryTime,
          strategy: strategyKey,
          data,
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if we should retry
        if (!strategy.shouldRetry(lastError, attempt)) {
          break;
        }

        // Don't wait after the last attempt
        if (attempt < strategy.maxRetries) {
          // Call onRetry callback if provided
          if (strategy.onRetry) {
            strategy.onRetry(attempt, lastError);
          }

          // Calculate delay with exponential backoff
          const delay = this.calculateDelay(strategy, attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    const recoveryTime = Date.now() - startTime;
    
    if (strategy.onFailure && lastError) {
      strategy.onFailure(lastError, attempt);
    }

    return {
      success: false,
      attempts: attempt,
      finalError: lastError,
      recoveryTime,
      strategy: strategyKey,
    };
  }

  /**
   * Register a custom retry strategy
   */
  public registerStrategy(key: string, strategy: RecoveryStrategy): void {
    this.strategies.set(key, strategy);
  }

  /**
   * Get strategy with optional overrides
   */
  private getStrategy(
    key: string,
    customStrategy?: Partial<RecoveryStrategy>
  ): RecoveryStrategy {
    const baseStrategy = this.strategies.get(key) || DEFAULT_STRATEGIES.network;
    
    if (!customStrategy) {
      return baseStrategy;
    }

    // Merge custom strategy with base
    return {
      ...baseStrategy,
      ...customStrategy,
      shouldRetry: customStrategy.shouldRetry || baseStrategy.shouldRetry,
    };
  }

  /**
   * Calculate delay with exponential backoff
   * Requirements: C4.2
   */
  private calculateDelay(strategy: RecoveryStrategy, attempt: number): number {
    return strategy.retryDelay * Math.pow(strategy.backoffMultiplier, attempt - 1);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all registered strategies
   */
  public getStrategies(): Map<string, RecoveryStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Remove a strategy
   */
  public removeStrategy(key: string): boolean {
    return this.strategies.delete(key);
  }

  /**
   * Reset to default strategies
   */
  public reset(): void {
    this.strategies.clear();
    Object.entries(DEFAULT_STRATEGIES).forEach(([key, strategy]) => {
      this.strategies.set(key, strategy);
    });
  }
}

// Export singleton instance
export const retryManager = new RetryManager();
