/**
 * Badge Placeholder Component
 * Displays a loading placeholder for badges that haven't loaded yet
 * Used in lazy loading scenarios
 */

import React from 'react';

export interface BadgePlaceholderProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * Badge Placeholder Component
 * Shows a skeleton loader while badge is loading
 */
export const BadgePlaceholder: React.FC<BadgePlaceholderProps> = ({
  size = 256,
  className = '',
  animated = true,
}) => {
  return (
    <div
      className={`badge-placeholder ${className} ${animated ? 'animate-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: animated ? 'shimmer 1.5s infinite' : 'none',
      }}
      role="img"
      aria-label="Loading badge"
    >
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}
      </style>
    </div>
  );
};

/**
 * Badge Grid Placeholder
 * Shows multiple badge placeholders in a grid layout
 */
export interface BadgeGridPlaceholderProps {
  count?: number;
  size?: number;
  className?: string;
}

export const BadgeGridPlaceholder: React.FC<BadgeGridPlaceholderProps> = ({
  count = 6,
  size = 256,
  className = '',
}) => {
  return (
    <div className={`badge-grid-placeholder grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <BadgePlaceholder key={index} size={size} />
      ))}
    </div>
  );
};
