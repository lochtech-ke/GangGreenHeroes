/**
 * Error Context System
 * Provides utilities for collecting and managing error context information
 * Requirements: 1.3, 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { ErrorContext, Breadcrumb } from '../types/errors';
import { sanitizeObject } from './errorLogging';

/**
 * Error Context Manager
 * Collects and manages contextual information for error reporting
 */
export class ErrorContextManager {
  private static instance: ErrorContextManager;
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs: number = 20;
  private userActions: Array<{ timestamp: Date; action: string; component?: string; data?: any }> = [];
  private maxUserActions: number = 10;
  private navigationHistory: Array<{ timestamp: Date; route: string; referrer?: string }> = [];
  private maxNavigationHistory: number = 5;

  private constructor() {
    this.setupNavigationTracking();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorContextManager {
    if (!ErrorContextManager.instance) {
      ErrorContextManager.instance = new ErrorContextManager();
    }
    return ErrorContextManager.instance;
  }

  /**
   * Set up navigation tracking
   */
  private setupNavigationTracking(): void {
    if (typeof window !== 'undefined') {
      // Track initial page load
      this.addNavigationEntry(window.location.pathname, document.referrer);

      // Track navigation changes (for SPAs)
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = (...args) => {
        originalPushState.apply(history, args);
        this.addNavigationEntry(window.location.pathname);
      };

      history.replaceState = (...args) => {
        originalReplaceState.apply(history, args);
        this.addNavigationEntry(window.location.pathname);
      };

      // Track back/forward navigation
      window.addEventListener('popstate', () => {
        this.addNavigationEntry(window.location.pathname);
      });
    }
  }

  /**
   * Add navigation entry to history
   */
  private addNavigationEntry(route: string, referrer?: string): void {
    const entry = {
      timestamp: new Date(),
      route,
      referrer,
    };

    this.navigationHistory.push(entry);

    // Keep only the last N entries
    if (this.navigationHistory.length > this.maxNavigationHistory) {
      this.navigationHistory = this.navigationHistory.slice(-this.maxNavigationHistory);
    }

    // Also add as breadcrumb
    this.addBreadcrumb({
      timestamp: new Date(),
      category: 'navigation',
      message: `Navigated to ${route}`,
      level: 'info',
      data: { route, referrer },
    });
  }

  /**
   * Add breadcrumb for error context
   * Requirements: 15.2
   */
  public addBreadcrumb(breadcrumb: Breadcrumb): void {
    // Sanitize breadcrumb data
    const sanitizedBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      data: breadcrumb.data ? sanitizeObject(breadcrumb.data) : undefined,
    };

    this.breadcrumbs.push(sanitizedBreadcrumb);

    // Keep only the last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Add user action to tracking
   * Requirements: 15.2
   */
  public addUserAction(action: string, component?: string, data?: any): void {
    const userAction = {
      timestamp: new Date(),
      action,
      component,
      data: data ? sanitizeObject(data) : undefined,
    };

    this.userActions.push(userAction);

    // Keep only the last N actions
    if (this.userActions.length > this.maxUserActions) {
      this.userActions = this.userActions.slice(-this.maxUserActions);
    }

    // Also add as breadcrumb
    this.addBreadcrumb({
      timestamp: new Date(),
      category: 'user_action',
      message: `User ${action}${component ? ` in ${component}` : ''}`,
      level: 'info',
      data: { action, component, ...data },
    });
  }

  /**
   * Get current breadcrumbs
   */
  public getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Get user actions history
   */
  public getUserActions(): Array<{ timestamp: Date; action: string; component?: string; data?: any }> {
    return [...this.userActions];
  }

  /**
   * Get navigation history
   * Requirements: 15.1
   */
  public getNavigationHistory(): Array<{ timestamp: Date; route: string; referrer?: string }> {
    return [...this.navigationHistory];
  }

  /**
   * Build comprehensive error context
   * Requirements: 1.3, 15.1, 15.2, 15.3, 15.4, 15.5
   */
  public buildErrorContext(additionalContext?: Partial<ErrorContext>): ErrorContext {
    const context: ErrorContext = {
      timestamp: new Date(),
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      breadcrumbs: this.getBreadcrumbs(),
      metadata: {
        navigationHistory: this.getNavigationHistory(),
        userActions: this.getUserActions(),
        sessionId: this.getSessionId(),
        viewport: this.getViewportInfo(),
        performance: this.getPerformanceInfo(),
        ...additionalContext?.metadata,
      },
      ...additionalContext,
    };

    return context;
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server-session';
    }

    let sessionId = sessionStorage.getItem('error-context-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error-context-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get viewport information
   */
  private getViewportInfo(): any {
    if (typeof window === 'undefined') {
      return null;
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      orientation: screen.orientation?.type,
    };
  }

  /**
   * Get performance information
   */
  private getPerformanceInfo(): any {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (window.performance as any).memory;

    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
      memory: memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      } : null,
      timing: {
        now: window.performance.now(),
        timeOrigin: window.performance.timeOrigin,
      },
    };
  }

