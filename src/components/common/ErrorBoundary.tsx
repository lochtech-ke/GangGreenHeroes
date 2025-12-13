/**
 * React Error Boundary Component
 * Catches JavaScript errors in child component trees and displays fallback UI
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React, { Component, ReactNode } from 'react';
import { debugLogger } from '../../utils/debugLogger';
import { AppError, ErrorSeverity } from '../../types/errors';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
  level?: 'critical' | 'section' | 'component';
  maxResetAttempts?: number;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  level: 'critical' | 'section' | 'component';
  resetCount: number;
  maxResetAttempts: number;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetCount: number;
  errorId: string | null;
}

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  level,
  resetCount,
  maxResetAttempts
}) => {
  const canReset = resetCount < maxResetAttempts;
  
  const getLevelConfig = () => {
    switch (level) {
      case 'critical':
        return {
          title: 'Application Error',
          description: 'The application has encountered a critical error and needs to be restarted.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'section':
        return {
          title: 'Section Error',
          description: 'This section has encountered an error. You can try to reload it or continue using other parts of the application.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'component':
        return {
          title: 'Component Error',
          description: 'A component has encountered an error. You can try to reload it.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
      default:
        return {
          title: 'Error',
          description: 'Something went wrong.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const config = getLevelConfig();

  return (
    <div className={`min-h-[200px] flex items-center justify-center p-4`}>
      <div className={`max-w-md w-full ${config.bgColor} ${config.borderColor} border rounded-lg p-6`}>
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className={`h-6 w-6 ${config.textColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className={`text-lg font-medium ${config.textColor}`}>
              {config.title}
            </h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className={`text-sm ${config.textColor}`}>
            {config.description}
          </p>
          
          {import.meta.env.DEV && (
            <details className="mt-3">
              <summary className={`text-xs ${config.textColor} cursor-pointer hover:underline`}>
                Technical Details
              </summary>
              <div className="mt-2 p-2 bg-white rounded border">
                <p className="text-xs text-gray-600 font-mono break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs text-gray-500 mt-2 overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {canReset && (
            <button
              onClick={resetError}
              className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-md ${config.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50`}
            >
              Try Again
              {resetCount > 0 && ` (${resetCount}/${maxResetAttempts})`}
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Reload Page
          </button>
          
          {level === 'critical' && (
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Go Home
            </button>
          )}
        </div>

        {!canReset && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
            <p className="text-xs text-red-700">
              Maximum reset attempts reached. Please reload the page or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * React Error Boundary Class Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: 0,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Log error with debug logger
    debugLogger.error('error-boundary', `Error caught in ${level} boundary`, error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      level,
      resetCount: this.state.resetCount
    });

    // Create AppError for centralized error handling
    const appError = new AppError(
      error.message,
      'COMPONENT_ERROR',
      level === 'critical' ? ErrorSeverity.CRITICAL : ErrorSeverity.MEDIUM,
      {
        component: 'ErrorBoundary',
        action: 'componentDidCatch',
        metadata: {
          componentStack: errorInfo.componentStack,
          level,
          resetCount: this.state.resetCount
        }
      },
      true // recoverable
    );

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        debugLogger.error('error-boundary', 'Error in custom error handler', handlerError);
      }
    }

    // Report to global error handler if available
    if (typeof window !== 'undefined' && (window as any).__ERROR_HANDLER__) {
      try {
        (window as any).__ERROR_HANDLER__.handleError(appError);
      } catch (handlerError) {
        debugLogger.error('error-boundary', 'Error in global error handler', handlerError);
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;
    
    // Reset error state if resetKeys have changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        key !== prevProps.resetKeys![index]
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    const { maxResetAttempts = 3 } = this.props;
    const { resetCount } = this.state;

    if (resetCount >= maxResetAttempts) {
      debugLogger.warn('error-boundary', 'Maximum reset attempts reached', {
        resetCount,
        maxResetAttempts
      });
      return;
    }

    debugLogger.info('error-boundary', 'Resetting error boundary', {
      resetCount: resetCount + 1,
      maxResetAttempts
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: resetCount + 1,
      errorId: null
    });
  };

  render() {
    const { hasError, error, resetCount } = this.state;
    const { children, fallback: FallbackComponent, level = 'component', maxResetAttempts = 3 } = this.props;

    if (hasError && error) {
      const FallbackToRender = FallbackComponent || DefaultErrorFallback;
      
      return (
        <FallbackToRender
          error={error}
          resetError={this.resetErrorBoundary}
          level={level}
          resetCount={resetCount}
          maxResetAttempts={maxResetAttempts}
        />
      );
    }

    return children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for error boundary context (for functional components)
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    // Throw error to be caught by nearest error boundary
    throw error;
  };
}

export default ErrorBoundary;