/**
 * useErrorNotification Hook
 * 
 * React hook for managing error notifications in components
 * 
 * Usage:
 * ```typescript
 * const { showError, dismissError, errors } = useErrorNotification();
 * 
 * try {
 *   await someOperation();
 * } catch (error) {
 *   showError(error, {
 *     onRetry: () => someOperation(),
 *     onGoBack: () => navigate(-1),
 *   });
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { AppError } from '../types/errors';

export interface ErrorNotificationItem {
  id: string;
  error: AppError | Error;
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
}

export interface UseErrorNotificationReturn {
  errors: ErrorNotificationItem[];
  showError: (
    error: AppError | Error,
    actions?: {
      onRetry?: () => void;
      onGoBack?: () => void;
      onContactSupport?: () => void;
    }
  ) => string;
  dismissError: (id: string) => void;
  clearAll: () => void;
}

/**
 * Hook for managing error notifications
 */
export function useErrorNotification(): UseErrorNotificationReturn {
  const [errors, setErrors] = useState<ErrorNotificationItem[]>([]);

  /**
   * Show an error notification
   * Returns the error ID for manual dismissal if needed
   */
  const showError = useCallback(
    (
      error: AppError | Error,
      actions?: {
        onRetry?: () => void;
        onGoBack?: () => void;
        onContactSupport?: () => void;
      }
    ): string => {
      const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newError: ErrorNotificationItem = {
        id,
        error,
        onRetry: actions?.onRetry,
        onGoBack: actions?.onGoBack,
        onContactSupport: actions?.onContactSupport,
      };

      setErrors((prev) => [...prev, newError]);

      return id;
    },
    []
  );

  /**
   * Dismiss a specific error notification
   */
  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  }, []);

  /**
   * Clear all error notifications
   */
  const clearAll = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    showError,
    dismissError,
    clearAll,
  };
}
