/**
 * Enhanced API Client with Error Handling
 * 
 * Provides a wrapper around Supabase client with:
 * - Retry mechanism with exponential backoff
 * - Circuit breaker pattern for failing operations
 * - Automatic token refresh
 * - Network error classification
 * - Error context tracking
 * 
 * Requirements: C4.1, C4.2, C4.3
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { RetryManager } from './retryManager';
import { CircuitBreakerRegistry } from './circuitBreaker';
import { errorHandler } from './errorHandler';
import { DatabaseError, NetworkError, AuthError } from '../types/errors';

/**
 * API Client Configuration
 */
interface ApiClientConfig {
  enableRetry: boolean;
  enableCircuitBreaker: boolean;
  enableAutoRefresh: boolean;
  retryAttempts: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ApiClientConfig = {
  enableRetry: true,
  enableCircuitBreaker: true,
  enableAutoRefresh: true,
  retryAttempts: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minute
};

/**
 * Enhanced API Client
 * 
 * Wraps Supabase client with error handling, retry logic, and circuit breaker
 */
export class ApiClient {
  private client: SupabaseClient;
  private retryManager: RetryManager;
  private circuitBreaker: CircuitBreakerRegistry;
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.client = supabase;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize retry manager
    this.retryManager = new RetryManager();
    
    // Register custom database strategy with config values
    this.retryManager.registerStrategy('database', {
      maxRetries: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
      backoffMultiplier: 2,
      shouldRetry: (error: Error, attempt: number) => {
        const message = error.message.toLowerCase();
        return attempt < this.config.retryAttempts && 
               (message.includes('timeout') || message.includes('connection') || message.includes('network'));
      },
    });

    // Initialize circuit breaker registry
    this.circuitBreaker = new CircuitBreakerRegistry();
    
    // Set default config for circuit breakers
    this.circuitBreaker.setDefaultConfig({
      failureThreshold: this.config.circuitBreakerThreshold,
      resetTimeout: this.config.circuitBreakerTimeout,
      monitoringPeriod: 60000,
    });
  }

