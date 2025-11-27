/**
 * Lazy Badge Loading Hook
 * Uses Intersection Observer API to lazy load badges as they enter viewport
 * Optimizes performance for badge grids and collections
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface LazyBadgeOptions {
  rootMargin?: string; // Margin around viewport for preloading
  threshold?: number; // Visibility threshold (0-1)
  enabled?: boolean; // Enable/disable lazy loading
}

const DEFAULT_OPTIONS: Required<LazyBadgeOptions> = {
  rootMargin: '50px',
  threshold: 0.1,
  enabled: true,
};

/**
 * Hook for lazy loading badges
 * Returns visible badge IDs and observer ref to attach to badge elements
 */
export function useLazyBadges(
  badgeIds: string[],
  options: LazyBadgeOptions = {}
): {
  visibleBadges: Set<string>;
  observerRef: React.RefObject<IntersectionObserver | null>;
  registerBadge: (badgeId: string, element: Element | null) => void;
  unregisterBadge: (badgeId: string) => void;
  isVisible: (badgeId: string) => boolean;
} {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const [visibleBadges, setVisibleBadges] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, Element>>(new Map());

  // Initialize Intersection Observer
  useEffect(() => {
    if (!finalOptions.enabled) {
      // If lazy loading is disabled, mark all badges as visible
      setVisibleBadges(new Set(badgeIds));
      return;
    }

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const badgeId = entry.target.getAttribute('data-badge-id');
          if (!badgeId) return;

          if (entry.isIntersecting) {
            // Badge is visible, add to visible set
            setVisibleBadges((prev) => {
              const next = new Set(prev);
              next.add(badgeId);
              return next;
            });
          }
        });
      },
      {
        rootMargin: finalOptions.rootMargin,
        threshold: finalOptions.threshold,
      }
    );

    // Observe all registered elements
    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [badgeIds, finalOptions.enabled, finalOptions.rootMargin, finalOptions.threshold]);

  // Register a badge element for observation
  const registerBadge = useCallback(
    (badgeId: string, element: Element | null) => {
      if (!element || !finalOptions.enabled) return;

      // Store element reference
      elementsRef.current.set(badgeId, element);

      // Observe element
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    },
    [finalOptions.enabled]
  );

  // Unregister a badge element
  const unregisterBadge = useCallback((badgeId: string) => {
    const element = elementsRef.current.get(badgeId);
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
    }
    elementsRef.current.delete(badgeId);
  }, []);

  // Check if a badge is visible
  const isVisible = useCallback(
    (badgeId: string) => {
      if (!finalOptions.enabled) return true;
      return visibleBadges.has(badgeId);
    },
    [visibleBadges, finalOptions.enabled]
  );

  return {
    visibleBadges,
    observerRef,
    registerBadge,
    unregisterBadge,
    isVisible,
  };
}

/**
 * Hook for preloading critical badges
 * Preloads the first N badges immediately for better perceived performance
 */
export function usePreloadBadges(
  badgeIds: string[],
  preloadCount: number = 3
): {
  preloadedBadges: Set<string>;
  shouldPreload: (badgeId: string) => boolean;
} {
  const [preloadedBadges] = useState<Set<string>>(() => {
    return new Set(badgeIds.slice(0, preloadCount));
  });

  const shouldPreload = useCallback(
    (badgeId: string) => {
      return preloadedBadges.has(badgeId);
    },
    [preloadedBadges]
  );

  return {
    preloadedBadges,
    shouldPreload,
  };
}

/**
 * Combined hook for lazy loading with preloading
 * Provides optimal loading strategy for badge grids
 */
export function useBadgeLoading(
  badgeIds: string[],
  options: LazyBadgeOptions & { preloadCount?: number } = {}
): {
  shouldLoad: (badgeId: string) => boolean;
  registerBadge: (badgeId: string, element: Element | null) => void;
  unregisterBadge: (badgeId: string) => void;
  loadedCount: number;
} {
  const { preloadCount = 3, ...lazyOptions } = options;

  const { visibleBadges, registerBadge, unregisterBadge, isVisible } =
    useLazyBadges(badgeIds, lazyOptions);

  const { shouldPreload } = usePreloadBadges(badgeIds, preloadCount);

  const shouldLoad = useCallback(
    (badgeId: string) => {
      return shouldPreload(badgeId) || isVisible(badgeId);
    },
    [shouldPreload, isVisible]
  );

  const loadedCount = visibleBadges.size + preloadCount;

  return {
    shouldLoad,
    registerBadge,
    unregisterBadge,
    loadedCount,
  };
}
