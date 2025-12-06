/**
 * Geometric Badge Generator
 * Creates low-poly, geometric art style badges inspired by nature
 * Enhanced with tier styling, mobile optimization, and export capabilities
 */

import { AchievementType, BadgeTier, BadgeMetadata } from '../types/badge.types';

export interface GeometricConfig {
  primaryColors: string[];
  accentColors: string[];
  complexity: 'simple' | 'medium' | 'complex';
  style: 'angular' | 'organic' | 'mixed';
}

export interface Polygon {
  points: string;
  fill: string;
  opacity?: number;
}

export interface TierStyle {
  background: string;
  border: string;
  borderWidth: number;
  glowColor: string;
  glowIntensity: number;
  name: string;
}

/**
 * Achievement-specific geometric configurations
 */
export const GEOMETRIC_CONFIGS: Record<AchievementType, GeometricConfig> = {
  tree_planter: {
    primaryColors: ['#2E8B57', '#3CB371', '#90EE90', '#228B22'],
    accentColors: ['#8B4513', '#A0522D', '#CD853F'],
    complexity: 'medium',
    style: 'organic',
  },
  carbon_warrior: {
    primaryColors: ['#4169E1', '#1E90FF', '#87CEEB', '#00BFFF'],
    accentColors: ['#191970', '#000080', '#4682B4'],
    complexity: 'complex',
    style: 'angular',
  },
  water_guardian: {
    primaryColors: ['#00CED1', '#48D1CC', '#40E0D0', '#7FFFD4'],
    accentColors: ['#008B8B', '#20B2AA', '#5F9EA0'],
    complexity: 'medium',
    style: 'organic',
  },
  biodiversity_champion: {
    primaryColors: ['#FF6347', '#FF7F50', '#FFA07A', '#FFD700'],
    accentColors: ['#9370DB', '#8A2BE2', '#9932CC', '#BA55D3'],
    complexity: 'complex',
    style: 'mixed',
  },
  community_leader: {
    primaryColors: ['#FF8C00', '#FFA500', '#FFB347', '#FFDAB9'],
    accentColors: ['#CD5C5C', '#DC143C', '#B22222'],
    complexity: 'medium',
    style: 'angular',
  },
  climate_hero: {
    primaryColors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347'],
    accentColors: ['#DC143C', '#B22222', '#8B0000'],
    complexity: 'complex',
    style: 'mixed',
  },
  forest_protector: {
    primaryColors: ['#228B22', '#32CD32', '#00FF00', '#7FFF00'],
    accentColors: ['#8B4513', '#A0522D', '#D2691E'],
    complexity: 'complex',
    style: 'organic',
  },
  green_ambassador: {
    primaryColors: ['#00FA9A', '#00FF7F', '#3CB371', '#2E8B57'],
    accentColors: ['#FFD700', '#FFA500', '#FF8C00'],
    complexity: 'medium',
    style: 'mixed',
  },
  welcome_badge: {
    primaryColors: ['#20B2AA', '#48D1CC', '#40E0D0', '#7FFFD4'],
    accentColors: ['#FF6347', '#FF7F50', '#FFA07A'],
    complexity: 'simple',
    style: 'organic',
  },
  ganggreen_hero: {
    primaryColors: ['#FFD700', '#FFA500', '#FF8C00', '#32CD32'],
    accentColors: ['#4169E1', '#8A2BE2', '#DC143C'],
    complexity: 'complex',
    style: 'mixed',
  },
};

/**
 * Tier-specific styling configurations
 * Based on GEOMETRIC_DESIGN.md specifications
 */