  /**
   * Execute a database query with error handling
   * 
   * Requirement C4.1: Retry with exponential backoff
   * Requirement C4.2: Automatic token refresh
   * Requirement C4.3: Circuit breaker pattern
   */
  async query<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    operationKey: string,
    context?: Record<string, any>
  ): Promise<T> {
    // Check circuit breaker
    if (this.config.enableCircuitBreaker && this.circuitBreaker.isCircuitOpen(operationKey)) {
      const error = new DatabaseError(
        'Circuit breaker is open for this operation',
        'CIRCUIT_BREAKER_OPEN',
        'high',
        { operationKey, ...context }
      );
      errorHandler.handleError(error);
      throw error;
    }

    // Execute with retry
    const executeOperation = async (): Promise<T> => {
      try {
        // Check for token expiration and refresh if needed
        if (this.config.enableAutoRefresh) {
          await this.ensureValidSession();
        }

        // Execute the operation
        const { data, error } = await operation();

        if (error) {
          // Classify and throw appropriate error
          throw this.classifyError(error, context);
        }

        if (data === null) {
          throw new DatabaseError(
            'Query returned null data',
            'NULL_DATA',
            'medium',
            { operationKey, ...context }
          );
        }

        // Circuit breaker success is handled by execute method
        return data;
      } catch (error) {
        // Circuit breaker failure is handled by execute method
        throw error;
      }
    };

    // Execute with circuit breaker and retry if enabled
    if (this.config.enableCircuitBreaker) {
      const executeWithCircuitBreaker = async () => {
        return await this.circuitBreaker.execute(operationKey, executeOperation);
      };

      if (this.config.enableRetry) {
        return await this.retryManager.retry(
          executeWithCircuitBreaker,
          'database'
        ).then(result => {
          if (result.success && result.data !== undefined) {
            return result.data;
          }
          throw result.finalError || new Error('Operation failed');
        });
      } else {
        return await executeWithCircuitBreaker();
      }
    } else if (this.config.enableRetry) {
      return await this.retryManager.retry(
        executeOperation,
        'database'
      ).then(result => {
        if (result.success && result.data !== undefined) {
          return result.data;
        }
        throw result.finalError || new Error('Operation failed');
      });
    } else {
      return await executeOperation();
    }
  }

  /**
   * Ensure valid session with automatic token refresh
   * 
   * Requirement C4.2: Automatic token refresh
   */
  private async ensureValidSession(): Promise<void> {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();

      if (error) {
        throw new AuthError(
          'Failed to get session',
          'SESSION_ERROR',
          'high',
          { originalError: error.message }
        );
      }

      // If no session, user needs to log in
      if (!session) {
        return;
      }

      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiresIn = expiresAt * 1000 - Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (expiresIn < fiveMinutes) {
          // Refresh the token
          const { error: refreshError } = await this.client.auth.refreshSession();

          if (refreshError) {
            throw new AuthError(
              'Failed to refresh token',
              'TOKEN_REFRESH_ERROR',
              'high',
              { originalError: refreshError.message }
            );
          }
        }
      }
    } catch (error) {
      // Log error but don't throw - let the operation proceed
      errorHandler.handleError(error as Error, {
        component: 'ApiClient',
        action: 'ensureValidSession',
      });
    }
  }

  /**
   * Classify Supabase errors into appropriate error types
   * 
   * Requirement C4.1: Network error classification
   */
  private classifyError(error: PostgrestError, context?: Record<string, any>): Error {
    const errorContext = {
      code: error.code,
      details: error.details,
      hint: error.hint,
      ...context,
    };

    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError(
        error.message,
        'NETWORK_ERROR',
        'high',
        errorContext,
        true // recoverable
      );
    }

    // Authentication errors
    if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      return new AuthError(
        error.message,
        'AUTH_ERROR',
        'high',
        errorContext,
        true // recoverable
      );
    }

    // Permission errors (RLS violations)
    if (error.code === '42501' || error.message.includes('permission')) {
      return new AuthError(
        'Insufficient permissions',
        'PERMISSION_DENIED',
        'medium',
        errorContext,
        false // not recoverable
      );
    }

    // Constraint violations
    if (error.code === '23505' || error.message.includes('duplicate')) {
      return new DatabaseError(
        'Duplicate entry',
        'DUPLICATE_ENTRY',
        'low',
        errorContext,
        false // not recoverable
      );
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return new DatabaseError(
        'Query timeout',
        'QUERY_TIMEOUT',
        'medium',
        errorContext,
        true // recoverable
      );
    }

    // Generic database error
    return new DatabaseError(
      error.message,
      'DATABASE_ERROR',
      'medium',
      errorContext,
      false
    );
  }

  /**
   * Determine if an error should be retried
   * 
   * Requirement C4.1: Retry logic
   */
  private shouldRetry(error: Error): boolean {
    // Retry network errors
    if (error instanceof NetworkError) {
      return true;
    }

    // Retry timeout errors
    if (error instanceof DatabaseError && error.code === 'QUERY_TIMEOUT') {
      return true;
    }

    // Retry auth errors (token might have been refreshed)
    if (error instanceof AuthError && error.recoverable) {
      return true;
    }

    // Don't retry other errors
    return false;
  }

  /**
   * Get the underlying Supabase client
   * For operations that don't need error handling wrapper
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Reset circuit breaker for a specific operation
   */
  resetCircuitBreaker(operationKey: string): void {
    this.circuitBreaker.resetCircuit(operationKey);
  }

  /**
   * Check if circuit breaker is open for an operation
   */
  isCircuitOpen(operationKey: string): boolean {
    return this.circuitBreaker.isCircuitOpen(operationKey);
  }
}

/**
 * Singleton instance of API client
 */
export const apiClient = new ApiClient();

/**
 * Helper function to execute queries with error handling
 * 
 * Usage:
 * ```typescript
 * const users = await withErrorHandling(
 *   () => supabase.from('users').select('*'),
 *   'users-list',
 *   { component: 'UserList' }
 * );
 * ```
 */
export async function withErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  operationKey: string,
  context?: Record<string, any>
): Promise<T> {
  return apiClient.query(operation, operationKey, context);
}
