import { useState } from 'react';
import { badgePurchaseService } from '../../services/badgePurchase.service';
import { BADGE_PRICE_KES, BADGE_PURCHASE_GG_COIN_REWARD } from '../../types/badgePurchase.types';

interface BadgePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeType: string;
  tier: string;
  badgeName: string;
  badgeImage: string;
  userId: string;
  userEmail: string;
  onSuccess?: (ggCoinsEarned: number) => void;
}

export const BadgePurchaseModal: React.FC<BadgePurchaseModalProps> = ({
  isOpen,
  onClose,
  badgeType,
  tier,
  badgeName,
  badgeImage,
  userId,
  userEmail,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'geometric' | 'classic'>('geometric');

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      // Initiate purchase
      const result = await badgePurchaseService.initiatePurchase({
        userId,
        badgeType,
        tier,
        email: userEmail,
        style: selectedStyle,
        metadata: {
          badge_name: badgeName,
          style: selectedStyle,
        },
      });

      if (!result.success || !result.paystack_authorization_url) {
        setError(result.error || 'Failed to initialize payment');
        setLoading(false);
        return;
      }

      // Open Paystack payment popup
      const paystackWindow = window.open(
        result.paystack_authorization_url,
        'Paystack Payment',
        'width=600,height=700'
      );

      // Poll for window close or payment completion
      const pollTimer = setInterval(async () => {
        if (paystackWindow?.closed) {
          clearInterval(pollTimer);

          // Verify payment completion
          if (result.paystack_reference) {
            const completionResult = await badgePurchaseService.completePurchase({
              reference: result.paystack_reference,
              userId,
            });

            if (completionResult.success) {
              setLoading(false);
              onSuccess?.(completionResult.gg_coins_earned || BADGE_PURCHASE_GG_COIN_REWARD);
              onClose();
            } else {
              setError('Payment verification failed. Please contact support if you were charged.');
              setLoading(false);
            }
          }
        }
      }, 1000);

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollTimer);
        if (loading) {
          setLoading(false);
          setError('Payment timeout. Please try again.');
        }
      }, 300000);
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Badge</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Style Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Badge Style</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedStyle('geometric')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${selectedStyle === 'geometric'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Geometric (New)
            </button>
            <button
              onClick={() => setSelectedStyle('classic')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${selectedStyle === 'classic'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Classic
            </button>
          </div>
        </div>

        {/* Badge Preview */}
        <div className="mb-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <img
              src={badgeImage}
              alt={badgeName}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{badgeName}</h3>
              <p className="text-sm text-gray-600 capitalize">{tier} Tier</p>
            </div>
          </div>
        </div>

        {/* Price Display */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 font-medium">Price</span>
            <span className="text-2xl font-bold text-green-600">KES {BADGE_PRICE_KES}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">GG</span>
            </div>
            <span>Earn {BADGE_PURCHASE_GG_COIN_REWARD} GG Coin with this purchase!</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-6 text-sm text-gray-600">
          <p className="mb-2">You will be redirected to Paystack to complete your payment securely.</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Payment processed by Paystack</li>
            <li>Secure and encrypted transaction</li>
            <li>GG Coins credited instantly</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Pay KES {BADGE_PRICE_KES}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
