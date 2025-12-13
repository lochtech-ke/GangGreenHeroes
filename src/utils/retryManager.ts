/**
 * Retry Manager
 * Implements retry mechanism with exponential backoff for error recovery
 * Requirements: 4.1, 4.2, 9.3
 */

import { RecoveryStrategy, RecoveryResult, AppError } from '../types/errors';
import { addBreadcrumb } from './errorContext';

/**
 * Retry Manager Implementation
 * Provides automatic retry functionality with configurable strategies
 */
export class RetryManager {
  private static instance: RetryManager;
  private strategies: Map<string, RecoveryStrategy> = new Map();

  private constructor() {
    this.setupDefaultStrategies();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager();
    }
    return RetryManager.instance;
  }

  /**
   * Set up default retry strategies
   */
  private setupDefaultStrategies(): void {
    // Network retry strategy
    this.strategies.set('network', {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      shouldRetry: (error: Error, attempt: number) => {
        // Don't retry client errors (4xx) except rate limits
        if (error instanceof AppError && (error as any).statusCode) {
          const statusCode = (error as any).statusCode;
          if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
            return false;
          }
        }
        return attempt <= 3;
      },
      onRetry: (attempt: number, error: Error) => {
        addBreadcrumb('retry', `Network retry attempt ${attempt}`, 'info', { error: error.message });
      },
    });

    // Authentication retry strategy
    this.strategies.set('auth', {
      maxRetries: 1,
      retryDelay: 0,
      backoffMultiplier: 1,
      shouldRetry: (error: Error, attempt: number) => {
        // Only retry token expiration errors once
        return attempt === 1 && error.message.toLowerCase().includes('token');
      },
      onRetry: (attempt: number, error: Error) => {
        addBreadcrumb('retry', 'Auth token refresh attempt', 'info', { error: error.message });
      },
    });

    // Database retry strategy
    this.strategies.set('database', {
      maxRetries: 2,
      retryDelay: 500,
      backoffMultiplier: 2,
      shouldRetry: (error: Error, attempt: number) => {
        // Retry timeout and connection errors
        const message = error.message.toLowerCase();
        return attempt <= 2 && (message.includes('timeout') || message.includes('connection'));
      },
      onRetry: (attempt: number, error: Error) => {
        addBreadcrumb('retry', `Database retry attempt ${attempt}`, 'warning', { error: error.message });
      },
    });

    // Web3 retry strategy
    this.strategies.set('web3', {
      maxRetries: 2,
      retryDelay: 2000,
      backoffMultiplier: 1.5,
      shouldRetry: (error: Error, attempt: number) => {
        const message = error.message.toLowerCase();
        // Don't retry user rejections or insufficient funds
        if (message.includes('user rejected') || message.includes('insufficient')) {
          return false;
        }
        // Retry network errors and gas estimation failures
        return attempt <= 2 && (message.includes('network') || message.includes('gas'));
      },
      onRetry: (attempt: number, error: Error) => {
        addBreadcrumb('retry', `Web3 retry attempt ${attempt}`, 'warning', { error: error.message });
      },
    });
  }

  /**
   * Execute operation with retry logic
   * Requirements: 4.1, 4.2
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    strategyName: string,
    customStrategy?: Partial<RecoveryStrategy>
  ): Promise<RecoveryResult & { data?: T }> {
    const strategy = this.getStrategy(strategyName, customStrategy);
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 1; attempt <= strategy.maxRetries + 1; attempt++) {
      attempts = attempt;
      
      try {
        const result = await operation();
        
        // Success
        if (strategy.onSuccess) {
          strategy.onSuccess(attempt);
        }

        addBreadcrumb('retry', `Operation succeeded on attempt ${attempt}`, 'info', { 
          strategy: strategyName,
          attempts: attempt,
        });

        return {
          success: true,
          attempts: attempt,
          recoveryTime: Date.now() - startTime,
          strategy: strategyName,
          data: result,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry
        if (attempt <= strategy.maxRetries && strategy.shouldRetry(lastError, attempt)) {
          // Calculate delay with exponential backoff
          const delay = strategy.retryDelay * Math.pow(strategy.backoffMultiplier, attempt - 1);
          
          // Call retry callback
          if (strategy.onRetry) {
            strategy.onRetry(attempt, lastError);
          }

          addBreadcrumb('retry', `Retrying operation after ${delay}ms`, 'warning', {
            strategy: strategyName,
            attempt,
            error: lastError.message,
            delay,
          });

          // Wait before retrying
          await this.delay(delay);
        } else {
          // No more retries or shouldn't retry
          break;
        }
      }
    }

    // All retries failed
    if (strategy.onFailure) {
      strategy.onFailure(lastError!, attempts);
    }

    addBreadcrumb('retry', `Operation failed after ${attempts} attempts`, 'error', {
      strategy: strategyName,
      attempts,
      error: lastError?.message,
    });

    return {
      success: false,
      attempts,
      finalError: lastError,
      recoveryTime: Date.now() - startTime,
      strategy: strategyName,
    };
  }

  /**
   * Get retry strategy by name with optional overrides
   */
  private getStrategy(strategyName: string, customStrategy?: Partial<RecoveryStrategy>): RecoveryStrategy {
    const baseStrategy = this.strategies.get(strategyName);
    
    if (!baseStrategy) {
      throw new Error(`Unknown retry strategy: ${strategyName}`);
    }

    return {
      ...baseStrategy,
      ...customStrategy,
    };
  }

  /**
   * Register a custom retry strategy
   */
  public registerStrategy(name: string, strategy: RecoveryStrategy): void {
    this.strategies.set(name, strategy);
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
  public removeStrategy(name: string): boolean {
    return this.strategies.delete(name);
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retry wrapper function
   */
  public createRetryWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    strategyName: string,
    customStrategy?: Partial<RecoveryStrategy>
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const result = await this.executeWithRetry(
        () => fn(...args),
        strategyName,
        customStrategy
      );

      if (result.success) {
        return result.data!;
      } else {
        throw result.finalError || new Error('Retry failed');
      }
    };
  }

  /**
   * Retry with exponential backoff (standalone utility)
   * Requirements: 4.1, 4.2
   */
  public static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      backoffMultiplier?: number;
      maxDelay?: number;
      shouldRetry?: (error: Error, attempt: number) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      backoffMultiplier = 2,
      maxDelay = 30000,
      shouldRetry = () => true,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt <= maxRetries && shouldRetry(lastError, attempt)) {
          const delay = Math.min(
            initialDelay * Math.pow(backoffMultiplier, attempt - 1),
            maxDelay
          );
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Reset all strategies to defaults
   */
  public reset(): void {
    this.strategies.clear();
    this.setupDefaultStrategies();
  }
}

// Export singleton instance
export const retryManager = RetryManager.getInstance();

// Export convenience functions
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  strategyName: string,
  customStrategy?: Partial<RecoveryStrategy>
): Promise<RecoveryResult & { data?: T }> {
  return retryManager.executeWithRetry(operation, strategyName, customStrategy);
}

export function createRetryWrapper<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  strategyName: string,
  customStrategy?: Partial<RecoveryStrategy>
): (...args: T) => Promise<R> {
  return retryManager.createRetryWrapper(fn, strategyName, customStrategy);
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    backoffMultiplier?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
  }
): Promise<T> {
  return RetryManager.retryWithBackoff(operation, options);
}