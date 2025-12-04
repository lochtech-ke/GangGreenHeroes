import { useRef } from 'react';
import type { ContributorTickerProps } from '../../types/splash.types';

/**
 * ContributorTicker Component
 * 
 * Displays a horizontally scrolling ticker of GitHub contributor names
 * for the v1.0 "Vivian" splash screen.
 * 
 * Features:
 * - Infinite horizontal scrolling animation
 * - Seamless loop behavior
 * - Pause-on-hover for accessibility
 * - Formats names with "@" prefix
 * - Handles empty contributor list gracefully
 * - Respects prefers-reduced-motion
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
const ContributorTicker = ({
  contributors,
  className = '',
  ariaLabelledBy
}: ContributorTickerProps) => {
  const tickerRef = useRef<HTMLDivElement>(null);

  // Handle empty contributor list
  if (!contributors || contributors.length === 0) {
    return (
      <div 
        className={`text-center text-white/60 text-sm ${className}`}
        role="status"
        aria-label="No contributors to display"
      >
        <p>Loading contributors...</p>
      </div>
    );
  }

  // Format contributor names with @ prefix
  const formattedContributors = contributors.map(name => `@${name}`);
  
  // Duplicate the list for seamless looping
  const displayList = [...formattedContributors, ...formattedContributors];

  // Calculate animation duration based on scroll speed
  // Duration = (total width / scroll speed)
  // We'll use a base duration and adjust with CSS
  const animationDuration = Math.max(20, contributors.length * 2);

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      role="region"
      aria-label="GitHub contributors"
      aria-labelledby={ariaLabelledBy}
      aria-live="off"
    >
      {/* Gradient fade on edges for smooth appearance */}
      <div className="ticker-gradient-left" />
      <div className="ticker-gradient-right" />
      
      {/* Scrolling ticker container */}
      <div 
        ref={tickerRef}
        className="flex gap-6 md:gap-8 ticker-scroll gpu-accelerated"
        style={{
          animationDuration: `${animationDuration}s`
        }}
      >
        {displayList.map((contributor, index) => (
          <span
            key={`${contributor}-${index}`}
            className="text-white splash-ticker-text font-medium whitespace-nowrap flex-shrink-0"
          >
            {contributor}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ContributorTicker;
