/**
 * Error Rate Limiter
 * Prevents error log flooding by rate limiting identical errors
 * Requirements: C14.1, C14.2, C14.3, C14.4, C14.5
 */

import {
  ErrorRateLimiter as IErrorRateLimiter,
  RateLimitConfig,
  RateLimitState,
  ErrorSeverity,
} from '../types/errors';

/**
 * Error Rate Limiter Implementation
 * Tracks error occurrences and suppresses repeated errors to prevent log flooding
 */
export class ErrorRateLimiter implements IErrorRateLimiter {
  private config: RateLimitConfig;
  private errorStates: Map<string, RateLimitState> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of expired rate limit states
   */
  private startCleanupInterval(): void {
    // Clean up every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredStates();
    }, 60000);
  }

  /**
   * Clean up expired rate limit states
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [errorCode, state] of this.errorStates.entries()) {
      const windowEnd = state.windowStart.getTime() + this.config.windowSize;
      const suppressionEnd = state.lastSuppression
        ? state.lastSuppression.getTime() + this.config.suppressionDuration
        : 0;

      // Remove if both window and suppression have expired
      if (now > windowEnd && now > suppressionEnd) {
        expiredKeys.push(errorCode);
      }
    }

    for (const key of expiredKeys) {
      this.errorStates.delete(key);
    }
  }

  /**
   * Check if an error should be logged based on rate limits
   * Requirements: C14.1, C14.2
   */
  public shouldLog(errorCode: string): boolean {
    const state = this.errorStates.get(errorCode);
    const now = new Date();

    // If no state exists, allow logging
    if (!state) {
      return true;
    }

    // Check if we're in suppression period
    if (state.isSuppressed) {
      const suppressionEnd = state.lastSuppression
        ? state.lastSuppression.getTime() + this.config.suppressionDuration
        : 0;

      if (now.getTime() < suppressionEnd) {
        return false;
      }

      // Suppression period ended, reset state
      state.isSuppressed = false;
      state.count = 0;
      state.suppressedCount = 0;
      state.windowStart = now;
      return true;
    }

    // Check if we're still in the same window
    const windowEnd = state.windowStart.getTime() + this.config.windowSize;
    
    if (now.getTime() > windowEnd) {
      // Window expired, check if we're still in suppression
      if (state.lastSuppression) {
        const suppressionEnd = state.lastSuppression.getTime() + this.config.suppressionDuration;
        if (now.getTime() < suppressionEnd) {
          // Still in suppression period
          return false;
        }
      }
      
      // Window expired and not in suppression, reset and allow
      state.count = 0;
      state.suppressedCount = 0;
      state.windowStart = now;
      state.isSuppressed = false;
      return true;
    }

    // Check if we've exceeded the limit
    if (state.count >= this.config.maxErrorsPerWindow) {
      // Start suppression
      state.isSuppressed = true;
      state.lastSuppression = now;
      return false;
    }

    // Within limits, allow logging
    return true;
  }

  /**
   * Record an error occurrence
   * Requirements: C14.3
   */
  public recordError(errorCode: string): void {
    const now = new Date();
    let state = this.errorStates.get(errorCode);

    if (!state) {
      // Create new state
      state = {
        errorCode,
        count: 1,
        suppressedCount: 0,
        windowStart: now,
        isSuppressed: false,
      };
      this.errorStates.set(errorCode, state);
      return;
    }

    // Check if we're in suppression
    if (state.isSuppressed) {
      state.suppressedCount++;
      return;
    }

    // Check if window has expired
    const windowEnd = state.windowStart.getTime() + this.config.windowSize;
    if (now.getTime() > windowEnd) {
      // Reset for new window
      state.count = 1;
      state.suppressedCount = 0;
      state.windowStart = now;
      state.isSuppressed = false;
      return;
    }

    // Increment count in current window
    state.count++;

    // Check if we should start suppression
    if (state.count >= this.config.maxErrorsPerWindow) {
      state.isSuppressed = true;
      state.lastSuppression = now;
    }
  }

  /**
   * Get the number of suppressed errors for a given error code
   * Requirements: C14.3, C14.4
   */
  public getSuppressedCount(errorCode: string): number {
    const state = this.errorStates.get(errorCode);
    return state?.suppressedCount || 0;
  }

  /**
   * Reset all rate limits
   */
  public resetLimits(): void {
    this.errorStates.clear();
  }

  /**
   * Reset rate limit for a specific error code
   */
  public resetLimit(errorCode: string): void {
    this.errorStates.delete(errorCode);
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfiguration(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current state for an error code
   */
  public getState(errorCode: string): RateLimitState | undefined {
    const state = this.errorStates.get(errorCode);
    return state ? { ...state } : undefined;
  }

  /**
   * Get all error states
   */
  public getAllStates(): Map<string, RateLimitState> {
    return new Map(this.errorStates);
  }

  /**
   * Check if an error code is currently suppressed
   */
  public isSuppressed(errorCode: string): boolean {
    const state = this.errorStates.get(errorCode);
    if (!state) {
      return false;
    }

    if (!state.isSuppressed) {
      return false;
    }

    // Check if suppression has expired
    const now = Date.now();
    const suppressionEnd = state.lastSuppression
      ? state.lastSuppression.getTime() + this.config.suppressionDuration
      : 0;

    return now < suppressionEnd;
  }

  /**
   * Get statistics for rate limiting
   */
  public getStats(): {
    totalErrorCodes: number;
    suppressedErrorCodes: number;
    totalSuppressedErrors: number;
  } {
    let suppressedErrorCodes = 0;
    let totalSuppressedErrors = 0;

    for (const state of this.errorStates.values()) {
      if (state.isSuppressed) {
        suppressedErrorCodes++;
      }
      totalSuppressedErrors += state.suppressedCount;
    }

    return {
      totalErrorCodes: this.errorStates.size,
      suppressedErrorCodes,
      totalSuppressedErrors,
    };
  }

  /**
   * Check if critical errors should bypass rate limiting
   * Requirements: C14.5
   */
  public shouldBypassForCritical(severity: ErrorSeverity): boolean {
    return this.config.criticalErrorsBypass && severity === ErrorSeverity.CRITICAL;
  }

  /**
   * Force log an error regardless of rate limits (for critical errors)
   * Requirements: C14.5
   */
  public forceLog(errorCode: string): void {
    // Reset the error state to allow logging
    const state = this.errorStates.get(errorCode);
    if (state) {
      state.isSuppressed = false;
      state.count = 0;
      state.suppressedCount = 0;
      state.windowStart = new Date();
      state.lastSuppression = undefined;
    }
  }

  /**
   * Cleanup and stop intervals
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.errorStates.clear();
  }
}

/**
 * Create a default error rate limiter instance
 */
export function createErrorRateLimiter(config?: Partial<RateLimitConfig>): ErrorRateLimiter {
  const defaultConfig: RateLimitConfig = {
    windowSize: 60000, // 1 minute
    maxErrorsPerWindow: 10,
    suppressionDuration: 300000, // 5 minutes
    criticalErrorsBypass: true,
  };

  return new ErrorRateLimiter({ ...defaultConfig, ...config });
}
