/**
 * Central Error Handler
 * Centralized error handling system with categorization, sanitization, and rate limiting
 * Requirements: C1.1, C1.2, C1.3, C1.4
 */

import {
  AppError,
  ErrorContext,
  ErrorHandler as IErrorHandler,
  ErrorSeverity,
  CustomErrorHandler,
  NetworkError,
  AuthError,
  ValidationError,
  DatabaseError,
  Web3Error,
  BadgeError,
  CurationError,
  NetworkErrorCodes,
  AuthErrorCodes,
  ValidationErrorCodes,
  DatabaseErrorCodes,
} from '../types/errors';
import { sanitizeObject, sanitizeString } from './errorLogging';
import { ErrorRateLimiter } from './errorRateLimiter';

/**
 * Generic concrete implementation of AppError for runtime errors
 */
class GenericAppError extends AppError {
  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    context?: ErrorContext,
    recoverable: boolean = false
  ) {
    super(message, code, severity, context, recoverable);
  }
}

/**
 * Central Error Handler Implementation
 * Provides centralized error processing, categorization, sanitization, and rate limiting
 */
export class ErrorHandler implements IErrorHandler {
  private static instance: ErrorHandler;
  private customHandlers: Map<string, CustomErrorHandler> = new Map();
  private severityThreshold: ErrorSeverity = ErrorSeverity.LOW;
  private trackingEnabled: boolean = true;
  private rateLimiter: ErrorRateLimiter;

