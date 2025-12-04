import React, { useEffect, useState } from 'react';
import { ggCoinService, type TransactionHistory as HistoryData, type TransactionFilters } from '../../services/ggCoin.service';

/**
 * TransactionHistory Component
 * 
 * Displays user's GG Coin transaction history with pagination, filtering,
 * and proper formatting.
 * 
 * Features:
 * - Transaction list display with proper formatting
 * - Pagination controls (load more)
 * - Amount formatting with +/- prefix
 * - Relative timestamps (e.g., "2 hours ago")
 * - Optional filtering by type and date range
 * - Loading and error states
 * - Responsive design
 * - Empty state handling
 * 
 * Requirements: B5.1, B5.2
 * Task: 3.2 - Create Transaction History Component
 */

interface TransactionHistoryProps {
  userId: string;
  showFilters?: boolean;
  pageSize?: number;
  className?: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  userId,
  showFilters = false,
  pageSize = 20,
  className = '',
}) => {
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<TransactionFilters>({});

  useEffect(() => {
    loadHistory(true);
  }, [userId, filters]);

  const loadHistory = async (reset: boolean = false) => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const currentPage = reset ? 0 : page;
      const result = await ggCoinService.getTransactionHistory(
        userId,
        pageSize,
        currentPage * pageSize,
        filters
      );

      if (reset) {
        setHistory(result);
      } else {
        // Append to existing transactions
        setHistory(prev => ({
          transactions: [...(prev?.transactions || []), ...result.transactions],
          total: result.total,
          hasMore: result.hasMore,
        }));
      }
    } catch (err) {
      console.error('[TransactionHistory] Error loading history:', err);
      setError('Failed to load transaction history. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadHistory(false);
  };

  const handleFilterChange = (newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  /**
   * Format amount with +/- prefix
   * - Positive amounts (earn, bonus, referral): +10.500
   * - Negative amounts (spend): -5.250
   */
  const formatAmount = (amount: number, type: string): string => {
    const absAmount = Math.abs(amount);
    const prefix = type === 'spend' ? '-' : '+';
    
    // Hide decimals if whole number
    if (absAmount % 1 === 0) {
      return `${prefix}${absAmount.toLocaleString()}`;
    }
    
    // Show up to 3 decimals
    return `${prefix}${absAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    })}`;
  };

  /**
   * Format timestamp as relative time
   * Examples: "just now", "2 minutes ago", "3 hours ago", "2 days ago"
   */
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    } else {
      // For older dates, show formatted date
      return date.toLocaleDateString();
    }
  };

  /**
   * Get icon for transaction type
   */
  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case 'earn':
        return '💰';
      case 'spend':
        return '🛒';
      case 'bonus':
        return '🎁';
      case 'referral':
        return '👥';
      default:
        return '💵';
    }
  };

  /**
   * Get color class for transaction type
   */
  const getAmountColorClass = (type: string): string => {
    switch (type) {
      case 'earn':
      case 'bonus':
      case 'referral':
        return 'text-green-600';
      case 'spend':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
            <p className="font-medium" role="alert">{error}</p>
          </div>
          <button
            onClick={() => loadHistory(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Retry loading transaction history"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!history || history.transactions.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg 
              className="w-16 h-16 mx-auto" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No transactions yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Start earning GG Coins by completing actions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
        <span className="text-sm text-gray-500">
          {history.total} transaction{history.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters (optional) */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">Filter by:</label>
            
            {/* Type filter */}
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange({ type: e.target.value as any || undefined })}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Filter by transaction type"
            >
              <option value="">All Types</option>
              <option value="earn">Earned</option>
              <option value="spend">Spent</option>
              <option value="bonus">Bonus</option>
              <option value="referral">Referral</option>
            </select>

            {/* Clear filters */}
            {(filters.type || filters.startDate || filters.endDate) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 underline"
                aria-label="Clear all filters"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="space-y-3">
        {history.transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1">
              {/* Icon */}
              <div className="text-2xl" aria-hidden="true">
                {getTransactionIcon(tx.type)}
              </div>

              {/* Transaction info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {tx.description}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatRelativeTime(tx.timestamp)}
                </p>
                {tx.metadata?.actionType && (
                  <p className="text-xs text-gray-400 mt-1">
                    Action: {tx.metadata.actionType.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right ml-4">
              <p className={`font-bold text-lg ${getAmountColorClass(tx.type)}`}>
                {formatAmount(tx.amount, tx.type)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Balance: {tx.balanceAfter.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 3,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      {history.hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Load more transactions"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
