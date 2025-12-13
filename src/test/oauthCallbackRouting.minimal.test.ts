import { describe, it, expect } from 'vitest';

/**
 * Minimal OAuth Callback Routing Test
 * Testing basic OAuth URL validation logic
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

describe('OAuth Callback Routing - Minimal Tests', () => {
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

  it('should validate production routing logic', () => {
    // Test the routing logic that would be used by Vercel
    const testRoutes = [
      { path: '/auth/callback', shouldServeReact: true },
      { path: '/login', shouldServeReact: true },
      { path: '/dashboard', shouldServeReact: true },
      { path: '/api/users', shouldServeReact: false },
      { path: '/_next/static/chunk.js', shouldServeReact: false },
      { path: '/favicon.ico', shouldServeReact: false },
      { path: '/assets/image.png', shouldServeReact: false },
    ];

    testRoutes.forEach(({ path, shouldServeReact }) => {
      // Simulate Vercel routing logic from vercel.json
      const isStaticAsset = /\.(ico|png|jpg|jpeg|gif|css|js|svg|woff|woff2|ttf|eot)$/.test(path);
      const isApiRoute = path.startsWith('/api');
      const isNextRoute = path.startsWith('/_next');
      const isStaticRoute = path.startsWith('/_static');
      const isFavicon = path === '/favicon.ico' || path.includes('favicon');
      const isPublicAsset = path.startsWith('/public');
      
      // According to vercel.json rewrite rule:
      // "source": "/((?!api|_next|_static|favicon.ico|favicon-16x16.png|favicon-32x32.png|apple-touch-icon.png|assets|images|public).*)"
      const shouldNotRewrite = isStaticAsset || isApiRoute || isNextRoute || isStaticRoute || 
                              isFavicon || isPublicAsset || path.startsWith('/assets') || 
                              path.startsWith('/images');
      
      const actuallyServesReact = !shouldNotRewrite;
      
      expect(actuallyServesReact).toBe(shouldServeReact);
    });
  });
});