/**
 * OAuth Error Handler Tests
 * Tests for 404 error context logging during OAuth flow
 * Requirements: 3.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  detectOAuthFlow, 
  logOAuth404Error, 
  setupOAuth404Handler,
  isValidOAuthCallbackUrl,
  logOAuth404Page
} from './oauthErrorHandler';
import { ErrorLogger } from './errorLogger';

// Mock ErrorLogger
vi.mock('./errorLogger', () => ({
  ErrorLogger: {
    log404Error: vi.fn(),
    logRouteError: vi.fn()
  }
}));

// Mock window and document objects
const mockWindow = {
  location: {
    href: 'https://example.com/auth/callback',
    hash: '',
    search: '',
    pathname: '/auth/callback',
    origin: 'https://example.com'
  },
  history: {
    pushState: vi.fn(),
    replaceState: vi.fn()
  },
  addEventListener: vi.fn(),
  performance: {
    now: () => 1000,
    timeOrigin: 1000
  },
  navigator: {
    userAgent: 'Test Browser',
    language: 'en-US',
    cookieEnabled: true,
    onLine: true
  },
  innerWidth: 1920,
  innerHeight: 1080
};

const mockDocument = {
  referrer: ''
};

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: mockWindow.navigator,
  writable: true
});

Object.defineProperty(global, 'performance', {
  value: mockWindow.performance,
  writable: true
});

describe('OAuth Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset window location
    mockWindow.location.href = 'https://example.com/auth/callback';
    mockWindow.location.hash = '';
    mockWindow.location.search = '';
    mockWindow.location.pathname = '/auth/callback';
    mockDocument.referrer = '';
  });

  describe('detectOAuthFlow', () => {
    it('should detect OAuth flow with access token in hash', () => {
      mockWindow.location.hash = '#access_token=abc123&token_type=bearer';
      
      const context = detectOAuthFlow();
      
      expect(context.isOAuthFlow).toBe(true);
      expect(context.hasAccessToken).toBe(true);
      expect(context.hasAuthCode).toBe(false);
      expect(context.flowType).toBe('unknown');
    });

    it('should detect OAuth flow with authorization code', () => {
      mockWindow.location.search = '?code=abc123&state=xyz';
      
      const context = detectOAuthFlow();
      
      expect(context.isOAuthFlow).toBe(true);
      expect(context.hasAccessToken).toBe(false);
      expect(context.hasAuthCode).toBe(true);
    });

    it('should detect Google OAuth flow from referrer', () => {
      mockDocument.referrer = 'https://accounts.google.com/oauth/authorize';
      mockWindow.location.hash = '#access_token=abc123';
      
      const context = detectOAuthFlow();
      
      expect(context.isOAuthFlow).toBe(true);
      expect(context.flowType).toBe('google');
      expect(context.referrerDomain).toBe('accounts.google.com');
    });

    it('should detect OAuth error flow', () => {
      mockWindow.location.search = '?error=access_denied&error_description=User%20denied';
      
      const context = detectOAuthFlow();
      
      expect(context.isOAuthFlow).toBe(true);
      expect(context.hasOAuthError).toBe(true);
    });

    it('should not detect OAuth flow for regular navigation', () => {
      mockWindow.location.href = 'https://example.com/dashboard';
      mockWindow.location.pathname = '/dashboard';
      mockDocument.referrer = 'https://example.com/login';
      
      const context = detectOAuthFlow();
      
      expect(context.isOAuthFlow).toBe(false);
      expect(context.hasAccessToken).toBe(false);
      expect(context.hasAuthCode).toBe(false);
    });
  });

  describe('logOAuth404Error', () => {
    it('should log 404 error during OAuth flow', () => {
      mockWindow.location.hash = '#access_token=abc123';
      mockWindow.location.pathname = '/wrong-route';
      mockDocument.referrer = 'https://accounts.google.com/oauth/authorize';
      
      logOAuth404Error();
      
      expect(ErrorLogger.log404Error).toHaveBeenCalledWith(
        mockWindow.location.href,
        mockDocument.referrer,
        expect.objectContaining({
          isOAuthFlow: true,
          flowType: 'google',
          hasAccessToken: true,
          actualRoute: '/wrong-route',
          expectedRoute: '/auth/callback'
        })
      );
      
      expect(ErrorLogger.logRouteError).toHaveBeenCalledWith(
        '/wrong-route',
        expect.any(Error),
        expect.objectContaining({
          oauthFlow: true,
          provider: 'google'
        })
      );
    });

    it('should not log if not in OAuth flow', () => {
      mockWindow.location.href = 'https://example.com/dashboard';
      mockWindow.location.pathname = '/dashboard';
      mockDocument.referrer = 'https://example.com/login';
      
      logOAuth404Error();
      
      expect(ErrorLogger.log404Error).not.toHaveBeenCalled();
      expect(ErrorLogger.logRouteError).not.toHaveBeenCalled();
    });

    it('should include comprehensive context in log', () => {
      mockWindow.location.hash = '#access_token=abc123&provider_token=xyz';
      mockWindow.location.pathname = '/invalid-route';
      mockDocument.referrer = 'https://accounts.google.com/oauth/authorize';
      
      logOAuth404Error('https://example.com/invalid-route', {
        customContext: 'test'
      });
      
      expect(ErrorLogger.log404Error).toHaveBeenCalledWith(
        'https://example.com/invalid-route',
        mockDocument.referrer,
        expect.objectContaining({
          customContext: 'test',
          oauthFlowState: expect.objectContaining({
            stage: 'token_received',
            provider: 'google',
            hasValidParameters: true,
            hasErrors: false
          }),
          navigation: expect.objectContaining({
            fromOAuthProvider: true,
            expectedDestination: '/auth/callback',
            actualDestination: '/invalid-route',
            routeMismatch: true
          }),
          browser: expect.objectContaining({
            userAgent: 'Test Browser',
            language: 'en-US',
            cookieEnabled: true,
            onLine: true
          }),
          timing: expect.objectContaining({
            timestamp: expect.any(String),
            performanceNow: expect.any(Number)
          })
        })
      );
    });
  });

  describe('isValidOAuthCallbackUrl', () => {
    it('should validate correct OAuth callback URL', () => {
      const validUrl = 'https://example.com/auth/callback#access_token=abc123';
      expect(isValidOAuthCallbackUrl(validUrl)).toBe(true);
    });

    it('should validate OAuth callback URL with code parameter', () => {
      const validUrl = 'https://example.com/auth/callback?code=abc123';
      expect(isValidOAuthCallbackUrl(validUrl)).toBe(true);
    });

    it('should reject URL with wrong path', () => {
      const invalidUrl = 'https://example.com/wrong/path#access_token=abc123';
      expect(isValidOAuthCallbackUrl(invalidUrl)).toBe(false);
    });

    it('should reject URL without OAuth parameters', () => {
      const invalidUrl = 'https://example.com/auth/callback';
      expect(isValidOAuthCallbackUrl(invalidUrl)).toBe(false);
    });

    it('should handle invalid URLs gracefully', () => {
      const invalidUrl = 'not-a-url';
      expect(isValidOAuthCallbackUrl(invalidUrl)).toBe(false);
    });
  });

  describe('logOAuth404Page', () => {
    it('should log when 404 page is rendered during OAuth flow', () => {
      mockWindow.location.hash = '#access_token=abc123';
      mockDocument.referrer = 'https://accounts.google.com/oauth/authorize';
      
      logOAuth404Page('/non-existent-page');
      
      expect(ErrorLogger.log404Error).toHaveBeenCalledWith(
        mockWindow.location.href,
        mockDocument.referrer,
        expect.objectContaining({
          trigger: '404_page_rendered',
          requestedPath: '/non-existent-page',
          shouldHaveBeenRedirected: true
        })
      );
    });

    it('should not log if not in OAuth flow', () => {
      mockWindow.location.href = 'https://example.com/non-existent';
      mockWindow.location.hash = '';
      mockDocument.referrer = 'https://example.com/home';
      
      logOAuth404Page('/non-existent');
      
      expect(ErrorLogger.log404Error).not.toHaveBeenCalled();
    });
  });

  describe('setupOAuth404Handler', () => {
    let originalPushState: any;
    let originalReplaceState: any;

    beforeEach(() => {
      originalPushState = window.history.pushState;
      originalReplaceState = window.history.replaceState;
      
      // Mock history methods
      window.history.pushState = vi.fn();
      window.history.replaceState = vi.fn();
    });

    afterEach(() => {
      // Restore original methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    });

    it('should setup global OAuth 404 handlers', () => {
      setupOAuth404Handler();
      
      // Verify that history methods were overridden
      expect(typeof window.history.pushState).toBe('function');
      expect(typeof window.history.replaceState).toBe('function');
      
      // Verify event listeners were added
      expect(window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('should log 404 when navigating during OAuth flow', () => {
      mockWindow.location.hash = '#access_token=abc123';
      
      setupOAuth404Handler();
      
      // Simulate navigation to wrong route during OAuth
      (window.history.pushState as any)({}, '', '/wrong-route');
      
      expect(ErrorLogger.log404Error).toHaveBeenCalledWith(
        '/wrong-route',
        mockDocument.referrer,
        expect.objectContaining({
          navigationType: 'pushState',
          previousUrl: mockWindow.location.href
        })
      );
    });
  });
});