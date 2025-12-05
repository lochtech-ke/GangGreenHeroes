import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronDown, AlertCircle } from 'lucide-react';
import type { Badge } from '../../types/badgeProgression.types';
import { CompactBadgeCard } from './BadgeCard';
import { BadgePlaceholder } from './BadgePlaceholder';
import { mapBadgeToBadgeConfig } from '../../utils/badgeMapping';
import { getBadgeRenderer } from '../../services/badgeRenderer.service';

interface BadgeTimelineProps {
  allBadges: Badge[];
  currentBadge: Badge;
  className?: string;
}

/**
 * Displays a timeline of all badge tiers showing progression
 * Enhanced with tier names, icons, requirements, and hover states
 */
export const BadgeTimeline: React.FC<BadgeTimelineProps> = ({
  allBadges,
  currentBadge,
  className = '',
}) => {
  const [expandedBadgeId, setExpandedBadgeId] = useState<string | null>(null);
  const [badgeErrors, setBadgeErrors] = useState<Set<string>>(new Set());
  const [loadingBadges, setLoadingBadges] = useState<Set<string>>(new Set(allBadges.map(b => b.id)));
  const sortedBadges = [...allBadges].sort((a, b) => a.tier_order - b.tier_order);

  // Preload all badges in parallel for optimal performance
  useEffect(() => {
    const preloadBadges = async () => {
      const startTime = performance.now();
      const renderer = getBadgeRenderer();
      
      // Map all badges to configs
      const badgeConfigs = sortedBadges.map(badge => mapBadgeToBadgeConfig(badge));
      
      // Render all badges in parallel using Promise.all
      try {
        await Promise.all(
          badgeConfigs.map(config => 
            renderer.renderBadge(config, {
              size: 48,
              optimizeForMobile: false,
            })
          )
        );
        
        const duration = performance.now() - startTime;
        console.log(`[BadgeTimeline] Preloaded ${sortedBadges.length} badges in ${duration.toFixed(2)}ms (${(duration / sortedBadges.length).toFixed(2)}ms per badge)`);
      } catch (error) {
        console.error('[BadgeTimeline] Failed to preload badges:', error);
      }
    };

    if (sortedBadges.length > 0) {
      preloadBadges();
    }
  }, [sortedBadges]);

  // Handle badge loading error
  const handleBadgeError = (badgeId: string) => (error: Error) => {
    console.error(`Failed to load badge ${badgeId}:`, error);
    setBadgeErrors(prev => new Set(prev).add(badgeId));
    setLoadingBadges(prev => {
      const next = new Set(prev);
      next.delete(badgeId);
      return next;
    });
  };

  // Handle badge load success
  const handleBadgeLoad = (badgeId: string) => () => {
    setLoadingBadges(prev => {
      const next = new Set(prev);
      next.delete(badgeId);
      return next;
    });
  };

  const toggleExpanded = (badgeId: string) => {
    setExpandedBadgeId(expandedBadgeId === badgeId ? null : badgeId);
  };

  return (
    <div className={`${className}`}>
      <h4 className="text-lg font-semibold text-gray-900 mb-6">Badge Journey</h4>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Progress Line */}
        <motion.div
          initial={{ height: 0 }}
          animate={{
            height: `${(currentBadge.tier_order / sortedBadges.length) * 100}%`,
          }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-green-500 to-green-600"
        />

        {/* Badge Items */}
        <div className="space-y-6">
          {sortedBadges.map((badge, index) => {
            const isEarned = badge.tier_order <= currentBadge.tier_order;
            const isCurrent = badge.id === currentBadge.id;
            const isLocked = !isEarned;
            const isExpanded = expandedBadgeId === badge.id;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative flex items-start gap-4 transition-all ${
                  isLocked ? 'opacity-60' : 'opacity-100'
                }`}
              >
                {/* Badge Icon */}
                <div className="relative z-10 flex-shrink-0">
                  {badgeErrors.has(badge.id) ? (
                    <div className="aspect-square w-12 rounded-lg bg-red-50 border-2 border-red-200 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                  ) : loadingBadges.has(badge.id) ? (
                    <BadgePlaceholder size={48} animated={true} />
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="cursor-pointer"
                      onClick={() => toggleExpanded(badge.id)}
                    >
                      <CompactBadgeCard
                        config={mapBadgeToBadgeConfig(badge)}
                        size={48}
                        showTierOnly={true}
                        lazyLoad={false}
                        className={`transition-all ${isLocked ? 'opacity-60' : 'opacity-100'}`}
                        onLoad={handleBadgeLoad(badge.id)}
                        onError={handleBadgeError(badge.id)}
                      />
                    </motion.div>
                  )}
                  
                  {/* Lock Icon for Locked Badges */}
                  {isLocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center shadow-sm"
                    >
                      <Lock className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  
                  {/* Current Badge Indicator */}
                  {isCurrent && (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 rounded-lg border-2 border-green-500"
                    />
                  )}
                </div>

                {/* Badge Info */}
                <div className="flex-1 pt-1">
                  <div 
                    className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => toggleExpanded(badge.id)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h5
                          className={`font-semibold ${
                            isEarned ? 'text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          {badge.name}
                        </h5>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            Current
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    </div>
                    <p className={`text-sm ${isEarned ? 'text-gray-600' : 'text-gray-400'}`}>
                      {badge.description}
                    </p>
                  </div>
                  
                  {/* Requirements Summary (Always Visible) */}
                  {badge.requirements.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {badge.requirements.map((req, reqIndex) => (
                        <span
                          key={reqIndex}
                          className={`text-xs px-2 py-1 rounded ${
                            isEarned
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {req.count} {req.type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Detailed Requirements (Expandable) */}
                  <AnimatePresence>
                    {isExpanded && badge.requirements.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h6 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Detailed Requirements
                          </h6>
                          <ul className="space-y-2">
                            {badge.requirements.map((req, reqIndex) => (
                              <li
                                key={reqIndex}
                                className="flex items-start gap-2 text-sm"
                              >
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                                  isEarned ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                                <div className="flex-1">
                                  <p className={`${isEarned ? 'text-gray-700' : 'text-gray-500'}`}>
                                    {req.description}
                                  </p>
                                  <p className={`text-xs mt-0.5 ${
                                    isEarned ? 'text-gray-500' : 'text-gray-400'
                                  }`}>
                                    Target: {req.count} {req.type.replace('_', ' ')}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                          
                          {/* Tier Order Info */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              <span className="font-semibold">Tier Level:</span> {badge.tier_order} of {sortedBadges.length}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
