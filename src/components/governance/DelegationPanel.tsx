import { useState, useEffect } from 'react';
import { governanceTokenService } from '../../services/governanceToken.service';
import type { GovernanceToken } from '../../types/governance.types';

interface DelegationPanelProps {
  userId: string;
}

/**
 * DelegationPanel Component
 * 
 * Interface to delegate and revoke voting power.
 * Displays current delegation status.
 * 
 * Requirements: 7.1, 7.2, 7.4
 */
export function DelegationPanel({ userId }: DelegationPanelProps) {
  const [tokenRecord, setTokenRecord] = useState<GovernanceToken | null>(null);
  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegateAmount, setDelegateAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDelegationStatus();
  }, [userId]);

  const loadDelegationStatus = async () => {
    try {
      setLoading(true);
      const record = await governanceTokenService.getTokenRecord(userId);
      setTokenRecord(record);
    } catch (err) {
      console.error('Error loading delegation status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const amount = parseInt(delegateAmount);

      if (!delegateAddress || isNaN(amount) || amount <= 0) {
        setError('Please enter a valid address and amount');
        return;
      }

      const result = await governanceTokenService.delegateTokens(
        userId,
        delegateAddress,
        amount
      );

      if (result.success) {
        setSuccess('Delegation successful!');
        setDelegateAddress('');
        setDelegateAmount('');
        await loadDelegationStatus();
      } else {
        setError(result.error?.message || 'Failed to delegate tokens');
      }
    } catch (err) {
      setError('An error occurred while delegating tokens');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const result = await governanceTokenService.revokeDelegation(userId);

      if (result.success) {
        setSuccess('Delegation revoked successfully!');
        await loadDelegationStatus();
      } else {
        setError(result.error?.message || 'Failed to revoke delegation');
      }
    } catch (err) {
      setError('An error occurred while revoking delegation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const availableBalance = tokenRecord?.balance || 0;
  const isDelegated = !!tokenRecord?.delegated_to;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Delegate Voting Power
      </h3>

      {/* Current Status */}
      {isDelegated && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Currently Delegated
          </p>
          <div className="space-y-1 text-sm text-blue-800">
            <p>
              <strong>To:</strong> {tokenRecord.delegated_to}
            </p>
            <p>
              <strong>Amount:</strong> {tokenRecord.delegated_amount} tokens
            </p>
          </div>
          <button
            onClick={handleRevoke}
            disabled={submitting}
            className="mt-3 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {submitting ? 'Revoking...' : 'Revoke Delegation'}
          </button>
        </div>
      )}

      {/* Delegation Form */}
      {!isDelegated && (
        <form onSubmit={handleDelegate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delegate To (User ID)
            </label>
            <input
              type="text"
              value={delegateAddress}
              onChange={(e) => setDelegateAddress(e.target.value)}
              placeholder="Enter user ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Delegate
            </label>
            <input
              type="number"
              value={delegateAmount}
              onChange={(e) => setDelegateAmount(e.target.value)}
              placeholder="0"
              min="1"
              max={availableBalance}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {availableBalance} tokens
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || availableBalance === 0}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? 'Delegating...' : 'Delegate Tokens'}
          </button>
        </form>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>About Delegation:</strong> When you delegate your tokens, the delegate can vote on your behalf. You retain ownership but cannot vote yourself until you revoke the delegation.
        </p>
      </div>
    </div>
  );
}
