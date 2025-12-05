import { useState, useEffect } from 'react';
import { Crown, TrendingUp, Shield, Zap, Star, Award } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { gangGreenHeroBadgeService } from '../../services/gangGreenHeroBadge.service';
import { heroBenefitsService } from '../../services/heroBenefits.service';
import type { HeroBadgeConfig, HeroBadgePurchaseResult } from '../../types/heroBadge.types';
import type { HeroBenefits } from '../../types/heroBenefit.types';

interface HeroBadgeMarketplaceProps {
  userId: string;
  userEmail: string;
  onPurchase?: (result: HeroBadgePurchaseResult) => void;
  showComparison?: boolean;
}

export const HeroBadgeMarketplace: React.FC<HeroBadgeMarketplaceProps> = ({
  userId,
  userEmail,
  onPurchase,
  showComparison = true,
}) => {
  const [config, setConfig] = useState<HeroBadgeConfig | null>(null);
  const [benefits, setBenefits] = useState<HeroBenefits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isHero, setIsHero] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHeroBadgeData();
  }, [userId]);

  const loadHeroBadgeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load Hero badge configuration
      const badgeConfig = await gangGreenHeroBadgeService.getHeroBadgeConfig();
      setConfig(badgeConfig);

      // Load Hero benefits
      const heroBenefits = await heroBenefitsService.getHeroBenefits();
      setBenefits(heroBenefits);

      // Check if user is already a Hero
      const heroStatus = await gangGreenHeroBadgeService.isHeroUser(userId);
      setIsHero(heroStatus);
    } catch (err) {
      console.error('Error loading Hero badge data:', err);
      setError('Failed to load Hero badge information');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      setError(null);

      const result = await gangGreenHeroBadgeService.purchaseHeroBadge({
        userId,
        email: userEmail,
      });

      if (onPurchase) {
        onPurchase(result as HeroBadgePurchaseResult);
      }

      // Reload data to update Hero status
      await loadHeroBadgeData();
    } catch (err) {
      console.error('Error purchasing Hero badge:', err);
      setError(err instanceof Error ? err.message : 'Failed to purchase Hero badge');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadHeroBadgeData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Hero Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <Crown className="w-12 h-12 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            GangGreen Hero Badge
          </h1>
          <Crown className="w-12 h-12 text-yellow-500" />
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Become a conservation hero and unlock exclusive benefits, daily GG coin rewards, and premium platform features
        </p>
      </div>

      {/* Already a Hero Banner */}
      {isHero && (
        <GlassCard variant="green" className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">You're Already a Hero!</h3>
              <p className="text-gray-600">
                You have access to all Hero benefits and daily GG coin rewards
              </p>
            </div>
            <Shield className="w-12 h-12 text-green-600" />
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main Hero Badge Card */}
        <div className="lg:col-span-2">
          <GlassCard variant="default" hover="lift" className="h-full">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Badge Visual */}
              <div className="flex-shrink-0">
                <div className="aspect-square w-48 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Crown className="w-24 h-24 text-white" />
                </div>
              </div>

              {/* Badge Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold">
                    PREMIUM
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                    LIMITED EDITION
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  GangGreen Hero Badge
                </h2>
                <p className="text-gray-600 mb-6">
                  The ultimate badge for dedicated environmental champions. Show your commitment to conservation and enjoy exclusive platform benefits.
                </p>

                {/* Price */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">One-time purchase</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      KES {config?.priceKes || 500}
                    </span>
                    <span className="text-gray-500">/ lifetime</span>
                  </div>
                </div>

                {/* Purchase Button */}
                {!isHero && (
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPurchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5" />
                        Become a Hero
                      </>
                    )}
                  </button>
                )}

                {error && (
                  <p className="mt-4 text-red-600 text-sm">{error}</p>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Daily Rewards Card */}
        <div>
          <GlassCard variant="green" hover="glow" className="h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Daily GG Coin Rewards</h3>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {config?.dailyGGCoinReward || 0.1} GG
              </div>
              <p className="text-sm text-gray-600 mb-4">Earned automatically every day</p>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-700 font-medium">
                  That's {((config?.dailyGGCoinReward || 0.1) * 365).toFixed(1)} GG coins per year!
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Benefits Grid */}
      {benefits && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Exclusive Hero Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Enhanced Rewards */}
            <GlassCard variant="default" hover="lift">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Enhanced Rewards</h3>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {benefits.enhancedRewards.initiativeMultiplier}x
                </div>
                <p className="text-sm text-gray-600">
                  Multiplier on initiative rewards
                </p>
              </div>
            </GlassCard>

            {/* Fee Discounts */}
            <GlassCard variant="default" hover="lift">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Fee Discounts</h3>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {(benefits.platformPrivileges.reducedFees * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-gray-600">
                  Off marketplace fees
                </p>
              </div>
            </GlassCard>

            {/* Content Priority */}
            <GlassCard variant="default" hover="lift">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Content Priority</h3>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  Level {benefits.socialBenefits.contentPriority}
                </div>
                <p className="text-sm text-gray-600">
                  Priority in community feeds
                </p>
              </div>
            </GlassCard>

            {/* Exclusive Features */}
            <GlassCard variant="default" hover="lift">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Exclusive Access</h3>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {benefits.platformPrivileges.exclusiveFeatures.length}+
                </div>
                <p className="text-sm text-gray-600">
                  Premium features
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Detailed Benefits List */}
      {benefits && (
        <GlassCard variant="default" className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6">What You Get</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Enhanced Rewards
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{benefits.enhancedRewards.initiativeMultiplier}x multiplier on all initiative rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{benefits.enhancedRewards.achievementBonus}x bonus on achievement unlocks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Daily automatic GG coin deposits</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Platform Privileges
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{(benefits.platformPrivileges.reducedFees * 100).toFixed(0)}% discount on all marketplace fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Priority customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Access to {benefits.platformPrivileges.exclusiveFeatures.length} exclusive features</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" />
                Social Benefits
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Level {benefits.socialBenefits.contentPriority} content priority boost</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Special Hero badge flair on profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Exclusive Hero community access</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-600" />
                Exclusive Features
              </h4>
              <ul className="space-y-2 text-gray-600">
                {benefits.platformPrivileges.exclusiveFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Comparison Table (if enabled) */}
      {showComparison && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Compare Badge Tiers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Standard</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 bg-gradient-to-r from-yellow-50 to-orange-50">
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      Hero
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Daily GG Coins</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">-</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-green-600 bg-gradient-to-r from-yellow-50 to-orange-50">
                    {config?.dailyGGCoinReward || 0.1} GG
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Initiative Rewards</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">1x</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-green-600 bg-gradient-to-r from-yellow-50 to-orange-50">
                    {benefits?.enhancedRewards.initiativeMultiplier || 1.5}x
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Marketplace Fees</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Standard</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-green-600 bg-gradient-to-r from-yellow-50 to-orange-50">
                    {((benefits?.platformPrivileges.reducedFees || 0.1) * 100).toFixed(0)}% Off
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Content Priority</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Normal</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-green-600 bg-gradient-to-r from-yellow-50 to-orange-50">
                    Level {benefits?.socialBenefits.contentPriority || 2}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Priority Support</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">-</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-green-600 bg-gradient-to-r from-yellow-50 to-orange-50">
                    ✓
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Exclusive Features</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">-</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-green-600 bg-gradient-to-r from-yellow-50 to-orange-50">
                    {benefits?.platformPrivileges.exclusiveFeatures.length || 3}+
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <GlassCard variant="default">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">How do daily rewards work?</h4>
            <p className="text-gray-600 text-sm">
              Once you purchase the Hero badge, you'll automatically receive {config?.dailyGGCoinReward || 0.1} GG coins every day. No action required!
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Is this a one-time purchase?</h4>
            <p className="text-gray-600 text-sm">
              Yes! Pay once and enjoy lifetime Hero benefits including daily rewards and all premium features.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Can I lose my Hero status?</h4>
            <p className="text-gray-600 text-sm">
              Your Hero status is permanent unless you violate platform terms. We're here to support your conservation journey!
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
