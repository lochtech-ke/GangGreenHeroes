import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { BadgeCard } from './BadgeCard';
import { BadgePlaceholder } from './BadgePlaceholder';
import { mapBadgeToBadgeConfig } from '../../utils/badgeMapping';
import { getBadgeRenderer } from '../../services/badgeRenderer.service';
import type { Badge } from '../../types/badgeProgression.types';

interface CurrentBadgeDisplayProps {
  badge: Badge;
  className?: string;
}

/**
 * Displays the user's current badge with animation
 * Supports both regular badges and hummingbird welcome badges
 * Now uses the geometric badge rendering system via BadgeCard
 */
export const CurrentBadgeDisplay: React.FC<CurrentBadgeDisplayProps> = ({
  badge,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Map the badge to BadgeConfig for geometric rendering
  // Use useMemo to cache the mapped config and prevent unnecessary recalculations
  const badgeConfig = useMemo(() => mapBadgeToBadgeConfig(badge), [badge]);
  const isHummingbird = badge.tier === 'hummingbird';

  // Preload current badge for immediate display
  useEffect(() => {
    const preloadCurrentBadge = async () => {
      const startTime = performance.now();
      const renderer = getBadgeRenderer();
      
      try {
        // Preload the badge to ensure it's cached
        await renderer.renderBadge(badgeConfig, {
          size: 256,
          optimizeForMobile: false,
        });
        
        const duration = performance.now() - startTime;
        console.log(`[CurrentBadgeDisplay] Preloaded current badge in ${duration.toFixed(2)}ms`);
      } catch (error) {
        console.error('[CurrentBadgeDisplay] Failed to preload badge:', error);
      }
    };

    preloadCurrentBadge();
  }, [badgeConfig]);

  // Handle badge loading error
  const handleError = (error: Error) => {
    console.error('Failed to load current badge:', error);
    setHasError(true);
    setIsLoading(false);
  };

  // Handle badge load success
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Show error state if badge failed to load
  if (hasError) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex flex-col items-center ${className}`}
      >
        <div className="relative mb-4">
          <div className="aspect-square w-64 rounded-xl bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <p className="text-red-700 font-semibold mb-2">Failed to Load Badge</p>
            <p className="text-sm text-red-600">
              We couldn't display your {badge.name} badge. Please try refreshing the page.
            </p>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{badge.name}</h3>
          <p className="text-sm text-gray-600 max-w-xs">{badge.description}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center ${className}`}
    >
      {/* Badge Display with Geometric Design */}
      <div className="relative mb-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <BadgePlaceholder size={256} animated={true} />
          </div>
        )}
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: isHummingbird ? 1.5 : 2,
            repeat: Infinity,
            repeatDelay: isHummingbird ? 2 : 3,
          }}
          className="relative"
          style={{ opacity: isLoading ? 0 : 1 }}
        >
          {/* BadgeCard with geometric rendering */}
          <BadgeCard
            config={badgeConfig}
            size={256}
            showMetadata={false}
            lazyLoad={true}
            className="shadow-lg"
            onLoad={handleLoad}
            onError={handleError}
          />
          
          {/* Enhanced Sparkle Effect */}
          <motion.div
            animate={{
              scale: isHummingbird ? [1, 1.3, 1] : [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
              rotate: isHummingbird ? [0, 360] : [0, 0],
            }}
            transition={{
              duration: isHummingbird ? 3 : 2,
              repeat: Infinity,
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className={`${isHummingbird ? 'w-10 h-10 text-teal-400' : 'w-8 h-8 text-yellow-400'}`} />
          </motion.div>

          {/* Special Welcome Badge Indicator */}
          {isHummingbird && (
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.5,
              }}
              className="absolute -bottom-2 -left-2"
            >
              <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                Welcome!
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{badge.name}</h3>
        <p className="text-sm text-gray-600 max-w-xs">{badge.description}</p>
        
        {/* Special message for hummingbird badge */}
        {isHummingbird && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-teal-600 mt-2 font-medium"
          >
            🐦 Your journey begins here!
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};
