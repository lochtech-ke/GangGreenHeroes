/**
 * Tests for ErrorLogger utility service
 * Validates OAuth error logging, route error logging, and sensitive data filtering
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorLogger } from './errorLogger';

// Mock console methods
const mockConsoleError = vi.fn();
const originalConsoleError = console.error;

describe('ErrorLogger', () => {
  beforeEach(() => {
    console.error = mockConsoleError;
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('logOAuthError', () => {
    it('should log OAuth errors with sanitized context', () => {
      const error = new Error('OAuth authentication failed');
      const context = {
        callbackUrl: 'https://example.com/auth/callback',
        access_token: 'sensitive_token_123',
        user_id: '12345'
      };

      ErrorLogger.logOAuthError(error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'OAuth Error:',
        expect.objectContaining({
          type: 'OAuth Error',
          message: 'OAuth authentication failed',
          context: expect.objectContaining({
            callbackUrl: 'https://example.com/auth/callback',
            access_token: '[REDACTED]',
            user_id: '12345'
          })
        })
      );
    });

    it('should handle OAuth errors without context', () => {
      const error = new Error('OAuth provider unavailable');

      ErrorLogger.logOAuthError(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'OAuth Error:',
        expect.objectContaining({
          type: 'OAuth Error',
          message: 'OAuth provider unavailable',
          context: undefined
        })
      );
    });
  });

  describe('logRouteError', () => {
    it('should log route errors with route information', () => {
      const error = new Error('Route not found');
      const route = '/auth/callback';
      const context = { method: 'GET', statusCode: 404 };

      ErrorLogger.logRouteError(route, error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Route Error [/auth/callback]:',
        expect.objectContaining({
          type: 'Route Error',
          route: '/auth/callback',
          message: 'Route not found',
          context: expect.objectContaining({
            method: 'GET',
            statusCode: 404
          })
        })
      );
    });
  });

  describe('logSessionError', () => {
    it('should log session errors with sanitized auth state', () => {
      const error = new Error('Session establishment failed');
      const authState = {
        user_id: '12345',
        access_token: 'sensitive_token',
        refresh_token: 'refresh_token_123'
      };

      ErrorLogger.logSessionError(error, authState);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Session Error:',
        expect.objectContaining({
          type: 'Session Error',
          message: 'Session establishment failed',
          authState: expect.objectContaining({
            user_id: '12345',
            access_token: '[REDACTED]',
            refresh_token: '[REDACTED]'
          })
        })
      );
    });
  });

  describe('log404Error', () => {
    it('should log 404 errors with URL information', () => {
      const requestedUrl = 'https://example.com/auth/callback?access_token=sensitive123';
      const referrer = 'https://accounts.google.com/oauth/authorize';

      ErrorLogger.log404Error(requestedUrl, referrer);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '404 Error during OAuth flow:',
        expect.objectContaining({
          type: '404 Error',
          message: 'Page not found during OAuth flow',
          requestedUrl: expect.stringContaining('[REDACTED]'),
          referrer: 'https://accounts.google.com/oauth/authorize'
        })
      );

      const loggedUrl = mockConsoleError.mock.calls[0][1].requestedUrl;
      expect(loggedUrl).not.toContain('sensitive123');
    });
  });

  describe('containsSensitiveData', () => {
    it('should detect access tokens', () => {
      expect(ErrorLogger.containsSensitiveData('access_token=token123')).toBe(true);
    });

    it('should detect refresh tokens', () => {
      expect(ErrorLogger.containsSensitiveData('refresh_token=abc123xyz')).toBe(true);
    });

    it('should detect bearer tokens', () => {
      expect(ErrorLogger.containsSensitiveData('Authorization: bearer token123')).toBe(true);
    });

    it('should detect passwords', () => {
      expect(ErrorLogger.containsSensitiveData('password=secret123')).toBe(true);
    });

    it('should detect JWT tokens', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(ErrorLogger.containsSensitiveData(jwt)).toBe(true);
    });

    it('should return false for non-sensitive data', () => {
      expect(ErrorLogger.containsSensitiveData('normal text')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(ErrorLogger.containsSensitiveData(null)).toBe(false);
      expect(ErrorLogger.containsSensitiveData(undefined)).toBe(false);
    });
  });

  describe('sensitive data filtering', () => {
    it('should redact nested sensitive data', () => {
      const context = {
        user: {
          id: '12345',
          credentials: {
            access_token: 'sensitive_token',
            password: 'secret_password'
          }
        }
      };

      ErrorLogger.logError('Test', new Error('Test error'), context);

      const loggedContext = mockConsoleError.mock.calls[0][1].context;
      expect(loggedContext.user.id).toBe('12345');
      expect(loggedContext.user.credentials.access_token).toBe('[REDACTED]');
      expect(loggedContext.user.credentials.password).toBe('[REDACTED]');
    });

    it('should sanitize string values containing sensitive patterns', () => {
      const context = {
        url: 'https://example.com/callback?access_token=sensitive123&state=abc',
        description: 'User authenticated with bearer token123'
      };

      ErrorLogger.logError('Test', new Error('Test error'), context);

      const loggedContext = mockConsoleError.mock.calls[0][1].context;
      expect(loggedContext.url).toContain('[REDACTED]');
      expect(loggedContext.url).not.toContain('sensitive123');
      expect(loggedContext.description).toContain('[REDACTED]');
      expect(loggedContext.description).not.toContain('token123');
    });
  });

  describe('logSecurityError', () => {
    it('should log security errors with high severity', () => {
      const error = new Error('Unauthorized origin detected');
      const context = {
        currentOrigin: 'https://malicious-site.com',
        referrer: 'https://evil.com',
        access_token: 'sensitive_token_123'
      };

      ErrorLogger.logSecurityError('Origin Validation', error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Security Origin Validation:',
        expect.objectContaining({
          type: 'Security Origin Validation',
          severity: 'HIGH',
          message: 'Unauthorized origin detected',
          context: expect.objectContaining({
            currentOrigin: 'https://malicious-site.com',
            referrer: 'https://evil.com',
            access_token: '[REDACTED]'
          })
        })
      );
    });

    it('should handle security errors without context', () => {
      const error = new Error('Security violation');

      ErrorLogger.logSecurityError('CSRF', error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Security CSRF:',
        expect.objectContaining({
          type: 'Security CSRF',
          severity: 'HIGH',
          message: 'Security violation',
          context: undefined
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle errors without messages', () => {
      const error = new Error();
      error.message = '';

      ErrorLogger.logError('Test', error);

      const loggedError = mockConsoleError.mock.calls[0][1];
      expect(loggedError.message).toBe('Unknown error');
    });

    it('should include timestamp and URL information', () => {
      const error = new Error('Test error');

      ErrorLogger.logError('Test', error);

      const loggedError = mockConsoleError.mock.calls[0][1];
      expect(loggedError.timestamp).toBeDefined();
      expect(loggedError.url).toBeDefined();
      expect(loggedError.userAgent).toBeDefined();
    });
  });
});