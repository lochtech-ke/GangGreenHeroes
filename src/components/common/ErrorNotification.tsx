/**
 * Error Notification Component
 * 
 * Displays user-friendly error notifications with:
 * - Severity-based styling
 * - Action buttons (Retry, Go Back, Contact Support)
 * - Auto-dismiss functionality
 * - Age-appropriate messaging
 * 
 * Requirements: C3.1, C3.2, C3.5
 */

import { useEffect, useState } from 'react';
import { AppError, ErrorSeverity } from '../../types/errors';

export interface ErrorNotificationProps {
  error: AppError | Error;
  onDismiss?: () => void;
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  autoDismissAfter?: number; // milliseconds, 0 = no auto-dismiss
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

/**
 * Get severity-based styling
 * 
 * Requirement C3.1: Severity styling
 */
function getSeverityStyles(severity: ErrorSeverity): {
  bg: string;
  border: string;
  icon: string;
  iconBg: string;
} {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-500',
        icon: 'text-red-600',
        iconBg: 'bg-red-100',
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-500',
        icon: 'text-orange-600',
        iconBg: 'bg-orange-100',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-500',
        icon: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
      };
    case 'low':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100',
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-500',
        icon: 'text-gray-600',
        iconBg: 'bg-gray-100',
      };
  }
}

/**
 * Get position-based styling
 */
function getPositionStyles(position: ErrorNotificationProps['position']): string {
  switch (position) {
    case 'top-center':
      return 'top-4 left-1/2 transform -translate-x-1/2';
    case 'bottom-right':
      return 'bottom-4 right-4';
    case 'bottom-center':
      return 'bottom-4 left-1/2 transform -translate-x-1/2';
    case 'top-right':
    default:
      return 'top-4 right-4';
  }
}

/**
 * Error Notification Component
 * 
 * Requirement C3.1: User-friendly error messages
 * Requirement C3.2: Action buttons for recoverable errors
 * Requirement C3.5: Auto-dismiss functionality
 */
export function ErrorNotification({
  error,
  onDismiss,
  onRetry,
  onGoBack,
  onContactSupport,
  autoDismissAfter = 5000,
  position = 'top-right',
}: ErrorNotificationProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const isAppError = error instanceof AppError;
  const severity = isAppError ? error.severity : ErrorSeverity.MEDIUM;
  const recoverable = isAppError ? error.recoverable : false;
  const message = error.message;

  const styles = getSeverityStyles(severity);
  const positionStyles = getPositionStyles(position);

  // Auto-dismiss functionality
  // Requirement C3.5: Auto-dismiss
  useEffect(() => {
    if (autoDismissAfter > 0 && !recoverable) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissAfter);

      return () => clearTimeout(timer);
    }
  }, [autoDismissAfter, recoverable]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300); // Match animation duration
  };

  if (!isVisible) {
    return <></>;
  }

  return (
    <div
      className={`fixed ${positionStyles} z-50 max-w-md w-full transition-all duration-300 ${
        isExiting ? 'opacity-0 transform translate-y-2' : 'opacity-100'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`${styles.bg} ${styles.border} border-l-4 rounded-lg shadow-lg p-4`}
      >
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-2`}>
            <svg
              className={`h-5 w-5 ${styles.icon}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {severity === 'critical' || severity === 'high' ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {severity === 'critical' ? 'Critical Error' : 
               severity === 'high' ? 'Error' :
               severity === 'medium' ? 'Warning' : 'Notice'}
            </h3>
            <p className="mt-1 text-sm text-gray-700">{message}</p>

            {/* Action Buttons */}
            {/* Requirement C3.2: Action buttons for recoverable errors */}
            {recoverable && (onRetry || onGoBack || onContactSupport) && (
              <div className="mt-3 flex gap-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Retry
                  </button>
                )}
                {onGoBack && (
                  <button
                    onClick={onGoBack}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Go Back
                  </button>
                )}
                {onContactSupport && (
                  <button
                    onClick={onContactSupport}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Contact Support
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-md"
              aria-label="Dismiss notification"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error Notification Container
 * 
 * Manages multiple error notifications with stacking
 */
export interface ErrorNotificationContainerProps {
  errors: Array<{
    id: string;
    error: AppError | Error;
    onRetry?: () => void;
    onGoBack?: () => void;
    onContactSupport?: () => void;
  }>;
  onDismiss: (id: string) => void;
  position?: ErrorNotificationProps['position'];
  maxVisible?: number;
}

export function ErrorNotificationContainer({
  errors,
  onDismiss,
  position = 'top-right',
  maxVisible = 3,
}: ErrorNotificationContainerProps): JSX.Element {
  // Show only the most recent errors
  const visibleErrors = errors.slice(-maxVisible);

  return (
    <>
      {visibleErrors.map((item, index) => (
        <div
          key={item.id}
          style={{
            transform: `translateY(${index * 80}px)`,
            zIndex: 50 - index,
          }}
        >
          <ErrorNotification
            error={item.error}
            onDismiss={() => onDismiss(item.id)}
            onRetry={item.onRetry}
            onGoBack={item.onGoBack}
            onContactSupport={item.onContactSupport}
            position={position}
          />
        </div>
      ))}
    </>
  );
}