export const TIER_STYLES: Record<BadgeTier, TierStyle> = {
  hummingbird: {
    background: '#F0FFF4',
    border: '#20B2AA',
    borderWidth: 4,
    glowColor: 'rgba(32, 178, 170, 0.3)',
    glowIntensity: 0.3,
    name: 'Hummingbird',
  },
  bronze: {
    background: '#FFF8F0',
    border: '#CD7F32',
    borderWidth: 4,
    glowColor: 'rgba(205, 127, 50, 0.3)',
    glowIntensity: 0.3,
    name: 'Bronze',
  },
  silver: {
    background: '#F8F9FA',
    border: '#C0C0C0',
    borderWidth: 4,
    glowColor: 'rgba(192, 192, 192, 0.3)',
    glowIntensity: 0.3,
    name: 'Silver',
  },
  gold: {
    background: '#FFFBF0',
    border: '#FFD700',
    borderWidth: 4,
    glowColor: 'rgba(255, 215, 0, 0.4)',
    glowIntensity: 0.4,
    name: 'Gold',
  },
  platinum: {
    background: '#FAFAFA',
    border: '#E5E4E2',
    borderWidth: 4,
    glowColor: 'rgba(229, 228, 226, 0.4)',
    glowIntensity: 0.4,
    name: 'Platinum',
  },
  diamond: {
    background: '#F0FFFF',
    border: '#B9F2FF',
    borderWidth: 4,
    glowColor: 'rgba(185, 242, 255, 0.5)',
    glowIntensity: 0.5,
    name: 'Diamond',
  },
  hero: {
    background: '#FFF5E6',
    border: '#FFD700',
    borderWidth: 6,
    glowColor: 'rgba(255, 215, 0, 0.6)',
    glowIntensity: 0.6,
    name: 'Hero',
  },
};

/**
 * Generate a hummingbird-style geometric icon
 */
export function generateHummingbirdIcon(config: GeometricConfig, size: number = 120): string {
  const polygons = createHummingbirdPolygons(config, size);
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <title>Hummingbird Badge</title>
      <g id="hummingbird">
        ${polygons.map(p => `<polygon points="${p.points}" fill="${p.fill}" opacity="${p.opacity || 1}"/>`).join('\n        ')}
      </g>
    </svg>
  `;
}

/**
 * Create hummingbird polygon structure
 */
function createHummingbirdPolygons(config: GeometricConfig, size: number): Polygon[] {
  const scale = size / 120;
  const colors = [...config.primaryColors, ...config.accentColors];
  
  return [
    // Body (center)
    { points: scalePoints('60,50 70,60 70,80 60,90 50,80 50,60', scale), fill: colors[0] },
    { points: scalePoints('60,50 70,60 65,55', scale), fill: colors[1] },
    { points: scalePoints('50,60 60,50 55,55', scale), fill: colors[2] },
    
    // Head
    { points: scalePoints('55,40 65,40 70,50 60,50 50,50', scale), fill: colors[3] },
    { points: scalePoints('60,40 65,40 65,45', scale), fill: colors[4] },
    
    // Beak
    { points: scalePoints('65,45 95,35 65,50', scale), fill: colors[5] },
    { points: scalePoints('65,45 95,35 80,40', scale), fill: colors[6] },
    
    // Eye
    { points: scalePoints('62,43 64,43 63,45', scale), fill: '#FFFFFF' },
    { points: scalePoints('62.5,43.5 63.5,43.5 63,44.5', scale), fill: '#000000' },
    
    // Upper wing (right)
    { points: scalePoints('70,60 90,40 95,50', scale), fill: colors[0] },
    { points: scalePoints('70,60 95,50 90,60', scale), fill: colors[1] },
    { points: scalePoints('70,60 90,60 85,70', scale), fill: colors[2] },
    { points: scalePoints('70,60 85,70 75,75', scale), fill: colors[3] },
    
    // Upper wing (left)
    { points: scalePoints('50,60 30,40 25,50', scale), fill: colors[4] },
    { points: scalePoints('50,60 25,50 30,60', scale), fill: colors[5] },
    { points: scalePoints('50,60 30,60 35,70', scale), fill: colors[6] },
    { points: scalePoints('50,60 35,70 45,75', scale), fill: colors[0] },
    
    // Lower wing (right)
    { points: scalePoints('70,80 85,75 90,85', scale), fill: colors[1] },
    { points: scalePoints('70,80 90,85 85,95', scale), fill: colors[2] },
    { points: scalePoints('70,80 85,95 75,100', scale), fill: colors[3] },
    
    // Lower wing (left)
    { points: scalePoints('50,80 35,75 30,85', scale), fill: colors[4] },
    { points: scalePoints('50,80 30,85 35,95', scale), fill: colors[5] },
    { points: scalePoints('50,80 35,95 45,100', scale), fill: colors[6] },
    
    // Tail
    { points: scalePoints('60,90 65,105 60,110', scale), fill: colors[0] },
    { points: scalePoints('60,90 60,110 55,105', scale), fill: colors[1] },
    { points: scalePoints('55,105 60,110 50,115', scale), fill: colors[2] },
    { points: scalePoints('65,105 60,110 70,115', scale), fill: colors[3] },
  ];
}

/**
 * Generate tree geometric icon
 */
export function generateTreeIcon(config: GeometricConfig, size: number = 120): string {
  const polygons = createTreePolygons(config, size);
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <title>Tree Badge</title>
      <g id="tree">
        ${polygons.map(p => `<polygon points="${p.points}" fill="${p.fill}" opacity="${p.opacity || 1}"/>`).join('\n        ')}
      </g>
    </svg>
  `;
}

