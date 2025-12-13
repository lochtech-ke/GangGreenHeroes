/**
 * Specialized Error Fallback Components
 * Different fallback UIs for different error boundary levels
 * Requirements: 6.1, 6.3, 6.4
 */

import React from 'react';
import { ErrorFallbackProps } from './ErrorBoundary';

/**
 * Critical Error Fallback - For app-level errors
 */
export const CriticalErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  resetCount,
  maxResetAttempts
}) => {
  const canReset = resetCount < maxResetAttempts;

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white shadow-lg rounded-lg p-8 border border-red-200">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0">
              <svg
                className="h-12 w-12 text-red-600"
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
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-red-900">
                Application Error
              </h1>
              <p className="text-red-700 mt-1">
                We're sorry, but something went wrong
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              The application has encountered a critical error and cannot continue. 
              This issue has been automatically reported to our team.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                What you can do:
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Try refreshing the page</li>
                <li>• Check your internet connection</li>
                <li>• Clear your browser cache</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>

            {import.meta.env.DEV && (
              <details className="mt-4">
                <summary className="text-sm text-red-600 cursor-pointer hover:underline">
                  Developer Information
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded border">
                  <p className="text-xs text-gray-700 font-mono break-all mb-2">
                    <strong>Error:</strong> {error.message}
                  </p>
                  {error.stack && (
                    <pre className="text-xs text-gray-600 overflow-auto max-h-40">
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
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Try Again
                {resetCount > 0 && ` (${resetCount}/${maxResetAttempts})`}
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Reload Page
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Go Home
            </button>
          </div>

          {!canReset && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded">
              <p className="text-sm text-red-700">
                Maximum reset attempts reached. Please reload the page or contact support at{' '}
                <a href="mailto:support@ganggreen.com" className="underline">
                  support@ganggreen.com
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Section Error Fallback - For page sections
 */
export const SectionErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  resetCount,
  maxResetAttempts
}) => {
  const canReset = resetCount < maxResetAttempts;

  return (
    <div className="w-full py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-yellow-600"
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
              <h3 className="text-lg font-medium text-yellow-900">
                Section Unavailable
              </h3>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-yellow-800 mb-3">
              This section is temporarily unavailable due to an error. 
              You can continue using other parts of the application.
            </p>

            {import.meta.env.DEV && (
              <details className="mb-3">
                <summary className="text-xs text-yellow-700 cursor-pointer hover:underline">
                  Error Details
                </summary>
                <div className="mt-2 p-2 bg-white rounded border">
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {error.message}
                  </p>
                </div>
              </details>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {canReset && (
              <button
                onClick={resetError}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
              >
                Retry Section
                {resetCount > 0 && ` (${resetCount}/${maxResetAttempts})`}
              </button>
            )}
            
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Go Back
            </button>
          </div>

          {!canReset && (
            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-700">
                This section is experiencing persistent issues. Please try again later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Component Error Fallback - For individual components
 */
export const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  resetCount,
  maxResetAttempts
}) => {
  const canReset = resetCount < maxResetAttempts;

  return (
    <div className="w-full p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Component Error
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              This component encountered an error and couldn't load properly.
            </p>

            {import.meta.env.DEV && (
              <details className="mb-3">
                <summary className="text-xs text-blue-700 cursor-pointer hover:underline">
                  Technical Details
                </summary>
                <div className="mt-1 p-2 bg-white rounded border text-xs text-gray-600 font-mono">
                  {error.message}
                </div>
              </details>
            )}

            <div className="flex gap-2">
              {canReset && (
                <button
                  onClick={resetError}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Retry
                  {resetCount > 0 && ` (${resetCount}/${maxResetAttempts})`}
                </button>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              >
                Reload
              </button>
            </div>

            {!canReset && (
              <div className="mt-2 p-2 bg-blue-100 border border-blue-200 rounded">
                <p className="text-xs text-blue-700">
                  Component failed to load after multiple attempts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Minimal Error Fallback - For small components or widgets
 */
export const MinimalErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  resetCount,
  maxResetAttempts
}) => {
  const canReset = resetCount < maxResetAttempts;

  return (
    <div className="inline-flex items-center px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-600">
      <svg
        className="h-4 w-4 text-gray-500 mr-2"
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
      <span className="mr-2">Error loading component</span>
      {canReset && (
        <button
          onClick={resetError}
          className="text-blue-600 hover:text-blue-800 underline text-xs"
        >
          retry
        </button>
      )}
    </div>
  );
};

/**
 * Loading Error Fallback - For async loading errors
 */
export const LoadingErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  resetCount,
  maxResetAttempts
}) => {
  const canReset = resetCount < maxResetAttempts;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="text-center max-w-sm">
        <svg
          className="h-12 w-12 text-gray-400 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.175-5.5-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to Load
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          We couldn't load this content. Please check your connection and try again.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {canReset && (
            <button
              onClick={resetError}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
              {resetCount > 0 && ` (${resetCount}/${maxResetAttempts})`}
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Reload Page
          </button>
        </div>

        {!canReset && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            Unable to load after multiple attempts. Please reload the page.
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Network Error Fallback - For network-related errors
 */
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  resetCount,
  maxResetAttempts
}) => {
  const canReset = resetCount < maxResetAttempts;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="text-center max-w-sm">
        <svg
          className="h-12 w-12 text-red-400 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v6m0 8v6m10-10h-6M8 12H2"
          />
        </svg>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Connection Problem
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          We're having trouble connecting to our servers. Please check your internet connection.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <div className="text-xs text-yellow-800">
            <p className="font-medium mb-1">Troubleshooting tips:</p>
            <ul className="text-left space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Disable VPN if active</li>
              <li>• Clear browser cache</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {canReset && (
            <button
              onClick={resetError}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Retry Connection
              {resetCount > 0 && ` (${resetCount}/${maxResetAttempts})`}
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Reload Page
          </button>
        </div>

        {!canReset && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            Connection failed after multiple attempts. Please check your network and try again later.
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  CriticalErrorFallback,
  SectionErrorFallback,
  ComponentErrorFallback,
  MinimalErrorFallback,
  LoadingErrorFallback,
  NetworkErrorFallback
};