/**
 * Error Logger Utility Service
 * Production-safe error logging with sensitive data filtering for OAuth and route errors
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

interface ErrorLogData {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  context?: Record<string, any>;
}

export class ErrorLogger {
  /**
   * Sanitizes error data for safe logging
   * Removes stack traces in production and formats error information
   */
  private static sanitizeError(error: any): ErrorLogData {
    const sanitized: ErrorLogData = {
      message: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add stack trace in development only
    if (process.env.NODE_ENV !== 'production' && error?.stack) {
      sanitized.stack = error.stack;
    }

    return sanitized;
  }

  /**
   * Recursively filters sensitive data from objects
   * Redacts sensitive keys while preserving debugging context
   */
  private static filterSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;
    
    const filtered = { ...data };
    const sensitiveKeys = [
      'access_token', 'refresh_token', 'password', 'secret', 'key',
      'authorization', 'bearer', 'token', 'api_key', 'apikey',
      'private_key', 'privatekey', 'mnemonic', 'seed'
    ];
    
    for (const key in filtered) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive information
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        filtered[key] = '[REDACTED]';
      } else if (typeof filtered[key] === 'object') {
        // Recursively filter nested objects
        filtered[key] = this.filterSensitiveData(filtered[key]);
      } else if (typeof filtered[key] === 'string') {
        // Filter sensitive patterns in string values
        filtered[key] = this.sanitizeString(filtered[key]);
      }
    }
    
    return filtered;
  }

  /**
   * Sanitizes string values to remove sensitive patterns
   */
  private static sanitizeString(value: string): string {
    if (!value || typeof value !== 'string') return value;

    // Redact JWT tokens
    let sanitized = value.replace(/eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[JWT_TOKEN_REDACTED]');
    
    // Redact bearer tokens
    sanitized = sanitized.replace(/bearer\s+[\w-]+/gi, 'bearer [REDACTED]');
    
    // Redact access tokens in URLs
    sanitized = sanitized.replace(/access_token=[\w.-]+/gi, 'access_token=[REDACTED]');
    
    // Redact refresh tokens in URLs
    sanitized = sanitized.replace(/refresh_token=[\w.-]+/gi, 'refresh_token=[REDACTED]');
    
    return sanitized;
  }

  /**
   * Logs OAuth-specific errors with context
   * Requirements: 3.1, 3.4
   */
  static logOAuthError(error: any, context?: Record<string, any>): void {
    const sanitizedError = this.sanitizeError(error);
    const sanitizedContext = context ? this.filterSensitiveData(context) : undefined;
    
    const logEntry = {
      type: 'OAuth Error',
      ...sanitizedError,
      context: sanitizedContext
    };

    console.error('OAuth Error:', logEntry);

    // In production, could send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      // this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Logs route-specific errors
   * Requirements: 3.3
   */
  static logRouteError(route: string, error: any, context?: Record<string, any>): void {
    const sanitizedError = this.sanitizeError(error);
    const sanitizedContext = context ? this.filterSensitiveData(context) : undefined;

    const logEntry = {
      type: 'Route Error',
      route,
      ...sanitizedError,
      context: sanitizedContext
    };

    console.error(`Route Error [${route}]:`, logEntry);

    // In production, could send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Logs session establishment failures
   * Requirements: 3.2
   */
  static logSessionError(error: any, authState?: any, context?: Record<string, any>): void {
    const sanitizedError = this.sanitizeError(error);
    const sanitizedAuthState = authState ? this.filterSensitiveData(authState) : undefined;
    const sanitizedContext = context ? this.filterSensitiveData(context) : undefined;

    const logEntry = {
      type: 'Session Error',
      ...sanitizedError,
      authState: sanitizedAuthState,
      context: sanitizedContext
    };

    console.error('Session Error:', logEntry);

    // In production, could send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Logs 404 errors with context during OAuth flow
   * Requirements: 3.3
   */
  static log404Error(requestedUrl: string, referrer?: string, context?: Record<string, any>): void {
    const sanitizedContext = context ? this.filterSensitiveData(context) : undefined;

    // Enhanced context for OAuth flow 404 errors
    const enhancedContext = {
      ...sanitizedContext,
      // Request details
      request: {
        url: this.sanitizeString(requestedUrl),
        referrer: referrer ? this.sanitizeString(referrer) : undefined,
        method: 'GET', // 404s are typically GET requests
        timestamp: new Date().toISOString()
      },
      // Browser environment
      environment: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      // Performance timing
      performance: {
        now: performance.now(),
        timeOrigin: performance.timeOrigin,
        navigationStart: performance.timing?.navigationStart
      },
      // OAuth flow indicators
      oauthIndicators: {
        hasHashParams: window.location.hash.length > 1,
        hasSearchParams: window.location.search.length > 1,
        referrerIsOAuthProvider: referrer ? (
          referrer.includes('accounts.google.com') ||
          referrer.includes('github.com') ||
          referrer.includes('oauth')
        ) : false
      }
    };

    const logEntry = {
      type: '404 Error',
      message: context?.oauthFlow ? 'Page not found during OAuth flow' : 'Page not found',
      severity: context?.oauthFlow ? 'HIGH' : 'MEDIUM',
      timestamp: new Date().toISOString(),
      requestedUrl: this.sanitizeString(requestedUrl),
      referrer: referrer ? this.sanitizeString(referrer) : undefined,
      userAgent: navigator.userAgent,
      context: enhancedContext
    };

    // Use different log levels based on whether this is OAuth-related
    if (context?.oauthFlow) {
      console.error('🔐 OAuth 404 Error:', logEntry);
    } else {
      console.warn('📄 404 Error:', logEntry);
    }

    // In production, send to monitoring service with appropriate priority
    if (process.env.NODE_ENV === 'production') {
      // OAuth 404s should be high priority for monitoring
      if (context?.oauthFlow) {
        // this.sendToHighPriorityMonitoring(logEntry);
      } else {
        // this.sendToMonitoring(logEntry);
      }
    }
  }

  /**
   * Generic error logging with sensitive data filtering
   * Requirements: 3.4
   */
  static logError(type: string, error: any, context?: Record<string, any>): void {
    const sanitizedError = this.sanitizeError(error);
    const sanitizedContext = context ? this.filterSensitiveData(context) : undefined;

    const logEntry = {
      type,
      ...sanitizedError,
      context: sanitizedContext
    };

    console.error(`${type}:`, logEntry);

    // In production, could send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Logs security-related errors and suspicious requests
   * Requirements: 5.4
   */
  static logSecurityError(type: string, error: any, context?: Record<string, any>): void {
    const sanitizedError = this.sanitizeError(error);
    const sanitizedContext = context ? this.filterSensitiveData(context) : undefined;

    const logEntry = {
      type: `Security ${type}`,
      severity: 'HIGH',
      ...sanitizedError,
      context: sanitizedContext
    };

    console.error(`Security ${type}:`, logEntry);

    // In production, this should definitely be sent to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // this.sendToSecurityMonitoring(logEntry);
    }
  }

  /**
   * Utility method to check if data contains sensitive information
   * Useful for testing and validation
   */
  static containsSensitiveData(data: any): boolean {
    if (!data) return false;

    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const sensitivePatterns = [
      /access_token/i,
      /refresh_token/i,
      /bearer\s+[\w-]+/i,
      /password/i,
      /secret/i,
      /api_key/i,
      /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/
    ];

    return sensitivePatterns.some(pattern => pattern.test(dataStr));
  }
}