/**
 * Create tree polygon structure
 */
function createTreePolygons(config: GeometricConfig, size: number): Polygon[] {
  const scale = size / 120;
  const greenColors = config.primaryColors;
  const brownColors = config.accentColors;
  
  return [
    // Trunk
    { points: scalePoints('50,70 55,70 58,100 47,100', scale), fill: brownColors[0] },
    { points: scalePoints('55,70 58,100 62,100 60,70', scale), fill: brownColors[1] },
    { points: scalePoints('60,70 70,70 68,100 62,100', scale), fill: brownColors[2] },
    
    // Lower canopy
    { points: scalePoints('30,70 60,70 50,80', scale), fill: greenColors[0] },
    { points: scalePoints('60,70 90,70 70,80', scale), fill: greenColors[1] },
    { points: scalePoints('50,80 70,80 60,90', scale), fill: greenColors[2] },
    
    // Middle canopy
    { points: scalePoints('35,50 60,50 45,60', scale), fill: greenColors[1] },
    { points: scalePoints('60,50 85,50 75,60', scale), fill: greenColors[2] },
    { points: scalePoints('45,60 75,60 60,70', scale), fill: greenColors[3] },
    
    // Upper canopy
    { points: scalePoints('40,30 60,30 50,40', scale), fill: greenColors[2] },
    { points: scalePoints('60,30 80,30 70,40', scale), fill: greenColors[3] },
    { points: scalePoints('50,40 70,40 60,50', scale), fill: greenColors[0] },
    
    // Top
    { points: scalePoints('50,20 60,20 55,30', scale), fill: greenColors[1] },
    { points: scalePoints('55,30 60,20 65,30', scale), fill: greenColors[2] },
  ];
}

/**
 * Generate water drop geometric icon
 */
export function generateWaterIcon(config: GeometricConfig, size: number = 120): string {
  const polygons = createWaterPolygons(config, size);
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <title>Water Badge</title>
      <g id="water">
        ${polygons.map(p => `<polygon points="${p.points}" fill="${p.fill}" opacity="${p.opacity || 1}"/>`).join('\n        ')}
      </g>
    </svg>
  `;
}

/**
 * Create water drop polygon structure
 */
function createWaterPolygons(config: GeometricConfig, size: number): Polygon[] {
  const scale = size / 120;
  const colors = config.primaryColors;
  
  return [
    // Main drop shape
    { points: scalePoints('60,20 75,40 80,60', scale), fill: colors[0] },
    { points: scalePoints('60,20 45,40 40,60', scale), fill: colors[1] },
    { points: scalePoints('40,60 60,90 80,60', scale), fill: colors[2] },
    { points: scalePoints('40,60 50,75 60,90', scale), fill: colors[3] },
    { points: scalePoints('80,60 70,75 60,90', scale), fill: colors[0] },
    
    // Highlight
    { points: scalePoints('55,30 60,25 58,35', scale), fill: '#FFFFFF', opacity: 0.6 },
    { points: scalePoints('50,40 55,35 52,45', scale), fill: '#FFFFFF', opacity: 0.4 },
  ];
}

/**
 * Generate shield geometric icon
 */
export function generateShieldIcon(config: GeometricConfig, size: number = 120): string {
  const polygons = createShieldPolygons(config, size);
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <title>Shield Badge</title>
      <g id="shield">
        ${polygons.map(p => `<polygon points="${p.points}" fill="${p.fill}" opacity="${p.opacity || 1}"/>`).join('\n        ')}
      </g>
    </svg>
  `;
}

