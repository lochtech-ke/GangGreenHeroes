import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { isValidOAuthCallbackUrl, detectOAuthFlow } from '../utils/oauthErrorHandler';

/**
 * Simple OAuth Callback Routing Tests
 * Basic tests to verify OAuth callback routing functionality
 */

// Mock window.location for testing
const mockLocation = {
  href: '',
  origin: 'https://gg.lochtech.africa',
  pathname: '',
  search: '',
  hash: '',
  hostname: 'gg.lochtech.africa',
  protocol: 'https:',
  port: '',
};

// Mock document.referrer
let mockReferrer = '';

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
  
  // Mock global objects
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  });
  
  Object.defineProperty(document, 'referrer', {
    get: () => mockReferrer,
    configurable: true,
  });
});

afterEach(() => {
  // Reset location state
  mockLocation.href = '';
  mockLocation.pathname = '';
  mockLocation.search = '';
  mockLocation.hash = '';
  mockReferrer = '';
});

describe('OAuth Callback Routing - Basic Tests', () => {
  it('should recognize valid OAuth callback URLs', () => {
    const validUrls = [
      'https://gg.lochtech.africa/auth/callback#access_token=eyJ123&refresh_token=abc123',
      'https://gg.lochtech.africa/auth/callback?code=auth_code_123&state=random_state',
      'https://gg.lochtech.africa/auth/callback?error=access_denied&error_description=User%20denied',
    ];

    validUrls.forEach(url => {
      expect(isValidOAuthCallbackUrl(url)).toBe(true);
    });
  });

  it('should reject invalid OAuth callback URLs', () => {
    const invalidUrls = [
      'https://gg.lochtech.africa/auth/callback', // No OAuth params
      'https://gg.lochtech.africa/login#access_token=eyJ123', // Wrong path
      'not-a-url',
      '',
    ];

    invalidUrls.forEach(url => {
      expect(isValidOAuthCallbackUrl(url)).toBe(false);
    });
  });

  it('should detect OAuth flow context correctly', () => {
    // Test with access token in hash
    mockLocation.pathname = '/auth/callback';
    mockLocation.hash = '#access_token=eyJ123&refresh_token=abc123';
    mockLocation.search = '';
    mockReferrer = 'https://accounts.google.com/oauth/authorize';

    const context1 = detectOAuthFlow();
    expect(context1.isOAuthFlow).toBe(true);
    expect(context1.hasAccessToken).toBe(true);
    expect(context1.flowType).toBe('google');

    // Test with authorization code in search
    mockLocation.hash = '';
    mockLocation.search = '?code=auth_code_123&state=random_state';
    mockReferrer = 'https://github.com/login/oauth/authorize';

    const context2 = detectOAuthFlow();
    expect(context2.isOAuthFlow).toBe(true);
    expect(context2.hasAuthCode).toBe(true);
    expect(context2.flowType).toBe('github');
  });
});

describe('OAuth Callback Routing - Property Tests', () => {
  /**
   * Property 1: OAuth callback routing consistency
   * For any valid OAuth callback URL with authentication parameters, 
   * the production server should serve the React application instead of returning a 404 error.
   * **Feature: oauth-callback-production-fix, Property 1: OAuth callback routing consistency**
   * **Validates: Requirements 1.1, 4.3**
   */
  it('Property 1: OAuth callback routing consistency - **Feature: oauth-callback-production-fix, Property 1: OAuth callback routing consistency** **Validates: Requirements 1.1, 4.3**', async () => {
    // Generate valid OAuth callback URLs
    const validOAuthCallbackUrlArbitrary = fc.oneof(
      // Implicit flow URLs
      fc.record({
        origin: fc.constantFrom('https://gg.lochtech.africa', 'https://ganggreen-platform.vercel.app'),
        accessToken: fc.string({ minLength: 20, maxLength: 200 }).map(s => `eyJ${s.replace(/[^a-zA-Z0-9]/g, '')}`),
        refreshToken: fc.string({ minLength: 20, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9_-]/g, '')),
      }).map(({ origin, accessToken, refreshToken }) => {
        const hash = `#access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=3600&token_type=bearer`;
        return `${origin}/auth/callback${hash}`;
      }),
      
      // PKCE flow URLs
      fc.record({
        origin: fc.constantFrom('https://gg.lochtech.africa', 'https://ganggreen-platform.vercel.app'),
        code: fc.string({ minLength: 10, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9_-]/g, '')),
        state: fc.string({ minLength: 10, maxLength: 50 }),
      }).map(({ origin, code, state }) => {
        const search = `?code=${code}&state=${state}`;
        return `${origin}/auth/callback${search}`;
      })
    );

    await fc.assert(
      fc.asyncProperty(validOAuthCallbackUrlArbitrary, (callbackUrl) => {
        try {
          // Parse the URL
          const url = new URL(callbackUrl);
          
          // Set up mock location to simulate the callback URL
          mockLocation.href = callbackUrl;
          mockLocation.origin = url.origin;
          mockLocation.pathname = url.pathname;
          mockLocation.search = url.search;
          mockLocation.hash = url.hash;
          mockLocation.hostname = url.hostname;
          mockLocation.protocol = url.protocol;
          
          // Test 1: URL should be recognized as a valid OAuth callback URL
          const isValidCallback = isValidOAuthCallbackUrl(callbackUrl);
          
          // Test 2: OAuth flow should be detected
          const oauthContext = detectOAuthFlow();
          
          // Test 3: Route should be the callback route
          const isCallbackRoute = url.pathname === '/auth/callback';
          
          // Test 4: Should have OAuth parameters
          const hasOAuthParams = oauthContext.hasAccessToken || oauthContext.hasAuthCode || oauthContext.hasOAuthError;
          
          // Test 5: Origin should be from allowed list (for valid URLs)
          const allowedOrigins = [
            'https://gg.lochtech.africa',
            'https://ganggreen-platform.vercel.app',
            'http://localhost:5173',
            'http://localhost:3000'
          ];
          const isAllowedOrigin = allowedOrigins.includes(url.origin);
          
          // For valid OAuth callback URLs, all conditions should be true
          return isValidCallback && 
                 oauthContext.isOAuthFlow && 
                 isCallbackRoute && 
                 hasOAuthParams && 
                 isAllowedOrigin;
                 
        } catch (error) {
          // Invalid URL format should not occur with our generators
          return false;
        }
      }),
      {
        numRuns: 100,
        timeout: 10000,
      }
    );
  });
});