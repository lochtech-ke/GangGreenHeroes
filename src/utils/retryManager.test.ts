/**
 * Retry Manager Tests
 * Tests for retry mechanism with exponential backoff
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetryManager, DEFAULT_STRATEGIES } from './retryManager';
import { RecoveryStrategy } from '../types/errors';

describe('RetryManager', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager();
    vi.clearAllMocks();
  });

  describe('retry with default strategies', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryManager.retry(operation, 'network');

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await retryManager.retry(operation, 'network');

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(result.data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should exhaust retries and fail', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent error'));

      const result = await retryManager.retry(operation, 'network');

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // maxRetries for network
      expect(result.finalError).toBeDefined();
      expect(result.finalError?.message).toBe('Persistent error');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should apply exponential backoff', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      const result = await retryManager.retry(operation, 'network');
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      
      // Network strategy: 1000ms * 2^0 + 1000ms * 2^1 = 1000 + 2000 = 3000ms minimum
      expect(duration).toBeGreaterThanOrEqual(3000);
    });
  });

  describe('custom strategies', () => {
    it('should use custom strategy', async () => {
      const customStrategy: Partial<RecoveryStrategy> = {
        maxRetries: 5,
        retryDelay: 100,
        backoffMultiplier: 1,
      };

      const operation = vi.fn().mockRejectedValue(new Error('Error'));

      const result = await retryManager.retry(operation, 'network', customStrategy);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(5);
      expect(operation).toHaveBeenCalledTimes(5);
    });

    it('should respect custom shouldRetry logic', async () => {
      const customStrategy: Partial<RecoveryStrategy> = {
        shouldRetry: (error: Error, attempt: number) => {
          // Only retry if error message contains "retry"
          return error.message.includes('retry') && attempt < 3;
        },
      };

      const operation = vi.fn().mockRejectedValue(new Error('Do not retry'));

      const result = await retryManager.retry(operation, 'network', customStrategy);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1); // Should not retry
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const customStrategy: Partial<RecoveryStrategy> = {
        onRetry,
      };

      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      await retryManager.retry(operation, 'network', customStrategy);

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error));
    });

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn();
      const customStrategy: Partial<RecoveryStrategy> = {
        onSuccess,
      };

      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValue('success');

      await retryManager.retry(operation, 'network', customStrategy);

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(1); // 1 retry before success
    });

    it('should call onFailure callback', async () => {
      const onFailure = vi.fn();
      const customStrategy: Partial<RecoveryStrategy> = {
        onFailure,
      };

      const operation = vi.fn().mockRejectedValue(new Error('Persistent error'));

      await retryManager.retry(operation, 'network', customStrategy);

      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledWith(expect.any(Error), 3);
    });
  });

  describe('strategy management', () => {
    it('should register custom strategy', () => {
      const customStrategy: RecoveryStrategy = {
        maxRetries: 10,
        retryDelay: 500,
        backoffMultiplier: 3,
        shouldRetry: () => true,
      };

      retryManager.registerStrategy('custom', customStrategy);

      const strategies = retryManager.getStrategies();
      expect(strategies.has('custom')).toBe(true);
      expect(strategies.get('custom')).toEqual(customStrategy);
    });

    it('should remove strategy', () => {
      retryManager.registerStrategy('temp', DEFAULT_STRATEGIES.network);
      
      const removed = retryManager.removeStrategy('temp');
      
      expect(removed).toBe(true);
      expect(retryManager.getStrategies().has('temp')).toBe(false);
    });

    it('should reset to default strategies', () => {
      retryManager.registerStrategy('custom', DEFAULT_STRATEGIES.network);
      
      retryManager.reset();
      
      const strategies = retryManager.getStrategies();
      expect(strategies.has('custom')).toBe(false);
      expect(strategies.has('network')).toBe(true);
      expect(strategies.has('auth')).toBe(true);
      expect(strategies.has('database')).toBe(true);
    });
  });

  describe('default strategies', () => {
    it('should have network strategy', () => {
      const strategies = retryManager.getStrategies();
      expect(strategies.has('network')).toBe(true);
      
      const networkStrategy = strategies.get('network')!;
      expect(networkStrategy.maxRetries).toBe(3);
      expect(networkStrategy.retryDelay).toBe(1000);
      expect(networkStrategy.backoffMultiplier).toBe(2);
    });

    it('should have auth strategy', () => {
      const strategies = retryManager.getStrategies();
      expect(strategies.has('auth')).toBe(true);
      
      const authStrategy = strategies.get('auth')!;
      expect(authStrategy.maxRetries).toBe(2);
      expect(authStrategy.retryDelay).toBe(500);
    });

    it('should have database strategy', () => {
      const strategies = retryManager.getStrategies();
      expect(strategies.has('database')).toBe(true);
      
      const dbStrategy = strategies.get('database')!;
      expect(dbStrategy.maxRetries).toBe(3);
      expect(dbStrategy.retryDelay).toBe(2000);
      expect(dbStrategy.backoffMultiplier).toBe(1.5);
    });

    it('should have curation strategy', () => {
      const strategies = retryManager.getStrategies();
      expect(strategies.has('curation')).toBe(true);
      
      const curationStrategy = strategies.get('curation')!;
      expect(curationStrategy.maxRetries).toBe(2);
      expect(curationStrategy.retryDelay).toBe(500);
    });
  });

  describe('recovery time tracking', () => {
    it('should track recovery time', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValue('success');

      const result = await retryManager.retry(operation, 'network');

      expect(result.recoveryTime).toBeGreaterThan(0);
      expect(result.recoveryTime).toBeGreaterThanOrEqual(1000); // At least one retry delay
    });

    it('should track recovery time on failure', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Error'));

      const result = await retryManager.retry(operation, 'network');

      expect(result.recoveryTime).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined strategy key', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryManager.retry(operation, 'nonexistent');

      // Should fall back to network strategy
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('nonexistent');
    });

    it('should handle operation that throws non-Error', async () => {
      const operation = vi.fn().mockRejectedValue('string error');

      const result = await retryManager.retry(operation, 'network');

      expect(result.success).toBe(false);
      expect(result.finalError).toBeDefined();
    });

    it('should not wait after last retry attempt', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Error'));

      const startTime = Date.now();
      await retryManager.retry(operation, 'network');
      const duration = Date.now() - startTime;

      // Should not include delay after 3rd attempt
      // Expected: 1000 + 2000 = 3000ms (not 3000 + 4000)
      expect(duration).toBeLessThan(4000);
    });
  });
});
