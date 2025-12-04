/**
 * BadgeDisplay Component
 * Displays user's earned badges and progression tiers
 * Requirements: A9.1, A9.2
 */

import React, { useState, useEffect } from 'react';
import { Award, Lock, TrendingUp, Star, Shield, Droplet, TreePine } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Badge, PlatformBadgeTier, IconType } from '../../types/platform.types';

interface BadgeDisplayProps {
  userId: string;
  compact?: boolean;
  showProgress?: boolean;
}

interface BadgeWithProgress extends Badge {
  userProgress?: number;
  earned?: boolean;
  earnedAt?: Date;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ 
  userId, 
  compact = false,
  showProgress = true 
}) => {
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<PlatformBadgeTier | 'all'>('all');

  useEffect(() => {
    loadBadges();
  }, [userId, selectedTier]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all badges
      let badgesQuery = supabase
        .from('badges')
        .select('*')
        .order('tier', { ascending: true });

      if (selectedTier !== 'all') {
        badgesQuery = badgesQuery.eq('tier', selectedTier);
      }

      const { data: allBadges, error: badgesError } = await badgesQuery;

      if (badgesError) throw badgesError;

      // Load user's earned badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

      if (userBadgesError) throw userBadgesError;

      // Combine badges with user progress
      const badgesWithProgress: BadgeWithProgress[] = (allBadges || []).map(badge => {
        const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
        return {
          ...badge,
          userProgress: userBadge?.progress || 0,
          earned: !!userBadge,
          earnedAt: userBadge?.earned_at ? new Date(userBadge.earned_at) : undefined
        };
      });

      setBadges(badgesWithProgress);
    } catch (err) {
      console.error('Error loading badges:', err);
      setError('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconType: IconType) => {
    const iconMap = {
      hummingbird: Award,
      tree: TreePine,
      water: Droplet,
      shield: Shield,
      star: Star
    };
    return iconMap[iconType] || Award;
  };

  const getTierColor = (tier: PlatformBadgeTier) => {
    const colorMap = {
      steward: 'text-green-600 bg-green-50 border-green-200',
      platinum: 'text-purple-600 bg-purple-50 border-purple-200',
      hero: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    };
    return colorMap[tier];
  };

  const getTierLabel = (tier: PlatformBadgeTier) => {
    const labelMap = {
      steward: 'Steward',
      platinum: 'Platinum',
      hero: 'Hero'
    };
    return labelMap[tier];
  };

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-green-600" />
        <span className="text-sm font-medium text-gray-700">
          {earnedBadges.length} / {badges.length} Badges
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with tier filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Badges</h2>
          <p className="text-sm text-gray-600 mt-1">
            {earnedBadges.length} earned • {lockedBadges.length} to unlock
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedTier === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {(['steward', 'platinum', 'hero'] as PlatformBadgeTier[]).map(tier => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTier === tier
                  ? getTierColor(tier).replace('bg-', 'bg-').replace('text-', 'text-white ')
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getTierLabel(tier)}
            </button>
          ))}
        </div>
      </div>

      {/* Progression Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['steward', 'platinum', 'hero'] as PlatformBadgeTier[]).map(tier => {
          const tierBadges = badges.filter(b => b.tier === tier);
          const earnedInTier = tierBadges.filter(b => b.earned).length;
          const percentage = tierBadges.length > 0 
            ? Math.round((earnedInTier / tierBadges.length) * 100) 
            : 0;

          return (
            <div
              key={tier}
              className={`border-2 rounded-lg p-4 ${getTierColor(tier)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{getTierLabel(tier)}</h3>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold mb-2">
                {earnedInTier} / {tierBadges.length}
              </div>
              <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: 'currentColor'
                  }}
                />
              </div>
              <p className="text-xs mt-1 opacity-75">{percentage}% complete</p>
            </div>
          );
        })}
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Earned Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {earnedBadges.map(badge => {
              const IconComponent = getIconComponent(badge.iconType);
              return (
                <div
                  key={badge.id}
                  className={`border-2 rounded-lg p-4 ${getTierColor(badge.tier)} hover:shadow-lg transition-shadow cursor-pointer`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                    <p className="text-xs opacity-75 mb-2">{badge.description}</p>
                    {badge.earnedAt && (
                      <p className="text-xs opacity-60">
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Locked Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lockedBadges.map(badge => {
              const IconComponent = getIconComponent(badge.iconType);
              const progress = badge.userProgress || 0;
              const firstCriteria = badge.criteria[0];
              const progressPercentage = firstCriteria 
                ? Math.min(Math.round((progress / firstCriteria.threshold) * 100), 100)
                : 0;

              return (
                <div
                  key={badge.id}
                  className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer opacity-75"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 relative">
                      <IconComponent className="w-8 h-8 text-gray-400" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-full">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm mb-1 text-gray-700">{badge.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                    
                    {showProgress && firstCriteria && (
                      <div className="w-full mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{progress}</span>
                          <span>{firstCriteria.threshold}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {firstCriteria.metric}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No badges available yet</p>
        </div>
      )}
    </div>
  );
};
