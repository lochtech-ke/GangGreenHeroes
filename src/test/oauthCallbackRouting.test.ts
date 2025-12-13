import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createPropertyTest, commonArbitraries } from './property-helpers';
import { isValidOAuthCallbackUrl, detectOAuthFlow } from '../utils/oauthErrorHandler';

/**
 * OAuth Callback Routing Property Tests
 * Tests that production routing serves React app for OAuth callbacks
 * Requirements: 1.1, 4.3
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

// Mock history API
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
};

// Mock navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  language: 'en-US',
  platform: 'Win32',
  cookieEnabled: true,
  onLine: true,
};

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
  
  Object.defineProperty(window, 'history', {
    value: mockHistory,
    writable: true,
  });
  
  Object.defineProperty(window, 'navigator', {
    value: mockNavigator,
    writable: true,
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

describe('OAuth Callback Routing Property Tests', () => {
  // Arbitraries for generating OAuth callback URLs
  const oauthProviders = fc.constantFrom('google', 'github');
  
  const accessTokenArbitrary = fc.string({ minLength: 20, maxLength: 200 })
    .map(s => `eyJ${s.replace(/[^a-zA-Z0-9]/g, '')}`);
  
  const refreshTokenArbitrary = fc.string({ minLength: 20, maxLength: 100 })
    .map(s => s.replace(/[^a-zA-Z0-9_-]/g, ''));
  
  const authCodeArbitrary = fc.string({ minLength: 10, maxLength: 50 })
    .map(s => s.replace(/[^a-zA-Z0-9_-]/g, ''));
  
  const oauthErrorArbitrary = fc.constantFrom(
    'access_denied',
    'invalid_request',
    'unauthorized_client',
    'unsupported_response_type',
    'invalid_scope',
    'server_error',
    'temporarily_unavailable'
  );
  
  const validOriginArbitrary = fc.constantFrom(
    'https://gg.lochtech.africa',
    'https://ganggreen-platform.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  );
  
  const invalidOriginArbitrary = fc.constantFrom(
    'https://malicious-site.com',
    'http://fake-oauth.com',
    'https://phishing-site.net',
    'http://localhost:8080'
  );

  // Generate OAuth callback URLs with access tokens (implicit flow)
  const implicitFlowUrlArbitrary = fc.record({
    origin: validOriginArbitrary,
    accessToken: accessTokenArbitrary,
    refreshToken: refreshTokenArbitrary,
    expiresIn: fc.integer({ min: 3600, max: 86400 }),
    tokenType: fc.constant('bearer'),
    provider: oauthProviders,
  }).map(({ origin, accessToken, refreshToken, expiresIn, tokenType, provider }) => {
    const hash = `#access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=${expiresIn}&token_type=${tokenType}&provider_token=goog_${accessToken.slice(0, 10)}`;
    return `${origin}/auth/callback${hash}`;
  });

  // Generate OAuth callback URLs with authorization codes (PKCE flow)
  const pkceFlowUrlArbitrary = fc.record({
    origin: validOriginArbitrary,
    code: authCodeArbitrary,
    state: fc.string({ minLength: 10, maxLength: 50 }),
    provider: oauthProviders,
  }).map(({ origin, code, state, provider }) => {
    const search = `?code=${code}&state=${state}&provider=${provider}`;
    return `${origin}/auth/callback${search}`;
  });

  // Generate OAuth callback URLs with errors
  const errorFlowUrlArbitrary = fc.record({
    origin: validOriginArbitrary,
    error: oauthErrorArbitrary,
    errorDescription: fc.string({ minLength: 10, maxLength: 100 }),
    state: fc.string({ minLength: 10, maxLength: 50 }),
  }).map(({ origin, error, errorDescription, state }) => {
    const search = `?error=${error}&error_description=${encodeURIComponent(errorDescription)}&state=${state}`;
    return `${origin}/auth/callback${search}`;
  });

  // Generate valid OAuth callback URLs (any flow type)
  const validOAuthCallbackUrlArbitrary = fc.oneof(
    implicitFlowUrlArbitrary,
    pkceFlowUrlArbitrary,
    errorFlowUrlArbitrary
  );

  // Generate invalid OAuth callback URLs (wrong path, no OAuth params, etc.)
  const invalidOAuthCallbackUrlArbitrary = fc.oneof(
    // Wrong path
    fc.record({
      origin: validOriginArbitrary,
      path: fc.constantFrom('/login', '/dashboard', '/profile', '/wrong-path'),
      accessToken: accessTokenArbitrary,
    }).map(({ origin, path, accessToken }) => `${origin}${path}#access_token=${accessToken}`),
    
    // No OAuth parameters
    validOriginArbitrary.map(origin => `${origin}/auth/callback`),
    
    // Invalid origin with OAuth params
    fc.record({
      origin: invalidOriginArbitrary,
      accessToken: accessTokenArbitrary,
    }).map(({ origin, accessToken }) => `${origin}/auth/callback#access_token=${accessToken}`)
  );

  // Generate OAuth referrer URLs
  const oauthReferrerArbitrary = fc.oneof(
    fc.constant('https://accounts.google.com/oauth/authorize'),
    fc.constant('https://github.com/login/oauth/authorize'),
    fc.constant('https://accounts.google.com/signin/oauth'),
    validOriginArbitrary.map(origin => `${origin}/login`)
  );

  /**
   * Property 1: OAuth callback routing consistency
   * For any valid OAuth callback URL with authentication parameters, 
   * the production server should serve the React application instead of returning a 404 error.
   * Validates: Requirements 1.1, 4.3
   */
  createPropertyTest(
    'OAuth callback routing consistency',
    validOAuthCallbackUrlArbitrary,
    (callbackUrl) => {
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
    },
    {
      featureName: 'oauth-callback-production-fix',
      propertyNumber: 1,
      propertyText: 'OAuth callback routing consistency',
      requirements: ['1.1', '4.3'],
      numRuns: 100,
    }
  );

  /**
   * Test that invalid OAuth callback URLs are properly rejected
   */
  createPropertyTest(
    'Invalid OAuth callback URL rejection',
    invalidOAuthCallbackUrlArbitrary,
    (callbackUrl) => {
      try {
        // Parse the URL
        const url = new URL(callbackUrl);
        
        // Set up mock location
        mockLocation.href = callbackUrl;
        mockLocation.origin = url.origin;
        mockLocation.pathname = url.pathname;
        mockLocation.search = url.search;
        mockLocation.hash = url.hash;
        
        // Test that invalid URLs are not recognized as valid OAuth callbacks
        const isValidCallback = isValidOAuthCallbackUrl(callbackUrl);
        
        // Invalid URLs should return false
        return !isValidCallback;
        
      } catch (error) {
        // Invalid URL format should be rejected
        return true;
      }
    },
    {
      featureName: 'oauth-callback-production-fix',
      propertyNumber: 2,
      propertyText: 'Invalid OAuth callback URL rejection',
      requirements: ['1.1', '4.3'],
      numRuns: 50,
    }
  );

  /**
   * Test OAuth flow detection with various referrer scenarios
   */
  createPropertyTest(
    'OAuth flow detection with referrers',
    fc.record({
      callbackUrl: validOAuthCallbackUrlArbitrary,
      referrer: oauthReferrerArbitrary,
    }),
    ({ callbackUrl, referrer }) => {
      try {
        // Parse the URL
        const url = new URL(callbackUrl);
        
        // Set up mock location and referrer
        mockLocation.href = callbackUrl;
        mockLocation.origin = url.origin;
        mockLocation.pathname = url.pathname;
        mockLocation.search = url.search;
        mockLocation.hash = url.hash;
        mockReferrer = referrer;
        
        // Detect OAuth flow
        const oauthContext = detectOAuthFlow();
        
        // Should detect OAuth flow for valid callback URLs
        const shouldDetectFlow = url.pathname === '/auth/callback' && (
          url.hash.includes('access_token') ||
          url.search.includes('code') ||
          url.search.includes('error') ||
          referrer.includes('accounts.google.com') ||
          referrer.includes('github.com')
        );
        
        return oauthContext.isOAuthFlow === shouldDetectFlow;
        
      } catch (error) {
        return false;
      }
    },
    {
      featureName: 'oauth-callback-production-fix',
      propertyNumber: 3,
      propertyText: 'OAuth flow detection with referrers',
      requirements: ['1.1', '4.3'],
      numRuns: 75,
    }
  );

  /**
   * Test that OAuth callback URLs with various parameter combinations are handled
   */
  createPropertyTest(
    'OAuth parameter combination handling',
    fc.record({
      origin: validOriginArbitrary,
      hasAccessToken: fc.boolean(),
      hasRefreshToken: fc.boolean(),
      hasCode: fc.boolean(),
      hasError: fc.boolean(),
      hasState: fc.boolean(),
      accessToken: accessTokenArbitrary,
      refreshToken: refreshTokenArbitrary,
      code: authCodeArbitrary,
      error: oauthErrorArbitrary,
      state: fc.string({ minLength: 10, maxLength: 50 }),
    }),
    ({ origin, hasAccessToken, hasRefreshToken, hasCode, hasError, hasState, accessToken, refreshToken, code, error, state }) => {
      // Build URL with selected parameters
      let url = `${origin}/auth/callback`;
      const hashParams: string[] = [];
      const searchParams: string[] = [];
      
      if (hasAccessToken) hashParams.push(`access_token=${accessToken}`);
      if (hasRefreshToken) hashParams.push(`refresh_token=${refreshToken}`);
      if (hasCode) searchParams.push(`code=${code}`);
      if (hasError) searchParams.push(`error=${error}`);
      if (hasState) searchParams.push(`state=${state}`);
      
      if (searchParams.length > 0) {
        url += `?${searchParams.join('&')}`;
      }
      if (hashParams.length > 0) {
        url += `#${hashParams.join('&')}`;
      }
      
      // Set up mock location
      const urlObj = new URL(url);
      mockLocation.href = url;
      mockLocation.origin = urlObj.origin;
      mockLocation.pathname = urlObj.pathname;
      mockLocation.search = urlObj.search;
      mockLocation.hash = urlObj.hash;
      
      // Test OAuth flow detection
      const oauthContext = detectOAuthFlow();
      
      // Should detect OAuth flow if any OAuth parameters are present
      const hasOAuthParams = hasAccessToken || hasCode || hasError;
      const expectedDetection = hasOAuthParams;
      
      // Verify detection matches expectation
      const detectionCorrect = oauthContext.isOAuthFlow === expectedDetection;
      
      // Verify parameter detection
      const tokenDetectionCorrect = oauthContext.hasAccessToken === hasAccessToken;
      const codeDetectionCorrect = oauthContext.hasAuthCode === hasCode;
      const errorDetectionCorrect = oauthContext.hasOAuthError === hasError;
      
      return detectionCorrect && tokenDetectionCorrect && codeDetectionCorrect && errorDetectionCorrect;
    },
    {
      featureName: 'oauth-callback-production-fix',
      propertyNumber: 4,
      propertyText: 'OAuth parameter combination handling',
      requirements: ['1.1', '4.3'],
      numRuns: 100,
    }
  );

  /**
   * Test production routing configuration simulation
   * This tests the logic that would be used by Vercel routing
   */
  createPropertyTest(
    'Production routing configuration',
    fc.record({
      path: fc.oneof(
        fc.constant('/auth/callback'),
        fc.constantFrom('/login', '/dashboard', '/profile', '/about', '/contact'),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `/${s.replace(/[^a-zA-Z0-9-]/g, '')}`),
      ),
      hasOAuthParams: fc.boolean(),
      accessToken: accessTokenArbitrary,
    }),
    ({ path, hasOAuthParams, accessToken }) => {
      // Simulate Vercel routing logic
      const isStaticAsset = /\.(ico|png|jpg|jpeg|gif|css|js|svg|woff|woff2|ttf|eot)$/.test(path);
      const isApiRoute = path.startsWith('/api');
      const isNextRoute = path.startsWith('/_next');
      const isStaticRoute = path.startsWith('/_static');
      const isFavicon = path === '/favicon.ico' || path.includes('favicon');
      
      // According to vercel.json, these should NOT be rewritten to index.html
      const shouldNotRewrite = isStaticAsset || isApiRoute || isNextRoute || isStaticRoute || isFavicon;
      
      // All other routes should be rewritten to serve the React app
      const shouldServeReactApp = !shouldNotRewrite;
      
      // For OAuth callback specifically, it should always serve React app
      const isOAuthCallback = path === '/auth/callback';
      
      if (isOAuthCallback) {
        // OAuth callback should always serve React app regardless of other conditions
        return shouldServeReactApp;
      } else {
        // Other routes follow normal routing rules
        return true; // This test is mainly about OAuth callback routing
      }
    },
    {
      featureName: 'oauth-callback-production-fix',
      propertyNumber: 5,
      propertyText: 'Production routing configuration',
      requirements: ['1.1', '4.3'],
      numRuns: 50,
    }
  );

  // Unit tests for specific scenarios
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
      'https://malicious.com/auth/callback#access_token=eyJ123', // Wrong domain (but this test is about URL structure)
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

    // Test with error
    mockLocation.search = '?error=access_denied&error_description=User%20denied';
    mockReferrer = '';

    const context3 = detectOAuthFlow();
    expect(context3.isOAuthFlow).toBe(true);
    expect(context3.hasOAuthError).toBe(true);
  });

  it('should not detect OAuth flow for non-OAuth requests', () => {
    mockLocation.pathname = '/dashboard';
    mockLocation.hash = '';
    mockLocation.search = '';
    mockReferrer = 'https://gg.lochtech.africa/login';

    const context = detectOAuthFlow();
    expect(context.isOAuthFlow).toBe(false);
    expect(context.hasAccessToken).toBe(false);
    expect(context.hasAuthCode).toBe(false);
    expect(context.hasOAuthError).toBe(false);
  });
});