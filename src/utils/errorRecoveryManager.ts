/**
 * Error Recovery Manager
 * Orchestrates error recovery strategies including retry and circuit breaker patterns
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */

import { 
  AppError, 
  RecoveryStrategy, 
  RecoveryResult, 
  RecoveryStats,
  ErrorRecoveryManager as IErrorRecoveryManager,
  CircuitBreakerConfig,
  NetworkError,
  AuthError,
  DatabaseError,
  Web3Error,
  BadgeError,
  CurationError,
} from '../types/errors';
import { retryManager } from './retryManager';
import { circuitBreakerManager } from './circuitBreaker';
import { addBreadcrumb } from './errorContext';

/**
 * Error Recovery Manager Implementation
 * Provides comprehensive error recovery orchestration
 */
export class ErrorRecoveryManager implements IErrorRecoveryManager {
  private static instance: ErrorRecoveryManager;
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private recoveryStats: Map<string, RecoveryStats> = new Map();

  private constructor() {
    this.setupDefaultStrategies();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  /**
   * Set up default recovery strategies
   * Requirements: 4.4, 4.5
   */
  private setupDefaultStrategies(): void {
    // Network error recovery
    this.recoveryStrategies.set('network', {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      shouldRetry: (error: Error, attempt: number) => {
        if (error instanceof NetworkError) {
          // Don't retry client errors except rate limits
          if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            return error.statusCode === 429; // Retry rate limits
          }
          return true;
        }
        return attempt <= 3;
      },
      onRetry: (attempt: number, error: Error) => {
        addBreadcrumb('recovery', `Network recovery attempt ${attempt}`, 'info', { 
          error: error.message,
          strategy: 'network',
        });
      },
      onSuccess: (attempt: number) => {
        addBreadcrumb('recovery', `Network recovery succeeded after ${attempt} attempts`, 'info');
      },
      onFailure: (error: Error, attempts: number) => {
        addBreadcrumb('recovery', `Network recovery failed after ${attempts} attempts`, 'error', {
          error: error.message,
        });
      },
    });

    // Authentication error recovery
    this.recoveryStrategies.set('auth', {
      maxRetries: 1,
      retryDelay: 0,
      backoffMultiplier: 1,
      shouldRetry: (error: Error, attempt: number) => {
        if (error instanceof AuthError) {
          // Only retry token expiration
          return attempt === 1 && error.authType === 'token';
        }
        return false;
      },
      onRetry: async (attempt: number, error: Error) => {
        addBreadcrumb('recovery', 'Attempting token refresh', 'info');
        // Token refresh logic would be implemented here
        // This is a placeholder for the actual token refresh
      },
      onSuccess: (attempt: number) => {
        addBreadcrumb('recovery', 'Auth recovery succeeded', 'info');
      },
      onFailure: (error: Error, attempts: number) => {
        addBreadcrumb('recovery', 'Auth recovery failed', 'error', {
          error: error.message,
        });
      },
    });

    // Database error recovery
    this.recoveryStrategies.set('database', {
      maxRetries: 2,
      retryDelay: 500,
      backoffMultiplier: 2,
      shouldRetry: (error: Error, attempt: number) => {
        if (error instanceof DatabaseError) {
          // Retry timeouts and connection issues
          return attempt <= 2 && (
            error.code.includes('TIMEOUT') || 
            error.code.includes('CONNECTION_FAILED')
          );
        }
        return false;
      },
      onRetry: (attempt: number, error: Error) => {
        addBreadcrumb('recovery', `Database recovery attempt ${attempt}`, 'warning', {
          error: error.message,
          strategy: 'database',
        });
      },
      onSuccess: (attempt: number) => {
        addBreadcrumb('recovery', `Database recovery succeeded after ${attempt} attempts`, 'info');
      },
      onFailure: (error: Error, attempts: number) => {
        addBreadcrumb('recovery', `Database recovery failed after ${attempts} attempts`, 'error', {
          error: error.message,
        });
      },
    });

    // Web3 error recovery
    this.recoveryStrategies.set('web3', {
      maxRetries: 2,
      retryDelay: 2000,
      backoffMultiplier: 1.5,
      shouldRetry: (error: Error, attempt: number) => {
        if (error instanceof Web3Error) {
          // Don't retry user rejections
          if (error.code.includes('USER_REJECTED')) {
            return false;
          }
          // Retry network and gas estimation errors
          return attempt <= 2 && (
            error.code.includes('NETWORK') || 
            error.code.includes('GAS')
          );
        }
        return false;
      },
      onRetry: (attempt: number, error: Error) => {
        addBreadcrumb('recovery', `Web3 recovery attempt ${attempt}`, 'warning', {
          error: error.message,
          strategy: 'web3',
        });
      },
      onSuccess: (attempt: number) => {
        addBreadcrumb('recovery', `Web3 recovery succeeded after ${attempt} attempts`, 'info');
      },
      onFailure: (error: Error, attempts: number) => {
        addBreadcrumb('recovery', `Web3 recovery failed after ${attempts} attempts`, 'error', {
          error: error.message,
        });
      },
    });

    // Cache fallback strategy
    this.recoveryStrategies.set('cache', {
      maxRetries: 0, // No retries, just fallback
      retryDelay: 0,
      backoffMultiplier: 1,
      shouldRetry: () => false,
      onRetry: () => {},
      onSuccess: () => {
        addBreadcrumb('recovery', 'Cache fallback succeeded', 'info');
      },
      onFailure: (error: Error) => {
        addBreadcrumb('recovery', 'Cache fallback failed', 'error', {
          error: error.message,
        });
      },
    });
  }

