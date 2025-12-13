/**
 * Error Notification Component
 * User-facing error messages and notifications with action buttons
 * Requirements: 3.1, 3.2, 3.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppError, ErrorSeverity } from '../../types/errors';

export interface ErrorNotificationProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void;
  onReport?: () => void;
  autoHideDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export interface ErrorNotificationConfig {
  title: string;
  message: string;
  actions: ErrorAction[];
  icon?: React.ReactNode;
  severity: ErrorSeverity;
  dismissible: boolean;
  autoHideDuration?: number;
}

export interface ErrorAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
}

/**
 * Error Notification Component
 */
export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  onReport,
  autoHideDuration = 0,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-hide functionality
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  const handleDismiss = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300); // Animation duration
  }, [onDismiss]);

  const handleRetry = useCallback(() => {
    onRetry?.();
    handleDismiss();
  }, [onRetry, handleDismiss]);

  const handleReport = useCallback(() => {
    onReport?.();
    // Don't auto-dismiss when reporting
  }, [onReport]);

  if (!isVisible) {
    return null;
  }

  const getSeverityConfig = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          primaryButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          secondaryButton: 'border-red-300 text-red-700 hover:bg-red-50',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        };
      case ErrorSeverity.HIGH:
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          primaryButton: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
          secondaryButton: 'border-orange-300 text-orange-700 hover:bg-orange-50',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        };
      case ErrorSeverity.MEDIUM:
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          primaryButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          secondaryButton: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case ErrorSeverity.LOW:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          primaryButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          secondaryButton: 'border-blue-300 text-blue-700 hover:bg-blue-50',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          primaryButton: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
          secondaryButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getUserFriendlyMessage = () => {
    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'NETWORK_REQUEST_FAILED': 'Unable to connect to our servers. Please check your internet connection.',
      'NETWORK_TIMEOUT': 'The request took too long to complete. Please try again.',
      'NETWORK_NO_CONNECTION': 'No internet connection detected. Please check your network settings.',
      'AUTH_INVALID_CREDENTIALS': 'Invalid username or password. Please try again.',
      'AUTH_TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
      'AUTH_UNAUTHORIZED': 'You don\'t have permission to access this resource.',
      'VALIDATION_FAILED': 'Please check your input and try again.',
      'VALIDATION_REQUIRED_FIELD': 'Please fill in all required fields.',
      'DB_QUERY_FAILED': 'Unable to save your changes. Please try again.',
      'DB_CONNECTION_FAILED': 'Database connection error. Please try again later.',
      'WEB3_USER_REJECTED': 'Transaction was cancelled by user.',
      'WEB3_INSUFFICIENT_GAS': 'Insufficient gas for transaction. Please increase gas limit.',
      'WEB3_NETWORK_ERROR': 'Blockchain network error. Please try again.',
      'BADGE_GENERATION_FAILED': 'Unable to generate badge. Please try again.',
      'COMPONENT_ERROR': 'A component failed to load properly.',
    };

    return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  };

  const getErrorTitle = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'Critical Error';
      case ErrorSeverity.HIGH:
        return 'Error';
      case ErrorSeverity.MEDIUM:
        return 'Warning';
      case ErrorSeverity.LOW:
        return 'Notice';
      default:
        return 'Error';
    }
  };

  const config = getSeverityConfig();
  const animationClass = isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100';

  return (
    <div className={`fixed z-50 ${getPositionClasses()}`}>
      <div className={`max-w-sm w-full transition-all duration-300 ease-in-out ${animationClass}`}>
        <div className={`${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${config.iconColor}`}>
              {config.icon}
            </div>
            
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${config.textColor} mb-1`}>
                {getErrorTitle()}
              </h3>
              
              <p className={`text-sm ${config.textColor} mb-3`}>
                {getUserFriendlyMessage()}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {error.recoverable && onRetry && (
                  <button
                    onClick={handleRetry}
                    className={`px-3 py-1 text-xs font-medium text-white rounded-md ${config.primaryButton} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
                  >
                    Try Again
                  </button>
                )}
                
                {onReport && (
                  <button
                    onClick={handleReport}
                    className={`px-3 py-1 text-xs font-medium border rounded-md ${config.secondaryButton} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
                  >
                    Report Issue
                  </button>
                )}
                
                <button
                  onClick={() => window.history.back()}
                  className={`px-3 py-1 text-xs font-medium border rounded-md ${config.secondaryButton} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
                >
                  Go Back
                </button>
              </div>

              {/* Error code for debugging (development only) */}
              {import.meta.env.DEV && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-mono">
                    Error Code: {error.code}
                  </p>
                </div>
              )}
            </div>

            {/* Dismiss button */}
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className={`inline-flex ${config.textColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Error Notification Manager
 * Manages multiple error notifications with queue and deduplication
 */
export class ErrorNotificationManager {
  private notifications: Map<string, AppError> = new Map();
  private listeners: Set<(notifications: AppError[]) => void> = new Set();
  private maxNotifications = 5;
  private deduplicationWindow = 5000; // 5 seconds

  /**
   * Add a new error notification
   */
  addNotification(error: AppError): void {
    const key = this.getNotificationKey(error);
    
    // Check for duplicate within deduplication window
    if (this.notifications.has(key)) {
      return;
    }

    // Add notification
    this.notifications.set(key, error);

    // Remove old notifications if exceeding max
    if (this.notifications.size > this.maxNotifications) {
      const firstKey = this.notifications.keys().next().value;
      this.notifications.delete(firstKey);
    }

    // Auto-remove after deduplication window
    setTimeout(() => {
      this.notifications.delete(key);
      this.notifyListeners();
    }, this.deduplicationWindow);

    this.notifyListeners();
  }

  /**
   * Remove a specific notification
   */
  removeNotification(error: AppError): void {
    const key = this.getNotificationKey(error);
    this.notifications.delete(key);
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.clear();
    this.notifyListeners();
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: AppError[]) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current notifications
   */
  getNotifications(): AppError[] {
    return Array.from(this.notifications.values());
  }

  private getNotificationKey(error: AppError): string {
    return `${error.code}_${error.message.substring(0, 50)}`;
  }

  private notifyListeners(): void {
    const notifications = this.getNotifications();
    this.listeners.forEach(listener => listener(notifications));
  }
}

// Global notification manager instance
export const errorNotificationManager = new ErrorNotificationManager();

/**
 * Hook for using error notifications
 */
export function useErrorNotifications() {
  const [notifications, setNotifications] = useState<AppError[]>([]);

  useEffect(() => {
    const unsubscribe = errorNotificationManager.subscribe(setNotifications);
    setNotifications(errorNotificationManager.getNotifications());
    
    return unsubscribe;
  }, []);

  const showNotification = useCallback((error: AppError) => {
    errorNotificationManager.addNotification(error);
  }, []);

  const dismissNotification = useCallback((error: AppError) => {
    errorNotificationManager.removeNotification(error);
  }, []);

  const clearAllNotifications = useCallback(() => {
    errorNotificationManager.clearAll();
  }, []);

  return {
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications
  };
}

export default ErrorNotification;