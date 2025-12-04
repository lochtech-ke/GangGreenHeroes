import React from 'react';
import { GGCoinWallet } from '../components/gamification/GGCoinWallet';
import { ReferralTracker } from '../components/gamification/ReferralTracker';
import { useAuth } from '../hooks/useAuth';

/**
 * GG Coins Page
 * Displays user's GG Coin wallet and referral tracking
 */
export const GGCoinsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">GG Coins</h1>
            <p className="text-gray-600">Please log in to view your wallet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GG Coins</h1>
          <p className="mt-2 text-gray-600">
            Manage your GG Coins, view transaction history, and track your referrals
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GG Coin Wallet */}
          <div>
            <GGCoinWallet userId={user.id} showTransactions={true} />
          </div>

          {/* Referral Tracker */}
          <div>
            <ReferralTracker />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @deprecated Use GGCoinsPage instead. This alias is maintained for backward compatibility.
 * Will be removed in a future version.
 */
export const GreenCoinsPage = GGCoinsPage;
