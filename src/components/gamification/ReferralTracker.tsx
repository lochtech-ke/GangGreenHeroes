import React, { useEffect, useState } from 'react';
import { referralService, type ReferralStats } from '../../services/referral.service';
import { useAuth } from '../../hooks/useAuth';

/**
 * ReferralTracker Component
 * Displays user's referral code, statistics, and recent referrals
 * 
 * Requirements: A7.5 - Display referral code, track successful referrals, show bonus earnings
 */
export const ReferralTracker: React.FC = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    loadReferralData();
  }, [user?.id]);

  const loadReferralData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get referral code
      const code = await referralService.getReferralCode(user.id);
      if (code) {
        setReferralCode(code);
      }

      // Get referral stats
      const referralStats = await referralService.getReferralStats(user.id);
      setStats(referralStats);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying referral code:', error);
    }
  };

  const shareReferralLink = () => {
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/register?ref=${referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join #GangGreen',
        text: 'Join me in taking climate action! Use my referral code to get started.',
        url: referralLink,
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Referral Program</h2>
        <p className="text-gray-600">
          Invite friends to join #GangGreen and earn 50 GG Coins for each successful referral!
        </p>
      </div>

      {/* Referral Code */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Code</label>
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 font-mono text-lg font-bold text-green-600">
            {referralCode || 'Loading...'}
          </div>
          <button
            onClick={copyReferralCode}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
          <button
            onClick={shareReferralLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Share
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalReferrals}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Successful</p>
              <p className="text-3xl font-bold text-green-600">{stats.successfulReferrals}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Bonus Earned</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.totalBonusEarned}</p>
            </div>
          </div>

          {/* Recent Referrals */}
          {stats.recentReferrals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Referrals</h3>
              <div className="space-y-2">
                {stats.recentReferrals.map((referral, index) => (
                  <div
                    key={`${referral.referredUserId}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">👤</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">New Member</p>
                        <p className="text-sm text-gray-500">{formatDate(referral.referredAt)}</p>
                      </div>
                    </div>
                    {referral.bonusAwarded && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        +50 Coins
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats.totalReferrals === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Referring!</h3>
              <p className="text-gray-600 mb-4">
                Share your referral code with friends and earn GG Coins when they join.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
