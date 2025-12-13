import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { authService } from '../services/auth.service';
import { ErrorLogger } from '../utils/errorLogger';
import { getAndClearRedirectDestination } from '../utils/redirectDestination';
import { detectOAuthFlow, logOAuth404Error } from '../utils/oauthErrorHandler';

/**
 * OAuth Callback Handler Page
 * Handles the redirect from OAuth providers (Google, etc.)
 * Validates the session and redirects to appropriate page
 * Requirements: 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const hasProcessed = useRef(false);

  // Maximum retry attempts for transient errors
  const MAX_RETRY_ATTEMPTS = 3;

  // Get allowed origins from environment or use defaults
  const getAllowedOrigins = (): string[] => {
    const envOrigins = import.meta.env.VITE_ALLOWED_ORIGINS;
    
    if (envOrigins) {
      return envOrigins.split(',').map((origin: string) => origin.trim());
    }
    
    // Default allowed origins for OAuth callbacks (production and development)
    return [
      'https://gg.lochtech.africa',           // Production domain
      'https://ganggreen-platform.vercel.app', // Vercel preview deployments
      'http://localhost:5173',                // Vite dev server
      'http://localhost:3000',                // Alternative dev port
      'http://127.0.0.1:5173',               // Alternative localhost
      'http://127.0.0.1:3000'                // Alternative localhost
    ];
  };

  const ALLOWED_ORIGINS = getAllowedOrigins();

  /**
   * Validates the request origin for security
   * Requirements: 5.4
   */
  const validateOrigin = (): boolean => {
    const currentOrigin = window.location.origin;
    const referrer = document.referrer;
    
    // Check if current origin is in allowed list
    const isValidOrigin = ALLOWED_ORIGINS.includes(currentOrigin);
    
    if (!isValidOrigin) {
      ErrorLogger.logSecurityError('Invalid Origin', new Error('OAuth callback from unauthorized origin'), {
        currentOrigin,
        referrer,
        allowedOrigins: ALLOWED_ORIGINS,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      return false;
    }

    // Log suspicious referrer patterns (optional additional security check)
    if (referrer && !referrer.startsWith('https://accounts.google.com') && !ALLOWED_ORIGINS.some(origin => referrer.startsWith(origin))) {
      ErrorLogger.logSecurityError('Suspicious Referrer', new Error('OAuth callback with unexpected referrer'), {
        currentOrigin,
        referrer,
        severity: 'MEDIUM',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      // Don't block the request, just log it for monitoring
    }

    return true;
  };

  /**
   * Validates OAuth parameters from URL
   * Requirements: 1.2, 5.3
   */
  const validateOAuthParameters = (searchParams: URLSearchParams, hashParams: URLSearchParams) => {
    const hasAccessToken = hashParams.has('access_token');
    const hasRefreshToken = hashParams.has('refresh_token');
    const hasCode = searchParams.has('code');
    const hasError = searchParams.has('error') || hashParams.has('error');

    // Check for OAuth error parameters
    if (hasError) {
      const oauthError = searchParams.get('error') || hashParams.get('error');
      const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
      
      ErrorLogger.logOAuthError(new Error(`OAuth Provider Error: ${oauthError}`), {
        error: oauthError,
        description: errorDescription,
        url: window.location.href,
        referrer: document.referrer
      });

      throw new Error(errorDescription || `Authentication failed: ${oauthError}`);
    }

    // Check if we have any OAuth parameters at all
    const hasOAuthParams = hasAccessToken || hasCode || hasError;
    
    if (!hasOAuthParams) {
      // Direct access without OAuth parameters - this is valid, redirect to login
      ErrorLogger.logRouteError('/auth/callback', new Error('Direct access without OAuth parameters'), {
        url: window.location.href,
        referrer: document.referrer,
        hasHash: !!window.location.hash,
        hasSearch: !!window.location.search
      });
      
      return { isDirectAccess: true };
    }

    // Validate token completeness for hash-based flow
    if (hasAccessToken && !hasRefreshToken) {
      throw new Error('Incomplete OAuth response: missing refresh token');
    }

    return {
      isDirectAccess: false,
      hasAccessToken,
      hasRefreshToken,
      hasCode,
      accessToken: hasAccessToken ? hashParams.get('access_token') : null,
      refreshToken: hasRefreshToken ? hashParams.get('refresh_token') : null,
      code: hasCode ? searchParams.get('code') : null
    };
  };

  /**
   * Handles session establishment with retry logic
   * Requirements: 1.3, 1.4
   */
  const establishSession = async (params: any, attempt = 1): Promise<boolean> => {
    try {
      let sessionData = null;

      // Handle PKCE flow (authorization code)
      if (params.code) {
        ErrorLogger.logError('OAuth Code Exchange', new Error('Exchanging authorization code'), {
          hasCode: true,
          attempt
        });

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
        
        if (exchangeError) {
          throw exchangeError;
        }
        
        sessionData = data;
      }
      // Handle implicit flow (access token in hash)
      else if (params.accessToken && params.refreshToken) {
        ErrorLogger.logError('OAuth Token Session', new Error('Setting session from tokens'), {
          hasTokens: true,
          attempt
        });

        const { data, error: setSessionError } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });

        if (setSessionError) {
          throw setSessionError;
        }

        sessionData = data;
      }

      // Verify session was established
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        ErrorLogger.logSessionError(sessionError, { attempt }, {
          url: window.location.href,
          hasSessionData: !!sessionData
        });
        throw sessionError;
      }

      if (!session) {
        const noSessionError = new Error('No session established after OAuth callback');
        ErrorLogger.logSessionError(noSessionError, { 
          sessionData: !!sessionData,
          attempt 
        }, {
          url: window.location.href,
          hasTokens: !!(params.accessToken && params.refreshToken),
          hasCode: !!params.code
        });
        throw noSessionError;
      }

      return true;
    } catch (error) {
      // Log the session establishment error
      ErrorLogger.logSessionError(error, { attempt }, {
        url: window.location.href,
        hasCode: !!params.code,
        hasTokens: !!(params.accessToken && params.refreshToken)
      });

      // Retry logic for transient errors
      if (attempt < MAX_RETRY_ATTEMPTS && isRetryableError(error)) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        return establishSession(params, attempt + 1);
      }

      throw error;
    }
  };

  /**
   * Determines if an error is retryable
   */
  const isRetryableError = (error: any): boolean => {
    if (!error) return false;
    
    const retryableMessages = [
      'network error',
      'timeout',
      'connection failed',
      'temporary failure',
      'rate limit'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  };

  /**
   * Handles retry attempts
   * Requirements: 1.4
   */
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    hasProcessed.current = false; // Allow re-processing
  };

  useEffect(() => {
    // Prevent multiple executions (React StrictMode runs effects twice in dev)
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Detect OAuth flow context and log 404 errors if route is incorrect
        const oauthContext = detectOAuthFlow();
        
        // If we're in an OAuth flow but not on the correct callback route, log as 404 error
        if (oauthContext.isOAuthFlow && window.location.pathname !== '/auth/callback') {
          logOAuth404Error(window.location.href, {
            trigger: 'incorrect_callback_route',
            expectedRoute: '/auth/callback',
            actualRoute: window.location.pathname,
            flowContext: oauthContext
          });
        }

        // Validate origin for security first
        if (!validateOrigin()) {
          throw new Error('OAuth callback from unauthorized origin. This may be a security issue.');
        }

        // Log callback attempt for debugging
        ErrorLogger.logError('OAuth Callback Initiated', new Error('Processing OAuth callback'), {
          url: window.location.href,
          hash: window.location.hash ? '[PRESENT]' : 'none',
          search: window.location.search || 'none',
          referrer: document.referrer || 'none',
          retryCount,
          origin: window.location.origin
        });

        // Parse and validate URL parameters
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const validationResult = validateOAuthParameters(searchParams, hashParams);

        // Handle direct access without OAuth parameters
        if (validationResult.isDirectAccess) {
          ErrorLogger.logRouteError('/auth/callback', new Error('Direct access - redirecting to login'), {
            url: window.location.href,
            referrer: document.referrer
          });
          
          navigate('/login', { replace: true });
          return;
        }

        // Establish session with the validated parameters
        await establishSession(validationResult);

        // Get the established session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          try {
            // Ensure user profile exists for OAuth users
            const user = session.user;
            const metadata = {
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            };

            // Create profile if needed
            await authService.ensureUserProfile(user.id, metadata);

            // Clear the URL parameters to prevent re-processing
            window.history.replaceState(null, '', window.location.pathname);

            // Get stored redirect destination or default to dashboard
            // Requirements: 5.5
            const redirectDestination = getAndClearRedirectDestination() || '/dashboard';

            // Successful authentication, redirect to intended destination
            ErrorLogger.logError('OAuth Success', new Error('Authentication successful'), {
              userId: user.id,
              provider: user.app_metadata?.provider,
              redirectDestination
            });

            navigate(redirectDestination, { replace: true });
          } catch (profileError) {
            // Even if profile creation fails, let user through
            ErrorLogger.logError('Profile Creation Warning', profileError, {
              userId: session.user.id,
              continuing: true
            });
            
            navigate('/dashboard', { replace: true });
          }
        } else {
          throw new Error('Session established but no user found');
        }
      } catch (err) {
        ErrorLogger.logOAuthError(err, {
          url: window.location.href,
          referrer: document.referrer,
          retryCount,
          hasHash: !!window.location.hash,
          hasSearch: !!window.location.search
        });

        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        
        // Handle origin validation failures specifically
        if (errorMessage.includes('unauthorized origin')) {
          setError('Security Error: This authentication request appears to be from an unauthorized source. Please try signing in again from the official website.');
        } else {
          setError(errorMessage);
        }
        
        setIsLoading(false);
      }
    };

    // Small delay to ensure URL parameters are available
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [navigate, retryCount]);

  // Enhanced loading state with better UX
  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {retryCount > 0 ? 'Retrying sign in...' : 'Completing sign in...'}
          </h2>
          <p className="text-gray-600 mb-4">
            {retryCount > 0 
              ? `Attempt ${retryCount + 1} of ${MAX_RETRY_ATTEMPTS + 1}. Please wait...`
              : 'Please wait while we set up your account.'
            }
          </p>
          {retryCount > 0 && (
            <div className="text-sm text-gray-500">
              This may take a moment due to network conditions.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhanced error state with retry options
  if (error) {
    const canRetry = retryCount < MAX_RETRY_ATTEMPTS && isRetryableError({ message: error });
    const isSecurityError = error.includes('Security Error') || error.includes('unauthorized origin');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
              isSecurityError ? 'bg-orange-100' : 'bg-red-100'
            }`}>
              {isSecurityError ? (
                <svg
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isSecurityError ? 'Security Warning' : 'Sign In Failed'}
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            {retryCount > 0 && !isSecurityError && (
              <p className="text-sm text-gray-500 mb-4">
                Failed after {retryCount + 1} attempt{retryCount > 0 ? 's' : ''}.
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            {canRetry && !isSecurityError && (
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Again ({MAX_RETRY_ATTEMPTS - retryCount} attempts left)
              </button>
            )}
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              {isSecurityError ? 'Go to Official Login' : 'Return to Login'}
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Go Home
            </button>
          </div>
          
          {isSecurityError && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Security Notice:</strong> For your protection, please only sign in from the official #GangGreen website at{' '}
                <span className="font-mono">https://gg.lochtech.africa</span>
              </p>
            </div>
          )}
          
          {!canRetry && retryCount > 0 && !isSecurityError && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                If this problem persists, please try signing in again later or contact support.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // This should not be reached, but just in case
  return null;
}
