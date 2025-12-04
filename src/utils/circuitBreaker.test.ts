/**
 * Circuit Breaker Tests
 * Tests for circuit breaker pattern implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerRegistry,
  DEFAULT_CONFIG,
} from './circuitBreaker';
import { CircuitBreakerState } from '../types/errors';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker();
    vi.clearAllMocks();
  });

  describe('state transitions', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(breaker.isOpen()).toBe(false);
    });

    it('should transition to OPEN after threshold failures', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Trigger failures up to threshold
      for (let i = 0; i < DEFAULT_CONFIG.failureThreshold; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);
      expect(breaker.isOpen()).toBe(true);
    });

    it('should reject calls when OPEN', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < DEFAULT_CONFIG.failureThreshold; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      // Try to execute when open
      await expect(breaker.execute(operation)).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < DEFAULT_CONFIG.failureThreshold; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Wait for reset timeout (use shorter timeout for testing)
      breaker.updateConfig({ resetTimeout: 100 });
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Next call should transition to HALF_OPEN
      operation.mockResolvedValue('success');
      await breaker.execute(operation);

      expect(breaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
    });

    it('should transition to CLOSED after successful calls in HALF_OPEN', async () => {
      const operation = vi.fn();

      // Open the circuit
      operation.mockRejectedValue(new Error('Failure'));
      for (let i = 0; i < DEFAULT_CONFIG.failureThreshold; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      // Wait for reset timeout
      breaker.updateConfig({ resetTimeout: 100 });
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Succeed in HALF_OPEN state
      operation.mockResolvedValue('success');
      for (let i = 0; i < DEFAULT_CONFIG.halfOpenMaxCalls; i++) {
        await breaker.execute(operation);
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should reopen on failure in HALF_OPEN state', async () => {
      const operation = vi.fn();

      // Open the circuit
      operation.mockRejectedValue(new Error('Failure'));
      for (let i = 0; i < DEFAULT_CONFIG.failureThreshold; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      // Wait for reset timeout
      breaker.updateConfig({ resetTimeout: 100 });
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Fail in HALF_OPEN state
      try {
        await breaker.execute(operation);
      } catch (error) {
        // Expected
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('failure tracking', () => {
    it('should track failure count', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(3);
    });

    it('should track success count', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      for (let i = 0; i < 3; i++) {
        await breaker.execute(operation);
      }

      const stats = breaker.getStats();
      expect(stats.successCount).toBe(3);
    });

    it('should reset failure count on success in CLOSED state', async () => {
      const operation = vi.fn();

      // Some failures
      operation.mockRejectedValue(new Error('Failure'));
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      // Then success
      operation.mockResolvedValue('success');
      await breaker.execute(operation);

      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(0);
    });

    it('should track failures within monitoring period', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));
      
      breaker.updateConfig({
        monitoringPeriod: 1000,
        failureThreshold: 3,
      });

      // First failure
      try {
        await breaker.execute(operation);
      } catch (error) {
        // Expected
      }

      // Wait for monitoring period to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // More failures (should not trigger open because first one expired)
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customBreaker = new CircuitBreaker({
        failureThreshold: 10,
        resetTimeout: 30000,
        monitoringPeriod: 5000,
        halfOpenMaxCalls: 5,
      });

      const config = customBreaker.getConfig();
      expect(config.failureThreshold).toBe(10);
      expect(config.resetTimeout).toBe(30000);
      expect(config.monitoringPeriod).toBe(5000);
      expect(config.halfOpenMaxCalls).toBe(5);
    });

    it('should update configuration', () => {
      breaker.updateConfig({
        failureThreshold: 10,
      });

      const config = breaker.getConfig();
      expect(config.failureThreshold).toBe(10);
      expect(config.resetTimeout).toBe(DEFAULT_CONFIG.resetTimeout); // Unchanged
    });
  });

  describe('manual reset', () => {
    it('should manually reset circuit', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < DEFAULT_CONFIG.failureThreshold; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Manual reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(breaker.getStats().failureCount).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should provide accurate statistics', async () => {
      const operation = vi.fn();

      // Some successes
      operation.mockResolvedValue('success');
      await breaker.execute(operation);
      await breaker.execute(operation);

      // Some failures
      operation.mockRejectedValue(new Error('Failure'));
      try {
        await breaker.execute(operation);
      } catch (error) {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.state).toBe(CircuitBreakerState.CLOSED);
      expect(stats.successCount).toBe(2);
      expect(stats.failureCount).toBe(1);
      expect(stats.lastSuccessTime).toBeDefined();
      expect(stats.lastFailureTime).toBeDefined();
    });
  });
});

describe('CircuitBreakerRegistry', () => {
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    registry = new CircuitBreakerRegistry();
  });

  describe('breaker management', () => {
    it('should create breaker on first access', () => {
      const breaker = registry.getBreaker('test-operation');
      
      expect(breaker).toBeDefined();
      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should reuse existing breaker', () => {
      const breaker1 = registry.getBreaker('test-operation');
      const breaker2 = registry.getBreaker('test-operation');
      
      expect(breaker1).toBe(breaker2);
    });

    it('should create separate breakers for different operations', () => {
      const breaker1 = registry.getBreaker('operation-1');
      const breaker2 = registry.getBreaker('operation-2');
      
      expect(breaker1).not.toBe(breaker2);
    });

    it('should remove breaker', () => {
      registry.getBreaker('test-operation');
      
      const removed = registry.removeBreaker('test-operation');
      
      expect(removed).toBe(true);
      
      // Should create new breaker on next access
      const newBreaker = registry.getBreaker('test-operation');
      expect(newBreaker).toBeDefined();
    });

    it('should clear all breakers', () => {
      registry.getBreaker('operation-1');
      registry.getBreaker('operation-2');
      
      registry.clear();
      
      expect(registry.getOperationKeys()).toHaveLength(0);
    });
  });

  describe('execute with registry', () => {
    it('should execute operation through registry', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await registry.execute('test-operation', operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should track circuit state per operation', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open circuit for operation-1
      for (let i = 0; i < DEFAULT_CONFIG.failureThreshold; i++) {
        try {
          await registry.execute('operation-1', operation);
        } catch (error) {
          // Expected
        }
      }

      expect(registry.isCircuitOpen('operation-1')).toBe(true);
      expect(registry.isCircuitOpen('operation-2')).toBe(false);
    });
  });

  describe('circuit control', () => {
    it('should check if circuit is open', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      expect(registry.isCircuitOpen('test-operation')).toBe(false);

      // Open the circuit
      for (let i = 0; i < DEFAULT_CONFIG.failureThreshold; i++) {
        try {
          await registry.execute('test-operation', operation);
        } catch (error) {
          // Expected
        }
      }

      expect(registry.isCircuitOpen('test-operation')).toBe(true);
    });

    it('should reset circuit', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < DEFAULT_CONFIG.failureThreshold; i++) {
        try {
          await registry.execute('test-operation', operation);
        } catch (error) {
          // Expected
        }
      }

      registry.resetCircuit('test-operation');

      expect(registry.isCircuitOpen('test-operation')).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should get stats for operation', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      await registry.execute('test-operation', operation);

      const stats = registry.getStats('test-operation');
      
      expect(stats).toBeDefined();
      expect(stats?.successCount).toBe(1);
    });

    it('should return null for non-existent operation', () => {
      const stats = registry.getStats('non-existent');
      
      expect(stats).toBeNull();
    });
  });

  describe('configuration', () => {
    it('should use custom config for breaker', () => {
      const customConfig = {
        failureThreshold: 10,
        resetTimeout: 30000,
      };

      const breaker = registry.getBreaker('test-operation', customConfig);
      const config = breaker.getConfig();

      expect(config.failureThreshold).toBe(10);
      expect(config.resetTimeout).toBe(30000);
    });

    it('should set default config for new breakers', () => {
      registry.setDefaultConfig({
        failureThreshold: 15,
      });

      const breaker = registry.getBreaker('test-operation');
      const config = breaker.getConfig();

      expect(config.failureThreshold).toBe(15);
    });
  });

  describe('operation keys', () => {
    it('should list all operation keys', () => {
      registry.getBreaker('operation-1');
      registry.getBreaker('operation-2');
      registry.getBreaker('operation-3');

      const keys = registry.getOperationKeys();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('operation-1');
      expect(keys).toContain('operation-2');
      expect(keys).toContain('operation-3');
    });
  });
});
