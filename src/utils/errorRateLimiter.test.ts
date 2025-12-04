/**
 * Error Rate Limiter Tests
 * Unit tests for error rate limiting functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ErrorRateLimiter } from './errorRateLimiter';
import { ErrorSeverity } from '../types/errors';

describe('ErrorRateLimiter', () => {
  let rateLimiter: ErrorRateLimiter;

  beforeEach(() => {
    rateLimiter = new ErrorRateLimiter({
      windowSize: 1000, // 1 second for testing
      maxErrorsPerWindow: 3,
      suppressionDuration: 2000, // 2 seconds for testing
      criticalErrorsBypass: true,
    });
  });

  afterEach(() => {
    rateLimiter.destroy();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow errors within limit', () => {
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(true);
      rateLimiter.recordError('TEST_ERROR');
      
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(true);
      rateLimiter.recordError('TEST_ERROR');
      
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(true);
      rateLimiter.recordError('TEST_ERROR');
    });

    it('should suppress errors exceeding limit', () => {
      // Record 3 errors (at limit)
      for (let i = 0; i < 3; i++) {
        expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(true);
        rateLimiter.recordError('TEST_ERROR');
      }
      
      // 4th error should be suppressed
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(false);
    });

    it('should track different error codes independently', () => {
      // Record 3 errors for ERROR_A
      for (let i = 0; i < 3; i++) {
        expect(rateLimiter.shouldLog('ERROR_A')).toBe(true);
        rateLimiter.recordError('ERROR_A');
      }
      
      // ERROR_A should be suppressed
      expect(rateLimiter.shouldLog('ERROR_A')).toBe(false);
      
      // ERROR_B should still be allowed
      expect(rateLimiter.shouldLog('ERROR_B')).toBe(true);
    });
  });

  describe('Suppression Counting', () => {
    it('should count suppressed errors', () => {
      // Record errors up to limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordError('TEST_ERROR');
      }
      
      // Record suppressed errors
      rateLimiter.recordError('TEST_ERROR');
      rateLimiter.recordError('TEST_ERROR');
      
      expect(rateLimiter.getSuppressedCount('TEST_ERROR')).toBe(2);
    });

    it('should return 0 for non-existent error codes', () => {
      expect(rateLimiter.getSuppressedCount('NON_EXISTENT')).toBe(0);
    });
  });

  describe('Window Expiration', () => {
    it('should reset after window and suppression expire', async () => {
      // Record errors up to limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordError('TEST_ERROR');
      }
      
      // Should be suppressed
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(false);
      
      // Wait for both window and suppression to expire (suppression is 2000ms)
      await new Promise(resolve => setTimeout(resolve, 2100));
      
      // Should be allowed again
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(true);
    });
  });

  describe('Suppression Duration', () => {
    it('should maintain suppression during suppression period', async () => {
      // Record errors up to limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordError('TEST_ERROR');
      }
      
      // Should be suppressed
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(false);
      
      // Wait less than suppression duration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should still be suppressed
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(false);
    });

    it('should end suppression after suppression duration', async () => {
      // Record errors up to limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordError('TEST_ERROR');
      }
      
      // Should be suppressed
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(false);
      
      // Wait for suppression duration to expire
      await new Promise(resolve => setTimeout(resolve, 2100));
      
      // Should be allowed again
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should return current configuration', () => {
      const config = rateLimiter.getConfiguration();
      
      expect(config.windowSize).toBe(1000);
      expect(config.maxErrorsPerWindow).toBe(3);
      expect(config.suppressionDuration).toBe(2000);
      expect(config.criticalErrorsBypass).toBe(true);
    });

    it('should update configuration', () => {
      rateLimiter.updateConfiguration({
        maxErrorsPerWindow: 5,
      });
      
      const config = rateLimiter.getConfiguration();
      expect(config.maxErrorsPerWindow).toBe(5);
      expect(config.windowSize).toBe(1000); // Should remain unchanged
    });
  });

  describe('State Management', () => {
    it('should return state for error code', () => {
      rateLimiter.recordError('TEST_ERROR');
      
      const state = rateLimiter.getState('TEST_ERROR');
      
      expect(state).toBeDefined();
      expect(state?.errorCode).toBe('TEST_ERROR');
      expect(state?.count).toBe(1);
      expect(state?.isSuppressed).toBe(false);
    });

    it('should return undefined for non-existent error code', () => {
      const state = rateLimiter.getState('NON_EXISTENT');
      expect(state).toBeUndefined();
    });

    it('should return all states', () => {
      rateLimiter.recordError('ERROR_A');
      rateLimiter.recordError('ERROR_B');
      
      const states = rateLimiter.getAllStates();
      
      expect(states.size).toBe(2);
      expect(states.has('ERROR_A')).toBe(true);
      expect(states.has('ERROR_B')).toBe(true);
    });
  });

  describe('Suppression Status', () => {
    it('should report suppression status correctly', () => {
      // Record errors up to limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordError('TEST_ERROR');
      }
      
      // Trigger suppression
      rateLimiter.shouldLog('TEST_ERROR');
      
      expect(rateLimiter.isSuppressed('TEST_ERROR')).toBe(true);
    });

    it('should report not suppressed for non-existent error', () => {
      expect(rateLimiter.isSuppressed('NON_EXISTENT')).toBe(false);
    });

    it('should report not suppressed after suppression expires', async () => {
      // Record errors up to limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordError('TEST_ERROR');
      }
      
      // Trigger suppression
      rateLimiter.shouldLog('TEST_ERROR');
      expect(rateLimiter.isSuppressed('TEST_ERROR')).toBe(true);
      
      // Wait for suppression to expire
      await new Promise(resolve => setTimeout(resolve, 2100));
      
      expect(rateLimiter.isSuppressed('TEST_ERROR')).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      // Record errors for multiple codes
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordError('ERROR_A');
      }
      rateLimiter.shouldLog('ERROR_A'); // Trigger suppression
      
      for (let i = 0; i < 2; i++) {
        rateLimiter.recordError('ERROR_B');
      }
      
      // Record suppressed errors
      rateLimiter.recordError('ERROR_A');
      rateLimiter.recordError('ERROR_A');
      
      const stats = rateLimiter.getStats();
      
      expect(stats.totalErrorCodes).toBe(2);
      expect(stats.suppressedErrorCodes).toBe(1);
      expect(stats.totalSuppressedErrors).toBe(2);
    });
  });

  describe('Critical Error Bypass', () => {
    it('should bypass rate limiting for critical errors when enabled', () => {
      expect(rateLimiter.shouldBypassForCritical(ErrorSeverity.CRITICAL)).toBe(true);
    });

    it('should not bypass for non-critical errors', () => {
      expect(rateLimiter.shouldBypassForCritical(ErrorSeverity.HIGH)).toBe(false);
      expect(rateLimiter.shouldBypassForCritical(ErrorSeverity.MEDIUM)).toBe(false);
      expect(rateLimiter.shouldBypassForCritical(ErrorSeverity.LOW)).toBe(false);
    });

    it('should respect bypass configuration', () => {
      rateLimiter.updateConfiguration({ criticalErrorsBypass: false });
      expect(rateLimiter.shouldBypassForCritical(ErrorSeverity.CRITICAL)).toBe(false);
    });
  });

  describe('Force Logging', () => {
    it('should allow force logging of suppressed errors', () => {
      // Record errors up to limit
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordError('TEST_ERROR');
      }
      
      // Should be suppressed
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(false);
      
      // Force log
      rateLimiter.forceLog('TEST_ERROR');
      
      // Should now be allowed
      expect(rateLimiter.shouldLog('TEST_ERROR')).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all limits', () => {
      rateLimiter.recordError('ERROR_A');
      rateLimiter.recordError('ERROR_B');
      
      rateLimiter.resetLimits();
      
      const states = rateLimiter.getAllStates();
      expect(states.size).toBe(0);
    });

    it('should reset specific error limit', () => {
      rateLimiter.recordError('ERROR_A');
      rateLimiter.recordError('ERROR_B');
      
      rateLimiter.resetLimit('ERROR_A');
      
      const states = rateLimiter.getAllStates();
      expect(states.size).toBe(1);
      expect(states.has('ERROR_B')).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clean up on destroy', () => {
      rateLimiter.recordError('TEST_ERROR');
      
      rateLimiter.destroy();
      
      const states = rateLimiter.getAllStates();
      expect(states.size).toBe(0);
    });
  });
});
