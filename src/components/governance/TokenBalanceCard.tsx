import { useEffect, useState } from 'react';
import { governanceTokenService } from '../../services/governanceToken.service';
import type { TokenTransaction } from '../../types/governance.types';

interface TokenBalanceCardProps {
  userId: string;
}

/**
 * TokenBalanceCard Component
 * 
 * Displays governance token balance separately from GG Coins.
 * Shows earning history and transaction log.
 * 
 * Requirements: 1.4, 1.5, 8.2, 8.5
 */
export function TokenBalanceCard({ userId }: TokenBalanceCardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadTokenData();
  }, [userId]);

  const loadTokenData = async () => {
    try {
      setLoading(true);
      const [tokenBalance, tokenHistory] = await Promise.all([
        governanceTokenService.getBalance(userId),
        governanceTokenService.getTransactionHistory(userId, 10),
      ]);

      setBalance(tokenBalance);
      setTransactions(tokenHistory);
    } catch (error) {
      console.error('Error loading token data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return '🎁';
      case 'delegated':
        return '🤝';
      case 'revoked':
        return '↩️';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Governance Tokens
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          Voting Power
        </span>
      </div>

      {/* Balance Display */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-green-600">{balance}</span>
          <span className="text-gray-500 text-sm">tokens</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Use these tokens to vote on platform proposals and participate in governance decisions.
        </p>
      </div>

      {/* Transaction History Toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full text-left text-sm font-medium text-green-600 hover:text-green-700 flex items-center justify-between py-2 border-t border-gray-200"
      >
        <span>Transaction History</span>
        <span className="transform transition-transform duration-200" style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {/* Transaction History */}
      {showHistory && (
        <div className="mt-4 space-y-3">
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No transactions yet
            </p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">{getTransactionIcon(tx.transaction_type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.source.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {transactions.length > 0 && (
            <button
              onClick={loadTokenData}
              className="w-full text-sm text-green-600 hover:text-green-700 font-medium py-2"
            >
              Refresh
            </button>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Governance tokens are separate from GG Coins. They cannot be spent or transferred, only used for voting.
        </p>
      </div>
    </div>
  );
}
