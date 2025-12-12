import React from 'react';
import { motion } from 'framer-motion';

interface GeometricHummingbirdBadgeProps {
  tier: 'hummingbird' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'hero';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const tierColors = {
  hummingbird: {
    primary: '#20B2AA', // Bright teal like the reference
    secondary: '#48D1CC', // Medium turquoise
    accent: '#00CED1', // Dark turquoise
    throat: '#FF6347', // Tomato red for the throat
    beak: '#4169E1', // Royal blue for the beak
  },
  bronze: {
    primary: '#CD7F32',
    secondary: '#8B4513',
    accent: '#DEB887',
    throat: '#D2691E',
    beak: '#654321',
  },
  silver: {
    primary: '#C0C0C0',
    secondary: '#808080',
    accent: '#E5E5E5',
    throat: '#B0B0B0',
    beak: '#696969',
  },
  gold: {
    primary: '#FFD700',
    secondary: '#FFA500',
    accent: '#FFFF99',
    throat: '#FF8C00',
    beak: '#B8860B',
  },
  platinum: {
    primary: '#E5E4E2',
    secondary: '#B0B0B0',
    accent: '#F5F5F5',
    throat: '#D3D3D3',
    beak: '#A9A9A9',
  },
  diamond: {
    primary: '#B9F2FF',
    secondary: '#00CED1',
    accent: '#E0FFFF',
    throat: '#40E0D0',
    beak: '#008B8B',
  },
  hero: {
    primary: '#FFD700',
    secondary: '#FF8C00',
    accent: '#FFFF99',
    throat: '#FF6347',
    beak: '#B8860B',
  },
};

const sizeConfig = {
  sm: { width: 120, height: 120, scale: 0.6 },
  md: { width: 192, height: 192, scale: 1 },
  lg: { width: 256, height: 256, scale: 1.3 },
};

export const GeometricHummingbirdBadge: React.FC<GeometricHummingbirdBadgeProps> = ({
  tier,
  size = 'md',
  animated = true,
  className = '',
}) => {
  const colors = tierColors[tier];
  const { width, height, scale } = sizeConfig[size];

  return (
    <motion.div
      className={`inline-block ${className}`}
      style={{ width, height }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        duration: 0.8, 
        type: 'spring', 
        stiffness: 100,
        delay: 0.2 
      }}
      whileHover={animated ? { 
        scale: scale * 1.05, 
        rotate: 5,
        transition: { duration: 0.3 }
      } : undefined}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 400 400"
        className="drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
      >
        <defs>
          {/* Gradients for the hummingbird */}
          <linearGradient id={`bodyGradient-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.primary} />
          </linearGradient>
          
          <linearGradient id={`wingGradient-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.secondary} />
            <stop offset="30%" stopColor={colors.primary} />
            <stop offset="70%" stopColor={colors.accent} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          
          <linearGradient id={`throatGradient-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.throat} />
            <stop offset="100%" stopColor={colors.primary} />
          </linearGradient>

          {/* Glow filter for premium tiers */}
          {(tier === 'diamond' || tier === 'hero' || tier === 'platinum') && (
            <filter id={`glow-${tier}`}>
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Background circle */}
        <circle
          cx="200"
          cy="200"
          r="190"
          fill="rgba(255,255,255,0.1)"
          stroke={colors.accent}
          strokeWidth="2"
          opacity="0.3"
        />

        {/* Hummingbird Body - Geometric style */}
        <g transform="translate(200, 200)">
          {/* Main body - elongated diamond shape */}
          <path
            d="M 0,-60 L 15,-45 L 12,45 L 0,65 L -12,45 L -15,-45 Z"
            fill={`url(#bodyGradient-${tier})`}
            filter={tier === 'diamond' || tier === 'hero' ? `url(#glow-${tier})` : undefined}
          />
          
          {/* Head - geometric diamond */}
          <path
            d="M 0,-75 L 12,-60 L 8,-45 L -8,-45 L -12,-60 Z"
            fill={`url(#bodyGradient-${tier})`}
          />
          
          {/* Throat patch - geometric triangle */}
          <path
            d="M 0,-45 L 8,-30 L 0,-15 L -8,-30 Z"
            fill={`url(#throatGradient-${tier})`}
          />
          
          {/* Beak - sharp geometric triangle */}
          <path
            d="M 0,-75 L 3,-95 L 0,-100 L -3,-95 Z"
            fill={colors.beak}
          />
          
          {/* Left Wing - Geometric faceted design */}
          <g>
            <motion.path
              d="M -15,-30 L -45,-50 L -65,-35 L -70,-10 L -60,15 L -40,25 L -20,20 L -15,0 Z"
              fill={`url(#wingGradient-${tier})`}
              opacity="0.9"
              animate={animated ? {
                d: [
                  "M -15,-30 L -45,-50 L -65,-35 L -70,-10 L -60,15 L -40,25 L -20,20 L -15,0 Z",
                  "M -15,-30 L -50,-55 L -70,-40 L -75,-15 L -65,20 L -45,30 L -25,25 L -15,5 Z",
                  "M -15,-30 L -45,-50 L -65,-35 L -70,-10 L -60,15 L -40,25 L -20,20 L -15,0 Z"
                ]
              } : undefined}
              transition={animated ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
            />
            
            {/* Wing details - geometric lines */}
            <path
              d="M -25,-20 L -45,-25 M -30,-10 L -50,-15 M -35,0 L -55,-5 M -30,10 L -50,5"
              stroke={colors.secondary}
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />
          </g>
          
          {/* Right Wing - Geometric faceted design */}
          <g>
            <motion.path
              d="M 15,-30 L 45,-50 L 65,-35 L 70,-10 L 60,15 L 40,25 L 20,20 L 15,0 Z"
              fill={`url(#wingGradient-${tier})`}
              opacity="0.9"
              animate={animated ? {
                d: [
                  "M 15,-30 L 45,-50 L 65,-35 L 70,-10 L 60,15 L 40,25 L 20,20 L 15,0 Z",
                  "M 15,-30 L 50,-55 L 70,-40 L 75,-15 L 65,20 L 45,30 L 25,25 L 15,5 Z",
                  "M 15,-30 L 45,-50 L 65,-35 L 70,-10 L 60,15 L 40,25 L 20,20 L 15,0 Z"
                ]
              } : undefined}
              transition={animated ? { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.1 } : undefined}
            />
            
            {/* Wing details - geometric lines */}
            <path
              d="M 25,-20 L 45,-25 M 30,-10 L 50,-15 M 35,0 L 55,-5 M 30,10 L 50,5"
              stroke={colors.secondary}
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />
          </g>
          
          {/* Tail - Geometric fan shape */}
          <path
            d="M 0,65 L -8,85 L -4,95 L 0,90 L 4,95 L 8,85 Z"
            fill={`url(#bodyGradient-${tier})`}
          />
          
          {/* Eye */}
          <circle
            cx="-3"
            cy="-65"
            r="2"
            fill="white"
          />
          <circle
            cx="-3"
            cy="-65"
            r="1"
            fill="black"
          />
          
          {/* Geometric accent lines on body */}
          <path
            d="M -8,-40 L 8,-40 M -6,-20 L 6,-20 M -8,0 L 8,0 M -6,20 L 6,20 M -8,40 L 8,40"
            stroke={colors.accent}
            strokeWidth="1"
            opacity="0.4"
          />
        </g>

        {/* Sparkle effects for premium tiers */}
        {(tier === 'diamond' || tier === 'hero') && (
          <g opacity="0.8">
            <motion.circle
              cx="120"
              cy="120"
              r="3"
              fill={colors.accent}
              animate={animated ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] } : undefined}
              transition={animated ? { duration: 2, repeat: Infinity, delay: 0 } : undefined}
            />
            <motion.circle
              cx="280"
              cy="140"
              r="2"
              fill={colors.accent}
              animate={animated ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] } : undefined}
              transition={animated ? { duration: 2, repeat: Infinity, delay: 0.7 } : undefined}
            />
            <motion.circle
              cx="300"
              cy="280"
              r="3"
              fill={colors.accent}
              animate={animated ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] } : undefined}
              transition={animated ? { duration: 2, repeat: Infinity, delay: 1.4 } : undefined}
            />
            <motion.circle
              cx="100"
              cy="300"
              r="2"
              fill={colors.accent}
              animate={animated ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] } : undefined}
              transition={animated ? { duration: 2, repeat: Infinity, delay: 2.1 } : undefined}
            />
          </g>
        )}

        {/* Rotating animation for the entire hummingbird */}
        {animated && (
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            values="0 200 200; 2 200 200; 0 200 200; -2 200 200; 0 200 200"
            dur="4s"
            repeatCount="indefinite"
          />
        )}
      </svg>
    </motion.div>
  );
};