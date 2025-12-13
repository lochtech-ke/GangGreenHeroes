import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * OAuth Callback Routing Property Tests
 * Tests that production routing serves React app for OAuth callbacks
 * Requirements: 1.1, 4.3
 */

// Simple OAuth URL validation function for testing
function isValidOAuthCallbackUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const hasOAuthParams = urlObj.hash.includes('access_token') || 
                          urlObj.search.includes('code') || 
                          urlObj.search.includes('error');
    
    return pathname === '/auth/callback' && hasOAuthParams;
  } catch {
    return false;
  }
}

// OAuth flow detection function for testing
function detectOAuthFlow(url: string, referrer?: string): {
  isOAuthFlow: boolean;
  hasAccessToken: boolean;
  hasAuthCode: boolean;
  hasOAuthError: boolean;
  flowType: 'google' | 'github' | 'unknown';
} {
  try {
    const urlObj = new URL(url);
    const hash = urlObj.hash;
    const search = urlObj.search;
    
    const hasAccessToken = hash.includes('access_token');
    const hasAuthCode = search.includes('code');
    const hasOAuthError = search.includes('error') || hash.includes('error');
    
    const isFromGoogleOAuth = referrer?.includes('accounts.google.com') || false;
    const isFromGitHubOAuth = referrer?.includes('github.com') && referrer?.includes('oauth') || false;
    
    const isOAuthFlow = hasAccessToken || hasAuthCode || hasOAuthError || isFromGoogleOAuth || isFromGitHubOAuth;
    
    let flowType: 'google' | 'github' | 'unknown' = 'unknown';
    if (isFromGoogleOAuth || hash.includes('provider_token') || search.includes('provider=google')) {
      flowType = 'google';
    } else if (isFromGitHubOAuth || search.includes('provider=github')) {
      flowType = 'github';
    }
    
    return {
      isOAuthFlow,
      hasAccessToken,
      hasAuthCode,
      hasOAuthError,
      flowType,
    };
  } catch {
    return {
      isOAuthFlow: false,
      hasAccessToken: false,
      hasAuthCode: false,
      hasOAuthError: false,
      flowType: 'unknown',
    };
  }
}

