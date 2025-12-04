/**
 * Unit tests for DebugLogger
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DebugLogger, LogLevel } from './debugLogger';

describe('DebugLogger', () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset logger state
    DebugLogger.clearNamespaces();
    DebugLogger.setLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Log Level System', () => {
    it('should log debug messages when level is DEBUG', () => {
      DebugLogger.setLevel(LogLevel.DEBUG);
      DebugLogger.debug('test', 'Debug message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log debug messages when level is INFO', () => {
      DebugLogger.setLevel(LogLevel.INFO);
      DebugLogger.debug('test', 'Debug message');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log info messages when level is INFO', () => {
      DebugLogger.setLevel(LogLevel.INFO);
      DebugLogger.info('test', 'Info message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log info messages when level is WARN', () => {
      DebugLogger.setLevel(LogLevel.WARN);
      DebugLogger.info('test', 'Info message');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log warn messages when level is WARN', () => {
      DebugLogger.setLevel(LogLevel.WARN);
      DebugLogger.warn('test', 'Warning message');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should not log warn messages when level is ERROR', () => {
      DebugLogger.setLevel(LogLevel.ERROR);
      DebugLogger.warn('test', 'Warning message');
      
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should log error messages when level is ERROR', () => {
      DebugLogger.setLevel(LogLevel.ERROR);
      DebugLogger.error('test', 'Error message');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not log any messages when level is NONE', () => {
      DebugLogger.setLevel(LogLevel.NONE);
      DebugLogger.debug('test', 'Debug');
      DebugLogger.info('test', 'Info');
      DebugLogger.warn('test', 'Warn');
      DebugLogger.error('test', 'Error');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should get and set log level', () => {
      DebugLogger.setLevel(LogLevel.WARN);
      expect(DebugLogger.getLevel()).toBe(LogLevel.WARN);
      
      DebugLogger.setLevel(LogLevel.DEBUG);
      expect(DebugLogger.getLevel()).toBe(LogLevel.DEBUG);
    });
  });

  describe('Namespace Filtering', () => {
    it('should log when namespace is enabled', () => {
      DebugLogger.enable('auth');
      DebugLogger.debug('auth', 'Auth debug message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log when namespace is disabled', () => {
      DebugLogger.enable('auth');
      DebugLogger.disable('auth');
      DebugLogger.debug('auth', 'Auth debug message');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log all namespaces when no filters are set', () => {
      DebugLogger.clearNamespaces();
      DebugLogger.debug('auth', 'Auth message');
      DebugLogger.debug('api', 'API message');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should only log enabled namespaces when filters are set', () => {
      DebugLogger.enable('auth');
      DebugLogger.debug('auth', 'Auth message');
      DebugLogger.debug('api', 'API message');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should support wildcard namespace patterns', () => {
      DebugLogger.enable('auth:*');
      DebugLogger.debug('auth:login', 'Login message');
      DebugLogger.debug('auth:register', 'Register message');
      DebugLogger.debug('api:fetch', 'Fetch message');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should enable multiple namespaces at once', () => {
      DebugLogger.enableMultiple(['auth', 'api', 'db']);
      
      expect(DebugLogger.getEnabledNamespaces()).toEqual(['auth', 'api', 'db']);
    });

    it('should disable multiple namespaces at once', () => {
      DebugLogger.disableMultiple(['auth', 'api']);
      
      expect(DebugLogger.getDisabledNamespaces()).toEqual(['auth', 'api']);
    });

    it('should clear all namespace filters', () => {
      DebugLogger.enable('auth');
      DebugLogger.disable('api');
      DebugLogger.clearNamespaces();
      
      expect(DebugLogger.getEnabledNamespaces()).toEqual([]);
      expect(DebugLogger.getDisabledNamespaces()).toEqual([]);
    });
  });

  describe('Message Formatting', () => {
    it('should include timestamp in log message', () => {
      DebugLogger.debug('test', 'Test message');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include log level in message', () => {
      DebugLogger.debug('test', 'Test message');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('DEBUG');
    });

    it('should include namespace in message', () => {
      DebugLogger.debug('auth:login', 'Test message');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('auth:login');
    });

    it('should include the actual message', () => {
      DebugLogger.debug('test', 'This is my test message');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('This is my test message');
    });

    it('should log additional data when provided', () => {
      const data = { userId: '123', action: 'login' };
      DebugLogger.debug('test', 'Test message', data);
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy.mock.calls[1][0]).toEqual(data);
    });

    it('should log error objects separately', () => {
      const error = new Error('Test error');
      DebugLogger.error('test', 'Error occurred', error);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy.mock.calls[1][0]).toBe(error);
    });
  });

  describe('Color Coding', () => {
    it('should include ANSI color codes when color is enabled', () => {
      DebugLogger.setColorEnabled(true);
      DebugLogger.debug('test', 'Test message');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toMatch(/\x1b\[\d+m/); // Contains ANSI codes
    });

    it('should not include ANSI color codes when color is disabled', () => {
      DebugLogger.setColorEnabled(false);
      DebugLogger.debug('test', 'Test message');
      
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).not.toMatch(/\x1b\[\d+m/); // No ANSI codes
    });
  });

  describe('Timing Utilities', () => {
    it('should start a timer', () => {
      DebugLogger.time('perf', 'operation');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('Timer started');
      expect(logCall).toContain('operation');
    });

    it('should end a timer and log duration', () => {
      DebugLogger.time('perf', 'operation');
      DebugLogger.timeEnd('perf', 'operation');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const endCall = consoleLogSpy.mock.calls[1][0];
      expect(endCall).toContain('operation');
      expect(endCall).toMatch(/\d+\.\d+ms/);
    });

    it('should warn when ending a timer that was not started', () => {
      DebugLogger.timeEnd('perf', 'nonexistent');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      const warnCall = consoleWarnSpy.mock.calls[0][0];
      expect(warnCall).toContain('Timer not found');
    });

    it('should not log timing for disabled namespaces', () => {
      DebugLogger.disable('perf');
      DebugLogger.time('perf', 'operation');
      DebugLogger.timeEnd('perf', 'operation');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should measure actual elapsed time', async () => {
      DebugLogger.time('perf', 'async-operation');
      
      // Wait for a short duration
      await new Promise(resolve => setTimeout(resolve, 50));
      
      DebugLogger.timeEnd('perf', 'async-operation');
      
      const endCall = consoleLogSpy.mock.calls[1][0];
      const durationMatch = endCall.match(/(\d+\.\d+)ms/);
      expect(durationMatch).toBeTruthy();
      
      const duration = parseFloat(durationMatch![1]);
      expect(duration).toBeGreaterThanOrEqual(40); // Allow some variance
    });
  });

  describe('Namespaced Logger', () => {
    it('should create a namespaced logger instance', () => {
      const authLogger = DebugLogger.createNamespacedLogger('auth');
      
      authLogger.debug('Login attempt');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('auth');
      expect(logCall).toContain('Login attempt');
    });

    it('should respect namespace filters for namespaced logger', () => {
      DebugLogger.disable('auth');
      const authLogger = DebugLogger.createNamespacedLogger('auth');
      
      authLogger.debug('Login attempt');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should support all log methods in namespaced logger', () => {
      const logger = DebugLogger.createNamespacedLogger('test');
      
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug and info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should support timing methods in namespaced logger', () => {
      const logger = DebugLogger.createNamespacedLogger('perf');
      
      logger.time('operation');
      logger.timeEnd('operation');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined data gracefully', () => {
      DebugLogger.debug('test', 'Message', undefined);
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle null data', () => {
      DebugLogger.debug('test', 'Message', null);
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy.mock.calls[1][0]).toBeNull();
    });

    it('should handle empty namespace', () => {
      DebugLogger.debug('', 'Message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle empty message', () => {
      DebugLogger.debug('test', '');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle complex data objects', () => {
      const complexData = {
        nested: {
          deeply: {
            value: 'test'
          }
        },
        array: [1, 2, 3],
        date: new Date(),
      };
      
      DebugLogger.debug('test', 'Complex data', complexData);
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy.mock.calls[1][0]).toEqual(complexData);
    });
  });
});
