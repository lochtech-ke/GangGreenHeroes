/**
 * Error Context System
 * Captures and manages error context including breadcrumbs, navigation history, and user actions
 * Requirements: C15.1, C15.2, C15.3, C15.4, C15.5
 */

import { ErrorContext, Breadcrumb } from '../types/errors';

/**
 * Maximum number of breadcrumbs to store
 */
const MAX_BREADCRUMBS = 10;

/**
 * Maximum number of navigation history entries to store
 */
const MAX_NAVIGATION_HISTORY = 10;

/**
 * Error Context Manager
 * Manages error context collection including breadcrumbs, navigation history, and component hierarchy
 */
export class ErrorContextManager {
  private static instance: ErrorContextManager;
  private breadcrumbs: Breadcrumb[] = [];
  private navigationHistory: string[] = [];
  private currentRoute: string = '';
  private componentHierarchy: string[] = [];
  private sessionId: string;
  private requestIdCounter: number = 0;

  private constructor() {
    this.sessionId = this.generateSessionId();
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
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate a unique request ID
   */
  public generateRequestId(): string {
    this.requestIdCounter++;
    return `req_${this.sessionId}_${this.requestIdCounter}`;
  }

  /**
   * Set up navigation tracking
   * Requirements: C15.1
   */
  private setupNavigationTracking(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Track initial route
    this.updateRoute(window.location.pathname);

    // Track route changes (for SPAs)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      this.updateRoute(window.location.pathname);
    };

    window.history.replaceState = (...args) => {
      originalReplaceState.apply(window.history, args);
      this.updateRoute(window.location.pathname);
    };

    // Track popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.updateRoute(window.location.pathname);
    });
  }

  /**
   * Update current route and navigation history
   * Requirements: C15.1
   */
  private updateRoute(route: string): void {
    if (route === this.currentRoute) {
      return;
    }

    // Add to navigation history
    this.navigationHistory.push(route);
    if (this.navigationHistory.length > MAX_NAVIGATION_HISTORY) {
      this.navigationHistory.shift();
    }

    this.currentRoute = route;

    // Add breadcrumb for navigation
    this.addBreadcrumb({
      timestamp: new Date(),
      category: 'navigation',
      message: `Navigated to ${route}`,
      level: 'info',
      data: { route },
    });
  }

  /**
   * Add a breadcrumb to the trail
   * Requirements: C15.2
   */
  public addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);
    
    // Keep only the last MAX_BREADCRUMBS
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Add a user action breadcrumb
   * Requirements: C15.2
   */
  public trackUserAction(action: string, data?: Record<string, any>): void {
    this.addBreadcrumb({
      timestamp: new Date(),
      category: 'user_action',
      message: action,
      level: 'info',
      data,
    });
  }

  /**
   * Add an API call breadcrumb
   * Requirements: C15.3
   */
  public trackApiCall(
    method: string,
    endpoint: string,
    status?: number,
    data?: Record<string, any>
  ): void {
    this.addBreadcrumb({
      timestamp: new Date(),
      category: 'api',
      message: `${method} ${endpoint}${status ? ` - ${status}` : ''}`,
      level: status && status >= 400 ? 'error' : 'info',
      data: {
        method,
        endpoint,
        status,
        ...data,
      },
    });
  }

  /**
   * Add a form interaction breadcrumb
   * Requirements: C15.4
   */
  public trackFormInteraction(
    formName: string,
    action: 'focus' | 'blur' | 'change' | 'submit' | 'error',
    fieldName?: string,
    data?: Record<string, any>
  ): void {
    this.addBreadcrumb({
      timestamp: new Date(),
      category: 'form',
      message: `Form ${formName}: ${action}${fieldName ? ` on ${fieldName}` : ''}`,
      level: action === 'error' ? 'error' : 'info',
      data: {
        formName,
        action,
        fieldName,
        ...data,
      },
    });
  }

  /**
   * Add a component lifecycle breadcrumb
   * Requirements: C15.5
   */
  public trackComponentLifecycle(
    componentName: string,
    lifecycle: 'mount' | 'unmount' | 'update' | 'error',
    data?: Record<string, any>
  ): void {
    this.addBreadcrumb({
      timestamp: new Date(),
      category: 'component',
      message: `${componentName}: ${lifecycle}`,
      level: lifecycle === 'error' ? 'error' : 'info',
      data: {
        componentName,
        lifecycle,
        ...data,
      },
    });
  }

  /**
   * Set component hierarchy for error context
   * Requirements: C15.5
   */
  public setComponentHierarchy(hierarchy: string[]): void {
    this.componentHierarchy = hierarchy;
  }

  /**
   * Get current error context
   * Returns complete context including breadcrumbs, navigation history, and current state
   */
  public getContext(additionalContext?: Partial<ErrorContext>): ErrorContext {
    const context: ErrorContext = {
      route: this.currentRoute,
      breadcrumbs: [...this.breadcrumbs],
      sessionId: this.sessionId,
      timestamp: new Date(),
      metadata: {
        navigationHistory: [...this.navigationHistory],
        componentHierarchy: [...this.componentHierarchy],
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      },
      ...additionalContext,
    };

    return context;
  }

  /**
   * Get breadcrumbs
   */
  public getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Get navigation history
   */
  public getNavigationHistory(): string[] {
    return [...this.navigationHistory];
  }

  /**
   * Get current route
   */
  public getCurrentRoute(): string {
    return this.currentRoute;
  }

  /**
   * Get session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Clear all breadcrumbs
   */
  public clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Clear navigation history
   */
  public clearNavigationHistory(): void {
    this.navigationHistory = [];
  }

  /**
   * Reset all context
   */
  public reset(): void {
    this.breadcrumbs = [];
    this.navigationHistory = [];
    this.componentHierarchy = [];
    this.sessionId = this.generateSessionId();
    this.requestIdCounter = 0;
  }
}

// Export singleton instance
export const errorContextManager = ErrorContextManager.getInstance();

// Export convenience functions

/**
 * Add a breadcrumb
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  errorContextManager.addBreadcrumb(breadcrumb);
}

/**
 * Track a user action
 */
export function trackUserAction(action: string, data?: Record<string, any>): void {
  errorContextManager.trackUserAction(action, data);
}

/**
 * Track an API call
 */
export function trackApiCall(
  method: string,
  endpoint: string,
  status?: number,
  data?: Record<string, any>
): void {
  errorContextManager.trackApiCall(method, endpoint, status, data);
}

/**
 * Track a form interaction
 */
export function trackFormInteraction(
  formName: string,
  action: 'focus' | 'blur' | 'change' | 'submit' | 'error',
  fieldName?: string,
  data?: Record<string, any>
): void {
  errorContextManager.trackFormInteraction(formName, action, fieldName, data);
}

/**
 * Track a component lifecycle event
 */
export function trackComponentLifecycle(
  componentName: string,
  lifecycle: 'mount' | 'unmount' | 'update' | 'error',
  data?: Record<string, any>
): void {
  errorContextManager.trackComponentLifecycle(componentName, lifecycle, data);
}

/**
 * Get current error context
 */
export function getErrorContext(additionalContext?: Partial<ErrorContext>): ErrorContext {
  return errorContextManager.getContext(additionalContext);
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return errorContextManager.generateRequestId();
}