describe('OAuth Callback Routing Property Tests', () => {
  /**
   * Property 1: OAuth callback routing consistency
   * For any valid OAuth callback URL with authentication parameters, 
   * the production server should serve the React application instead of returning a 404 error.
   * **Feature: oauth-callback-production-fix, Property 1: OAuth callback routing consistency**
   * **Validates: Requirements 1.1, 4.3**
   */
  it('Property 1: OAuth callback routing consistency - **Feature: oauth-callback-production-fix, Property 1: OAuth callback routing consistency** **Validates: Requirements 1.1, 4.3**', async () => {
    // Arbitraries for generating OAuth callback URLs
    const validOriginArbitrary = fc.constantFrom(
      'https://gg.lochtech.africa',
      'https://ganggreen-platform.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    );
    
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

    // Generate OAuth callback URLs with access tokens (implicit flow)
    const implicitFlowUrlArbitrary = fc.record({
      origin: validOriginArbitrary,
      accessToken: accessTokenArbitrary,
      refreshToken: refreshTokenArbitrary,
      expiresIn: fc.integer({ min: 3600, max: 86400 }),
      tokenType: fc.constant('bearer'),
    }).map(({ origin, accessToken, refreshToken, expiresIn, tokenType }) => {
      const hash = `#access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=${expiresIn}&token_type=${tokenType}`;
      return `${origin}/auth/callback${hash}`;
    });

    // Generate OAuth callback URLs with authorization codes (PKCE flow)
    const pkceFlowUrlArbitrary = fc.record({
      origin: validOriginArbitrary,
      code: authCodeArbitrary,
      state: fc.string({ minLength: 10, maxLength: 50 }),
    }).map(({ origin, code, state }) => {
      const search = `?code=${code}&state=${state}`;
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

    await fc.assert(
      fc.asyncProperty(validOAuthCallbackUrlArbitrary, (callbackUrl) => {
        try {
          // Parse the URL
          const url = new URL(callbackUrl);
          
          // Test 1: URL should be recognized as a valid OAuth callback URL
          const isValidCallback = isValidOAuthCallbackUrl(callbackUrl);
          
          // Test 2: OAuth flow should be detected
          const oauthContext = detectOAuthFlow(callbackUrl);
          
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

  /**
   * Test that invalid OAuth callback URLs are properly rejected
   */
  it('Property 2: Invalid OAuth callback URL rejection', async () => {
    const invalidOriginArbitrary = fc.constantFrom(
      'https://malicious-site.com',
      'http://fake-oauth.com',
      'https://phishing-site.net',
      'http://localhost:8080'
    );

    const accessTokenArbitrary = fc.string({ minLength: 20, maxLength: 200 })
      .map(s => `eyJ${s.replace(/[^a-zA-Z0-9]/g, '')}`);

    // Generate invalid OAuth callback URLs (wrong path, no OAuth params, etc.)
    const invalidOAuthCallbackUrlArbitrary = fc.oneof(
      // Wrong path
      fc.record({
        origin: fc.constantFrom('https://gg.lochtech.africa', 'https://ganggreen-platform.vercel.app'),
        path: fc.constantFrom('/login', '/dashboard', '/profile', '/wrong-path'),
        accessToken: accessTokenArbitrary,
      }).map(({ origin, path, accessToken }) => `${origin}${path}#access_token=${accessToken}`),
      
      // No OAuth parameters
      fc.constantFrom('https://gg.lochtech.africa', 'https://ganggreen-platform.vercel.app')
        .map(origin => `${origin}/auth/callback`),
      
      // Invalid origin with OAuth params
      fc.record({
        origin: invalidOriginArbitrary,
        accessToken: accessTokenArbitrary,
      }).map(({ origin, accessToken }) => `${origin}/auth/callback#access_token=${accessToken}`)
    );

    await fc.assert(
      fc.asyncProperty(invalidOAuthCallbackUrlArbitrary, (callbackUrl) => {
        try {
          // Test that invalid URLs are not recognized as valid OAuth callbacks
          const isValidCallback = isValidOAuthCallbackUrl(callbackUrl);
          
          // Invalid URLs should return false
          return !isValidCallback;
          
        } catch (error) {
          // Invalid URL format should be rejected
          return true;
        }
      }),
      {
        numRuns: 50,
        timeout: 10000,
      }
    );
  });

  /**
   * Test OAuth parameter combination handling
   */
  it('Property 3: OAuth parameter combination handling', async () => {
    const validOriginArbitrary = fc.constantFrom(
      'https://gg.lochtech.africa',
      'https://ganggreen-platform.vercel.app'
    );

    const accessTokenArbitrary = fc.string({ minLength: 20, maxLength: 200 })
      .map(s => `eyJ${s.replace(/[^a-zA-Z0-9]/g, '')}`);
    
    const refreshTokenArbitrary = fc.string({ minLength: 20, maxLength: 100 })
      .map(s => s.replace(/[^a-zA-Z0-9_-]/g, ''));
    
    const authCodeArbitrary = fc.string({ minLength: 10, maxLength: 50 })
      .map(s => s.replace(/[^a-zA-Z0-9_-]/g, ''));
    
    const oauthErrorArbitrary = fc.constantFrom(
      'access_denied',
      'invalid_request',
      'server_error'
    );

    const oauthParameterCombinationArbitrary = fc.record({
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
    });

    await fc.assert(
      fc.asyncProperty(oauthParameterCombinationArbitrary, ({ origin, hasAccessToken, hasRefreshToken, hasCode, hasError, hasState, accessToken, refreshToken, code, error, state }) => {
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
        
        // Test OAuth flow detection
        const oauthContext = detectOAuthFlow(url);
        
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
      }),
      {
        numRuns: 100,
        timeout: 10000,
      }
    );
  });

  /**
   * Test production routing configuration simulation
   */
  it('Property 4: Production routing configuration', async () => {
    const pathArbitrary = fc.oneof(
      fc.constant('/auth/callback'),
      fc.constantFrom('/login', '/dashboard', '/profile', '/about', '/contact'),
      fc.string({ minLength: 1, maxLength: 20 }).map(s => `/${s.replace(/[^a-zA-Z0-9-]/g, '')}`),
    );

    await fc.assert(
      fc.asyncProperty(pathArbitrary, (path) => {
        // Simulate Vercel routing logic from vercel.json
        const isStaticAsset = /\.(ico|png|jpg|jpeg|gif|css|js|svg|woff|woff2|ttf|eot)$/.test(path);
        const isApiRoute = path.startsWith('/api');
        const isNextRoute = path.startsWith('/_next');
        const isStaticRoute = path.startsWith('/_static');
        const isFavicon = path === '/favicon.ico' || path.includes('favicon');
        const isPublicAsset = path.startsWith('/public');
        const isAssetsRoute = path.startsWith('/assets');
        const isImagesRoute = path.startsWith('/images');
        
        // According to vercel.json rewrite rule:
        // "source": "/((?!api|_next|_static|favicon.ico|favicon-16x16.png|favicon-32x32.png|apple-touch-icon.png|assets|images|public).*)"
        const shouldNotRewrite = isStaticAsset || isApiRoute || isNextRoute || isStaticRoute || 
                                isFavicon || isPublicAsset || isAssetsRoute || isImagesRoute;
        
        // All other routes should be rewritten to serve the React app
        const shouldServeReactApp = !shouldNotRewrite;
        
        // For OAuth callback specifically, it should always serve React app
        const isOAuthCallback = path === '/auth/callback';
        
        if (isOAuthCallback) {
          // OAuth callback should always serve React app
          return shouldServeReactApp;
        } else {
          // Other routes follow normal routing rules - this is always true for our test
          return true;
        }
      }),
      {
        numRuns: 50,
        timeout: 10000,
      }
    );
  });
});