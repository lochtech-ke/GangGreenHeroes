import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logOAuth404Page, detectOAuthFlow } from '../utils/oauthErrorHandler';
import { Layout } from '../components/layout';

/**
 * 404 Not Found Page
 * Handles unknown routes and logs 404 errors during OAuth flow
 * Requirements: 3.3
 */
export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Log 404 error if this occurs during OAuth flow
    logOAuth404Page(location.pathname);
  }, [location.pathname]);

  const oauthContext = detectOAuthFlow();
  const isOAuthFlow = oauthContext.isOAuthFlow;

  // If this is an OAuth flow that hit a 404, provide specific guidance
  if (isOAuthFlow) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Authentication Error
              </h1>
              <p className="text-gray-600 mb-4">
                There was an issue completing your sign-in process. The page you're looking for doesn't exist.
              </p>
              <div className="text-sm text-gray-500 mb-4">
                <p>Requested path: <code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code></p>
                <p>OAuth Provider: {oauthContext.flowType}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/auth/callback', { replace: true })}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Continue Authentication
              </button>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Over
              </button>
              <button
                onClick={() => navigate('/', { replace: true })}
                className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Go Home
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This error has been logged for our development team to investigate and improve the authentication experience.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Regular 404 page for non-OAuth flows
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
              <svg
                className="h-8 w-8 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-4">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="text-sm text-gray-500 mb-6">
              <p>Requested path: <code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code></p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Go Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>
              Need help? <a href="/legal/terms" className="text-green-600 hover:text-green-700">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}