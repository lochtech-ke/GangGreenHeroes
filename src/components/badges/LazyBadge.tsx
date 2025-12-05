/**
 * Lazy Badge Component
 * Renders badges with lazy loading support
 * Uses Intersection Observer to load badges as they enter viewport
 */

import React, { useRef, useEffect, useState } from 'react';
import { BadgeConfig } from '../../types/badge.types';
import { getBadgeRenderer } from '../../services/badgeRenderer.service';
import { BadgePlaceholder } from './BadgePlaceholder';

export interface LazyBadgeProps {
  config: BadgeConfig;
  size?: number;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  shouldLoad?: boolean; // External control for loading
  optimizeForMobile?: boolean;
}

/**
 * Lazy Badge Component
 * Renders a badge with lazy loading and placeholder
 */
export const LazyBadge: React.FC<LazyBadgeProps> = ({
  config,
  size = 256,
  className = '',
  onLoad,
  onError,
  shouldLoad = true,
  optimizeForMobile = false,
}) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Load badge when shouldLoad becomes true
  useEffect(() => {
    if (!shouldLoad || svg || loading) return;

    const loadBadge = async () => {
      setLoading(true);
      setError(null);

      try {
        const renderer = getBadgeRenderer();
        const renderedSvg = await renderer.renderBadge(config, {
          size,
          optimizeForMobile,
        });

        setSvg(renderedSvg);
        onLoad?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load badge');
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    loadBadge();
  }, [shouldLoad, config, size, optimizeForMobile, svg, loading, onLoad, onError]);

  // Show placeholder while loading
  if (!svg && !error) {
    return (
      <div
        ref={elementRef}
        data-badge-id={config.id}
        className={className}
      >
        <BadgePlaceholder size={size} />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        ref={elementRef}
        data-badge-id={config.id}
        className={`badge-error aspect-square ${className}`}
        style={{
          width: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fee',
          borderRadius: '8px',
          color: '#c00',
          fontSize: '14px',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        Failed to load badge
      </div>
    );
  }

  // Render badge
  return (
    <div
      ref={elementRef}
      data-badge-id={config.id}
      className={`lazy-badge aspect-square ${className}`}
      dangerouslySetInnerHTML={{ __html: svg || '' }}
      style={{
        width: size,
      }}
    />
  );
};

/**
 * Badge with Intersection Observer
 * Automatically loads when entering viewport
 */
export interface ObservedBadgeProps extends Omit<LazyBadgeProps, 'shouldLoad'> {
  rootMargin?: string;
  threshold?: number;
}

export const ObservedBadge: React.FC<ObservedBadgeProps> = ({
  rootMargin = '50px',
  threshold = 0.1,
  ...props
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={elementRef}>
      <LazyBadge {...props} shouldLoad={shouldLoad} />
    </div>
  );
};
