# Design Document: OAuth Callback Production Fix

## Overview

This design document outlines the solution for fixing critical OAuth callback issues in the production environment at https://gg.lochtech.africa. The primary issue is a Vercel 404 error occurring during Google OAuth authentication callbacks, preventing users from successfully signing in. Additionally, a missing favicon.ico file causes secondary 404 errors. The solution focuses on production-specific routing configuration, proper error handling, and asset management.

## Architecture

### Problem Analysis

The current production failure occurs in this flow:

```
User clicks "Sign in with Google" on production
    ↓
Google OAuth consent screen (✓ Working)
    ↓
User authorizes application (✓ Working)
    ↓
Google redirects to: https://gg.lochtech.africa/auth/callback#access_token=... (❌ 404 Error)
    ↓
Vercel returns 404: NOT_FOUND instead of serving React app
    ↓
User sees error page instead of being authenticated
```

### Root Cause Analysis

1. **Client-Side Routing Issue**: Vercel is not configured to serve the React application for the `/auth/callback` route
2. **Missing Favicon**: No favicon.ico file in the public directory
3. **Production vs Development**: The issue doesn't occur in development because Vite dev server handles all routes

### Solution Architecture

```
Production Request: /auth/callback
    ↓
Vercel Routing Rules (vercel.json)
    ↓
Serve index.html (React App)
    ↓
React Router handles /auth/callback
    ↓
AuthCallbackPage processes OAuth tokens
    ↓
Redirect to dashboard or show error
```

## Components and Interfaces

### 1. Vercel Configuration Update

The primary fix requires updating `vercel.json` to handle client-side routing properly:

```json
{
  "rewrites": [
    {
      "source": "/((?!api|_next|_static|favicon.ico|public).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/auth/callback",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

**Key Changes:**
- Rewrite all non-API routes to serve `index.html`
- Exclude favicon.ico from rewriting
- Add no-cache headers for OAuth callback to prevent stale responses

### 2. Favicon Implementation

Add proper favicon files to the public directory:

```
public/
├── favicon.ico          # Standard ICO format (16x16, 32x32, 48x48)
├── favicon-16x16.png    # PNG fallback for modern browsers
├── favicon-32x32.png    # PNG fallback for modern browsers
└── apple-touch-icon.png # iOS/macOS support
```

Update `index.html` to reference favicon properly:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

### 3. Enhanced AuthCallbackPage

Improve the existing AuthCallbackPage to handle production-specific scenarios:

```typescript
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Log callback attempt for debugging
        console.log('OAuth callback initiated', {
          url: window.location.href,
          hash: window.location.hash ? '[REDACTED]' : 'none',
          search: window.location.search
        });

        // Check for OAuth parameters in URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const hasOAuthParams = hashParams.has('access_token') || 
                              searchParams.has('code') || 
                              searchParams.has('error');

        if (!hasOAuthParams) {
          // Direct access without OAuth parameters - redirect to login
          console.log('No OAuth parameters found, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        // Handle OAuth error from provider
        const oauthError = hashParams.get('error') || searchParams.get('error');
        if (oauthError) {
          const errorDescription = hashParams.get('error_description') || 
                                 searchParams.get('error_description') || 
                                 'Authentication failed';
          throw new Error(`OAuth Error: ${oauthError} - ${errorDescription}`);
        }

        // Get session from Supabase (handles token exchange automatically)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session?.user) {
          console.log('OAuth authentication successful');
          
          // Ensure user profile exists (for new Google users)
          await ensureUserProfile(session.user);
          
          // Clear URL parameters and redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('No session established after OAuth callback');
        }
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Small delay to ensure URL parameters are available
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  // Enhanced loading and error UI
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing sign in...</h2>
          <p className="text-gray-600">Please wait while we set up your account.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
```

### 4. Error Logging Service

Create a production-safe error logging utility:

```typescript
// src/utils/errorLogger.ts
interface ErrorLogData {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  context?: Record<string, any>;
}

export class ErrorLogger {
  private static sanitizeError(error: any): ErrorLogData {
    const sanitized: ErrorLogData = {
      message: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add stack trace in development
    if (import.meta.env.DEV && error?.stack) {
      sanitized.stack = error.stack;
    }

    return sanitized;
  }

  private static filterSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;
    
    const filtered = { ...data };
    const sensitiveKeys = ['access_token', 'refresh_token', 'password', 'secret', 'key'];
    
    for (const key in filtered) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        filtered[key] = '[REDACTED]';
      } else if (typeof filtered[key] === 'object') {
        filtered[key] = this.filterSensitiveData(filtered[key]);
      }
    }
    
    return filtered;
  }

  static logOAuthError(error: any, context?: Record<string, any>) {
    const sanitizedError = this.sanitizeError(error);
    const sanitizedContext = context ? this.filterSensitiveData(context) : undefined;
    
    console.error('OAuth Error:', {
      ...sanitizedError,
      context: sanitizedContext
    });

    // In production, could send to monitoring service
    if (import.meta.env.PROD) {
      // Example: Send to Sentry, LogRocket, etc.
      // this.sendToMonitoring(sanitizedError, sanitizedContext);
    }
  }

  static logRouteError(route: string, error: any) {
    console.error(`Route Error [${route}]:`, this.sanitizeError(error));
  }
}
```

## Data Models

### OAuth Callback URL Structure

The OAuth callback URL contains authentication data in the URL fragment:

```typescript
interface OAuthCallbackParams {
  access_token: string;      // JWT token from Supabase
  expires_at: number;        // Token expiration timestamp
  expires_in: number;        // Seconds until expiration
  provider_refresh_token: string; // Google refresh token
  provider_token: string;    // Google access token
  refresh_token: string;     // Supabase refresh token
  token_type: 'bearer';      // Token type
}

