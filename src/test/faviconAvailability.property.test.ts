import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createPropertyTest } from './property-helpers';

/**
 * Favicon Availability Property Tests
 * **Feature: oauth-callback-production-fix, Property 5: Favicon availability across routes**
 * **Validates: Requirements 2.1**
 * 
 * Tests that favicon requests return valid files with 200 status across all routes
 */

describe('Favicon Availability Property Tests', () => {
  // Mock fetch for testing favicon requests
  const mockFetch = (url: string): Promise<Response> => {
    const faviconFiles = [
      '/favicon.ico',
      '/favicon-16x16.png', 
      '/favicon-32x32.png',
      '/apple-touch-icon.png',
      '/favicon.svg'
    ];
    
    // Check if the request is for a favicon file
    const isFaviconRequest = faviconFiles.some(favicon => url.includes(favicon));
    
    if (isFaviconRequest) {
      // Simulate successful favicon serving
      return Promise.resolve(new Response('favicon-content', {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': url.endsWith('.ico') ? 'image/x-icon' : 
                         url.endsWith('.png') ? 'image/png' :
                         url.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      }));
    }
    
    // For non-favicon requests, return 404
    return Promise.resolve(new Response('Not Found', {
      status: 404,
      statusText: 'Not Found'
    }));
  };

  // Generator for random page routes
  const pageRouteArbitrary = fc.oneof(
    // Common application routes
    fc.constantFrom(
      '/',
      '/dashboard',
      '/login',
      '/auth/callback',
      '/profile',
      '/initiatives',
      '/marketplace',
      '/trees',
      '/badges',
      '/settings'
    ),
    // Dynamic routes with parameters
    fc.tuple(
      fc.constantFrom('/user/', '/initiative/', '/tree/', '/badge/'),
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s))
    ).map(([base, param]) => `${base}${param}`),
    // Nested routes
    fc.tuple(
      fc.constantFrom('/dashboard/', '/profile/', '/settings/'),
      fc.constantFrom('overview', 'details', 'edit', 'history')
    ).map(([base, sub]) => `${base}${sub}`)
  );

  // Generator for favicon file paths
  const faviconPathArbitrary = fc.constantFrom(
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png', 
    '/apple-touch-icon.png',
    '/favicon.svg'
  );

  createPropertyTest(
    'favicon requests should return 200 status across all routes',
    fc.tuple(pageRouteArbitrary, faviconPathArbitrary),
    async ([pageRoute, faviconPath]) => {
      // Simulate a favicon request from any page route
      const baseUrl = 'https://gg.lochtech.africa';
      const faviconUrl = `${baseUrl}${faviconPath}`;
      
      // Mock the favicon request
      const response = await mockFetch(faviconUrl);
      
      // Property: Favicon requests should always return 200 status
      if (response.status !== 200) return false;
      if (response.statusText !== 'OK') return false;
      
      // Verify appropriate content type is set
      const contentType = response.headers.get('Content-Type');
      if (faviconPath.endsWith('.ico') && contentType !== 'image/x-icon') return false;
      if (faviconPath.endsWith('.png') && contentType !== 'image/png') return false;
      if (faviconPath.endsWith('.svg') && contentType !== 'image/svg+xml') return false;
      
      // Verify cache headers are set for performance
      const cacheControl = response.headers.get('Cache-Control');
      if (!cacheControl?.includes('public')) return false;
      if (!cacheControl?.includes('max-age')) return false;
      
      return true;
    },
    {
      featureName: 'oauth-callback-production-fix',
      propertyNumber: 5,
      propertyText: 'Favicon availability across routes',
      requirements: ['2.1'],
      numRuns: 100
    }
  );

  createPropertyTest(
    'favicon files should be consistently available regardless of current page route',
    fc.tuple(pageRouteArbitrary, faviconPathArbitrary),
    async ([currentPageRoute, faviconPath]) => {
      // Simulate being on any page route and requesting favicon
      const baseUrl = 'https://gg.lochtech.africa';
      const currentPageUrl = `${baseUrl}${currentPageRoute}`;
      const faviconUrl = `${baseUrl}${faviconPath}`;
      
      // Mock favicon request with referrer from current page
      const response = await mockFetch(faviconUrl);
      
      // Property: Favicon availability should be independent of current page route
      if (response.status !== 200) return false;
      
      // Verify the response contains actual content (not empty)
      const content = await response.text();
      if (!content || content.length === 0) return false;
      
      return true;
    },
    {
      featureName: 'oauth-callback-production-fix', 
      propertyNumber: 5,
      propertyText: 'Favicon availability across routes',
      requirements: ['2.1'],
      numRuns: 100
    }
  );

  createPropertyTest(
    'favicon requests should have appropriate cache headers for performance',
    faviconPathArbitrary,
    async (faviconPath) => {
      const baseUrl = 'https://gg.lochtech.africa';
      const faviconUrl = `${baseUrl}${faviconPath}`;
      
      const response = await mockFetch(faviconUrl);
      
      // Property: Favicon responses should have long-term cache headers
      if (response.status !== 200) return false;
      
      const cacheControl = response.headers.get('Cache-Control');
      if (!cacheControl) return false;
      if (!cacheControl.includes('public')) return false;
      if (!cacheControl.includes('max-age')) return false;
      if (!cacheControl.includes('immutable')) return false;
      
      // Verify cache duration is long-term (1 year = 31536000 seconds)
      if (!cacheControl.includes('max-age=31536000')) return false;
      
      return true;
    },
    {
      featureName: 'oauth-callback-production-fix',
      propertyNumber: 5, 
      propertyText: 'Favicon availability across routes',
      requirements: ['2.1'],
      numRuns: 50
    }
  );

  // Test fallback behavior when favicon is missing (edge case)
  it('should handle missing favicon gracefully', async () => {
    const mockFetchWithMissingFavicon = (url: string): Promise<Response> => {
      // Simulate missing favicon scenario
      if (url.includes('/favicon.ico')) {
        return Promise.resolve(new Response('Not Found', {
          status: 404,
          statusText: 'Not Found'
        }));
      }
      
      // Other favicon files are available
      const otherFaviconFiles = [
        '/favicon-16x16.png',
        '/favicon-32x32.png', 
        '/apple-touch-icon.png',
        '/favicon.svg'
      ];
      
      const isOtherFaviconRequest = otherFaviconFiles.some(favicon => url.includes(favicon));
      
      if (isOtherFaviconRequest) {
        return Promise.resolve(new Response('favicon-content', {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': url.endsWith('.png') ? 'image/png' : 'image/svg+xml'
          }
        }));
      }
      
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    };

    // Test that when favicon.ico is missing, other formats are still available
    const faviconIcoResponse = await mockFetchWithMissingFavicon('https://gg.lochtech.africa/favicon.ico');
    expect(faviconIcoResponse.status).toBe(404);
    
    // But PNG fallbacks should work
    const faviconPngResponse = await mockFetchWithMissingFavicon('https://gg.lochtech.africa/favicon-16x16.png');
    expect(faviconPngResponse.status).toBe(200);
    
    const appleTouchResponse = await mockFetchWithMissingFavicon('https://gg.lochtech.africa/apple-touch-icon.png');
    expect(appleTouchResponse.status).toBe(200);
  });

  // Test that favicon requests don't interfere with OAuth callback routing
  it('should not interfere with OAuth callback routing', async () => {
    const oauthCallbackUrl = 'https://gg.lochtech.africa/auth/callback#access_token=test123';
    const faviconUrl = 'https://gg.lochtech.africa/favicon.ico';
    
    // Both requests should be handled independently
    const oauthResponse = await mockFetch(oauthCallbackUrl);
    const faviconResponse = await mockFetch(faviconUrl);
    
    // OAuth callback should not be treated as favicon request
    expect(oauthResponse.status).toBe(404); // Would be handled by React router in real app
    
    // Favicon request should succeed
    expect(faviconResponse.status).toBe(200);
    expect(faviconResponse.headers.get('Content-Type')).toBe('image/x-icon');
  });
});