  /**
   * Attempt recovery from an error
   * Requirements: 4.1, 4.2
   */
  public async attemptRecovery(error: AppError, operation: () => Promise<any>): Promise<RecoveryResult> {
    const strategyName = this.selectRecoveryStrategy(error);
    const operationKey = this.generateOperationKey(error);
    
    addBreadcrumb('recovery', `Starting recovery for ${error.code}`, 'info', {
      strategy: strategyName,
      operationKey,
      errorCode: error.code,
    });

    const startTime = Date.now();
    
    try {
      // Check circuit breaker first
      if (circuitBreakerManager.isCircuitOpen(operationKey)) {
        throw new Error(`Circuit breaker is open for operation: ${operationKey}`);
      }

      // Execute with retry strategy
      const result = await retryManager.executeWithRetry(
        operation,
        strategyName,
        this.recoveryStrategies.get(strategyName)
      );

      // Update recovery stats
      this.updateRecoveryStats(operationKey, true, result.recoveryTime, result.attempts);

      return {
        success: result.success,
        attempts: result.attempts,
        finalError: result.finalError,
        recoveryTime: Date.now() - startTime,
        strategy: strategyName,
      };
    } catch (recoveryError) {
      const recoveryTime = Date.now() - startTime;
      
      // Update recovery stats
      this.updateRecoveryStats(operationKey, false, recoveryTime, 1);

      addBreadcrumb('recovery', `Recovery failed for ${error.code}`, 'error', {
        strategy: strategyName,
        operationKey,
        error: recoveryError.message,
        recoveryTime,
      });

      return {
        success: false,
        attempts: 1,
        finalError: recoveryError as Error,
        recoveryTime,
        strategy: strategyName,
      };
    }
  }

  /**
   * Select appropriate recovery strategy based on error type
   * Requirements: 4.4, 4.5
   */
  private selectRecoveryStrategy(error: AppError): string {
    if (error instanceof NetworkError) {
      return 'network';
    }
    if (error instanceof AuthError) {
      return 'auth';
    }
    if (error instanceof DatabaseError) {
      return 'database';
    }
    if (error instanceof Web3Error) {
      return 'web3';
    }
    if (error instanceof BadgeError) {
      return 'cache'; // Badge errors often benefit from cache fallback
    }
    if (error instanceof CurationError) {
      return 'cache'; // Curation errors can use cache fallback
    }

    // Default to network strategy for unknown errors
    return 'network';
  }

  /**
   * Generate operation key for circuit breaker
   */
  private generateOperationKey(error: AppError): string {
    const context = error.context;
    const component = context?.component || 'unknown';
    const action = context?.action || 'unknown';
    
    return `${component}-${action}-${error.code}`;
  }

  /**
   * Update recovery statistics
   */
  private updateRecoveryStats(
    operationKey: string, 
    success: boolean, 
    recoveryTime: number, 
    attempts: number
  ): void {
    let stats = this.recoveryStats.get(operationKey);
    
    if (!stats) {
      stats = {
        totalAttempts: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        avgRecoveryTime: 0,
      };
      this.recoveryStats.set(operationKey, stats);
    }

    stats.totalAttempts += attempts;
    stats.lastRecoveryAttempt = new Date();

    if (success) {
      stats.successfulRecoveries++;
    } else {
      stats.failedRecoveries++;
    }

    // Update average recovery time
    const totalRecoveries = stats.successfulRecoveries + stats.failedRecoveries;
    stats.avgRecoveryTime = (stats.avgRecoveryTime * (totalRecoveries - 1) + recoveryTime) / totalRecoveries;
  }

  /**
   * Register a custom recovery strategy
   */
  public registerStrategy(errorCode: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorCode, strategy);
    
