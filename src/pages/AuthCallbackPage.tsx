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
  const [status, setStatus] = useState<string>('Initializing...');
  const [isLoading, setIsLoading] = useState(true);
  const [connectivity, setConnectivity] = useState<string>('Checking...');
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

  const timeoutPromise = (ms: number, message: string) => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  };

  // Debug check for vars
  const debugEnv = {
    url: import.meta.env.VITE_SUPABASE_URL ? 'Set (starts with ' + import.meta.env.VITE_SUPABASE_URL.substring(0, 8) + ')' : 'MISSING',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'MISSING'
  };

  // Connectivity Check Effect
  useEffect(() => {
    const checkConn = async () => {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        setConnectivity('Skipped (No URL)');
        return;
      }
      try {
        // Try to hit the health endpoint
        // MUST include apikey for this to work (even for public projects sometimes)
        const res = await fetch(import.meta.env.VITE_SUPABASE_URL + '/auth/v1/health', {
          method: 'GET',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        });
        if (res.ok) setConnectivity('OK (200)');
        else setConnectivity(`Error: ${res.status}`);
      } catch (e: any) {
        setConnectivity(`Failed: ${e.message}`);
      }
    };
    checkConn();
  }, []);

  useEffect(() => {
    console.log('[AuthCallback] Component mounted');
    // In React 18 Strict Mode, effects run twice.
    if (hasProcessed.current) {
      console.log('[AuthCallback] Already processed/processing, skipping.');
      return;
    }
    hasProcessed.current = true;

    const handleCallback = async () => {
      console.log('[AuthCallback] Starting callback handling...');
      try {
        const oauthContext = detectOAuthFlow();
        console.log('[AuthCallback] OAuth Context:', oauthContext);

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

        setStatus('Parsing parameters...');
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

        console.log('[AuthCallback] Params found:', {
          hasCode: !!code,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken
        });

        setStatus('Exchanging tokens...');

        // Exchange Code or Tokens if present
        if (code) {
          console.log('[AuthCallback] Exchanging code for session...');
          // Add timeout to prevent hanging
          const exchangePromise = supabase.auth.exchangeCodeForSession(code);
          const { error: exchangeError } = await Promise.race([
            exchangePromise,
            timeoutPromise(10000, 'Token exchange timed out')
          ]) as any;

          if (exchangeError) throw exchangeError;
          console.log('[AuthCallback] Code exchange successful');
        } else if (accessToken && refreshToken) {
          console.log('[AuthCallback] Setting session from hash params...');
          // Add timeout
          const setSessionPromise = supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          const { error: setSessionError } = await Promise.race([
            setSessionPromise,
            timeoutPromise(10000, 'Setting session timed out')
          ]) as any;

          if (setSessionError) throw setSessionError;
          console.log('[AuthCallback] Session set successfully');
        } else {
          console.log('[AuthCallback] No tokens found in URL, checking existing session...');
        }

        setStatus('Verifying session...');
        // Final Session Check (Fast)
        const getSessionPromise = supabase.auth.getSession();
        const { data: { session }, error: sessionError } = await Promise.race([
          getSessionPromise,
          timeoutPromise(5000, 'Session verification timed out')
        ]) as any;

        if (sessionError) throw sessionError;

        console.log('[AuthCallback] Session verification complete. User ID:', session?.user?.id);

        if (session?.user) {
          // SUCCESS: Redirect immediately.
          setStatus('Redirecting...');
          console.log('[AuthCallback] Redirecting...');

          // Clear hash to prevent reprocessing if user refreshes (though replaceState does this)
          window.history.replaceState(null, '', window.location.pathname);

          const redirectDestination = getAndClearRedirectDestination() || '/dashboard';
          console.log('[AuthCallback] Destination:', redirectDestination);

          // Small delay to ensure state is flushed if needed (helps with race conditions in some browsers)
          setTimeout(() => {
            navigate(redirectDestination, { replace: true });
          }, 100);

        } else {
          throw new Error('No session established. Please try logging in again.');
        }

      } catch (err: any) {
        console.error('[AuthCallback] Error:', err);
        const errorMessage = err?.message || 'Authentication failed';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center border-4 border-amber-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-amber-900 mb-2">DEBUG MODE ACTIVE</h2>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Completing sign in...</h3>
          <div className="bg-gray-100 p-4 rounded-md text-left text-xs font-mono mb-4 overflow-auto max-h-40 border border-gray-300">
            <p className="font-bold mb-1">Status Log:</p>
            <p className="text-blue-600">&gt; {status}</p>
          </div>
          <div className="text-left text-xs bg-gray-200 p-2 rounded mb-2">
            <p><strong>Config Check:</strong></p>
            <p>URL: {debugEnv.url}</p>
            <p>Key: {debugEnv.key}</p>
            <p><strong>Connectivity:</strong> {connectivity}</p>
          </div>
          <p className="text-xs text-gray-400">
            If you see this, the new code IS loaded on v1 branch. <br />
            Please check the console (F12) for [AuthCallback] logs.
          </p>
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
          <div className="text-left text-xs bg-gray-100 p-2 rounded mb-4">
            <p><strong>Debug Info:</strong></p>
            <p>URL: {debugEnv.url}</p>
            <p>Key: {debugEnv.key}</p>
            <p>Connectivity: {connectivity}</p>
          </div>
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
