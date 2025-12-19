/**
 * NFT Badge SVG Type Definitions
 * Defines interfaces and types for the badge generation system
 */

export type BadgeTier = 'hummingbird' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'hero';

export type ForestType = 'kakamega' | 'karura' | 'mau';

export type AchievementType =
  | 'tree_planter'
  | 'carbon_warrior'
  | 'water_guardian'
  | 'biodiversity_champion'
  | 'community_leader'
  | 'climate_hero'
  | 'forest_protector'
  | 'green_ambassador'
  | 'welcome_badge'
  | 'ganggreen_hero';

export interface BadgeMetadata {
  badgeName: string;
  tierLevel: number;
  forestName: string;
  achievementType: string;
  achievementCount: number;
  earnedDate: string; // ISO 8601 format
  uniqueBadgeId: string; // UUID v4
  userId: string;
  // Optional fields for welcome badges
  welcomeMessage?: string;
  registrationDate?: string;
  platformVersion?: string;
  // Optional fields for Hero badges
  userName?: string;
  purchaseDate?: string;
  badgeType?: string;
  generatedAt?: string;
  badgeStyle?: 'geometric' | 'classic';
}

export interface BadgeConfig {
  id: string;
  tier: BadgeTier;
  forest: ForestType;
  achievement: AchievementType;
  metadata: BadgeMetadata;
  animated?: boolean;
  style?: 'geometric' | 'classic';
}

export interface TierStyle {
  primaryColor: string;
  gradientStart: string;
  gradientEnd: string;
  borderStyle: string;
  glowIntensity: number;
}

export interface ForestTheme {
  name: string;
  colors: string[];
  pattern: string;
  decorativeElements: string[];
  borderAccent: string;
}

export interface SVGGradient {
  id: string;
  type: 'linear' | 'radial';
  x1?: string;
  y1?: string;
  x2?: string;
  y2?: string;
  cx?: string;
  cy?: string;
  r?: string;
  stops: Array<{
    offset: string;
    color: string;
    opacity?: number;
  }>;
}

export interface SVGFilter {
  id: string;
  elements: Array<{
    type: string;
    attributes: Record<string, string | number>;
  }>;
}

export interface SVGPattern {
  id: string;
  width: number;
  height: number;
  patternUnits: string;
  content: string;
}

export interface SVGClipPath {
  id: string;
  content: string;
}

export interface SVGDefs {
  gradients: SVGGradient[];
  filters: SVGFilter[];
  patterns: SVGPattern[];
  clipPaths: SVGClipPath[];
}

export interface SVGElement {
  type: string;
  attributes: Record<string, string | number>;
  content?: string;
  children?: SVGElement[];
}

export interface SVGLayer {
  id: string;
  type: 'background' | 'glass' | 'border' | 'theme' | 'icon' | 'text';
  elements: SVGElement[];
  transform?: string;
  opacity?: number;
}

export interface SVGTemplate {
  viewBox: string;
  width: number;
  height: number;
  defs: SVGDefs;
  layers: SVGLayer[];
}

export interface BadgeExportOptions {
  format: 'svg' | 'png';
  size?: number; // For PNG export
  platform?: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'twitter-profile' | 'facebook-profile' | 'instagram-story';
  includeAccessibility?: boolean; // Add ARIA labels and accessibility attributes
  socialMediaOptimized?: boolean; // Optimize colors and contrast for social sharing
  wcagCompliant?: boolean; // Ensure WCAG AA color contrast compliance
}

export interface BadgeGenerationResult {
  success: boolean;
  svg?: string;
  error?: string;
  metadata?: BadgeMetadata;
}

export interface BadgeValidationResult {
  valid: boolean;
  errors: string[];
}