  private constructor() {
    this.rateLimiter = new ErrorRateLimiter({
      windowSize: 60000, // 1 minute
      maxErrorsPerWindow: 10,
      suppressionDuration: 300000, // 5 minutes
      criticalErrorsBypass: true,
    });

    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Set up global error handlers for unhandled errors
   */
  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason));
        
        this.handleError(error, {
          component: 'GlobalHandler',
          action: 'unhandledRejection',
          metadata: { promiseRejection: true },
        });
      });

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.handleError(event.error || new Error(event.message), {
          component: 'GlobalHandler',
          action: 'globalError',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });
    }
  }

  /**
   * Main error handling pipeline
   * Processes errors through categorization, sanitization, rate limiting, and custom handlers
   */
  public handleError(error: Error, context?: ErrorContext): void {
    try {
      // Convert to AppError if not already
      const appError = this.ensureAppError(error, context);

      // Check severity threshold
      if (!this.shouldProcess(appError)) {
        return;
      }

      // Categorize the error
      const errorType = this.categorizeError(appError);

      // Check rate limiting
      if (!this.rateLimiter.shouldLog(appError.code)) {
        this.rateLimiter.recordError(appError.code);
        return;
      }

      // Record error for rate limiting
      this.rateLimiter.recordError(appError.code);

      // Sanitize the error
      const sanitizedError = this.sanitizeError(appError);

      // Log the error if tracking is enabled
      if (this.trackingEnabled) {
        this.logError(sanitizedError, errorType);
      }

      // Execute custom handlers
      const handler = this.customHandlers.get(errorType);
      if (handler) {
        handler(sanitizedError);
      }

      // Execute generic handler if exists
      const genericHandler = this.customHandlers.get('*');
      if (genericHandler) {
        genericHandler(sanitizedError);
      }
    } catch (handlerError) {
      // Prevent infinite loops - log to console only
      console.error('[ErrorHandler] Error in error handler:', handlerError);
    }
  }

  /**
   * Ensure error is an AppError instance
   */
  private ensureAppError(error: Error, context?: ErrorContext): AppError {
    if (error instanceof AppError) {
      // Merge context if provided
      if (context) {
        return new (error.constructor as any)(
          error.message,
          error.code,
          error.severity,
          { ...error.context, ...context },
          error.recoverable
        );
      }
      return error;
    }

    // Convert standard Error to AppError
    const errorCode = this.inferErrorCode(error);
    const severity = this.inferSeverity(error);
    
    return new GenericAppError(
      error.message || 'Unknown error',
      errorCode,
      severity,
      context,
      false
    );
  }

  /**
   * Infer error code from error message or type
   */
  private inferErrorCode(error: Error): string {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return NetworkErrorCodes.CONNECTION_FAILED;
    }
    
    // Auth errors
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return AuthErrorCodes.INSUFFICIENT_PERMISSIONS;
    }
    
    // Validation errors
    if (message.includes('invalid') || message.includes('required') || message.includes('validation')) {
      return ValidationErrorCodes.INVALID_FORMAT;
    }
    
    // Database errors
    if (message.includes('database') || message.includes('query') || message.includes('sql')) {
      return DatabaseErrorCodes.QUERY_TIMEOUT;
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Infer severity from error type and message
   */
  private inferSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (message.includes('auth') || message.includes('database')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('network') || message.includes('timeout')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  /**
   * Check if error should be processed based on severity threshold
   */
  private shouldProcess(error: AppError): boolean {
    const severityLevels = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 1,
      [ErrorSeverity.HIGH]: 2,
      [ErrorSeverity.CRITICAL]: 3,
    };

    return severityLevels[error.severity] >= severityLevels[this.severityThreshold];
  }

  /**
   * Categorize error by type
   * Requirements: C1.2
   */
  public categorizeError(error: Error): string {
    if (error instanceof NetworkError) {
      return 'network';
    }
    if (error instanceof AuthError) {
      return 'authentication';
    }
    if (error instanceof ValidationError) {
      return 'validation';
    }
    if (error instanceof DatabaseError) {
      return 'database';
    }
    if (error instanceof Web3Error) {
      return 'web3';
    }
    if (error instanceof BadgeError) {
      return 'badge';
    }
    if (error instanceof CurationError) {
      return 'curation';
    }
    if (error instanceof AppError) {
      return 'runtime';
    }
    
    // Infer from error message
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'authentication';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('database') || message.includes('query')) {
      return 'database';
    }
    
    return 'runtime';
  }

  /**
   * Sanitize error to remove sensitive data
   * Requirements: C1.4
   */
  public sanitizeError(error: Error): Error {
    if (error instanceof AppError) {
      // Create a new instance with sanitized data
      const sanitizedContext = error.context ? sanitizeObject(error.context) : undefined;
      const sanitizedMessage = sanitizeString(error.message);
      
      const SanitizedErrorClass = error.constructor as any;
      const sanitized = new SanitizedErrorClass(
        sanitizedMessage,
        error.code,
        error.severity,
        sanitizedContext,
        error.recoverable
      );
      
      // Sanitize stack trace
      if (error.stack) {
        sanitized.stack = sanitizeString(error.stack);
      }
      
      return sanitized;
    }

    // For standard errors, create a sanitized copy
    const sanitized = new Error(sanitizeString(error.message));
    sanitized.name = error.name;
    if (error.stack) {
      sanitized.stack = sanitizeString(error.stack);
    }
    
    return sanitized;
  }

  /**
   * Log error to console and tracking systems
   */
  private logError(error: AppError, errorType: string): void {
    const timestamp = new Date().toISOString();
    
    const logData = {
      timestamp,
      type: errorType,
      code: error.code,
      message: error.message,
      severity: error.severity,
      recoverable: error.recoverable,
      context: error.context,
      stack: error.stack,
    };

    // Log based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('[CRITICAL ERROR]', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('[HIGH ERROR]', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[MEDIUM ERROR]', logData);
        break;
      case ErrorSeverity.LOW:
        console.log('[LOW ERROR]', logData);
        break;
    }

    // Check for suppressed errors
    const suppressedCount = this.rateLimiter.getSuppressedCount(error.code);
    if (suppressedCount > 0) {
      console.warn(`[ErrorHandler] ${suppressedCount} similar errors suppressed for code: ${error.code}`);
    }
  }

  /**
   * Register a custom error handler for a specific error type
   */
  public registerHandler(errorType: string, handler: CustomErrorHandler): void {
    this.customHandlers.set(errorType, handler);
  }

  /**
   * Set minimum severity threshold for processing errors
   */
  public setSeverityThreshold(severity: ErrorSeverity): void {
    this.severityThreshold = severity;
  }

  /**
   * Enable or disable error tracking
   */
  public setTrackingEnabled(enabled: boolean): void {
    this.trackingEnabled = enabled;
  }

  /**
   * Get rate limiter instance for configuration
   */
  public getRateLimiter(): ErrorRateLimiter {
    return this.rateLimiter;
  }

  /**
   * Reset all error handlers and configuration
   */
  public reset(): void {
    this.customHandlers.clear();
    this.severityThreshold = ErrorSeverity.LOW;
    this.trackingEnabled = true;
    this.rateLimiter.resetLimits();
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Export convenience function
export function handleError(error: Error, context?: ErrorContext): void {
  errorHandler.handleError(error, context);
}
