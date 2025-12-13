/**
 * Error Boundary Hierarchy Components
 * Pre-configured error boundaries for different application levels
 * Requirements: 6.4
 */

import React from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from './ErrorBoundary';
import {
  CriticalErrorFallback,
  SectionErrorFallback,
  ComponentErrorFallback,
  LoadingErrorFallback,
  NetworkErrorFallback
} from './ErrorFallbacks';

/**
 * App-level Error Boundary
 * Catches critical errors that would crash the entire application
 */
export const AppErrorBoundary: React.FC<{
  children: React.ReactNode;
  onError?: ErrorBoundaryProps['onError'];
}> = ({ children, onError }) => {
  return (
    <ErrorBoundary
      level="critical"
      fallback={CriticalErrorFallback}
      maxResetAttempts={2}
      onError={(error, errorInfo) => {
        // Log critical errors
        console.error('Critical App Error:', error, errorInfo);
        
        // Report to analytics/monitoring
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'exception', {
            description: error.message,
            fatal: true
          });
        }

        // Call custom handler
        if (onError) {
          onError(error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Route-level Error Boundary
 * Catches errors in page components and major sections
 */
export const RouteErrorBoundary: React.FC<{
  children: React.ReactNode;
  routeName?: string;
  onError?: ErrorBoundaryProps['onError'];
}> = ({ children, routeName, onError }) => {
  return (
    <ErrorBoundary
      level="section"
      fallback={SectionErrorFallback}
      maxResetAttempts={3}
      onError={(error, errorInfo) => {
        // Log route errors with context
        console.error(`Route Error [${routeName || 'unknown'}]:`, error, errorInfo);
        
        // Report to analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'exception', {
            description: `Route error: ${error.message}`,
            fatal: false,
            custom_parameters: {
              route: routeName || 'unknown'
            }
          });
        }

        // Call custom handler
        if (onError) {
          onError(error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Component-level Error Boundary
 * Catches errors in individual components
 */
export const ComponentErrorBoundary: React.FC<{
  children: React.ReactNode;
  componentName?: string;
  onError?: ErrorBoundaryProps['onError'];
}> = ({ children, componentName, onError }) => {
  return (
    <ErrorBoundary
      level="component"
      fallback={ComponentErrorFallback}
      maxResetAttempts={5}
      onError={(error, errorInfo) => {
        // Log component errors
        console.warn(`Component Error [${componentName || 'unknown'}]:`, error, errorInfo);
        
        // Call custom handler
        if (onError) {
          onError(error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Async Loading Error Boundary
 * Specialized for lazy-loaded components and async operations
 */
export const AsyncErrorBoundary: React.FC<{
  children: React.ReactNode;
  loadingComponent?: string;
  onError?: ErrorBoundaryProps['onError'];
}> = ({ children, loadingComponent, onError }) => {
  return (
    <ErrorBoundary
      level="component"
      fallback={LoadingErrorFallback}
      maxResetAttempts={3}
      onError={(error, errorInfo) => {
        // Log async loading errors
        console.warn(`Async Loading Error [${loadingComponent || 'unknown'}]:`, error, errorInfo);
        
        // Check if it's a chunk loading error
        const isChunkError = error.message.includes('Loading chunk') || 
                           error.message.includes('ChunkLoadError');
        
        if (isChunkError) {
          // Suggest page reload for chunk errors
          console.info('Chunk loading error detected. Consider reloading the page.');
        }

        // Call custom handler
        if (onError) {
          onError(error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Network Operation Error Boundary
 * Specialized for network-related operations
 */
export const NetworkErrorBoundary: React.FC<{
  children: React.ReactNode;
  operation?: string;
  onError?: ErrorBoundaryProps['onError'];
}> = ({ children, operation, onError }) => {
  return (
    <ErrorBoundary
      level="component"
      fallback={NetworkErrorFallback}
      maxResetAttempts={3}
      onError={(error, errorInfo) => {
        // Log network errors
        console.warn(`Network Error [${operation || 'unknown'}]:`, error, errorInfo);
        
        // Check if it's a network-related error
        const isNetworkError = error.message.includes('fetch') || 
                              error.message.includes('network') ||
                              error.message.includes('timeout') ||
                              error.name === 'NetworkError';
        
        if (isNetworkError) {
          console.info('Network error detected. Check connection and retry.');
        }

        // Call custom handler
        if (onError) {
          onError(error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Feature Error Boundary
 * For specific feature sections (dashboard, marketplace, etc.)
 */
export const FeatureErrorBoundary: React.FC<{
  children: React.ReactNode;
  featureName: string;
  onError?: ErrorBoundaryProps['onError'];
}> = ({ children, featureName, onError }) => {
  return (
    <ErrorBoundary
      level="section"
      fallback={SectionErrorFallback}
      maxResetAttempts={3}
      onError={(error, errorInfo) => {
        // Log feature errors with context
        console.warn(`Feature Error [${featureName}]:`, error, errorInfo);
        
        // Report to analytics with feature context
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'exception', {
            description: `Feature error: ${error.message}`,
            fatal: false,
            custom_parameters: {
              feature: featureName
            }
          });
        }

        // Call custom handler
        if (onError) {
          onError(error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Form Error Boundary
 * Specialized for form components and validation
 */
export const FormErrorBoundary: React.FC<{
  children: React.ReactNode;
  formName?: string;
  onError?: ErrorBoundaryProps['onError'];
}> = ({ children, formName, onError }) => {
  return (
    <ErrorBoundary
      level="component"
      fallback={ComponentErrorFallback}
      maxResetAttempts={5}
      onError={(error, errorInfo) => {
        // Log form errors
        console.warn(`Form Error [${formName || 'unknown'}]:`, error, errorInfo);
        
        // Check if it's a validation error
        const isValidationError = error.message.includes('validation') || 
                                 error.message.includes('required') ||
                                 error.name === 'ValidationError';
        
        if (isValidationError) {
          console.info('Form validation error. Check form inputs.');
        }

        // Call custom handler
        if (onError) {
          onError(error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Higher-order component to wrap any component with appropriate error boundary
 */
export function withErrorBoundaryLevel<P extends object>(
  Component: React.ComponentType<P>,
  level: 'app' | 'route' | 'component' | 'async' | 'network' | 'feature' | 'form',
  options?: {
    name?: string;
    onError?: ErrorBoundaryProps['onError'];
  }
) {
  const WrappedComponent = (props: P) => {
    const { name, onError } = options || {};

    switch (level) {
      case 'app':
        return (
          <AppErrorBoundary onError={onError}>
            <Component {...props} />
          </AppErrorBoundary>
        );
      
      case 'route':
        return (
          <RouteErrorBoundary routeName={name} onError={onError}>
            <Component {...props} />
          </RouteErrorBoundary>
        );
      
      case 'component':
        return (
          <ComponentErrorBoundary componentName={name} onError={onError}>
            <Component {...props} />
          </ComponentErrorBoundary>
        );
      
      case 'async':
        return (
          <AsyncErrorBoundary loadingComponent={name} onError={onError}>
            <Component {...props} />
          </AsyncErrorBoundary>
        );
      
      case 'network':
        return (
          <NetworkErrorBoundary operation={name} onError={onError}>
            <Component {...props} />
          </NetworkErrorBoundary>
        );
      
      case 'feature':
        return (
          <FeatureErrorBoundary featureName={name || 'unknown'} onError={onError}>
            <Component {...props} />
          </FeatureErrorBoundary>
        );
      
      case 'form':
        return (
          <FormErrorBoundary formName={name} onError={onError}>
            <Component {...props} />
          </FormErrorBoundary>
        );
      
      default:
        return (
          <ComponentErrorBoundary componentName={name} onError={onError}>
            <Component {...props} />
          </ComponentErrorBoundary>
        );
    }
  };

  WrappedComponent.displayName = `withErrorBoundaryLevel(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook to get the nearest error boundary context
 */
export function useErrorBoundaryContext() {
  const [errorHistory, setErrorHistory] = React.useState<Error[]>([]);

  const reportError = React.useCallback((error: Error) => {
    setErrorHistory(prev => [...prev.slice(-9), error]); // Keep last 10 errors
    throw error; // Re-throw to be caught by error boundary
  }, []);

  const clearErrorHistory = React.useCallback(() => {
    setErrorHistory([]);
  }, []);

  return {
    errorHistory,
    reportError,
    clearErrorHistory
  };
}

export default {
  AppErrorBoundary,
  RouteErrorBoundary,
  ComponentErrorBoundary,
  AsyncErrorBoundary,
  NetworkErrorBoundary,
  FeatureErrorBoundary,
  FormErrorBoundary,
  withErrorBoundaryLevel,
  useErrorBoundaryContext
};