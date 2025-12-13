/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring operation success/failure rates
 * Requirements: 4.3
 */

import { 
  CircuitBreakerState, 
  CircuitBreakerConfig, 
  CircuitBreakerStats 
} from '../types/errors';
import { addBreadcrumb } from './errorContext';

/**
 * Circuit Breaker Implementation
 * Implements the circuit breaker pattern with three states: CLOSED, OPEN, HALF_OPEN
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime?: Date;
  private halfOpenCalls: number = 0;

  constructor(
    private operationKey: string,
    private config: CircuitBreakerConfig
  ) {
    this.validateConfig();
  }

  /**
   * Validate circuit breaker configuration
   */
  private validateConfig(): void {
    if (this.config.failureThreshold <= 0) {
      throw new Error('Failure threshold must be greater than 0');
    }
    if (this.config.resetTimeout <= 0) {
      throw new Error('Reset timeout must be greater than 0');
    }
    if (this.config.monitoringPeriod <= 0) {
      throw new Error('Monitoring period must be greater than 0');
    }
    if (this.config.halfOpenMaxCalls <= 0) {
      throw new Error('Half open max calls must be greater than 0');
    }
  }

  /**
   * Execute operation through circuit breaker
   * Requirements: 4.3
   */
  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should transition states
    this.checkStateTransitions();

    // Handle different states
    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return this.executeInClosedState(operation);
      
      case CircuitBreakerState.OPEN:
        throw new Error(`Circuit breaker is open for operation: ${this.operationKey}`);
      
      case CircuitBreakerState.HALF_OPEN:
        return this.executeInHalfOpenState(operation);
      
      default:
        throw new Error(`Unknown circuit breaker state: ${this.state}`);
    }
  }

  /**
   * Execute operation in CLOSED state
   */
  private async executeInClosedState<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute operation in HALF_OPEN state
   */
  private async executeInHalfOpenState<T>(operation: () => Promise<T>): Promise<T> {
    if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      throw new Error(`Circuit breaker half-open call limit exceeded for operation: ${this.operationKey}`);
    }

    this.halfOpenCalls++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // If we've had enough successful calls in half-open, close the circuit
      if (this.successCount >= this.config.halfOpenMaxCalls) {
        this.transitionToClosed();
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }

    addBreadcrumb('circuit_breaker', `Operation succeeded for ${this.operationKey}`, 'info', {
      operationKey: this.operationKey,
      state: this.state,
      successCount: this.successCount,
      failureCount: this.failureCount,
    });
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitBreakerState.CLOSED) {
      // Check if we should open the circuit
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open state should open the circuit
      this.transitionToOpen();
    }

    addBreadcrumb('circuit_breaker', `Operation failed for ${this.operationKey}`, 'warning', {
      operationKey: this.operationKey,
      state: this.state,
      successCount: this.successCount,
      failureCount: this.failureCount,
    });
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.nextAttemptTime = undefined;

    addBreadcrumb('circuit_breaker', `Circuit breaker closed for ${this.operationKey}`, 'info', {
      operationKey: this.operationKey,
      previousState: 'HALF_OPEN',
      newState: 'CLOSED',
    });
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
    this.halfOpenCalls = 0;

    addBreadcrumb('circuit_breaker', `Circuit breaker opened for ${this.operationKey}`, 'error', {
      operationKey: this.operationKey,
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold,
      nextAttemptTime: this.nextAttemptTime,
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.successCount = 0;
    this.halfOpenCalls = 0;

    addBreadcrumb('circuit_breaker', `Circuit breaker half-opened for ${this.operationKey}`, 'info', {
      operationKey: this.operationKey,
      previousState: 'OPEN',
      newState: 'HALF_OPEN',
    });
  }

  /**
   * Check if state transitions are needed
   */
  private checkStateTransitions(): void {
    const now = new Date();

    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === CircuitBreakerState.OPEN && this.nextAttemptTime && now >= this.nextAttemptTime) {
      this.transitionToHalfOpen();
    }

    // Check if monitoring period has expired in CLOSED state
    if (this.state === CircuitBreakerState.CLOSED && this.lastFailureTime) {
      const timeSinceLastFailure = now.getTime() - this.lastFailureTime.getTime();
      if (timeSinceLastFailure > this.config.monitoringPeriod) {
        // Reset failure count after monitoring period
        this.failureCount = 0;
      }
    }
  }

  /**
   * Check if circuit is open
   */
  public isOpen(): boolean {
    this.checkStateTransitions();
    return this.state === CircuitBreakerState.OPEN;
  }

  /**
   * Check if circuit is closed
   */
  public isClosed(): boolean {
    this.checkStateTransitions();
    return this.state === CircuitBreakerState.CLOSED;
  }

  /**
   * Check if circuit is half-open
   */
  public isHalfOpen(): boolean {
    this.checkStateTransitions();
    return this.state === CircuitBreakerState.HALF_OPEN;
  }

  /**
   * Get current state
   */
  public getState(): CircuitBreakerState {
    this.checkStateTransitions();
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  public getStats(): CircuitBreakerStats {
    this.checkStateTransitions();
    
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
   * Force reset circuit breaker to CLOSED state
   */
  public reset(): void {
    this.transitionToClosed();
    
    addBreadcrumb('circuit_breaker', `Circuit breaker manually reset for ${this.operationKey}`, 'info', {
      operationKey: this.operationKey,
      action: 'manual_reset',
    });
  }

  /**
   * Force open circuit breaker
   */
  public forceOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
    
    addBreadcrumb('circuit_breaker', `Circuit breaker manually opened for ${this.operationKey}`, 'warning', {
      operationKey: this.operationKey,
      action: 'manual_open',
    });
  }

  /**
   * Get operation key
   */
  public getOperationKey(): string {
    return this.operationKey;
  }

  /**
   * Get configuration
   */
  public getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
    
    addBreadcrumb('circuit_breaker', `Circuit breaker config updated for ${this.operationKey}`, 'info', {
      operationKey: this.operationKey,
      newConfig,
    });
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different operations
 */
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 120000, // 2 minutes
    halfOpenMaxCalls: 3,
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  /**
   * Get or create circuit breaker for operation
   */
  public getCircuitBreaker(operationKey: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let circuitBreaker = this.circuitBreakers.get(operationKey);
    
    if (!circuitBreaker) {
      const finalConfig = { ...this.defaultConfig, ...config };
      circuitBreaker = new CircuitBreaker(operationKey, finalConfig);
      this.circuitBreakers.set(operationKey, circuitBreaker);
    }
    
    return circuitBreaker;
  }

  /**
   * Execute operation through circuit breaker
   */
  public async execute<T>(
    operationKey: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(operationKey, config);
    return circuitBreaker.execute(operation);
  }

  /**
   * Check if circuit is open for operation
   */
  public isCircuitOpen(operationKey: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(operationKey);
    return circuitBreaker ? circuitBreaker.isOpen() : false;
  }

  /**
   * Reset circuit breaker for operation
   */
  public resetCircuit(operationKey: string): void {
    const circuitBreaker = this.circuitBreakers.get(operationKey);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  /**
   * Get all circuit breaker statistics
   */
  public getAllStats(): Map<string, CircuitBreakerStats> {
    const stats = new Map<string, CircuitBreakerStats>();
    
    for (const [key, circuitBreaker] of this.circuitBreakers.entries()) {
      stats.set(key, circuitBreaker.getStats());
    }
    
    return stats;
  }

  /**
   * Remove circuit breaker for operation
   */
  public removeCircuitBreaker(operationKey: string): boolean {
    return this.circuitBreakers.delete(operationKey);
  }

  /**
   * Clear all circuit breakers
   */
  public clear(): void {
    this.circuitBreakers.clear();
  }

  /**
   * Set default configuration for new circuit breakers
   */
  public setDefaultConfig(config: Partial<CircuitBreakerConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get default configuration
   */
  public getDefaultConfig(): CircuitBreakerConfig {
    return { ...this.defaultConfig };
  }
}

// Export singleton instance
export const circuitBreakerManager = CircuitBreakerManager.getInstance();

// Export convenience functions
export async function executeWithCircuitBreaker<T>(
  operationKey: string,
  operation: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  return circuitBreakerManager.execute(operationKey, operation, config);
}

export function isCircuitOpen(operationKey: string): boolean {
  return circuitBreakerManager.isCircuitOpen(operationKey);
}

export function resetCircuit(operationKey: string): void {
  circuitBreakerManager.resetCircuit(operationKey);
}

export function getCircuitStats(operationKey: string): CircuitBreakerStats | undefined {
  const allStats = circuitBreakerManager.getAllStats();
  return allStats.get(operationKey);
}