/**
 * Create shield polygon structure
 */
function createShieldPolygons(config: GeometricConfig, size: number): Polygon[] {
  const scale = size / 120;
  const colors = [...config.primaryColors, ...config.accentColors];
  
  return [
    // Shield outline
    { points: scalePoints('60,20 85,30 85,70 60,95', scale), fill: colors[0] },
    { points: scalePoints('60,20 35,30 35,70 60,95', scale), fill: colors[1] },
    
    // Inner sections
    { points: scalePoints('60,30 75,38 75,65 60,85', scale), fill: colors[2] },
    { points: scalePoints('60,30 45,38 45,65 60,85', scale), fill: colors[3] },
    
    // Center emblem
    { points: scalePoints('55,50 60,45 65,50', scale), fill: colors[4] },
    { points: scalePoints('55,50 60,55 65,50', scale), fill: colors[5] },
    { points: scalePoints('60,55 55,60 65,60', scale), fill: colors[6] },
  ];
}

/**
 * Generate star geometric icon
 */
export function generateStarIcon(config: GeometricConfig, size: number = 120): string {
  const polygons = createStarPolygons(config, size);
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <title>Star Badge</title>
      <g id="star">
        ${polygons.map(p => `<polygon points="${p.points}" fill="${p.fill}" opacity="${p.opacity || 1}"/>`).join('\n        ')}
      </g>
    </svg>
  `;
}

/**
 * Create star polygon structure
 */
function createStarPolygons(config: GeometricConfig, size: number): Polygon[] {
  const scale = size / 120;
  const colors = config.primaryColors;
  
  return [
    // Star points
    { points: scalePoints('60,20 65,45 70,50', scale), fill: colors[0] },
    { points: scalePoints('70,50 90,55 75,60', scale), fill: colors[1] },
    { points: scalePoints('75,60 85,80 70,75', scale), fill: colors[2] },
    { points: scalePoints('70,75 65,95 60,80', scale), fill: colors[3] },
    { points: scalePoints('60,80 55,95 50,75', scale), fill: colors[0] },
    { points: scalePoints('50,75 35,80 45,60', scale), fill: colors[1] },
    { points: scalePoints('45,60 30,55 50,50', scale), fill: colors[2] },
    { points: scalePoints('50,50 55,45 60,20', scale), fill: colors[3] },
    
    // Center
    { points: scalePoints('55,50 60,55 65,50', scale), fill: colors[0] },
    { points: scalePoints('65,50 70,55 65,60', scale), fill: colors[1] },
    { points: scalePoints('65,60 60,65 55,60', scale), fill: colors[2] },
    { points: scalePoints('55,60 50,55 55,50', scale), fill: colors[3] },
  ];
}

/**
 * Generate achievement icon based on type
 */
export function generateGeometricIcon(
  achievementType: AchievementType,
  size: number = 120
): string {
  const config = GEOMETRIC_CONFIGS[achievementType];
  
  switch (achievementType) {
    case 'tree_planter':
    case 'forest_protector':
      return generateTreeIcon(config, size);
    
    case 'water_guardian':
      return generateWaterIcon(config, size);
    
    case 'carbon_warrior':
    case 'community_leader':
      return generateShieldIcon(config, size);
    
    case 'climate_hero':
    case 'ganggreen_hero':
      return generateStarIcon(config, size);
    
    case 'biodiversity_champion':
    case 'green_ambassador':
    case 'welcome_badge':
    default:
      return generateHummingbirdIcon(config, size);
  }
}

/**
 * Scale polygon points
 */
function scalePoints(points: string, scale: number): string {
  return points
    .split(' ')
    .map(point => {
      const [x, y] = point.split(',').map(Number);
      return `${x * scale},${y * scale}`;
    })
    .join(' ');
}

/**
 * Generate complete badge with geometric icon
 */
export function generateGeometricBadge(
  achievementType: AchievementType,
  tier: BadgeTier,
  size: number = 400
): string {
  const icon = generateGeometricIcon(achievementType, size * 0.5);
  const config = GEOMETRIC_CONFIGS[achievementType];
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <title>${achievementType} ${tier} Badge</title>
      
      <!-- Background -->
      <rect width="${size}" height="${size}" fill="#F3F4F6" rx="${size * 0.05}"/>
      
      <!-- Geometric pattern background -->
      <g opacity="0.1">
        ${generateBackgroundPattern(config, size)}
      </g>
      
      <!-- Icon -->
      <g transform="translate(${size * 0.25}, ${size * 0.25})">
        ${icon}
      </g>
    </svg>
  `;
}

