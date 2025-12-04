/**
 * Circuit Breaker
 * Implements circuit breaker pattern to prevent cascading failures
 * Requirements: C4.3
 */

import {
  CircuitBreakerState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
} from '../types/errors';

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5, // Open circuit after 5 failures
  resetTimeout: 60000, // Try to close after 60 seconds
  monitoringPeriod: 10000, // Monitor failures over 10 seconds
  halfOpenMaxCalls: 3, // Allow 3 calls in half-open state
};

/**
 * Circuit Breaker Implementation
 * Prevents repeated attempts to execute operations likely to fail
 * Requirements: C4.3
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private openedAt?: Date;
  private nextAttemptTime?: Date;
  private halfOpenCallCount: number = 0;
  private config: CircuitBreakerConfig;
  private failureTimestamps: Date[] = [];

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute operation with circuit breaker protection
   * Requirements: C4.3
   */
  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      // Check if reset timeout has passed
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        throw new Error(
          `Circuit breaker is OPEN. Next attempt at ${this.nextAttemptTime?.toISOString()}`
        );
      }
    }

    // Check half-open call limit
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        throw new Error('Circuit breaker is HALF_OPEN and max calls reached');
      }
      this.halfOpenCallCount++;
    }

    try {
      // Execute the operation
      const result = await operation();
      
      // Record success
      this.onSuccess();
      
      return result;
    } catch (error) {
      // Record failure
      this.onFailure();
      
      throw error;
    }
  }

  /**
   * Record successful operation
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // If we've had enough successful calls in half-open, close the circuit
      if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        this.transitionToClosed();
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
      this.failureTimestamps = [];
    }
  }

  /**
   * Record failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.failureTimestamps.push(new Date());

    // Clean up old failure timestamps outside monitoring period
    this.cleanupOldFailures();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open state reopens the circuit
      this.transitionToOpen();
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Check if we've exceeded failure threshold within monitoring period
      const recentFailures = this.failureTimestamps.length;
      if (recentFailures >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    }
  }

  /**
   * Clean up failure timestamps outside monitoring period
   */
  private cleanupOldFailures(): void {
    const cutoffTime = Date.now() - this.config.monitoringPeriod;
    this.failureTimestamps = this.failureTimestamps.filter(
      (timestamp) => timestamp.getTime() > cutoffTime
    );
  }

  /**
   * Check if we should attempt to reset (transition to half-open)
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return false;
    }
    return Date.now() >= this.nextAttemptTime.getTime();
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCallCount = 0;
    this.failureTimestamps = [];
    this.openedAt = undefined;
    this.nextAttemptTime = undefined;
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.openedAt = new Date();
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
    this.halfOpenCallCount = 0;
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.halfOpenCallCount = 0;
  }

  /**
   * Get current circuit breaker state
   */
  public getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  public getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Check if circuit is open
   */
  public isOpen(): boolean {
    if (this.state === CircuitBreakerState.OPEN) {
      // Check if we should transition to half-open
      if (this.shouldAttemptReset()) {
        return false; // Will transition on next execute
      }
      return true;
    }
    return false;
  }

  /**
   * Manually reset the circuit breaker
   */
  public reset(): void {
    this.transitionToClosed();
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }
}

/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers by operation key
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig = DEFAULT_CONFIG;

  /**
   * Get or create circuit breaker for operation
   */
  public getBreaker(
    operationKey: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(operationKey)) {
      const breakerConfig = config ? { ...this.defaultConfig, ...config } : this.defaultConfig;
      this.breakers.set(operationKey, new CircuitBreaker(breakerConfig));
    }
    return this.breakers.get(operationKey)!;
  }

  /**
   * Execute operation with circuit breaker
   */
  public async execute<T>(
    operationKey: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const breaker = this.getBreaker(operationKey, config);
    return breaker.execute(operation);
  }

  /**
   * Check if circuit is open for operation
   */
  public isCircuitOpen(operationKey: string): boolean {
    const breaker = this.breakers.get(operationKey);
    return breaker ? breaker.isOpen() : false;
  }

  /**
   * Reset circuit breaker for operation
   */
  public resetCircuit(operationKey: string): void {
    const breaker = this.breakers.get(operationKey);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * Get stats for operation
   */
  public getStats(operationKey: string): CircuitBreakerStats | null {
    const breaker = this.breakers.get(operationKey);
    return breaker ? breaker.getStats() : null;
  }

  /**
   * Get all operation keys
   */
  public getOperationKeys(): string[] {
    return Array.from(this.breakers.keys());
  }

  /**
   * Remove circuit breaker
   */
  public removeBreaker(operationKey: string): boolean {
    return this.breakers.delete(operationKey);
  }

  /**
   * Clear all circuit breakers
   */
  public clear(): void {
    this.breakers.clear();
  }

  /**
   * Set default configuration for new breakers
   */
  public setDefaultConfig(config: Partial<CircuitBreakerConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
