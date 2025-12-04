import React from 'react';
import { GGCoinWallet } from './GGCoinWallet';
import { useAuth } from '../../hooks/useAuth';

/**
 * GreenCoinWallet Component
 * 
 * @deprecated This component is deprecated as of Migration 032 (Coin System Harmonization).
 * Please use GGCoinWallet instead.
 * 
 * This component is maintained for backward compatibility only and will be removed in a future version.
 * It now acts as a simple wrapper around GGCoinWallet.
 * 
 * Migration Guide:
 * - Replace: <GreenCoinWallet /> 
 * - With: <GGCoinWallet userId={userId} showTransactions={true} />
 * 
 * Requirements: A7.2 - Display balance and history, show earning breakdown
 */
export const GreenCoinWallet: React.FC = () => {
  const { user } = useAuth();

  // Log deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATED] GreenCoinWallet is deprecated. Please use GGCoinWallet instead. ' +
      'This component will be removed in a future version.'
    );
  }

  // If no user, show error
  if (!user?.id) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <p>Please log in to view your wallet</p>
        </div>
      </div>
    );
  }

  // Render the new GGCoinWallet component with showTransactions enabled
  // to maintain backward compatibility with the old component's functionality
  return <GGCoinWallet userId={user.id} showTransactions={true} />;
};
