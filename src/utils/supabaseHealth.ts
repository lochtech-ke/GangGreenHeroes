/**
 * Supabase health check utility
 * Requirements: 4.5
 */

import { supabase } from '../services/supabase';

interface HealthCheckResult {
  isHealthy: boolean;
  timestamp: number;
  duration: number;
  error?: string;
}

interface HealthCheckMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageDuration: number;
  lastCheckTime: number;
}

/**
 * Health Check Monitor
 * Tracks health check performance metrics over time
 */
class HealthCheckMonitor {
  private metrics: HealthCheckMetrics = {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    averageDuration: 0,
    lastCheckTime: 0,
  };

  recordCheck(result: HealthCheckResult): void {
    this.metrics.totalChecks++;
    this.metrics.lastCheckTime = result.timestamp;

    if (result.isHealthy) {
      this.metrics.successfulChecks++;
    } else {
      this.metrics.failedChecks++;
    }

    // Update average duration
    const totalDuration =
      this.metrics.averageDuration * (this.metrics.totalChecks - 1);
    this.metrics.averageDuration =
      (totalDuration + result.duration) / this.metrics.totalChecks;

    // Log warning if success rate is low
    const successRate =
      this.metrics.successfulChecks / this.metrics.totalChecks;
    if (this.metrics.totalChecks >= 5 && successRate < 0.5) {
      console.warn('[Health] Low health check success rate:', {
        successRate: `${(successRate * 100).toFixed(1)}%`,
        total: this.metrics.totalChecks,
        successful: this.metrics.successfulChecks,
        failed: this.metrics.failedChecks,
        averageDuration: `${this.metrics.averageDuration.toFixed(0)}ms`,
      });
    }
  }

  getMetrics(): HealthCheckMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageDuration: 0,
      lastCheckTime: 0,
    };
    console.log('[Health] Metrics reset');
  }
}

// Cache health check results to avoid repeated checks
let lastHealthCheck: HealthCheckResult | null = null;
const HEALTH_CHECK_CACHE_TTL = 10000; // 10 seconds

// Singleton instance of health check monitor
const healthCheckMonitor = new HealthCheckMonitor();

/**
 * Checks if the Supabase connection is healthy
 * Uses a quick connection test with timeout and caches results
 * @param forceCheck - Force a new health check, bypassing cache
 * @returns true if Supabase is healthy, false otherwise
 */
export async function checkSupabaseHealth(
  forceCheck: boolean = false
): Promise<boolean> {
  const now = Date.now();

  // Return cached result if available and not expired
  if (
    !forceCheck &&
    lastHealthCheck &&
    now - lastHealthCheck.timestamp < HEALTH_CHECK_CACHE_TTL
  ) {
    console.log('[Health] Using cached health check result:', {
      isHealthy: lastHealthCheck.isHealthy,
      age: `${((now - lastHealthCheck.timestamp) / 1000).toFixed(1)}s`,
    });
    return lastHealthCheck.isHealthy;
  }

  console.log('[Health] Performing Supabase health check...');

  try {
    // Connection test with 5 second timeout using auth.getSession()
    const healthCheckPromise = supabase.auth.getSession();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), 5000)
    );

    const { error } = await Promise.race([
      healthCheckPromise,
      timeoutPromise,
    ]);

    const duration = Date.now() - now;
    const isHealthy = !error;

    // Cache the result
    lastHealthCheck = {
      isHealthy,
      timestamp: now,
      duration,
      error: error?.message,
    };

    // Record metrics
    healthCheckMonitor.recordCheck(lastHealthCheck);

    if (isHealthy) {
      // Classify performance and log accordingly
      if (duration < 1000) {
        console.log('[Health] Supabase is healthy (optimal performance)', {
          duration: `${duration}ms`,
        });
      } else if (duration < 2000) {
        console.log('[Health] Supabase is healthy (acceptable performance)', {
          duration: `${duration}ms`,
        });
      } else {
        console.warn('[Health] Supabase is healthy (slow performance)', {
          duration: `${duration}ms`,
          warning: 'Health check exceeded 2000ms threshold',
        });
      }
    } else {
      console.warn('[Health] Supabase health check failed:', {
        error: error?.message,
        duration: `${duration}ms`,
      });
    }

    return isHealthy;
  } catch (error) {
    const duration = Date.now() - now;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Classify the error type for better logging
    const isTimeout = errorMessage.includes('timeout');
    
    if (isTimeout) {
      console.error('[Health] Health check timed out (>5000ms):', {
        error: errorMessage,
        duration: `${duration}ms`,
      });
    } else {
      console.error('[Health] Health check failed:', {
        error: errorMessage,
        duration: `${duration}ms`,
      });
    }

    // Cache the failure
    lastHealthCheck = {
      isHealthy: false,
      timestamp: now,
      duration,
      error: errorMessage,
    };

    // Record metrics
    healthCheckMonitor.recordCheck(lastHealthCheck);

    return false;
  }
}

/**
 * Clears the health check cache
 * Useful for testing or when you want to force a fresh check
 */
export function clearHealthCheckCache(): void {
  lastHealthCheck = null;
  console.log('[Health] Health check cache cleared');
}

/**
 * Gets the last health check result without performing a new check
 * @returns The last health check result or null if no check has been performed
 */
export function getLastHealthCheck(): HealthCheckResult | null {
  return lastHealthCheck;
}

/**
 * Gets health check metrics for debugging and monitoring
 * @returns Current health check metrics
 */
export function getHealthCheckMetrics(): HealthCheckMetrics {
  return healthCheckMonitor.getMetrics();
}

/**
 * Resets health check metrics
 * Useful for testing or clearing historical data
 */
export function resetHealthCheckMetrics(): void {
  healthCheckMonitor.reset();
}

/**
 * Logs current health check metrics to console
 * Useful for debugging and monitoring
 */
export function logHealthCheckMetrics(): void {
  const metrics = healthCheckMonitor.getMetrics();
  const successRate =
    metrics.totalChecks > 0
      ? (metrics.successfulChecks / metrics.totalChecks) * 100
      : 0;

  console.log('[Health] Health Check Metrics:', {
    totalChecks: metrics.totalChecks,
    successfulChecks: metrics.successfulChecks,
    failedChecks: metrics.failedChecks,
    successRate: `${successRate.toFixed(1)}%`,
    averageDuration: `${metrics.averageDuration.toFixed(0)}ms`,
    lastCheckTime: metrics.lastCheckTime
      ? new Date(metrics.lastCheckTime).toISOString()
      : 'Never',
  });
}
