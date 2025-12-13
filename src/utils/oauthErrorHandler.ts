/**
 * OAuth Flow 404 Error Handler
 * Specialized error handling for 404 errors that occur during OAuth authentication flow
 * Requirements: 3.3
 */

import { ErrorLogger } from './errorLogger';

export interface OAuthFlowContext {
  isOAuthFlow: boolean;
  flowType: 'google' | 'github' | 'unknown';
  hasAccessToken: boolean;
  hasAuthCode: boolean;
  hasOAuthError: boolean;
  expectedRoute?: string;
  actualRoute: string;
  referrerDomain?: string;
  sessionId?: string;
}

/**
 * Detects if the current request is part of an OAuth flow
 */
export function detectOAuthFlow(): OAuthFlowContext {
  const url = window.location.href;
  const hash = window.location.hash;
  const search = window.location.search;
  const referrer = document.referrer;
  const pathname = window.location.pathname;

  // Check for OAuth parameters in URL
  const hasAccessToken = hash.includes('access_token') || search.includes('access_token');
  const hasAuthCode = search.includes('code');
  const hasOAuthError = search.includes('error') || hash.includes('error');

  // Check for OAuth referrers
  const isFromGoogleOAuth = referrer.includes('accounts.google.com') || referrer.includes('oauth');
  const isFromGitHubOAuth = referrer.includes('github.com') && referrer.includes('oauth');

  // Determine if this is an OAuth flow
  const isOAuthFlow = hasAccessToken || hasAuthCode || hasOAuthError || isFromGoogleOAuth || isFromGitHubOAuth;

  // Determine flow type
  let flowType: 'google' | 'github' | 'unknown' = 'unknown';
  if (isFromGoogleOAuth || hash.includes('provider_token') || search.includes('provider=google')) {
    flowType = 'google';
  } else if (isFromGitHubOAuth || search.includes('provider=github')) {
    flowType = 'github';
  }

  // Get referrer domain safely
  let referrerDomain: string | undefined;
  try {
    if (referrer) {
      referrerDomain = new URL(referrer).hostname;
    }
  } catch (error) {
    // Invalid referrer URL, ignore
  }

  return {
    isOAuthFlow,
    flowType,
    hasAccessToken,
    hasAuthCode,
    hasOAuthError,
    actualRoute: pathname,
    referrerDomain,
    expectedRoute: isOAuthFlow ? '/auth/callback' : undefined
  };
}

/**
 * Logs 404 errors that occur during OAuth flow with comprehensive context
 * Requirements: 3.3
 */
export function logOAuth404Error(requestedUrl?: string, additionalContext?: Record<string, any>): void {
  const oauthContext = detectOAuthFlow();
  
  // Only log if this is actually an OAuth flow
  if (!oauthContext.isOAuthFlow) {
    return;
  }

  const url = requestedUrl || window.location.href;
  const referrer = document.referrer;

  // Build comprehensive context
  const context = {
    ...oauthContext,
    ...additionalContext,
    // OAuth flow state information
    oauthFlowState: {
      stage: determineOAuthStage(oauthContext),
      provider: oauthContext.flowType,
      hasValidParameters: oauthContext.hasAccessToken || oauthContext.hasAuthCode,
      hasErrors: oauthContext.hasOAuthError
    },
    // Navigation context
    navigation: {
      fromOAuthProvider: oauthContext.referrerDomain?.includes('google.com') || 
                        oauthContext.referrerDomain?.includes('github.com'),
      expectedDestination: oauthContext.expectedRoute,
      actualDestination: oauthContext.actualRoute,
      routeMismatch: oauthContext.expectedRoute && oauthContext.actualRoute !== oauthContext.expectedRoute
    },
    // Browser context
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    },
    // Timing context
    timing: {
      timestamp: new Date().toISOString(),
      performanceNow: performance.now(),
      timeOrigin: performance.timeOrigin
    }
  };

  // Log the 404 error with OAuth context
  ErrorLogger.log404Error(url, referrer, context);

  // Also log as a route error for additional tracking
  ErrorLogger.logRouteError(oauthContext.actualRoute, new Error('404 during OAuth flow'), {
    oauthFlow: true,
    provider: oauthContext.flowType,
    stage: context.oauthFlowState.stage
  });
}

/**
 * Determines the current stage of the OAuth flow based on context
 */
function determineOAuthStage(context: OAuthFlowContext): string {
  if (context.hasOAuthError) {
    return 'error';
  }
  
  if (context.hasAccessToken) {
    return 'token_received';
  }
  
  if (context.hasAuthCode) {
    return 'code_received';
  }
  
  if (context.referrerDomain?.includes('google.com') || context.referrerDomain?.includes('github.com')) {
    return 'provider_redirect';
  }
  
  return 'unknown';
}

/**
 * Sets up a global error handler for 404 errors during OAuth flow
 * This can be called during app initialization to catch 404s globally
 */
export function setupOAuth404Handler(): void {
  // Listen for navigation events that might result in 404s during OAuth
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // Override history methods to detect navigation during OAuth
  history.pushState = function(...args) {
    const oauthContext = detectOAuthFlow();
    if (oauthContext.isOAuthFlow) {
      // Log potential 404 if navigating away from expected OAuth route
      const newUrl = args[2] as string;
      if (newUrl && !newUrl.includes('/auth/callback')) {
        logOAuth404Error(newUrl, {
          navigationType: 'pushState',
          previousUrl: window.location.href
        });
      }
    }
    return originalPushState.apply(this, args);
  };

  history.replaceState = function(...args) {
    const oauthContext = detectOAuthFlow();
    if (oauthContext.isOAuthFlow) {
      // Log potential 404 if replacing state during OAuth
      const newUrl = args[2] as string;
      if (newUrl && !newUrl.includes('/auth/callback')) {
        logOAuth404Error(newUrl, {
          navigationType: 'replaceState',
          previousUrl: window.location.href
        });
      }
    }
    return originalReplaceState.apply(this, args);
  };

  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    const oauthContext = detectOAuthFlow();
    if (oauthContext.isOAuthFlow && oauthContext.actualRoute !== '/auth/callback') {
      logOAuth404Error(window.location.href, {
        navigationType: 'popstate',
        trigger: 'browser_navigation'
      });
    }
  });

  // Listen for unhandled promise rejections that might indicate routing issues
  window.addEventListener('unhandledrejection', (event) => {
    const oauthContext = detectOAuthFlow();
    if (oauthContext.isOAuthFlow && event.reason?.message?.includes('404')) {
      logOAuth404Error(window.location.href, {
        error: event.reason?.message,
        trigger: 'unhandled_rejection'
      });
    }
  });
}

/**
 * Utility to check if a URL is a valid OAuth callback URL
 */
export function isValidOAuthCallbackUrl(url: string): boolean {
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

/**
 * Logs when a user lands on a 404 page during OAuth flow
 * This should be called from a 404 page component if one exists
 */
export function logOAuth404Page(requestedPath: string): void {
  const oauthContext = detectOAuthFlow();
  
  if (oauthContext.isOAuthFlow) {
    logOAuth404Error(window.location.href, {
      trigger: '404_page_rendered',
      requestedPath,
      shouldHaveBeenRedirected: true
    });
  }
}