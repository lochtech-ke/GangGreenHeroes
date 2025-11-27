/**
 * Badge Icon Renderer
 * Utilities for rendering achievement icons in badges
 * Updated to use geometric designs as default
 */

import { AchievementType } from '../types/badge.types';
import { getAchievementConfig } from '../assets/badges/styles/achievementConfig';
import { generateGeometricIcon } from './geometricBadgeGenerator';

/**
 * Icon rendering configuration
 */
export interface IconRenderConfig {
  size: number;
  color: string;
  shadowColor?: string;
  shadowOpacity?: number;
  backdropColor?: string;
  backdropOpacity?: number;
}

/**
 * Default icon rendering configuration
 */
export const DEFAULT_ICON_CONFIG: IconRenderConfig = {
  size: 120,
  color: '#FFFFFF',
  shadowColor: '#000000',
  shadowOpacity: 0.3,
  backdropColor: '#FFFFFF',
  backdropOpacity: 0.3,
};

/**
 * Get icon file path for an achievement type
 * Now defaults to geometric icons as per migration requirements (Requirement 2.2)
 * 
 * @param achievementType - The type of achievement
 * @param useGeometric - Use geometric design (default: true)
 * @returns Path to the icon file
 */
export function getIconPath(achievementType: AchievementType, useGeometric: boolean = true): string {
  // Geometric icon mapping (default)
  const geometricIconMap: Record<AchievementType, string> = {
    tree_planter: 'tree-planter-geometric.svg',
    carbon_warrior: 'carbon-warrior-geometric.svg',
    water_guardian: 'water-guardian-geometric.svg',
    biodiversity_champion: 'biodiversity-champion-geometric.svg',
    community_leader: 'community-leader-geometric.svg',
    climate_hero: 'climate-hero-geometric.svg',
    forest_protector: 'forest-protector-geometric.svg',
    green_ambassador: 'green-ambassador-geometric.svg',
    welcome_badge: 'hummingbird-geometric.svg',
    ganggreen_hero: 'ganggreen-hero-geometric.svg',
  };
  
  if (useGeometric) {
    return `/src/assets/badges/icons/${geometricIconMap[achievementType]}`;
  }
  
  // Fallback to original icons for backward compatibility
  const config = getAchievementConfig(achievementType);
  return `/src/assets/badges/icons/${config.iconFile}`;
}

/**
 * Load icon SVG content
 * Now generates geometric icons directly instead of loading from files (Requirement 2.2)
 * 
 * @param achievementType - The type of achievement
 * @param useGeometric - Use geometric design (default: true)
 * @returns Promise resolving to SVG string
 */
