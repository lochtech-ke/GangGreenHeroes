/**
 * BadgeFallback Component
 * Displays a styled fallback badge when SVG generation fails
 * Maintains tier-specific styling and proper aspect ratio
 */

import React from 'react';
import { Award, Sparkles } from 'lucide-react';
import type { BadgeTier } from '../../types/badge.types';

interface BadgeFallbackProps {
  tier: BadgeTier;
  badgeName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Tier-specific configuration matching the SVG badge system
const tierConfig: Record<BadgeTier, {
  gradient: string;
  glow: string;
  border: string;
  bg: string;
  primaryColor: string;
  secondaryColor: string;
  displayName: string;
}> = {
  hummingbird: {
    gradient: 'from-teal-400 to-teal-600',
    glow: 'shadow-teal-400/50',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
    primaryColor: '#14B8A6',
    secondaryColor: '#0D9488',
    displayName: 'Hummingbird',
  },
  bronze: {
    gradient: 'from-orange-700 to-orange-900',
    glow: 'shadow-orange-700/50',
    border: 'border-orange-700/30',
    bg: 'bg-orange-700/10',
    primaryColor: '#CD7F32',
    secondaryColor: '#8B4513',
    displayName: 'Bronze',
  },
  silver: {
    gradient: 'from-gray-300 to-gray-500',
    glow: 'shadow-gray-400/50',
    border: 'border-gray-400/30',
    bg: 'bg-gray-400/10',
    primaryColor: '#C0C0C0',
    secondaryColor: '#808080',
    displayName: 'Silver',
  },
  gold: {
    gradient: 'from-yellow-400 to-yellow-600',
    glow: 'shadow-yellow-400/50',
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-400/10',
    primaryColor: '#FFD700',
    secondaryColor: '#FFA500',
    displayName: 'Gold',
  },
  platinum: {
    gradient: 'from-slate-200 to-slate-400',
    glow: 'shadow-slate-300/50',
    border: 'border-slate-300/30',
    bg: 'bg-slate-300/10',
    primaryColor: '#E5E4E2',
    secondaryColor: '#B0B0B0',
    displayName: 'Platinum',
  },
  diamond: {
    gradient: 'from-cyan-300 to-cyan-500',
    glow: 'shadow-cyan-400/50',
    border: 'border-cyan-400/30',
    bg: 'bg-cyan-400/10',
    primaryColor: '#B9F2FF',
    secondaryColor: '#00CED1',
    displayName: 'Diamond',
  },
  hero: {
    gradient: 'from-yellow-300 to-orange-500',
    glow: 'shadow-yellow-400/50',
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-400/10',
    primaryColor: '#FFD700',
    secondaryColor: '#FF8C00',
    displayName: 'Hero',
  },
};

// Size configuration
const sizeConfig = {
  sm: {
    container: 'aspect-square w-32',
    icon: 48,
    text: 'text-xs',
    tierText: 'text-[10px]',
  },
  md: {
    container: 'aspect-square w-48',
    icon: 64,
    text: 'text-sm',
    tierText: 'text-xs',
  },
  lg: {
    container: 'aspect-square w-64',
    icon: 80,
    text: 'text-base',
    tierText: 'text-sm',
  },
};

/**
 * BadgeFallback Component
 * Renders a styled fallback badge with tier-specific colors and styling
 */
export const BadgeFallback: React.FC<BadgeFallbackProps> = ({
  tier,
  badgeName,
  className = '',
  size = 'md',
}) => {
  const config = tierConfig[tier];
  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={`
        ${sizeStyles.container}
        relative flex items-center justify-center
        aspect-square
        ${className}
      `}
      role="img"
      aria-label={`${config.displayName} tier badge${badgeName ? `: ${badgeName}` : ''}`}
    >
      {/* SVG Fallback Badge */}
      <svg
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        <defs>
          {/* Tier-specific gradient */}
          <linearGradient
            id={`fallback-gradient-${tier}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" style={{ stopColor: config.primaryColor, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: config.secondaryColor, stopOpacity: 1 }} />
          </linearGradient>

          {/* Shadow filter */}
          <filter id={`fallback-shadow-${tier}`}>
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3" />
          </filter>

          {/* Glow filter for premium tiers */}
          {(tier === 'platinum' || tier === 'diamond' || tier === 'hero') && (
            <filter id={`fallback-glow-${tier}`}>
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Background Circle */}
        <circle
          cx="200"
          cy="200"
          r="180"
          fill={`url(#fallback-gradient-${tier})`}
          filter={`url(#fallback-shadow-${tier})`}
        />

        {/* Inner Circle */}
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          stroke="white"
          strokeWidth="3"
          opacity="0.3"
        />

        {/* Award Icon */}
        <g transform="translate(200, 180)">
          <path
            d="M0,-60 L15,-30 L45,-35 L25,-10 L30,20 L0,0 L-30,20 L-25,-10 L-45,-35 L-15,-30 Z"
            fill="white"
            opacity="0.9"
            filter={
              tier === 'platinum' || tier === 'diamond' || tier === 'hero'
                ? `url(#fallback-glow-${tier})`
                : undefined
            }
          />
          {/* Star points for premium tiers */}
          {(tier === 'diamond' || tier === 'hero') && (
            <>
              <circle cx="0" cy="-60" r="6" fill="white" opacity="0.95" />
              <circle cx="45" cy="-35" r="4" fill="white" opacity="0.95" />
              <circle cx="-45" cy="-35" r="4" fill="white" opacity="0.95" />
            </>
          )}
        </g>

        {/* Tier Text */}
        <text
          x="200"
          y="280"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="28"
          fontWeight="bold"
          fill="white"
          opacity="0.95"
        >
          {config.displayName}
        </text>

        {/* Badge Name (if provided) */}
        {badgeName && (
          <text
            x="200"
            y="320"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="16"
            fill="white"
            opacity="0.8"
          >
            {badgeName.length > 20 ? `${badgeName.substring(0, 20)}...` : badgeName}
          </text>
        )}

        {/* Decorative elements for premium tiers */}
        {tier === 'diamond' && (
          <g opacity="0.6">
            <circle cx="80" cy="80" r="3" fill="white" />
            <circle cx="320" cy="100" r="2" fill="white" />
            <circle cx="300" cy="300" r="3" fill="white" />
            <circle cx="100" cy="320" r="2" fill="white" />
          </g>
        )}
      </svg>

      {/* Tier Badge Overlay */}
      <div
        className={`
          absolute top-2 right-2
          glass ${config.bg}
          px-2 py-1 rounded-full
          flex items-center gap-1
          backdrop-blur-sm
        `}
      >
        <Sparkles size={10} className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`} />
        <span className={`${sizeStyles.tierText} font-bold uppercase bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
          {config.displayName}
        </span>
      </div>
    </div>
  );
};

/**
 * BadgeLoadingSpinner Component
 * Glass-styled loading spinner for badge generation
 */
export const BadgeLoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={`
        ${sizeStyles.container}
        flex items-center justify-center
        aspect-square
        ${className}
      `}
      role="status"
      aria-label="Loading badge"
    >
      {/* Glass container */}
      <div className="relative aspect-square w-full flex items-center justify-center glass rounded-2xl backdrop-blur-md">
        {/* Spinning ring */}
        <div
          className={`
            animate-spin rounded-full
            border-4 border-green-200
            border-t-green-600
            aspect-square
            ${size === 'sm' ? 'w-12' : size === 'md' ? 'w-16' : 'w-20'}
          `}
        />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Award
            size={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
            className="text-green-600 opacity-50"
          />
        </div>
      </div>
    </div>
  );
};

export default BadgeFallback;
