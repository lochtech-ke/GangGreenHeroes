import React, { useEffect, useState } from 'react';
import { ggCoinService, type GGCoinWallet as WalletData } from '../../services/ggCoin.service';
import { TransactionHistory } from './TransactionHistory';

/**
 * GGCoinWallet Component
 * 
 * Displays user's GG Coin balance with real-time updates, proper formatting,
 * and comprehensive error handling.
 * 
 * Features:
 * - Real-time balance updates via Supabase subscriptions
 * - Smart decimal formatting (hide .000 for whole numbers)
 * - Thousand separators for large amounts
 * - Loading and error states with retry functionality
 * - Responsive design
 * - Automatic retry on first failure
 * - User-friendly error messages based on error type
 * - Graceful degradation if real-time updates fail
 * - Accessibility support (ARIA labels, roles)
 * 
 * Error Handling:
 * - Network errors: Detects and displays connection issues
 * - Authentication errors: Prompts user to log in again
 * - Timeout errors: Suggests retry
 * - Database errors: Provides appropriate feedback
 * - Subscription errors: Continues without real-time updates
 * - Auto-retry: Automatically retries once after 2 seconds on first failure
 * 
 * Requirements: B5.1, B5.2
 * Task: 3.1 - Create GG Coin Wallet Component
 */

interface GGCoinWalletProps {
  userId: string;
  showTransactions?: boolean;
  className?: string;
}

export const GGCoinWallet: React.FC<GGCoinWalletProps> = ({ 
  userId, 
  showTransactions = false,
  className = ''
}) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    loadBalance();
    
    // Subscribe to real-time updates with error handling
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = ggCoinService.subscribeToBalance(userId, (newBalance) => {
        try {
          setBalance(newBalance);
          if (wallet) {
            setWallet({ ...wallet, balance: newBalance });
          }
        } catch (err) {
          console.error('[GGCoinWallet] Error updating balance from subscription:', err);
          // Don't set error state for subscription updates to avoid disrupting UI
        }
      });
    } catch (err) {
      console.error('[GGCoinWallet] Error setting up subscription:', err);
      // Continue without real-time updates if subscription fails
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          console.error('[GGCoinWallet] Error cleaning up subscription:', err);
        }
      }
    };
  }, [userId]);

  const loadBalance = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Load wallet data
      const walletData = await ggCoinService.getWallet(userId);
      
      if (!walletData) {
        // Provide more specific error message
        setError('Wallet not found. Please try again or contact support.');
        return;
      }

      setWallet(walletData);
      setBalance(walletData.balance);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('[GGCoinWallet] Error loading balance:', err);
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Failed to load wallet data';
      
      if (err instanceof Error) {
        // Network errors
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        // Authentication errors
        else if (err.message.includes('auth') || err.message.includes('unauthorized')) {
          errorMessage = 'Authentication error. Please log in again.';
        }
        // Timeout errors
        else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
        // Database errors
        else if (err.message.includes('database') || err.message.includes('query')) {
          errorMessage = 'Database error. Please try again later.';
        }
      }
      
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Auto-retry once after a short delay if it's the first failure
      if (retryCount === 0) {
        setTimeout(() => {
          loadBalance();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format balance with smart decimal display
   * - Hide decimals for whole numbers (50 instead of 50.000)
   * - Show up to 3 decimals when non-zero (10.500)
   * - Use thousand separators (1,234.567)
   */
  const formatBalance = (amount: number): string => {
    // Hide decimals if whole number
    if (amount % 1 === 0) {
      return amount.toLocaleString();
    }
    // Show up to 3 decimals
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !wallet) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg 
              className="w-12 h-12 mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium" role="alert">
              {error || 'Failed to load wallet'}
            </p>
            {retryCount > 1 && (
              <p className="text-sm text-gray-600 mt-2">
                If the problem persists, please contact support.
              </p>
            )}
          </div>
          <button
            onClick={loadBalance}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Retry loading wallet"
          >
            {loading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">GG Coins</h2>
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-sm font-bold">GG</span>
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span 
            className="text-5xl font-bold text-green-600 transition-all duration-300"
            aria-label={`Balance: ${formatBalance(balance)} GG Coins`}
          >
            {formatBalance(balance)}
          </span>
          <span className="text-xl text-gray-600">GG</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Available Balance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Level</p>
          <p className="text-xl font-bold text-green-600">
            {wallet.level}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Total Points</p>
          <p className="text-xl font-bold text-blue-600">
            {wallet.totalPoints.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-gray-400 text-center mt-4">
        Last updated: {new Date(wallet.lastUpdated).toLocaleString()}
      </p>

      {/* Transaction History (optional) */}
      {showTransactions && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <TransactionHistory userId={userId} pageSize={10} />
        </div>
      )}
    </div>
  );
};
