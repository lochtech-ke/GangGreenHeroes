import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ErrorLogger } from '../utils/errorLogger';
import { getAndClearRedirectDestination } from '../utils/redirectDestination';
import { detectOAuthFlow, logOAuth404Error } from '../utils/oauthErrorHandler';

/**
 * OAuth Callback Handler Page
 * Handles the redirect from OAuth providers (Google, etc.)
 * Strictly handles token exchange/session verification and redirects.
 * NO heavy lifting (profile creation, badges) - that is done in UserInitializer.
 * Requirements: 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasProcessed = useRef(false);

  // Get allowed origins from environment or use defaults
  const getAllowedOrigins = (): string[] => {
    const envOrigins = import.meta.env.VITE_ALLOWED_ORIGINS;
    if (envOrigins) {
      return envOrigins.split(',').map((origin: string) => origin.trim());
    }
    return [
      'https://gg.lochtech.africa',
      'https://ganggreen-platform.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
  };

  const ALLOWED_ORIGINS = getAllowedOrigins();

  const validateOrigin = (): boolean => {
    const currentOrigin = window.location.origin;
    const isValidOrigin = ALLOWED_ORIGINS.includes(currentOrigin);
    if (!isValidOrigin) {
      ErrorLogger.logSecurityError('Invalid Origin', new Error('OAuth callback from unauthorized origin'), {
        currentOrigin,
        allowedOrigins: ALLOWED_ORIGINS,
      });
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        const oauthContext = detectOAuthFlow();

        if (oauthContext.isOAuthFlow && window.location.pathname !== '/auth/callback') {
          logOAuth404Error(window.location.href, {
            trigger: 'incorrect_callback_route',
            expectedRoute: '/auth/callback',
            actualRoute: window.location.pathname,
            flowContext: oauthContext
          });
        }

        if (!validateOrigin()) {
          throw new Error('OAuth callback from unauthorized origin.');
        }

        // Parse Params
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // Basic Error Check
        const error = searchParams.get('error') || hashParams.get('error');
        if (error) {
          const description = searchParams.get('error_description') || hashParams.get('error_description');
          throw new Error(description || `Authentication failed: ${error}`);
        }

        const code = searchParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // Exchange Code or Tokens if present
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setSessionError) throw setSessionError;
        }

        // Final Session Check (Fast)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          // SUCCESS: Redirect immediately.
          window.history.replaceState(null, '', window.location.pathname);
          const redirectDestination = getAndClearRedirectDestination() || '/dashboard';
          navigate(redirectDestination, { replace: true });
        } else {
          throw new Error('No session established. Please try logging in again.');
        }

      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing sign in...</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
