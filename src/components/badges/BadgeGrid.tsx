/**
 * Badge Grid Component
 * Displays badges in a responsive grid with lazy loading
 * Optimized for mobile performance using Intersection Observer
 */

import React, { useState, useEffect, useRef } from 'react';
import { BadgeConfig } from '../../types/badge.types';
import { BadgeCard, CompactBadgeCard } from './BadgeCard';
import { BadgeGridPlaceholder } from './BadgePlaceholder';

export interface BadgeGridProps {
  badges: BadgeConfig[];
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  badgeSize?: number;
  compact?: boolean;
  showMetadata?: boolean;
  onBadgeClick?: (badge: BadgeConfig) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Badge Grid Component
 * Renders badges in a responsive grid with lazy loading
 */
export const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  badgeSize = 256,
  compact = false,
  showMetadata = true,
  onBadgeClick,
  loading = false,
  emptyMessage = 'No badges to display',
  className = '',
}) => {
  const [visibleBadges, setVisibleBadges] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const badgeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Set up Intersection Observer for lazy loading
  useEffect(() => {
    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const badgeId = entry.target.getAttribute('data-badge-id');
            if (badgeId) {
              setVisibleBadges((prev) => new Set([...prev, badgeId]));
              // Stop observing once visible
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin: '100px', // Load badges 100px before they enter viewport
        threshold: 0.1,
      }
    );

    // Observe all badge elements
    badgeRefs.current.forEach((element) => {
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
    };
  }, [badges]);

  // Register badge element ref
  const registerBadgeRef = (badgeId: string, element: HTMLDivElement | null) => {
    if (element) {
      badgeRefs.current.set(badgeId, element);
      // Observe immediately if observer is ready
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else {
      badgeRefs.current.delete(badgeId);
    }
  };

  // Generate grid column classes
  const getGridClasses = () => {
    const classes = ['grid', 'gap-6'];
    
    if (columns.mobile) {
      classes.push(`grid-cols-${columns.mobile}`);
    }
    if (columns.tablet) {
      classes.push(`md:grid-cols-${columns.tablet}`);
    }
    if (columns.desktop) {
      classes.push(`lg:grid-cols-${columns.desktop}`);
    }

    return classes.join(' ');
  };

  // Show loading state
  if (loading) {
    return (
      <BadgeGridPlaceholder
        count={6}
        size={compact ? 120 : badgeSize}
        className={className}
      />
    );
  }

  // Show empty state
  if (badges.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg
            className="w-24 h-24 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p className="text-gray-600 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Render badge grid
  return (
    <div className={`badge-grid ${getGridClasses()} ${className}`}>
      {badges.map((badge) => {
        const isVisible = visibleBadges.has(badge.id);
        const BadgeComponent = compact ? CompactBadgeCard : BadgeCard;

        return (
          <div
            key={badge.id}
            ref={(el) => registerBadgeRef(badge.id, el)}
            data-badge-id={badge.id}
            className="badge-grid-item"
          >
            {isVisible ? (
              <BadgeComponent
                config={badge}
                size={compact ? 120 : badgeSize}
                showMetadata={showMetadata}
                onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
                lazyLoad={true}
              />
            ) : (
              // Placeholder while waiting to load
              <div
                className="badge-placeholder bg-gray-100 rounded-xl animate-pulse"
                style={{
                  height: compact ? 180 : 360,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Infinite Scroll Badge Grid
 * Loads more badges as user scrolls
 */
export interface InfiniteScrollBadgeGridProps extends Omit<BadgeGridProps, 'badges'> {
  badges: BadgeConfig[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

export const InfiniteScrollBadgeGrid: React.FC<InfiniteScrollBadgeGridProps> = ({
  badges,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  ...gridProps
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Set up observer for infinite scroll
  useEffect(() => {
    if (!hasMore || !onLoadMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: '200px',
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, onLoadMore, loadingMore]);

  return (
    <div>
      <BadgeGrid badges={badges} {...gridProps} />
      
      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 text-center">
          {loadingMore ? (
            <div className="flex justify-center items-center space-x-2">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Loading more badges...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Filterable Badge Grid
 * Grid with built-in filtering capabilities
 */
export interface BadgeFilters {
  tiers?: string[];
  achievements?: string[];
  forests?: string[];
}

export interface FilterableBadgeGridProps extends BadgeGridProps {
  filters?: BadgeFilters;
}

export const FilterableBadgeGrid: React.FC<FilterableBadgeGridProps> = ({
  badges,
  filters,
  ...gridProps
}) => {
  const [filteredBadges, setFilteredBadges] = useState(badges);

  useEffect(() => {
    if (!filters) {
      setFilteredBadges(badges);
      return;
    }

    const filtered = badges.filter((badge) => {
      if (filters.tiers && filters.tiers.length > 0) {
        if (!filters.tiers.includes(badge.tier)) return false;
      }
      if (filters.achievements && filters.achievements.length > 0) {
        if (!filters.achievements.includes(badge.achievement)) return false;
      }
      if (filters.forests && filters.forests.length > 0) {
        if (!filters.forests.includes(badge.forest)) return false;
      }
      return true;
    });

    setFilteredBadges(filtered);
  }, [badges, filters]);

  return <BadgeGrid badges={filteredBadges} {...gridProps} />;
};