interface OAuthErrorParams {
  error: string;             // Error code (e.g., 'access_denied')
  error_description?: string; // Human-readable error description
}
```

### Favicon Asset Requirements

```typescript
interface FaviconAssets {
  'favicon.ico': {
    sizes: [16, 32, 48];     // Multi-size ICO file
    format: 'ico';
  };
  'favicon-16x16.png': {
    size: 16;
    format: 'png';
  };
  'favicon-32x32.png': {
    size: 32;
    format: 'png';
  };
  'apple-touch-icon.png': {
    size: 180;               // Apple recommended size
    format: 'png';
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: OAuth callback routing consistency**
*For any* valid OAuth callback URL with authentication parameters, the production server should serve the React application instead of returning a 404 error.
**Validates: Requirements 1.1, 4.3**

**Property 2: Token extraction completeness**
*For any* OAuth callback URL containing access tokens in the fragment, all required authentication parameters should be correctly extracted and parsed.
**Validates: Requirements 1.2**

**Property 3: Valid token session establishment**
*For any* valid access token received in an OAuth callback, the system should successfully establish a user session and redirect to the dashboard.
**Validates: Requirements 1.3**

**Property 4: Error handling consistency**
*For any* OAuth callback error scenario, the system should display a meaningful error message and provide retry options.
**Validates: Requirements 1.4**

**Property 5: Favicon availability across routes**
*For any* page route on the production site, requesting the favicon should return a valid file with a 200 status code.
**Validates: Requirements 2.1**

**Property 6: OAuth error logging completeness**
*For any* OAuth callback error, the logged information should include the callback URL and relevant parameters while excluding sensitive data.
**Validates: Requirements 3.1, 3.4**

**Property 7: Session failure logging**
*For any* authentication session establishment failure, the system should log the authentication state and relevant context information.
**Validates: Requirements 3.2**

**Property 8: 404 error context logging**
*For any* 404 error during OAuth flow, the logged information should capture the requested URL and referrer information.
**Validates: Requirements 3.3**

**Property 9: Sensitive data filtering**
*For any* error log entry containing OAuth data, sensitive information like access tokens should be redacted while preserving debugging context.
**Validates: Requirements 3.4**

**Property 10: Authentication flow compatibility**
*For any* existing authentication method (email/password, Web3), the updated routing configuration should not interfere with the authentication flow.
**Validates: Requirements 4.4**

**Property 11: Invalid parameter handling**
*For any* OAuth callback with malformed or invalid parameters, the system should handle the error gracefully without crashing.
**Validates: Requirements 5.3**

**Property 12: Origin validation security**
*For any* OAuth callback request, the system should validate the request origin to prevent cross-origin attacks.
**Validates: Requirements 5.4**

**Property 13: Redirect destination preservation**
*For any* OAuth callback with an intended destination, the redirect flow should preserve and honor the user's original navigation intent.
**Validates: Requirements 5.5**

## Error Handling

### Production Routing Errors

1. **404 on OAuth Callback**: Primary issue being fixed
   - Root Cause: Vercel not configured for client-side routing
   - Solution: Update vercel.json with proper rewrites
   - Fallback: Error page with retry option

2. **Missing Favicon**: Secondary 404 error
   - Root Cause: No favicon.ico file in public directory
   - Solution: Add favicon assets and proper HTML references
   - Fallback: Browser default icon (no functional impact)

3. **Invalid OAuth Parameters**: Malformed callback URLs
   - Detection: Parse and validate URL parameters
   - Response: Show user-friendly error message
   - Recovery: Redirect to login with retry option

### Error Recovery Strategies

1. **Automatic Retry**: For transient network errors
2. **User-Initiated Retry**: For authentication failures
3. **Graceful Degradation**: Fallback to alternative auth methods
4. **Error Reporting**: Log errors for monitoring and debugging

### Production-Specific Considerations

- **Caching**: Ensure OAuth callbacks are never cached
- **HTTPS**: All OAuth flows must use HTTPS in production
- **CORS**: Validate origins for security
- **Monitoring**: Track OAuth success/failure rates

## Testing Strategy

### Unit Tests

1. **URL Parameter Parsing**
   - Test extraction of OAuth parameters from URL fragments
   - Test handling of missing or malformed parameters
   - Test error parameter parsing

2. **Error Logging Utilities**
   - Test sensitive data filtering
   - Test log message formatting
   - Test context information inclusion

3. **Route Configuration**
   - Test vercel.json rewrite rules
   - Test favicon serving
   - Test client-side routing

### Property-Based Tests

Property-based testing will verify the universal properties identified above using the fast-check library:

1. **Property Test: OAuth Callback Routing**
   - Generate random OAuth callback URLs with various parameter combinations
   - Verify all valid callbacks are routed to React app
   - Verify invalid callbacks are handled gracefully

2. **Property Test: Token Extraction**
   - Generate random OAuth response URLs with different token formats
   - Verify all required parameters are extracted correctly
   - Verify missing parameters are detected

3. **Property Test: Error Logging Safety**
   - Generate random error objects with sensitive OAuth data
   - Verify sensitive information is redacted from logs
   - Verify debugging context is preserved

4. **Property Test: Authentication Flow Compatibility**
   - Generate random authentication scenarios for all methods
   - Verify routing changes don't break existing flows
   - Verify session establishment works consistently

### Integration Tests

1. **End-to-End OAuth Flow**
   - Mock Google OAuth provider responses
   - Test complete authentication flow
   - Verify session establishment and redirect

2. **Production Routing Simulation**
   - Test Vercel routing configuration locally
   - Verify client-side routing works correctly
   - Test favicon serving

3. **Error Scenario Testing**
   - Test various OAuth error conditions
   - Verify error messages and recovery options
   - Test direct callback URL access

### Manual Testing Checklist

1. **Production OAuth Flow**
   - Test Google sign-in on production URL
   - Verify successful authentication and redirect
   - Test error scenarios (cancelled auth, network issues)

2. **Favicon Verification**
   - Check favicon loads on all pages
   - Verify no 404 errors in browser console
   - Test favicon caching behavior

3. **Edge Cases**
   - Direct access to /auth/callback
   - Expired OAuth parameters
   - Invalid OAuth parameters
   - Cross-origin requests

### Testing Framework

- **Unit/Integration Tests**: Vitest with React Testing Library
- **Property-Based Tests**: fast-check library for TypeScript
- **E2E Tests**: Playwright for production testing
- **Mocking**: Mock Supabase and Google OAuth responses
- **Coverage Target**: 90% code coverage for new/modified code

## Performance Considerations

### OAuth Flow Performance

- **Redirect Time**: OAuth adds ~2-3 seconds to authentication
- **Token Processing**: Minimal impact (<100ms for token extraction)
- **Session Establishment**: Existing Supabase performance (~200ms)

### Favicon Performance

- **File Size**: Keep favicon.ico under 10KB
- **Caching**: Set appropriate cache headers (1 year)
- **Format Optimization**: Use ICO format for broad compatibility

### Production Routing

- **Vercel Edge**: Routing rules processed at edge locations
- **Cache Behavior**: OAuth callbacks never cached (no-cache headers)
- **Bundle Size**: No impact on JavaScript bundle size

## Security Considerations

### OAuth Security

1. **State Parameter Validation**: Supabase handles CSRF protection
2. **Origin Validation**: Verify requests come from authorized domains
3. **Token Handling**: Never log or expose full access tokens
4. **HTTPS Enforcement**: All OAuth flows require HTTPS

### Production Security

1. **Route Protection**: Ensure sensitive routes are protected
2. **Error Information**: Don't expose internal errors to users
3. **Logging Security**: Filter sensitive data from all logs
4. **CORS Configuration**: Restrict cross-origin requests appropriately

## Deployment Considerations

### Vercel Configuration

The `vercel.json` file must be updated and deployed:

```json
{
  "rewrites": [
    {
      "source": "/((?!api|_next|_static|favicon.ico|public).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/auth/callback",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/favicon.ico",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Asset Deployment

Favicon files must be added to the public directory:
- Generate favicon.ico with multiple sizes (16x16, 32x32, 48x48)
- Create PNG fallbacks for modern browsers
- Add Apple touch icon for iOS devices

### Environment Verification

Before deployment, verify:
1. Supabase OAuth configuration includes production domain
2. Google OAuth credentials allow production redirects
3. All environment variables are set correctly
4. HTTPS is enforced for all OAuth endpoints

### Rollback Plan

If deployment causes issues:
1. **Quick Fix**: Revert vercel.json changes
2. **Favicon Issues**: Remove favicon references from HTML
3. **OAuth Issues**: Disable Google OAuth temporarily
4. **Full Rollback**: Revert to previous deployment

## Monitoring and Observability

### Key Metrics

1. **OAuth Success Rate**: Percentage of successful authentications
2. **404 Error Rate**: Monitor for routing issues
3. **Favicon Load Success**: Track favicon 404 errors
4. **Authentication Latency**: Time from OAuth start to session establishment

### Error Monitoring

1. **OAuth Callback Errors**: Track and alert on authentication failures
2. **Routing Errors**: Monitor 404 rates on OAuth routes
3. **Session Establishment**: Track session creation failures
4. **Client-Side Errors**: Monitor JavaScript errors during OAuth flow

### Logging Strategy

1. **Structured Logging**: Use consistent log format
2. **Sensitive Data Filtering**: Automatic redaction of tokens
3. **Context Preservation**: Include enough detail for debugging
4. **Production Safety**: Never log full tokens or passwords

## Future Enhancements

1. **OAuth Provider Expansion**: Support for GitHub, Microsoft, Apple
2. **Advanced Error Recovery**: Automatic retry with exponential backoff
3. **Performance Optimization**: Preload OAuth provider scripts
4. **Enhanced Monitoring**: Real-time OAuth success rate dashboard
5. **A/B Testing**: Test different OAuth button placements and styles

## References

- [Vercel Rewrites Documentation](https://vercel.com/docs/concepts/projects/project-configuration#rewrites)
- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Favicon Best Practices](https://web.dev/favicon/)
- [React Router Production Deployment](https://reactrouter.com/en/main/guides/deploying)