    addBreadcrumb('recovery', `Registered custom recovery strategy for ${errorCode}`, 'info', {
      errorCode,
      maxRetries: strategy.maxRetries,
      retryDelay: strategy.retryDelay,
    });
  }

  /**
   * Check if circuit breaker is open for operation
   */
  public isCircuitOpen(operationKey: string): boolean {
    return circuitBreakerManager.isCircuitOpen(operationKey);
  }

  /**
   * Reset circuit breaker for operation
   */
  public resetCircuit(operationKey: string): void {
    circuitBreakerManager.resetCircuit(operationKey);
    
    addBreadcrumb('recovery', `Reset circuit breaker for ${operationKey}`, 'info', {
      operationKey,
    });
  }

  /**
   * Get recovery statistics for operation
   */
  public getRecoveryStats(operationKey: string): RecoveryStats {
    const stats = this.recoveryStats.get(operationKey);
    
    if (!stats) {
      return {
        totalAttempts: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        avgRecoveryTime: 0,
      };
    }

    return { ...stats };
  }

  /**
   * Get all recovery statistics
   */
  public getAllRecoveryStats(): Map<string, RecoveryStats> {
    return new Map(this.recoveryStats);
  }

  /**
   * Get all registered strategies
   */
  public getStrategies(): Map<string, RecoveryStrategy> {
    return new Map(this.recoveryStrategies);
  }

  /**
   * Remove a recovery strategy
   */
  public removeStrategy(errorCode: string): boolean {
    const removed = this.recoveryStrategies.delete(errorCode);
    
    if (removed) {
      addBreadcrumb('recovery', `Removed recovery strategy for ${errorCode}`, 'info', {
        errorCode,
      });
    }
    
    return removed;
  }

  /**
   * Configure circuit breaker for operation
   */
  public configureCircuitBreaker(operationKey: string, config: Partial<CircuitBreakerConfig>): void {
    const circuitBreaker = circuitBreakerManager.getCircuitBreaker(operationKey, config);
    
    addBreadcrumb('recovery', `Configured circuit breaker for ${operationKey}`, 'info', {
      operationKey,
      config,
    });
  }

  /**
   * Execute operation with full recovery orchestration
   */
  public async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: {
      operationKey: string;
      errorType?: string;
      circuitBreakerConfig?: Partial<CircuitBreakerConfig>;
      recoveryStrategy?: Partial<RecoveryStrategy>;
    }
  ): Promise<T> {
    const { operationKey, errorType, circuitBreakerConfig, recoveryStrategy } = context;

    // Configure circuit breaker if needed
    if (circuitBreakerConfig) {
      this.configureCircuitBreaker(operationKey, circuitBreakerConfig);
    }

    // Register custom recovery strategy if provided
    if (errorType && recoveryStrategy) {
      const existingStrategy = this.recoveryStrategies.get(errorType);
      const mergedStrategy = { ...existingStrategy, ...recoveryStrategy };
      this.registerStrategy(errorType, mergedStrategy as RecoveryStrategy);
    }

    try {
      // Execute through circuit breaker
      return await circuitBreakerManager.execute(operationKey, operation, circuitBreakerConfig);
    } catch (error) {
      // If circuit breaker execution fails, attempt recovery
      if (error instanceof AppError) {
        const recoveryResult = await this.attemptRecovery(error, operation);
        
        if (recoveryResult.success) {
          // Recovery succeeded, but we don't have the actual result
          // Re-execute the operation
          return await operation();
        } else {
          throw recoveryResult.finalError || error;
        }
      }
      
      throw error;
    }
  }

  /**
   * Reset all recovery data
   */
  public reset(): void {
    this.recoveryStrategies.clear();
    this.recoveryStats.clear();
    this.setupDefaultStrategies();
    
    addBreadcrumb('recovery', 'Reset all recovery strategies and stats', 'info');
  }
}

// Export singleton instance
export const errorRecoveryManager = ErrorRecoveryManager.getInstance();

// Export convenience functions
export async function attemptRecovery(error: AppError, operation: () => Promise<any>): Promise<RecoveryResult> {
  return errorRecoveryManager.attemptRecovery(error, operation);
}

export function registerRecoveryStrategy(errorCode: string, strategy: RecoveryStrategy): void {
  errorRecoveryManager.registerStrategy(errorCode, strategy);
}

export function isCircuitOpen(operationKey: string): boolean {
  return errorRecoveryManager.isCircuitOpen(operationKey);
}

export function resetCircuit(operationKey: string): void {
  errorRecoveryManager.resetCircuit(operationKey);
}

export function getRecoveryStats(operationKey: string): RecoveryStats {
  return errorRecoveryManager.getRecoveryStats(operationKey);
}

export async function executeWithRecovery<T>(
  operation: () => Promise<T>,
  context: {
    operationKey: string;
    errorType?: string;
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>;
    recoveryStrategy?: Partial<RecoveryStrategy>;
  }
): Promise<T> {
  return errorRecoveryManager.executeWithRecovery(operation, context);
}