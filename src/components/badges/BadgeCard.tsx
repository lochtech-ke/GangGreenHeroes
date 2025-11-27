/**
 * Badge Card Component
 * Displays a single badge with geometric design by default
 * Includes tier-specific styling and lazy loading support
 */

import React from 'react';
import { BadgeConfig, BadgeTier } from '../../types/badge.types';
import { ObservedBadge } from './LazyBadge';

export interface BadgeCardProps {
  config: BadgeConfig;
  size?: number;
  className?: string;
  showMetadata?: boolean;
  onClick?: () => void;
  lazyLoad?: boolean;
}

/**
 * Get tier-specific styling
 */
const getTierStyles = (tier: BadgeTier) => {
  const styles: Record<BadgeTier, { bg: string; border: string; glow: string; text: string }> = {
    hummingbird: {
      bg: 'bg-gradient-to-br from-mint-50 to-teal-50',
      border: 'border-teal-400',
      glow: 'shadow-lg shadow-teal-200/50',
      text: 'text-teal-700',
    },
    bronze: {
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
      border: 'border-orange-400',
      glow: 'shadow-lg shadow-orange-200/50',
      text: 'text-orange-700',
    },
    silver: {
      bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
      border: 'border-gray-400',
      glow: 'shadow-lg shadow-gray-200/50',
      text: 'text-gray-700',
    },
    gold: {
      bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      border: 'border-yellow-400',
      glow: 'shadow-lg shadow-yellow-200/50',
      text: 'text-yellow-700',
    },
    platinum: {
      bg: 'bg-gradient-to-br from-slate-50 to-zinc-50',
      border: 'border-slate-400',
      glow: 'shadow-lg shadow-slate-200/50',
      text: 'text-slate-700',
    },
    diamond: {
      bg: 'bg-gradient-to-br from-cyan-50 to-blue-50',
      border: 'border-cyan-400',
      glow: 'shadow-lg shadow-cyan-200/50',
      text: 'text-cyan-700',
    },
    hero: {
      bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
      border: 'border-amber-500',
      glow: 'shadow-xl shadow-amber-300/60',
      text: 'text-amber-700',
    },
  };

  return styles[tier];
};

/**
 * Format achievement name for display
 */
const formatAchievementName = (achievement: string): string => {
  return achievement
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format tier name for display
 */
const formatTierName = (tier: BadgeTier): string => {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
};

/**
 * Badge Card Component
 * Displays a badge with geometric design, tier styling, and optional metadata
 */
export const BadgeCard: React.FC<BadgeCardProps> = ({
  config,
  size = 256,
  className = '',
  showMetadata = true,
  onClick,
  lazyLoad = true,
}) => {
  const tierStyles = getTierStyles(config.tier);
  const achievementName = formatAchievementName(config.achievement);
  const tierName = formatTierName(config.tier);

  const cardContent = (
    <div
      className={`
        badge-card
        ${tierStyles.bg}
        ${tierStyles.border}
        ${tierStyles.glow}
        border-2
        rounded-xl
        p-6
        transition-all
        duration-300
        hover:scale-105
        hover:shadow-2xl
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {/* Badge Icon */}
      <div className="flex justify-center mb-4">
        {lazyLoad ? (
          <ObservedBadge
            config={config}
            size={size}
            optimizeForMobile={true}
            rootMargin="100px"
          />
        ) : (
          <div
            className="badge-icon"
            style={{
              width: size,
              height: size,
            }}
          >
            {/* Non-lazy loaded badge would go here */}
            <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
        )}
      </div>

      {/* Badge Metadata */}
      {showMetadata && (
        <div className="text-center space-y-2">
          <h3 className={`text-lg font-bold ${tierStyles.text}`}>
            {achievementName}
          </h3>
          <p className="text-sm text-gray-600 capitalize">
            {tierName} Tier
          </p>
          {config.metadata.earnedDate && (
            <p className="text-xs text-gray-500">
              Earned: {new Date(config.metadata.earnedDate).toLocaleDateString()}
            </p>
          )}
          {config.metadata.achievementCount > 0 && (
            <p className="text-xs text-gray-500">
              {config.metadata.achievementCount} {config.metadata.achievementCount === 1 ? 'achievement' : 'achievements'}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return cardContent;
};

/**
 * Compact Badge Card
 * Smaller version for grids and lists
 */
export interface CompactBadgeCardProps extends BadgeCardProps {
  showTierOnly?: boolean;
}

export const CompactBadgeCard: React.FC<CompactBadgeCardProps> = ({
  config,
  size = 120,
  className = '',
  showTierOnly = false,
  onClick,
  lazyLoad = true,
}) => {
  const tierStyles = getTierStyles(config.tier);
  const tierName = formatTierName(config.tier);

  return (
    <div
      className={`
        compact-badge-card
        ${tierStyles.bg}
        ${tierStyles.border}
        border-2
        rounded-lg
        p-3
        transition-all
        duration-200
        hover:scale-105
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex justify-center mb-2">
        {lazyLoad ? (
          <ObservedBadge
            config={config}
            size={size}
            optimizeForMobile={true}
            rootMargin="50px"
          />
        ) : (
          <div
            className="badge-icon"
            style={{
              width: size,
              height: size,
            }}
          >
            <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
        )}
      </div>
      {!showTierOnly && (
        <p className={`text-xs font-medium text-center ${tierStyles.text} capitalize`}>
          {tierName}
        </p>
      )}
    </div>
  );
};
