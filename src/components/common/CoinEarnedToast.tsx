/**
 * Coin Earned Toast Component
 * 
 * Displays a toast notification when users earn GG Coins with:
 * - Smooth animations for appearance and dismissal
 * - Auto-dismiss after 5 seconds
 * - Manual dismiss option
 * - Amount and reason display
 * - Accessible ARIA labels
 * 
 * Requirements: B5.3
 */

import { useEffect, useState } from 'react';

export interface CoinEarnedToastProps {
  amount: number;
  reason: string;
  onClose: () => void;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

/**
 * Get position-based styling
 */
function getPositionStyles(position: CoinEarnedToastProps['position']): string {
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
 * Format coin amount for display
 * - Hide decimals if whole number
 * - Show up to 3 decimals for fractional amounts
 */
function formatCoinAmount(amount: number): string {
  if (amount % 1 === 0) {
    return amount.toLocaleString();
  }
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

/**
 * Coin Earned Toast Component
 * 
 * Requirement B5.3: Clear earning feedback with toast notifications
 */
export function CoinEarnedToast({
  amount,
  reason,
  onClose,
  position = 'top-right',
}: CoinEarnedToastProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const positionStyles = getPositionStyles(position);

  // Auto-dismiss after 5 seconds
  // Requirement B5.3: Auto-dismiss functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // Match animation duration
  };

  if (!isVisible) {
    return <></>;
  }

  return (
    <div
      className={`fixed ${positionStyles} z-50 max-w-sm w-full transition-all duration-300 ${
        isExiting 
          ? 'opacity-0 transform translate-y-2 scale-95' 
          : 'opacity-100 scale-100 animate-slide-in'
      }`}
      role="alert"
      aria-live="polite"
      aria-label={`Earned ${amount} GG Coins for ${reason}`}
    >
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-lg p-4 backdrop-blur-sm">
        <div className="flex items-start">
          {/* Coin Icon */}
          <div className="flex-shrink-0 bg-green-100 rounded-full p-2 animate-bounce-subtle">
            <span className="text-2xl" role="img" aria-label="coin">
              🪙
            </span>
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-green-700">
                +{formatCoinAmount(amount)}
              </span>
              <span className="text-sm font-medium text-green-600">
                GG Coins
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">{reason}</p>
          </div>

          {/* Dismiss Button */}
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-md transition-colors"
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
 * Coin Earned Toast Container
 * 
 * Manages multiple coin earned notifications with stacking
 */
export interface CoinEarnedToastContainerProps {
  toasts: Array<{
    id: string;
    amount: number;
    reason: string;
  }>;
  onDismiss: (id: string) => void;
  position?: CoinEarnedToastProps['position'];
  maxVisible?: number;
}

export function CoinEarnedToastContainer({
  toasts,
  onDismiss,
  position = 'top-right',
  maxVisible = 3,
}: CoinEarnedToastContainerProps): JSX.Element {
  // Show only the most recent toasts
  const visibleToasts = toasts.slice(-maxVisible);

  return (
    <>
      {visibleToasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 90}px)`,
            zIndex: 50 - index,
          }}
        >
          <CoinEarnedToast
            amount={toast.amount}
            reason={toast.reason}
            onClose={() => onDismiss(toast.id)}
            position={position}
          />
        </div>
      ))}
    </>
  );
}