/**
 * Generate geometric badge with tier-specific styling
 * Includes tier background, border, and glow effects
 */
export function generateGeometricBadgeWithTier(
  achievementType: AchievementType,
  tier: BadgeTier,
  size: number = 400,
  metadata?: BadgeMetadata
): string {
  const icon = generateGeometricIcon(achievementType, size * 0.5);
  const config = GEOMETRIC_CONFIGS[achievementType];
  const tierStyle = TIER_STYLES[tier];
  const cornerRadius = size * 0.05;
  
  // Generate metadata text if provided
  const metadataText = metadata ? `
    <text x="${size / 2}" y="${size - 30}" 
          text-anchor="middle" 
          font-family="Arial, sans-serif" 
          font-size="${size * 0.04}" 
          fill="#666">
      ${metadata.achievementCount ? `${metadata.achievementCount} achievements` : ''}
    </text>
    <text x="${size / 2}" y="${size - 10}" 
          text-anchor="middle" 
          font-family="Arial, sans-serif" 
          font-size="${size * 0.03}" 
          fill="#999">
      ${tierStyle.name} Tier
    </text>
  ` : '';
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <title>${achievementType} ${tier} Badge</title>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="${tierStyle.glowIntensity * 10}" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Glow effect -->
      <rect width="${size}" height="${size}" 
            fill="${tierStyle.glowColor}" 
            rx="${cornerRadius}" 
            filter="url(#glow)"/>
      
      <!-- Background -->
      <rect width="${size}" height="${size}" 
            fill="${tierStyle.background}" 
            rx="${cornerRadius}"/>
      
      <!-- Geometric pattern background -->
      <g opacity="0.08">
        ${generateBackgroundPattern(config, size)}
      </g>
      
      <!-- Border -->
      <rect width="${size}" height="${size}" 
            fill="none" 
            stroke="${tierStyle.border}" 
            stroke-width="${tierStyle.borderWidth}" 
            rx="${cornerRadius}"/>
      
      <!-- Icon -->
      <g transform="translate(${size * 0.25}, ${size * 0.2})">
        ${icon}
      </g>
      
      <!-- Metadata -->
      ${metadataText}
    </svg>
  `.trim();
}

/**
 * Generate mobile-optimized badge
 * Reduces polygon count and optimizes for smaller screens
 */
export function generateMobileBadge(
  achievementType: AchievementType,
  tier: BadgeTier,
  size: number = 256
): string {
  const config = GEOMETRIC_CONFIGS[achievementType];
  
  // Simplify complexity for mobile
  const mobileConfig: GeometricConfig = {
    ...config,
    complexity: config.complexity === 'complex' ? 'medium' : 'simple',
  };
  
  // Generate with simplified config
  const icon = generateGeometricIconWithConfig(achievementType, mobileConfig, size * 0.5);
  const tierStyle = TIER_STYLES[tier];
  const cornerRadius = size * 0.05;
  
  // Simplified SVG without heavy effects
  const svg = `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <title>${achievementType} ${tier} Badge</title>
      <rect width="${size}" height="${size}" 
            fill="${tierStyle.background}" 
            rx="${cornerRadius}"/>
      <rect width="${size}" height="${size}" 
            fill="none" 
            stroke="${tierStyle.border}" 
            stroke-width="${tierStyle.borderWidth}" 
            rx="${cornerRadius}"/>
      <g transform="translate(${size * 0.25}, ${size * 0.25})">
        ${icon}
      </g>
    </svg>
  `.trim();
  
  return optimizeSVGForMobile(svg);
}

/**
 * Generate badge with custom color palette
 */
export function generateCustomBadge(
  achievementType: AchievementType,
  tier: BadgeTier,
  customColors: string[],
  size: number = 400
): string {
  // Validate colors
  if (customColors.length < 4) {
    throw new Error('Custom colors must include at least 4 colors');
  }
  
  // Create custom config
  const baseConfig = GEOMETRIC_CONFIGS[achievementType];
  const customConfig: GeometricConfig = {
    ...baseConfig,
    primaryColors: customColors.slice(0, 4),
    accentColors: customColors.slice(4, 7).length > 0 ? customColors.slice(4, 7) : baseConfig.accentColors,
  };
  
  const icon = generateGeometricIconWithConfig(achievementType, customConfig, size * 0.5);
  const tierStyle = TIER_STYLES[tier];
  const cornerRadius = size * 0.05;
  
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <title>${achievementType} ${tier} Badge (Custom)</title>
      <rect width="${size}" height="${size}" 
            fill="${tierStyle.background}" 
            rx="${cornerRadius}"/>
      <rect width="${size}" height="${size}" 
            fill="none" 
            stroke="${tierStyle.border}" 
            stroke-width="${tierStyle.borderWidth}" 
            rx="${cornerRadius}"/>
      <g transform="translate(${size * 0.25}, ${size * 0.25})">
        ${icon}
      </g>
    </svg>
  `.trim();
}