export async function loadIconSVG(achievementType: AchievementType, useGeometric: boolean = true): Promise<string> {
  try {
    if (useGeometric) {
      // Generate geometric icon directly (no file loading needed)
      return generateGeometricIcon(achievementType, 120);
    }
    
    // Fallback to loading classic icons from files
    const iconPath = getIconPath(achievementType, false);
    const response = await fetch(iconPath);
    
    if (!response.ok) {
      throw new Error(`Failed to load icon: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error loading icon for ${achievementType}:`, error);
    // Fallback to geometric icon on error
    return generateGeometricIcon(achievementType, 120);
  }
}

/**
 * Extract SVG content (remove svg wrapper for embedding)
 */
export function extractSVGContent(svgString: string): string {
  // Remove the outer <svg> tags but keep the content
  const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match ? match[1] : svgString;
}

/**
 * Create icon backdrop circle
 */
export function createIconBackdrop(
  cx: number,
  cy: number,
  radius: number,
  color: string,
  opacity: number
): string {
  return `
    <circle 
      cx="${cx}" 
      cy="${cy}" 
      r="${radius}" 
      fill="${color}" 
      opacity="${opacity}"
      filter="url(#glassEffect)"
    />
  `;
}

/**
 * Create icon shadow effect
 */
export function createIconShadow(
  cx: number,
  cy: number,
  radius: number,
  color: string,
  opacity: number
): string {
  return `
    <circle 
      cx="${cx}" 
      cy="${cy}" 
      r="${radius}" 
      fill="${color}" 
      opacity="${opacity}"
      filter="url(#glassEffect)"
    />
  `;
}

/**
 * Render single icon with backdrop and effects
 * Now defaults to geometric design as per migration requirements (Requirement 2.2)
 * 
 * @param achievementType - The type of achievement to render
 * @param x - X coordinate for icon placement
 * @param y - Y coordinate for icon placement
 * @param config - Optional rendering configuration
 * @param useGeometric - Use geometric design (default: true)
 * @returns Promise resolving to SVG string of rendered icon
 */
export async function renderIcon(
  achievementType: AchievementType,
  x: number,
  y: number,
  config: Partial<IconRenderConfig> = {},
  useGeometric: boolean = true
): Promise<string> {
  const finalConfig = { ...DEFAULT_ICON_CONFIG, ...config };
  const iconSVG = await loadIconSVG(achievementType, useGeometric);
  const iconContent = extractSVGContent(iconSVG);
  
  const backdropRadius = finalConfig.size / 2 + 10;
  
  return `
    <g transform="translate(${x}, ${y})">
      ${createIconBackdrop(
        0,
        0,
        backdropRadius,
        finalConfig.backdropColor!,
        finalConfig.backdropOpacity!
      )}
      <g transform="scale(${finalConfig.size / 120})">
        <g transform="translate(-60, -60)">
          ${iconContent}
        </g>
      </g>
    </g>
  `;
}

/**
 * Render multiple icons in a balanced composition
 * Supports up to 3 icons as per requirements (Requirement 2.2)
 * Now defaults to geometric design for all icons
 * 
 * @param achievementTypes - Array of achievement types to render (max 3)
 * @param centerX - X coordinate for composition center
 * @param centerY - Y coordinate for composition center
 * @param config - Optional rendering configuration
 * @param useGeometric - Use geometric design (default: true)
 * @returns Promise resolving to SVG string of all rendered icons
 */
export async function renderMultipleIcons(
  achievementTypes: AchievementType[],
  centerX: number,
  centerY: number,
  config: Partial<IconRenderConfig> = {},
  useGeometric: boolean = true
): Promise<string> {
  if (achievementTypes.length === 0) {
    return '';
  }
  
  if (achievementTypes.length > 3) {
    console.warn('Maximum 3 icons supported, using first 3');
    achievementTypes = achievementTypes.slice(0, 3);
  }
  
  const finalConfig = { ...DEFAULT_ICON_CONFIG, ...config };
  const iconSize = achievementTypes.length === 1 ? finalConfig.size : finalConfig.size * 0.7;
  
  // Calculate positions based on number of icons
  const positions = calculateIconPositions(achievementTypes.length, centerX, centerY, iconSize);
  
  // Render each icon
  const iconPromises = achievementTypes.map((type, index) =>
    renderIcon(type, positions[index].x, positions[index].y, {
      ...config,
      size: iconSize,
    }, useGeometric)
  );
  
  const renderedIcons = await Promise.all(iconPromises);
  return renderedIcons.join('\n');
}

/**
 * Calculate icon positions for balanced composition
 */
function calculateIconPositions(
  count: number,
  centerX: number,
  centerY: number,
  iconSize: number
): Array<{ x: number; y: number }> {
  const spacing = iconSize * 0.6;
  
  switch (count) {
    case 1:
      return [{ x: centerX, y: centerY }];
    
    case 2:
      return [
        { x: centerX - spacing, y: centerY },
        { x: centerX + spacing, y: centerY },
      ];
    
    case 3:
      return [
        { x: centerX, y: centerY - spacing },
        { x: centerX - spacing, y: centerY + spacing * 0.5 },
        { x: centerX + spacing, y: centerY + spacing * 0.5 },
      ];
    
    default:
      return [{ x: centerX, y: centerY }];
  }
}

/**
 * Fallback icon (simple star) when icon loading fails
 */
function getFallbackIcon(): string {
  return `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <title>Achievement Icon</title>
      <path d="M 60 20 L 68 48 L 98 48 L 74 66 L 82 94 L 60 76 L 38 94 L 46 66 L 22 48 L 52 48 Z" 
            fill="none" stroke="white" stroke-width="4" stroke-linejoin="round"/>
    </svg>
  `;
}

/**
 * Validate icon rendering configuration
 */
export function validateIconConfig(config: Partial<IconRenderConfig>): boolean {
  if (config.size && (config.size < 20 || config.size > 200)) {
    console.error('Icon size must be between 20 and 200');
    return false;
  }
  
  if (config.shadowOpacity && (config.shadowOpacity < 0 || config.shadowOpacity > 1)) {
    console.error('Shadow opacity must be between 0 and 1');
    return false;
  }
  
  if (config.backdropOpacity && (config.backdropOpacity < 0 || config.backdropOpacity > 1)) {
    console.error('Backdrop opacity must be between 0 and 1');
    return false;
  }
  
  return true;
}
