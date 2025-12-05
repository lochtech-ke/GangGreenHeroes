/**
 * Tests for Supabase health check logging and metrics
 * Validates Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkSupabaseHealth,
  clearHealthCheckCache,
  getHealthCheckMetrics,
  resetHealthCheckMetrics,
  logHealthCheckMetrics,
  getLastHealthCheck,
} from './supabaseHealth';

// Mock the supabase client
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import { supabase } from '../services/supabase';

describe('Health Check Logging and Metrics', () => {
  beforeEach(() => {
    // Clear cache and reset metrics before each test
    clearHealthCheckCache();
    resetHealthCheckMetrics();
    vi.clearAllMocks();
    
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should log health check initiation (Requirement 4.1)', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    await checkSupabaseHealth();

    expect(console.log).toHaveBeenCalledWith(
      '[Health] Performing Supabase health check...'
    );
  });

  it('should log completion with duration and result for successful check (Requirement 4.2)', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    await checkSupabaseHealth();

    // Should log completion with duration
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[Health] Supabase is healthy'),
      expect.objectContaining({
        duration: expect.stringMatching(/\d+ms/),
      })
    );
  });

  it('should log error details when health check fails (Requirement 4.3)', async () => {
    // Mock error response
    const testError = new Error('Connection failed');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: testError,
    } as any);

    await checkSupabaseHealth();

    // Should log error with details
    expect(console.warn).toHaveBeenCalledWith(
      '[Health] Supabase health check failed:',
      expect.objectContaining({
        error: 'Connection failed',
        duration: expect.stringMatching(/\d+ms/),
      })
    );
  });

  it('should provide complete metrics data (Requirement 4.4)', async () => {
    // Mock successful response with slight delay to ensure duration > 0
    vi.mocked(supabase.auth.getSession).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { session: null },
                error: null,
              } as any),
            1
          )
        )
    );

    await checkSupabaseHealth();

    const metrics = getHealthCheckMetrics();

    // Verify all required fields are present
    expect(metrics).toHaveProperty('totalChecks');
    expect(metrics).toHaveProperty('successfulChecks');
    expect(metrics).toHaveProperty('failedChecks');
    expect(metrics).toHaveProperty('averageDuration');
    expect(metrics).toHaveProperty('lastCheckTime');

    // Verify values are correct
    expect(metrics.totalChecks).toBe(1);
    expect(metrics.successfulChecks).toBe(1);
    expect(metrics.failedChecks).toBe(0);
    expect(metrics.averageDuration).toBeGreaterThanOrEqual(0);
    expect(metrics.lastCheckTime).toBeGreaterThan(0);
  });

  it('should log aggregate statistics for low success rates (Requirement 4.5)', async () => {
    // Perform 5 checks with 3 failures (60% failure rate)
    for (let i = 0; i < 5; i++) {
      clearHealthCheckCache();
      
      if (i < 3) {
        // First 3 fail
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
          data: { session: null },
          error: new Error('Failed'),
        } as any);
      } else {
        // Last 2 succeed
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
          data: { session: null },
          error: null,
        } as any);
      }

      await checkSupabaseHealth();
    }

    // Should have logged warning about low success rate
    expect(console.warn).toHaveBeenCalledWith(
      '[Health] Low health check success rate:',
      expect.objectContaining({
        successRate: expect.stringMatching(/\d+\.\d+%/),
        total: 5,
        successful: 2,
        failed: 3,
        averageDuration: expect.stringMatching(/\d+ms/),
      })
    );
  });

  it('should distinguish timeout errors from other errors', async () => {
    // Mock timeout
    vi.mocked(supabase.auth.getSession).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 10)
        )
    );

    await checkSupabaseHealth();

    // Should log timeout-specific error
    expect(console.error).toHaveBeenCalledWith(
      '[Health] Health check timed out (>5000ms):',
      expect.objectContaining({
        error: expect.stringContaining('timeout'),
        duration: expect.stringMatching(/\d+ms/),
      })
    );
  });

  it('should log performance warnings for slow checks', async () => {
    // Mock slow response (>2000ms)
    vi.mocked(supabase.auth.getSession).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { session: null },
                error: null,
              } as any),
            2100
          )
        )
    );

    await checkSupabaseHealth();

    // Should log slow performance warning
    expect(console.warn).toHaveBeenCalledWith(
      '[Health] Supabase is healthy (slow performance)',
      expect.objectContaining({
        duration: expect.stringMatching(/\d+ms/),
        warning: 'Health check exceeded 2000ms threshold',
      })
    );
  });

  it('should recognize optimal performance (<1000ms)', async () => {
    // Mock fast response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    await checkSupabaseHealth();

    // Should log optimal performance (no warning)
    expect(console.log).toHaveBeenCalledWith(
      '[Health] Supabase is healthy (optimal performance)',
      expect.objectContaining({
        duration: expect.stringMatching(/\d+ms/),
      })
    );
  });

  it('should log metrics summary', () => {
    logHealthCheckMetrics();

    expect(console.log).toHaveBeenCalledWith(
      '[Health] Health Check Metrics:',
      expect.objectContaining({
        totalChecks: expect.any(Number),
        successfulChecks: expect.any(Number),
        failedChecks: expect.any(Number),
        successRate: expect.stringMatching(/\d+\.\d+%/),
        averageDuration: expect.stringMatching(/\d+ms/),
        lastCheckTime: expect.any(String),
      })
    );
  });
});

describe('Health Check Cache Behavior', () => {
  beforeEach(() => {
    // Clear cache and reset metrics before each test
    clearHealthCheckCache();
    resetHealthCheckMetrics();
    vi.clearAllMocks();
    
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should cache health check results and reuse within TTL (Requirement 2.4)', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    // First check - should call getSession
    await checkSupabaseHealth();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);

    // Second check within TTL - should use cache
    await checkSupabaseHealth();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1); // Still 1, not 2

    // Verify cache usage was logged
    expect(console.log).toHaveBeenCalledWith(
      '[Health] Using cached health check result:',
      expect.objectContaining({
        isHealthy: true,
        age: expect.stringMatching(/\d+\.\d+s/),
      })
    );
  });

  it('should reuse cached results for multiple operations within TTL (Requirement 2.4)', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    // First check
    const result1 = await checkSupabaseHealth();
    expect(result1).toBe(true);
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);

    // Multiple subsequent checks within TTL
    const result2 = await checkSupabaseHealth();
    const result3 = await checkSupabaseHealth();
    const result4 = await checkSupabaseHealth();

    // All should return same result
    expect(result2).toBe(true);
    expect(result3).toBe(true);
    expect(result4).toBe(true);

    // But getSession should only be called once
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it('should perform new check after cache TTL expires (Requirement 2.5)', async () => {
    // Use fake timers to control time
    vi.useFakeTimers();

    // Mock successful response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    // First check
    await checkSupabaseHealth();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);

    // Advance time past cache TTL (10 seconds + buffer)
    vi.advanceTimersByTime(10100);

    // Second check after TTL - should perform new check
    await checkSupabaseHealth();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(2);

    // Should log new check, not cache usage
    const logCalls = vi.mocked(console.log).mock.calls;
    const lastCall = logCalls[logCalls.length - 1];
    expect(lastCall[0]).toContain('[Health] Supabase is healthy');

    // Restore real timers
    vi.useRealTimers();
  });

  it('should cache both successful and failed results (Requirement 6.5)', async () => {
    // Mock failed response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: new Error('Connection failed'),
    } as any);

    // First check - should fail and cache the failure
    const result1 = await checkSupabaseHealth();
    expect(result1).toBe(false);
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);

    // Second check within TTL - should use cached failure
    const result2 = await checkSupabaseHealth();
    expect(result2).toBe(false);
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1); // Still 1

    // Verify cached result was used
    expect(console.log).toHaveBeenCalledWith(
      '[Health] Using cached health check result:',
      expect.objectContaining({
        isHealthy: false,
        age: expect.stringMatching(/\d+\.\d+s/),
      })
    );
  });

  it('should force new check when forceCheck is true, bypassing cache (Requirement 2.4)', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    // First check
    await checkSupabaseHealth();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);

    // Force check should bypass cache
    await checkSupabaseHealth(true);
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(2);
  });

  it('should return cached result with correct timestamp and age (Requirement 6.5)', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    // First check
    const beforeCheck = Date.now();
    await checkSupabaseHealth();
    const afterCheck = Date.now();

    // Get cached result
    const cachedResult = getLastHealthCheck();
    expect(cachedResult).not.toBeNull();
    expect(cachedResult!.isHealthy).toBe(true);
    expect(cachedResult!.timestamp).toBeGreaterThanOrEqual(beforeCheck);
    expect(cachedResult!.timestamp).toBeLessThanOrEqual(afterCheck);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second check should use cache
    await checkSupabaseHealth();

    // Verify age is calculated correctly
    expect(console.log).toHaveBeenCalledWith(
      '[Health] Using cached health check result:',
      expect.objectContaining({
        isHealthy: true,
        age: expect.stringMatching(/0\.\d+s/), // Should be less than 1 second
      })
    );
  });

  it('should clear cache when clearHealthCheckCache is called', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    // First check
    await checkSupabaseHealth();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);

    // Clear cache
    clearHealthCheckCache();

    // Next check should perform new check
    await checkSupabaseHealth();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(2);
  });

  it('should maintain separate cache entries for different check results', async () => {
    // First check - success
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const result1 = await checkSupabaseHealth();
    expect(result1).toBe(true);

    // Clear cache and change mock to failure
    clearHealthCheckCache();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: new Error('Failed'),
    } as any);

    const result2 = await checkSupabaseHealth();
    expect(result2).toBe(false);

    // Cached result should now be the failure
    const cachedResult = getLastHealthCheck();
    expect(cachedResult!.isHealthy).toBe(false);
    expect(cachedResult!.error).toBe('Failed');
  });

  it('should cache timeout errors correctly (Requirement 6.5)', async () => {
    // Mock timeout
    vi.mocked(supabase.auth.getSession).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 10)
        )
    );

    // First check - should timeout and cache
    const result1 = await checkSupabaseHealth();
    expect(result1).toBe(false);

    // Second check within TTL - should use cached timeout
    const result2 = await checkSupabaseHealth();
    expect(result2).toBe(false);

    // Verify cached result
    const cachedResult = getLastHealthCheck();
    expect(cachedResult!.isHealthy).toBe(false);
    expect(cachedResult!.error).toContain('timeout');
  });
});