  /**
   * Capture form state for error context
   * Requirements: 15.4
   */
  public captureFormState(formElement: HTMLFormElement): any {
    if (!formElement) {
      return null;
    }

    const formData = new FormData(formElement);
    const formState: any = {};

    for (const [key, value] of formData.entries()) {
      // Sanitize form values to remove sensitive data
      if (typeof value === 'string') {
        formState[key] = this.sanitizeFormValue(key, value);
      } else {
        formState[key] = '[FILE]';
      }
    }

    return {
      formId: formElement.id,
      formName: formElement.name,
      formAction: formElement.action,
      formMethod: formElement.method,
      fieldCount: formElement.elements.length,
      values: formState,
    };
  }

  /**
   * Sanitize form values to remove sensitive data
   */
  private sanitizeFormValue(fieldName: string, value: string): string {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'pin', 'cvv', 'ssn',
      'credit', 'card', 'account', 'routing', 'bank',
    ];

    const lowerFieldName = fieldName.toLowerCase();
    if (sensitiveFields.some(field => lowerFieldName.includes(field))) {
      return '[REDACTED]';
    }

    // For other fields, just return length info for long values
    if (value.length > 100) {
      return `[LONG_VALUE_${value.length}_CHARS]`;
    }

    return value;
  }

  /**
   * Capture API request context
   * Requirements: 15.3
   */
  public captureApiContext(url: string, method: string, requestData?: any, responseData?: any): any {
    return {
      url: this.sanitizeUrl(url),
      method,
      timestamp: new Date(),
      requestData: requestData ? sanitizeObject(requestData) : undefined,
      responseData: responseData ? sanitizeObject(responseData) : undefined,
    };
  }

  /**
   * Sanitize URL to remove sensitive query parameters
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth', 'session'];
      
      for (const param of sensitiveParams) {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      }
      
      return urlObj.toString();
    } catch {
      // If URL parsing fails, just return the original
      return url;
    }
  }

  /**
   * Clear all context data
   */
  public clear(): void {
    this.breadcrumbs = [];
    this.userActions = [];
    this.navigationHistory = [];
  }

  /**
   * Configure maximum items to keep
   */
  public configure(options: {
    maxBreadcrumbs?: number;
    maxUserActions?: number;
    maxNavigationHistory?: number;
  }): void {
    if (options.maxBreadcrumbs !== undefined) {
      this.maxBreadcrumbs = options.maxBreadcrumbs;
      if (this.breadcrumbs.length > this.maxBreadcrumbs) {
        this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
      }
    }

    if (options.maxUserActions !== undefined) {
      this.maxUserActions = options.maxUserActions;
      if (this.userActions.length > this.maxUserActions) {
        this.userActions = this.userActions.slice(-this.maxUserActions);
      }
    }

    if (options.maxNavigationHistory !== undefined) {
      this.maxNavigationHistory = options.maxNavigationHistory;
      if (this.navigationHistory.length > this.maxNavigationHistory) {
        this.navigationHistory = this.navigationHistory.slice(-this.maxNavigationHistory);
      }
    }
  }
}

// Export singleton instance
export const errorContextManager = ErrorContextManager.getInstance();

// Export convenience functions
export function addBreadcrumb(category: string, message: string, level: 'info' | 'warning' | 'error' = 'info', data?: any): void {
  errorContextManager.addBreadcrumb({
    timestamp: new Date(),
    category,
    message,
    level,
    data,
  });
}

export function addUserAction(action: string, component?: string, data?: any): void {
  errorContextManager.addUserAction(action, component, data);
}

export function buildErrorContext(additionalContext?: Partial<ErrorContext>): ErrorContext {
  return errorContextManager.buildErrorContext(additionalContext);
}

export function captureFormState(formElement: HTMLFormElement): any {
  return errorContextManager.captureFormState(formElement);
}

export function captureApiContext(url: string, method: string, requestData?: any, responseData?: any): any {
  return errorContextManager.captureApiContext(url, method, requestData, responseData);
}