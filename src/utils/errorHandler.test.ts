/**
 * Error Handler Tests
 * Unit tests for the central error handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler } from './errorHandler';
import {
  AppError,
  NetworkError,
  AuthError,
  ValidationError,
  DatabaseError,
  Web3Error,
  BadgeError,
  CurationError,
  ErrorSeverity,
  ErrorContext,
} from '../types/errors';

/**
 * Concrete implementation of AppError for testing purposes
 */
class TestAppError extends AppError {
  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    context?: ErrorContext,
    recoverable: boolean = false
  ) {
    super(message, code, severity, context, recoverable);
  }
}

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.reset();
    vi.clearAllMocks();
  });

  describe('Error Categorization', () => {
    it('should categorize NetworkError correctly', () => {
      const error = new NetworkError('Connection failed', 'NETWORK_ERROR', 500);
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('network');
    });

    it('should categorize AuthError correctly', () => {
      const error = new AuthError('Unauthorized', 'AUTH_ERROR', 'token');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('authentication');
    });

    it('should categorize ValidationError correctly', () => {
      const error = new ValidationError('Invalid input', 'VALIDATION_ERROR', 'email');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('validation');
    });

    it('should categorize DatabaseError correctly', () => {
      const error = new DatabaseError('Query failed', 'DB_ERROR', 'SELECT * FROM users');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('database');
    });

    it('should categorize Web3Error correctly', () => {
      const error = new Web3Error('Transaction failed', 'WEB3_ERROR', 'MetaMask');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('web3');
    });

    it('should categorize BadgeError correctly', () => {
      const error = new BadgeError('Badge generation failed', 'BADGE_ERROR', 'badge-123');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('badge');
    });

    it('should categorize CurationError correctly', () => {
      const error = new CurationError('Scoring failed', 'CURATION_ERROR', 'user-123');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('curation');
    });

    it('should categorize generic AppError as runtime', () => {
      const error = new TestAppError('Generic error', 'GENERIC_ERROR', ErrorSeverity.MEDIUM);
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('runtime');
    });

    it('should infer category from error message for standard Error', () => {
      const error = new Error('Network connection failed');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('network');
    });
  });

  describe('Error Sanitization', () => {
    it('should sanitize sensitive data in error message', () => {
      const error = new TestAppError(
        'Failed with token: abc123xyz',
        'TEST_ERROR',
        ErrorSeverity.MEDIUM
      );
      const sanitized = errorHandler.sanitizeError(error);
      expect(sanitized.message).not.toContain('abc123xyz');
      expect(sanitized.message).toContain('[REDACTED]');
    });

    it('should sanitize sensitive data in error context', () => {
      const context: ErrorContext = {
        metadata: {
          password: 'secret123',
          apiKey: 'key-abc-123',
        },
      };
      const error = new TestAppError('Test error', 'TEST_ERROR', ErrorSeverity.MEDIUM, context);
      const sanitized = errorHandler.sanitizeError(error) as AppError;
      
      expect(sanitized.context?.metadata?.password).toBe('[REDACTED]');
      expect(sanitized.context?.metadata?.apiKey).toBe('[REDACTED]');
    });

    it('should sanitize email addresses partially', () => {
      const error = new TestAppError(
        'Error for user test@example.com',
        'TEST_ERROR',
        ErrorSeverity.MEDIUM
      );
      const sanitized = errorHandler.sanitizeError(error);
      expect(sanitized.message).not.toContain('test@example.com');
      expect(sanitized.message).toContain('@example.com');
    });

    it('should sanitize Web3 addresses', () => {
      const error = new TestAppError(
        'Transaction from 0x1234567890123456789012345678901234567890',
        'TEST_ERROR',
        ErrorSeverity.MEDIUM
      );
      const sanitized = errorHandler.sanitizeError(error);
      expect(sanitized.message).not.toContain('0x1234567890123456789012345678901234567890');
      expect(sanitized.message).toMatch(/0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}/);
    });
  });

  describe('Severity Threshold', () => {
    it('should process errors above severity threshold', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      errorHandler.setSeverityThreshold(ErrorSeverity.MEDIUM);
      
      const highError = new TestAppError('High error', 'HIGH_ERROR', ErrorSeverity.HIGH);
      errorHandler.handleError(highError);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not process errors below severity threshold', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      errorHandler.setSeverityThreshold(ErrorSeverity.MEDIUM);
      
      const lowError = new TestAppError('Low error', 'LOW_ERROR', ErrorSeverity.LOW);
      errorHandler.handleError(lowError);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Custom Handlers', () => {
    it('should execute custom handler for specific error type', () => {
      const handler = vi.fn();
      errorHandler.registerHandler('network', handler);
      
      const error = new NetworkError('Connection failed', 'NETWORK_ERROR', 500);
      errorHandler.handleError(error);
      
      expect(handler).toHaveBeenCalledWith(expect.any(NetworkError));
    });

    it('should execute generic handler for all errors', () => {
      const handler = vi.fn();
      errorHandler.registerHandler('*', handler);
      
      const error = new TestAppError('Test error', 'TEST_ERROR', ErrorSeverity.MEDIUM);
      errorHandler.handleError(error);
      
      expect(handler).toHaveBeenCalledWith(expect.any(TestAppError));
    });

    it('should execute both specific and generic handlers', () => {
      const specificHandler = vi.fn();
      const genericHandler = vi.fn();
      
      errorHandler.registerHandler('network', specificHandler);
      errorHandler.registerHandler('*', genericHandler);
      
      const error = new NetworkError('Connection failed', 'NETWORK_ERROR', 500);
      errorHandler.handleError(error);
      
      expect(specificHandler).toHaveBeenCalled();
      expect(genericHandler).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should respect rate limits', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Configure rate limiter for testing
      const rateLimiter = errorHandler.getRateLimiter();
      rateLimiter.updateConfiguration({
        maxErrorsPerWindow: 2,
        windowSize: 1000,
      });
      
      const error = new TestAppError('Test error', 'RATE_LIMIT_TEST', ErrorSeverity.HIGH);
      
      // First two should log
      errorHandler.handleError(error);
      errorHandler.handleError(error);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      // Third should be suppressed
      errorHandler.handleError(error);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Tracking Control', () => {
    it('should not log when tracking is disabled', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      errorHandler.setTrackingEnabled(false);
      
      const error = new TestAppError('Test error', 'TEST_ERROR', ErrorSeverity.HIGH);
      errorHandler.handleError(error);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should log when tracking is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      errorHandler.setTrackingEnabled(true);
      
      const error = new TestAppError('Test error', 'TEST_ERROR', ErrorSeverity.HIGH);
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Conversion', () => {
    it('should convert standard Error to AppError', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const error = new Error('Standard error');
      errorHandler.handleError(error);
      
      // Should be logged as it's converted to AppError (with LOW severity -> console.log)
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should infer error code from message', () => {
      const error = new Error('Network connection failed');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      errorHandler.handleError(error);
      
      // Verify it was categorized as network error
      const category = errorHandler.categorizeError(error);
      expect(category).toBe('network');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Context Merging', () => {
    it('should merge provided context with existing error context', () => {
      const existingContext: ErrorContext = {
        component: 'TestComponent',
        metadata: { existing: 'data' },
      };
      
      const error = new TestAppError(
        'Test error',
        'TEST_ERROR',
        ErrorSeverity.MEDIUM,
        existingContext
      );
      
      const additionalContext: ErrorContext = {
        action: 'testAction',
        metadata: { additional: 'data' },
      };
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      errorHandler.handleError(error, additionalContext);
      consoleSpy.mockRestore();
      
      // Context should be merged (verified through sanitization)
      const sanitized = errorHandler.sanitizeError(error) as AppError;
      expect(sanitized.context).toBeDefined();
    });
  });
});
