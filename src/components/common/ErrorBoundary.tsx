import React, { Component, ErrorInfo } from 'react';
import { ErrorBoundaryProps, ErrorBoundaryState, ErrorFallbackProps } from '../../types/errors';
import { errorHandler } from '../../utils/errorHandler';

/**
 * ErrorBoundary Component
 * 
 * React Error Boundary that catches JavaScript errors in child component trees,
 * logs them, and displays a fallback UI instead of crashing the entire application.
 * 
 * Features:
 * - Catches errors in componentDidCatch lifecycle
 * - Provides error state management
 * - Supports reset functionality with resetKeys
 * - Prevents error loops by limiting reset attempts
 * - Integrates with central error handler
 * - Supports different fallback UIs based on error level
 * 
 * Requirements: C6.1, C6.2, C6.3, C6.4, C6.5
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly MAX_RESET_ATTEMPTS = 3;
  private readonly RESET_WINDOW_MS = 10000; // 10 seconds
  private resetTimestamps: number[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      resetCount: 0,
    };
  }

  /**
   * Static method called when an error is thrown in a child component
   * Updates state to trigger fallback UI rendering
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called after an error is caught
   * Logs error details and integrates with central error handler
   * 
   * Requirement C6.2: Log error with component stack trace
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { level = 'component', isolationId, onError } = this.props;

    // Generate unique error ID for tracking
    const errorId = `eb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update state with error details
    this.setState({
      errorInfo,
      errorId,
    });

    // Log error with central error handler
    errorHandler.handleError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      metadata: {
        level,
        isolationId,
        errorId,
        componentStack: errorInfo.componentStack,
        resetCount: this.state.resetCount,
      },
    });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }
  }

  /**
   * Check if component should reset based on resetKeys prop
   * Requirement C6.3: Add reset functionality
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // If error state is active and resetKeys have changed, attempt reset
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  /**
   * Reset error boundary state
   * Requirement C6.5: Prevent error loops by limiting reset attempts
   */
  resetErrorBoundary = (): void => {
    const now = Date.now();

    // Clean up old timestamps outside the reset window
    this.resetTimestamps = this.resetTimestamps.filter(
      (timestamp) => now - timestamp < this.RESET_WINDOW_MS
    );

    // Check if we've exceeded max reset attempts
    if (this.resetTimestamps.length >= this.MAX_RESET_ATTEMPTS) {
      console.error(
        `ErrorBoundary: Maximum reset attempts (${this.MAX_RESET_ATTEMPTS}) reached within ${this.RESET_WINDOW_MS}ms. Preventing reset to avoid error loop.`
      );
      return;
    }

    // Record this reset attempt
    this.resetTimestamps.push(now);

    // Reset state
    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      resetCount: prevState.resetCount + 1,
    }));
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback: FallbackComponent, level = 'component', isolationId } = this.props;

    // Requirement C6.1: Display fallback UI when error is caught
    if (hasError && error) {
      const fallbackProps: ErrorFallbackProps = {
        error,
        resetError: this.resetErrorBoundary,
        level,
        isolationId,
      };

      // Use custom fallback if provided, otherwise use default
      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
          }}
        >
          <h2 style={{ color: '#c92a2a', marginTop: 0 }}>Something went wrong</h2>
          <p style={{ color: '#495057' }}>
            We encountered an error while rendering this component.
          </p>
          <button
            onClick={this.resetErrorBoundary}
            style={{
              padding: '8px 16px',
              backgroundColor: '#228be6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ cursor: 'pointer', color: '#868e96' }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                }}
              >
                {error.toString()}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // Requirement C6.4: Allow rest of application to continue functioning
    return children;
  }
}

export default ErrorBoundary;
