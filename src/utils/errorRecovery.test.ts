/**
 * Error Recovery Manager Tests
 * Tests for error recovery orchestration with retry and circuit breaker
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorRecoveryManager, PREDEFINED_STRATEGIES } from './errorRecovery';
import { RetryManager } from './retryManager';
import { CircuitBreakerRegistry } from './circuitBreaker';
import {
  NetworkError,
  AuthError,
  DatabaseError,
  CurationError,
  NetworkErrorCodes,
  AuthErrorCodes,
  DatabaseErrorCodes,
  CurationErrorCodes,
} from '../types/errors';

describe('ErrorRecoveryManager', () => {
  let recoveryManager: ErrorRecoveryManager;
  let retryManager: RetryManager;
  let circuitBreaker: CircuitBreakerRegistry;

  beforeEach(() => {
    retryManager = new RetryManager();
    circuitBreaker = new CircuitBreakerRegistry();
    recoveryManager = new ErrorRecoveryManager(retryManager, circuitBreaker);
    vi.clearAllMocks();
  });

  describe('strategy selection', () => {
    it('should select network strategy for NetworkError', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED,
        500
      );
      const operation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.strategy).toBe('network');
      expect(result.success).toBe(true);
    });

    it('should select auth strategy for AuthError', async () => {
      const error = new AuthError(
        'Token expired',
        AuthErrorCodes.TOKEN_EXPIRED,
        'token'
      );
      const operation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.strategy).toBe('auth');
      expect(result.success).toBe(true);
    });

    it('should select database strategy for DatabaseError', async () => {
      const error = new DatabaseError(
        'Query timeout',
        DatabaseErrorCodes.QUERY_TIMEOUT
      );
      const operation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.strategy).toBe('database');
      expect(result.success).toBe(true);
    });

    it('should select curation strategy for CurationError', async () => {
      const error = new CurationError(
        'Scoring failed',
        CurationErrorCodes.SCORING_FAILED
      );
      const operation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.strategy).toBe('curation');
      expect(result.success).toBe(true);
    });

    it('should infer strategy from error code', async () => {
      const error = new NetworkError(
        'Network error',
        'NETWORK_CUSTOM_ERROR',
        500
      );
      const operation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.strategy).toBe('network');
    });
  });

  describe('recovery attempts', () => {
    it('should succeed on first attempt', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue('success');

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.success).toBe(true);
      expect(result.attempts).toBeGreaterThan(1);
    });

    it('should fail after exhausting retries', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.success).toBe(false);
      expect(result.finalError).toBeDefined();
    });

    it('should track recovery time', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue('success');

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.recoveryTime).toBeGreaterThan(0);
    });
  });

  describe('circuit breaker integration', () => {
    it('should prevent execution when circuit is open', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit by causing multiple failures
      for (let i = 0; i < 5; i++) {
        await recoveryManager.attemptRecovery(error, operation);
      }

      // Next attempt should be blocked by circuit breaker
      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(0);
      expect(result.finalError?.message).toContain('Circuit breaker is open');
    });

    it('should check circuit state', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      const operationKey = `${NetworkErrorCodes.CONNECTION_FAILED}`;

      expect(recoveryManager.isCircuitOpen(operationKey)).toBe(false);

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await recoveryManager.attemptRecovery(error, operation);
      }

      expect(recoveryManager.isCircuitOpen(operationKey)).toBe(true);
    });

    it('should reset circuit', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      const operationKey = `${NetworkErrorCodes.CONNECTION_FAILED}`;

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await recoveryManager.attemptRecovery(error, operation);
      }

      recoveryManager.resetCircuit(operationKey);

      expect(recoveryManager.isCircuitOpen(operationKey)).toBe(false);
    });
  });

  describe('statistics tracking', () => {
    it('should track recovery statistics', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockResolvedValue('success');

      await recoveryManager.attemptRecovery(error, operation);

      const stats = recoveryManager.getRecoveryStats(NetworkErrorCodes.CONNECTION_FAILED);

      expect(stats.totalAttempts).toBeGreaterThan(0);
      expect(stats.successfulRecoveries).toBe(1);
      expect(stats.failedRecoveries).toBe(0);
      expect(stats.avgRecoveryTime).toBeGreaterThan(0);
      expect(stats.lastRecoveryAttempt).toBeDefined();
    });

    it('should track failed recoveries', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      await recoveryManager.attemptRecovery(error, operation);

      const stats = recoveryManager.getRecoveryStats(NetworkErrorCodes.CONNECTION_FAILED);

      expect(stats.failedRecoveries).toBe(1);
      expect(stats.successfulRecoveries).toBe(0);
    });

    it('should calculate average recovery time', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockResolvedValue('success');

      // Multiple recovery attempts
      await recoveryManager.attemptRecovery(error, operation);
      await recoveryManager.attemptRecovery(error, operation);
      await recoveryManager.attemptRecovery(error, operation);

      const stats = recoveryManager.getRecoveryStats(NetworkErrorCodes.CONNECTION_FAILED);

      expect(stats.avgRecoveryTime).toBeGreaterThan(0);
      expect(stats.totalAttempts).toBeGreaterThanOrEqual(3);
    });

    it('should clear statistics', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockResolvedValue('success');

      await recoveryManager.attemptRecovery(error, operation);

      recoveryManager.clearStats();

      const stats = recoveryManager.getRecoveryStats(NetworkErrorCodes.CONNECTION_FAILED);
      expect(stats.totalAttempts).toBe(0);
    });
  });

  describe('custom strategies', () => {
    it('should register custom strategy', async () => {
      const customStrategy = {
        maxRetries: 5,
        retryDelay: 100,
        backoffMultiplier: 1,
        shouldRetry: () => true,
      };

      recoveryManager.registerStrategy('custom', customStrategy);

      const strategies = recoveryManager.getStrategies();
      expect(strategies.has('custom')).toBe(true);
    });

    it('should use custom strategy', async () => {
      const customStrategy = {
        maxRetries: 1,
        retryDelay: 100,
        backoffMultiplier: 1,
        shouldRetry: () => true,
      };

      recoveryManager.registerStrategy('CUSTOM_ERROR', customStrategy);

      const error = new NetworkError('Custom error', 'CUSTOM_ERROR');
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      const result = await recoveryManager.attemptRecovery(error, operation);

      // Should only attempt once due to custom strategy
      expect(result.attempts).toBeLessThanOrEqual(1);
    });
  });

  describe('predefined strategies', () => {
    it('should have network strategy', () => {
      const strategies = recoveryManager.getStrategies();
      expect(strategies.has('network')).toBe(true);
      
      const strategy = strategies.get('network')!;
      expect(strategy.maxRetries).toBe(3);
    });

    it('should have auth strategy', () => {
      const strategies = recoveryManager.getStrategies();
      expect(strategies.has('auth')).toBe(true);
      
      const strategy = strategies.get('auth')!;
      expect(strategy.maxRetries).toBe(2);
    });

    it('should have database strategy', () => {
      const strategies = recoveryManager.getStrategies();
      expect(strategies.has('database')).toBe(true);
      
      const strategy = strategies.get('database')!;
      expect(strategy.maxRetries).toBe(3);
    });

    it('should have cache strategy', () => {
      const strategies = recoveryManager.getStrategies();
      expect(strategies.has('cache')).toBe(true);
      
      const strategy = strategies.get('cache')!;
      expect(strategy.maxRetries).toBe(1);
    });

    it('should have curation strategy', () => {
      const strategies = recoveryManager.getStrategies();
      expect(strategies.has('curation')).toBe(true);
      
      const strategy = strategies.get('curation')!;
      expect(strategy.maxRetries).toBe(2);
    });
  });

  describe('operation key generation', () => {
    it('should generate operation key from error code', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockResolvedValue('success');

      await recoveryManager.attemptRecovery(error, operation);

      const stats = recoveryManager.getRecoveryStats(NetworkErrorCodes.CONNECTION_FAILED);
      expect(stats).toBeDefined();
    });

    it('should include component in operation key', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED,
        500,
        undefined,
        undefined,
        { component: 'TestComponent' }
      );
      const operation = vi.fn().mockResolvedValue('success');

      await recoveryManager.attemptRecovery(error, operation);

      const stats = recoveryManager.getRecoveryStats(
        `TestComponent:${NetworkErrorCodes.CONNECTION_FAILED}`
      );
      expect(stats).toBeDefined();
    });
  });

  describe('reset functionality', () => {
    it('should reset all recovery mechanisms', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockResolvedValue('success');

      // Create some state
      await recoveryManager.attemptRecovery(error, operation);
      recoveryManager.registerStrategy('custom', PREDEFINED_STRATEGIES.network);

      recoveryManager.reset();

      // Stats should be cleared
      const stats = recoveryManager.getRecoveryStats(NetworkErrorCodes.CONNECTION_FAILED);
      expect(stats.totalAttempts).toBe(0);

      // Custom strategy should be removed
      const strategies = recoveryManager.getStrategies();
      expect(strategies.has('custom')).toBe(false);

      // Predefined strategies should still exist
      expect(strategies.has('network')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle error without recovery strategy', async () => {
      const error = new NetworkError('Unknown error', 'UNKNOWN_CODE');
      const operation = vi.fn().mockResolvedValue('success');

      // Should fall back to network strategy
      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.success).toBe(true);
    });

    it('should handle operation that throws immediately', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('Immediate failure');
      });

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.success).toBe(false);
    });

    it('should handle async operation errors', async () => {
      const error = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const operation = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async failure');
      });

      const result = await recoveryManager.attemptRecovery(error, operation);

      expect(result.success).toBe(false);
    });
  });

  describe('getAllStats', () => {
    it('should return all recovery stats', async () => {
      const error1 = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      const error2 = new AuthError('Token expired', AuthErrorCodes.TOKEN_EXPIRED);
      const operation = vi.fn().mockResolvedValue('success');

      await recoveryManager.attemptRecovery(error1, operation);
      await recoveryManager.attemptRecovery(error2, operation);

      const allStats = recoveryManager.getAllStats();

      expect(allStats.size).toBeGreaterThan(0);
    });
  });
});
