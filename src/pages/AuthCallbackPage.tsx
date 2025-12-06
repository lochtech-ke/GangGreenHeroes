import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { authService } from '../services/auth.service';

/**
 * OAuth Callback Handler Page
 * Handles the redirect from OAuth providers (Google, etc.)
 * Validates the session and redirects to appropriate page
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions (React StrictMode runs effects twice in dev)
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        console.log('[AuthCallbackPage] Processing OAuth callback...');
        console.log('[AuthCallbackPage] Full URL:', window.location.href);
        console.log('[AuthCallbackPage] Hash:', window.location.hash);
        console.log('[AuthCallbackPage] Search:', window.location.search);

        // Check for OAuth errors in URL params
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const oauthError = searchParams.get('error') || hashParams.get('error');
        const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
        
        if (oauthError) {
          console.error('[AuthCallbackPage] OAuth error from provider:', oauthError, errorDescription);
          setError(errorDescription || 'Authentication failed. Please try again.');
          setIsLoading(false);
          return;
        }

        // Check if we have OAuth tokens in the URL hash
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = searchParams.get('code');

        console.log('[AuthCallbackPage] OAuth tokens present:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          hasCode: !!code
        });

        // If we have an authorization code, exchange it for a session (PKCE flow)
        if (code) {
          console.log('[AuthCallbackPage] Exchanging authorization code for session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[AuthCallbackPage] Code exchange error:', exchangeError);
            setError(exchangeError.message);
            setIsLoading(false);
            return;
          }
          
          console.log('[AuthCallbackPage] Code exchange successful:', !!data.session);
        }

        // If we have tokens in the URL hash, manually set the session
        // Supabase should auto-exchange but we'll do it explicitly for reliability
        if (accessToken && refreshToken) {
          console.log('[AuthCallbackPage] Setting session from hash tokens...');
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error('[AuthCallbackPage] Error setting session:', setSessionError);
            setError(setSessionError.message);
            setIsLoading(false);
            return;
          }

          console.log('[AuthCallbackPage] Session set successfully:', !!data.session);
        }

        // Now check the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[AuthCallbackPage] Session error:', sessionError);
          setError(sessionError.message);
          setIsLoading(false);
          return;
        }

        if (session) {
          console.log('[AuthCallbackPage] Session found, user authenticated');

          try {
            // Ensure user profile exists for OAuth users
            // Extract metadata from the user object
            const user = session.user;
            const metadata = {
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            };

            console.log('[AuthCallbackPage] User metadata:', metadata);

            // Create profile if needed
            await authService.ensureUserProfile(user.id, metadata);

            // Clear the hash from URL to prevent re-processing
            window.history.replaceState(null, '', window.location.pathname);

            // Successful authentication, redirect to dashboard
            console.log('[AuthCallbackPage] Redirecting to dashboard');
            navigate('/dashboard', { replace: true });
          } catch (profileError) {
            console.error('[AuthCallbackPage] Profile creation error:', profileError);
            // Even if profile creation fails, let user through
            // They can complete profile later
            console.log('[AuthCallbackPage] Continuing to dashboard despite profile error');
            navigate('/dashboard', { replace: true });
          }
        } else {
          // No session, redirect to login
          console.log('[AuthCallbackPage] No session found, redirecting to login');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('[AuthCallbackPage] Error handling callback:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  // Loading state
  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing sign in...
          </h2>
          <p className="text-gray-600">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // This should not be reached, but just in case
  return null;
}