/**
 * Export badge to PNG format
 * Note: This requires a browser environment with canvas support
 */
export async function exportBadgeToPNG(
  svgString: string,
  size: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    // Create image from SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // Draw image to canvas
      ctx.drawImage(img, 0, 0, size, size);
      
      // Convert to PNG blob
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };
    
    img.src = url;
  });
}

/**
 * Optimize SVG for mobile devices
 * Removes extra whitespace, comments, and rounds coordinates
 */
export function optimizeSVGForMobile(svg: string): string {
  return svg
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .replace(/<!--.*?-->/g, '') // Remove comments
    .replace(/(\d+\.\d{3})\d+/g, '$1') // Round coordinates to 3 decimals
    .replace(/\s*([<>])\s*/g, '$1') // Remove spaces around tags
    .trim();
}

/**
 * Generate icon with custom configuration
 * Internal helper function
 */
function generateGeometricIconWithConfig(
  achievementType: AchievementType,
  config: GeometricConfig,
  size: number
): string {
  switch (achievementType) {
    case 'tree_planter':
    case 'forest_protector':
      return generateTreeIcon(config, size);
    
    case 'water_guardian':
      return generateWaterIcon(config, size);
    
    case 'carbon_warrior':
    case 'community_leader':
      return generateShieldIcon(config, size);
    
    case 'climate_hero':
    case 'ganggreen_hero':
      return generateStarIcon(config, size);
    
    case 'biodiversity_champion':
    case 'green_ambassador':
    case 'welcome_badge':
    default:
      return generateHummingbirdIcon(config, size);
  }
}

/**
 * Generate background geometric pattern
 * Uses deterministic pattern generation to avoid undefined SVG paths
 */
function generateBackgroundPattern(config: GeometricConfig, size: number): string {
  const polygons: string[] = [];
  const colors = config.primaryColors;
  
  // Use deterministic pattern generation instead of random
  const gridSize = 5;
  const cellSize = size / gridSize;
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * cellSize;
      const y = row * cellSize;
      
      // Create triangular pattern
      const x1 = x;
      const y1 = y;
      const x2 = x + cellSize;
      const y2 = y;
      const x3 = x + cellSize / 2;
      const y3 = y + cellSize;
      
      const colorIndex = (row + col) % colors.length;
      const color = colors[colorIndex];
      
      polygons.push(`<polygon points="${x1.toFixed(2)},${y1.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)} ${x3.toFixed(2)},${y3.toFixed(2)}" fill="${color}"/>`);
    }
  }
  
  return polygons.join('\n    ');
}
