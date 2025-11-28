import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import type { Badge } from '../../types/badgeProgression.types';
import { BadgeCard } from './BadgeCard';
import { BadgePlaceholder } from './BadgePlaceholder';
import { mapBadgeToBadgeConfig } from '../../utils/badgeMapping';
import { getBadgeRenderer } from '../../services/badgeRenderer.service';

interface NextBadgePreviewProps {
  badge: Badge;
  progressPercentage: number;
  className?: string;
}

/**
 * Displays a preview of the next badge to earn
 */
export const NextBadgePreview: React.FC<NextBadgePreviewProps> = ({
  badge,
  progressPercentage,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cache mapped badge config to prevent unnecessary recalculations
  const badgeConfig = useMemo(() => mapBadgeToBadgeConfig(badge), [badge]);

  // Preload next badge for smooth display
  useEffect(() => {
    const preloadNextBadge = async () => {
      const startTime = performance.now();
      const renderer = getBadgeRenderer();
      
      try {
        // Preload the badge to ensure it's cached
        await renderer.renderBadge(badgeConfig, {
          size: 160,
          optimizeForMobile: false,
        });
        
        const duration = performance.now() - startTime;
        console.log(`[NextBadgePreview] Preloaded next badge in ${duration.toFixed(2)}ms`);
      } catch (error) {
        console.error('[NextBadgePreview] Failed to preload badge:', error);
      }
    };

    preloadNextBadge();
  }, [badgeConfig]);

  // Handle badge loading error
  const handleError = (error: Error) => {
    console.error('Failed to load next badge preview:', error);
    setHasError(true);
    setIsLoading(false);
  };

  // Handle badge load success
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`glass rounded-xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ArrowRight className="w-5 h-5 text-green-600" />
        <h4 className="text-lg font-semibold text-gray-900">Next Badge</h4>
      </div>

      {/* Badge Preview */}
      <div className="flex items-center gap-4">
        {/* Badge with Locked Overlay or Error State */}
        <div className="relative flex-shrink-0">
          {hasError ? (
            <div className="w-40 h-40 rounded-xl bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-xs text-red-600">Failed to load badge preview</p>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BadgePlaceholder size={160} animated={true} />
                </div>
              )}
              <div style={{ opacity: isLoading ? 0 : 1 }}>
                <BadgeCard
                  config={badgeConfig}
                  size={160}
                  showMetadata={false}
                  lazyLoad={true}
                  className="!p-4"
                  onLoad={handleLoad}
                  onError={handleError}
                />
              </div>
              {/* Lock overlay */}
              {!isLoading && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 rounded-xl backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center shadow-lg">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Badge Info */}
        <div className="flex-1">
          <h5 className="text-lg font-bold text-gray-900 mb-1">{badge.name}</h5>
          <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="h-full bg-gradient-to-r from-green-500 to-green-600"
              />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {progressPercentage}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
