/**
 * Hummingbird Badge Generation Service
 * Specialized service for generating welcome hummingbird badges
 */

import { BadgeConfig, BadgeGenerationResult, BadgeMetadata } from '../types/badge.types';
import { getTierStyle } from '../assets/badges/styles/tierStyles';
import { getForestTheme } from '../assets/badges/styles/forestThemes';
import { hummingbirdBadgePerformanceService, ValidationResult } from './hummingbirdBadge.performance';

export interface HummingbirdBadgeConfig extends Omit<BadgeConfig, 'achievement'> {
  achievement: 'welcome_badge';
  wingStyle?: 'geometric' | 'organic' | 'hybrid';
  colorPalette?: 'vibrant' | 'subtle' | 'forest-themed';
  animationLevel?: 'none' | 'subtle' | 'dynamic';
}

export interface HummingbirdBadgeMetadata extends BadgeMetadata {
  badgeName: 'Hummingbird Welcome Badge';
  achievementType: 'welcome_badge';
  welcomeMessage: string;
  registrationDate: string;
  platformVersion: string;
}

/**
 * Hummingbird Badge Generator Class
 * Core generator for hummingbird badge creation with configuration options
 */
class HummingbirdBadgeGenerator {
  private config: HummingbirdBadgeConfig;
  
  constructor(config: HummingbirdBadgeConfig) {
    this.config = {
      wingStyle: 'hybrid',
      colorPalette: 'vibrant',
      animationLevel: 'subtle',
      ...config,
    };
  }

  /**
   * Generate the hummingbird badge SVG
   */
  async generate(): Promise<BadgeGenerationResult> {
    const service = new HummingbirdBadgeService();
    return await service.generateHummingbirdBadge(this.config);
  }

  /**
   * Update configuration options
   */
  updateConfig(updates: Partial<HummingbirdBadgeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfig(): HummingbirdBadgeConfig {
    return { ...this.config };
  }

  /**
   * Set wing style
   */
  setWingStyle(style: 'geometric' | 'organic' | 'hybrid'): HummingbirdBadgeGenerator {
    this.config.wingStyle = style;
    return this;
  }

  /**
   * Set color palette
   */
  setColorPalette(palette: 'vibrant' | 'subtle' | 'forest-themed'): HummingbirdBadgeGenerator {
    this.config.colorPalette = palette;
    return this;
  }

  /**
   * Set animation level
   */
  setAnimationLevel(level: 'none' | 'subtle' | 'dynamic'): HummingbirdBadgeGenerator {
    this.config.animationLevel = level;
    return this;
  }

  /**
   * Apply forest-themed styling
   */
  applyForestTheme(): HummingbirdBadgeGenerator {
    this.config.colorPalette = 'forest-themed';
    this.config.wingStyle = 'organic';
    return this;
  }

  /**
   * Apply vibrant styling for social sharing
   */
  applyVibrantStyle(): HummingbirdBadgeGenerator {
    this.config.colorPalette = 'vibrant';
    this.config.wingStyle = 'hybrid';
    this.config.animationLevel = 'dynamic';
    return this;
  }

  /**
   * Apply subtle styling for professional contexts
   */
  applySubtleStyle(): HummingbirdBadgeGenerator {
    this.config.colorPalette = 'subtle';
    this.config.wingStyle = 'geometric';
    this.config.animationLevel = 'none';
    return this;
  }
}

/**
 * Hummingbird Badge Service Class
 */
class HummingbirdBadgeService {
  /**
   * Export hummingbird badge with accessibility and social media optimization
   */
  async exportHummingbirdBadge(
    config: HummingbirdBadgeConfig,
    options: {
      format: 'svg' | 'png';
      size?: number;
      platform?: string;
      includeAccessibility?: boolean;
      socialMediaOptimized?: boolean;
      wcagCompliant?: boolean;
    } = { format: 'svg' }
  ): Promise<Blob> {
    // Generate the badge first
    const result = await this.generateHummingbirdBadge(config);
    
    if (!result.success || !result.svg) {
      throw new Error(result.error || 'Failed to generate hummingbird badge');
    }

    let svg = result.svg;

    // Add accessibility features if requested
    if (options.includeAccessibility !== false) {
      svg = this.addAccessibilityAttributes(svg, config);
    }

    // Ensure WCAG compliance if requested
    if (options.wcagCompliant !== false) {
      svg = await this.ensureWCAGCompliance(svg, config);
    }

    // Add social media optimization if requested
    if (options.socialMediaOptimized) {
      svg = this.optimizeForSocialMedia(svg, options.platform);
    }

    // Add hover states and animations for engagement
    svg = this.addInteractiveFeatures(svg, config);

    if (options.format === 'png') {
      const size = this.getSizeForPlatform(options.platform, options.size);
      return await this.exportToPng(svg, size);
    }

    // Return SVG as blob
    return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  }

  /**
   * Generate hummingbird welcome badge with performance optimization
   */
  async generateHummingbirdBadge(config: HummingbirdBadgeConfig): Promise<BadgeGenerationResult> {
    const startTime = performance.now();
    
    try {
      // Load hummingbird-specific template
      const template = await this.loadHummingbirdTemplate(config);
      
      // Generate SVG defs with hummingbird-specific gradients
      const defs = this.generateHummingbirdDefs(config.tier, config);
      
      // Load forest pattern
      const forestPatternContent = await this.getForestPatternContent(config.forest);
      
      // Build complete SVG
      let svg = template;
      
      // Replace placeholders
      svg = this.replaceHummingbirdPlaceholders(svg, config);
      
      // Insert defs - replace the entire <defs></defs> section
      if (defs) {
        // Remove the outer <defs></defs> wrapper from the generated defs since we're replacing the template's defs
        const defsContent = defs.replace(/<\/?defs[^>]*>/g, '').trim();
        svg = svg.replace(/<defs>[\s\S]*?<\/defs>/, `<defs>${defsContent}</defs>`);
      }
      
      // Insert forest pattern
      if (forestPatternContent) {
        svg = svg.replace(
          '<g id="forest-theme" opacity="0.2">',
          `<g id="forest-theme" opacity="0.2">${forestPatternContent}</g><g>`
        );
      }
      
      // Apply animation level
      if (config.animationLevel === 'none') {
        svg = this.removeAnimations(svg);
      } else if (config.animationLevel === 'dynamic') {
        svg = this.enhanceAnimations(svg);
      }
      
      // Embed metadata
      svg = this.embedHummingbirdMetadata(svg, config.metadata as HummingbirdBadgeMetadata);
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Log performance metrics
      const svgSize = new Blob([svg]).size;
      console.log('[HummingbirdBadgeService] Hummingbird badge generated successfully:', {
        badgeId: config.id,
        tier: config.tier,
        forest: config.forest,
        wingStyle: config.wingStyle,
        colorPalette: config.colorPalette,
        generationTime: `${generationTime.toFixed(2)}ms`,
        svgSize: `${(svgSize / 1024).toFixed(2)}KB`,
        meetsPerformanceRequirements: generationTime <= 100 && svgSize <= 50 * 1024,
      });

      // Validate performance requirements
      if (generationTime > 100) {
        console.warn(`[HummingbirdBadgeService] Generation time ${generationTime.toFixed(2)}ms exceeds 100ms requirement`);
      }
      
      if (svgSize > 50 * 1024) {
        console.warn(`[HummingbirdBadgeService] SVG size ${(svgSize / 1024).toFixed(2)}KB exceeds 50KB requirement`);
      }

      return {
        success: true,
        svg,
        metadata: config.metadata,
      };
    } catch (error) {
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      console.error('[HummingbirdBadgeService] Error generating hummingbird badge:', {
        badgeId: config.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        generationTime: `${generationTime.toFixed(2)}ms`,
      });
      
      // Return error result instead of falling back to avoid infinite recursion
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hummingbird badge',
        metadata: config.metadata,
      };
    }
  }

  /**
   * Load hummingbird-specific template
   */
  private async loadHummingbirdTemplate(config: HummingbirdBadgeConfig): Promise<string> {
    try {
      // Try to load the hummingbird template
      let template: string;
      
      if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:') {
        // Browser environment with network access
        try {
          const response = await fetch('/src/assets/badges/templates/hummingbird-template.svg');
          if (!response.ok) {
            console.warn(`Failed to load hummingbird template: ${response.statusText}, using fallback`);
            template = this.getHummingbirdFallbackTemplate();
          } else {
            template = await response.text();
          }
        } catch (fetchError) {
          console.warn('Network error loading hummingbird template, using fallback:', fetchError);
          template = this.getHummingbirdFallbackTemplate();
        }
      } else {
        // Test/Node environment or file protocol - use fallback template
        template = this.getHummingbirdFallbackTemplate();
      }
      
      // Apply wing style modifications
      template = this.applyWingStyleToTemplate(template, config.wingStyle || 'hybrid');
      
      return template;
    } catch (error) {
      console.error('Error loading hummingbird template:', error);
      // Use fallback template
      return this.getHummingbirdFallbackTemplate();
    }
  }

  /**
   * Get fallback hummingbird template for testing/offline use
   */
  private getHummingbirdFallbackTemplate(): string {
    return `
<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Placeholder for gradients and filters -->
  </defs>
  
  <!-- Background circle with glassmorphism -->
  <circle cx="250" cy="250" r="220" fill="url(#tierGradient)" filter="url(#glassEffect)"/>
  
  <!-- Forest theme layer -->
  <g id="forest-theme" opacity="0.2">
    <!-- Forest pattern will be inserted here -->
  </g>
  
  <!-- Hummingbird body -->
  <g id="hummingbird-body" transform="translate(250, 250)">
    <!-- Hummingbird body path -->
    <ellipse cx="0" cy="0" rx="8" ry="20" fill="url(#hummingbirdBodyGradient)"/>
    
    <!-- Hummingbird head -->
    <circle cx="0" cy="-18" r="6" fill="url(#hummingbirdBodyGradient)"/>
    
    <!-- Hummingbird beak -->
    <path d="M 0,-24 L 2,-30 L 0,-32 L -2,-30 Z" fill="url(#hummingbirdBodyGradient)"/>
    
    <!-- Hummingbird wings -->
    <g id="hummingbird-wings">
      <!-- Left wing -->
      <path d="M -6,-12 C -26,-19 -34,-8 -30,4 C -26,12 -19,15 -11,11 C -7,8 -6,0 -6,-12 Z" 
            fill="url(#hummingbirdWingGradient)" opacity="0.9"/>
      
      <!-- Right wing -->
      <path d="M 6,-12 C 26,-19 34,-8 30,4 C 26,12 19,15 11,11 C 7,8 6,0 6,-12 Z" 
            fill="url(#hummingbirdWingGradient)" opacity="0.9"/>
    </g>
    
    <!-- Hummingbird tail -->
    <path d="M 0,20 L -4,35 L 0,38 L 4,35 Z" fill="url(#hummingbirdBodyGradient)"/>
    
    <!-- Shimmer effect -->
    <ellipse cx="0" cy="-5" rx="12" ry="18" fill="url(#hummingbirdShimmer)" opacity="0.6"/>
  </g>
  
  <!-- Tier border -->
  <circle cx="250" cy="250" r="220" fill="none" stroke="url(#tierBorderGradient)" 
          stroke-width="8" filter="url(#tierGlow)"/>
  
  <!-- Badge text -->
  <text x="250" y="420" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="24" font-weight="bold" fill="white" filter="url(#dropShadow)">
    {{tierName}} {{forestName}}
  </text>
  
  <text x="250" y="450" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="18" fill="white" opacity="0.9">
    {{achievementName}}
  </text>
  
  <!-- Animations for subtle movement -->
  <animateTransform attributeName="transform" attributeType="XML" type="rotate"
                    values="0 250 250; 2 250 250; 0 250 250; -2 250 250; 0 250 250"
                    dur="3s" repeatCount="indefinite"/>
</svg>
    `.trim();
  }

  /**
   * Apply wing style modifications to template
   */
  private applyWingStyleToTemplate(template: string, wingStyle: string): string {
    switch (wingStyle) {
      case 'geometric':
        // Replace curved wing paths with more angular, geometric shapes
        return template.replace(
          /d="M -6,-12 C -26,-19 -34,-8 -30,4 C -26,12 -19,15 -11,11 C -7,8 -6,0 -6,-12 Z"/g,
          'd="M -6,-12 L -26,-19 L -34,-8 L -30,4 L -26,12 L -19,15 L -11,11 L -7,8 L -6,0 Z"'
        ).replace(
          /d="M 6,-12 C 26,-19 34,-8 30,4 C 26,12 19,15 11,11 C 7,8 6,0 6,-12 Z"/g,
          'd="M 6,-12 L 26,-19 L 34,-8 L 30,4 L 26,12 L 19,15 L 11,11 L 7,8 L 6,0 Z"'
        );
      case 'organic':
        // Enhance curved paths for more organic feel
        return template.replace(
          /d="M -6,-12 C -26,-19 -34,-8 -30,4 C -26,12 -19,15 -11,11 C -7,8 -6,0 -6,-12 Z"/g,
          'd="M -6,-12 C -28,-22 -38,-10 -32,6 C -28,14 -21,17 -13,13 C -9,10 -6,2 -6,-12 Z"'
        ).replace(
          /d="M 6,-12 C 26,-19 34,-8 30,4 C 26,12 19,15 11,11 C 7,8 6,0 6,-12 Z"/g,
          'd="M 6,-12 C 28,-22 38,-10 32,6 C 28,14 21,17 13,13 C 9,10 6,2 6,-12 Z"'
        );
      case 'hybrid':
      default:
        // Keep the original hybrid design
        return template;
    }
  }

  /**
   * Generate hummingbird-specific SVG defs
   */
  private generateHummingbirdDefs(tier: string, config: HummingbirdBadgeConfig): string {
    const tierStyle = getTierStyle(tier as any);
    const colorPalette = this.getColorPalette(config.colorPalette || 'vibrant', config.forest);
    const tierEffects = this.getTierSpecificEffects(tier as any);
    
    return `
      <!-- Hummingbird-specific gradients -->
      <linearGradient id="hummingbirdBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorPalette.body.start}" />
        <stop offset="50%" stop-color="${colorPalette.body.middle}" />
        <stop offset="100%" stop-color="${colorPalette.body.end}" />
      </linearGradient>
      
      <linearGradient id="hummingbirdWingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorPalette.wings.start}" />
        <stop offset="30%" stop-color="${colorPalette.wings.middle1}" />
        <stop offset="70%" stop-color="${colorPalette.wings.middle2}" />
        <stop offset="100%" stop-color="${colorPalette.wings.end}" />
      </linearGradient>
      
      <radialGradient id="hummingbirdShimmer" cx="50%" cy="30%">
        <stop offset="0%" stop-color="rgba(255,255,255,${colorPalette.shimmer.intensity})" />
        <stop offset="50%" stop-color="rgba(255,255,255,${colorPalette.shimmer.intensity * 0.5})" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </radialGradient>
      
      <!-- Tier-specific gradients with enhanced effects -->
      <linearGradient id="tierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${tierStyle.gradientStart}" />
        <stop offset="50%" stop-color="${tierStyle.primaryColor}" />
        <stop offset="100%" stop-color="${tierStyle.gradientEnd}" />
      </linearGradient>
      
      <!-- Tier-specific metallic border -->
      <linearGradient id="tierBorderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${this.lightenColor(tierStyle.primaryColor, 30)}" />
        <stop offset="25%" stop-color="${tierStyle.primaryColor}" />
        <stop offset="50%" stop-color="${this.darkenColor(tierStyle.primaryColor, 20)}" />
        <stop offset="75%" stop-color="${tierStyle.primaryColor}" />
        <stop offset="100%" stop-color="${this.darkenColor(tierStyle.primaryColor, 30)}" />
      </linearGradient>
      
      <!-- Enhanced glassmorphism filter with tier-specific intensity -->
      <filter id="glassEffect">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${tierEffects.glassBlur}" result="blur"/>
        <feColorMatrix in="blur" type="matrix" 
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${tierEffects.glassOpacity} 0" result="glass"/>
        <feBlend in="SourceGraphic" in2="glass" mode="normal"/>
      </filter>
      
      <!-- Tier-specific glow filter -->
      <filter id="tierGlow">
        <feGaussianBlur stdDeviation="${tierEffects.glowRadius}" result="coloredBlur"/>
        <feFlood flood-color="${tierStyle.primaryColor}" flood-opacity="${tierStyle.glowIntensity}"/>
        <feComposite in2="coloredBlur" operator="in" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <filter id="dropShadow">
        <feGaussianBlur in="SourceAlpha" stdDeviation="${tierEffects.shadowBlur}"/>
        <feOffset dx="0" dy="${tierEffects.shadowOffset}" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="${tierEffects.shadowOpacity}"/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      ${tierEffects.additionalFilters}
    `;
  }

  /**
   * Replace hummingbird-specific placeholders
   */
  private replaceHummingbirdPlaceholders(template: string, config: HummingbirdBadgeConfig): string {
    const tierStyle = getTierStyle(config.tier);
    const forestTheme = getForestTheme(config.forest);
    
    // Safely access metadata properties with fallbacks
    const metadata = config.metadata || {} as any;
    const badgeName = metadata.badgeName || 'Hummingbird Welcome Badge';
    const tierLevel = metadata.tierLevel?.toString() || '1';
    const earnedDate = metadata.earnedDate ? new Date(metadata.earnedDate).toLocaleDateString() : new Date().toLocaleDateString();
    const uniqueBadgeId = metadata.uniqueBadgeId || config.id || 'unknown';
    const userId = metadata.userId || 'unknown';
    
    const replacements: Record<string, string> = {
      '{{gradientStart}}': tierStyle.gradientStart || '#CD7F32',
      '{{primaryColor}}': tierStyle.primaryColor || '#CD7F32',
      '{{gradientEnd}}': tierStyle.gradientEnd || '#8B4513',
      '{{badgeName}}': badgeName,
      '{{tierLevel}}': tierLevel,
      '{{forestName}}': forestTheme.name || 'Forest',
      '{{achievementType}}': 'welcome_badge',
      '{{achievementName}}': 'Hummingbird Welcome',
      '{{achievementCount}}': '1',
      '{{achievementUnit}}': 'Welcome',
      '{{earnedDate}}': earnedDate,
      '{{uniqueBadgeId}}': uniqueBadgeId,
      '{{userId}}': userId,
      '{{tierName}}': config.tier ? config.tier.charAt(0).toUpperCase() + config.tier.slice(1) : 'Bronze',
    };
    
    let result = template;
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    }
    
    return result;
  }

  /**
   * Get forest pattern content adapted for hummingbird badge
   */
  private async getForestPatternContent(forest: string): Promise<string> {
    try {
      let content: string;
      
      if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:') {
        // Browser environment with network access
        try {
          const response = await fetch(`/src/assets/badges/patterns/${forest}-pattern.svg`);
          if (!response.ok) {
            console.warn(`Failed to load ${forest} pattern, using mock`);
            content = this.getMockForestPattern(forest);
          } else {
            content = await response.text();
          }
        } catch (fetchError) {
          console.warn(`Network error loading ${forest} pattern, using mock:`, fetchError);
          content = this.getMockForestPattern(forest);
        }
      } else {
        // Test/Node environment or file protocol - use mock pattern
        content = this.getMockForestPattern(forest);
      }
      
      // Extract and adapt forest-specific elements for hummingbird badge
      return this.adaptForestPatternForHummingbird(content, forest);
    } catch (error) {
      console.warn(`Error loading ${forest} pattern:`, error);
      return this.getDefaultForestPattern();
    }
  }

  /**
   * Get mock forest pattern for testing
   */
  private getMockForestPattern(forest: string): string {
    const patterns: Record<string, string> = {
      kakamega: `
        <g>
          <circle cx="100" cy="100" r="20" fill="#2D5016" opacity="0.3"/>
          <circle cx="300" cy="150" r="25" fill="#228B22" opacity="0.3"/>
          <path d="M 50 50 Q 60 70 50 90" stroke="#32CD32" stroke-width="2" fill="none"/>
        </g>
      `,
      karura: `
        <g>
          <rect x="80" y="80" width="15" height="30" fill="#2D5016" opacity="0.3"/>
          <rect x="320" y="120" width="12" height="25" fill="#228B22" opacity="0.3"/>
          <circle cx="200" cy="300" r="18" fill="#32CD32" opacity="0.2"/>
        </g>
      `,
      mau: `
        <g>
          <path d="M 0 350 L 100 320 L 200 340 L 300 315 L 400 335" stroke="#2D5016" stroke-width="3" fill="none"/>
          <ellipse cx="150" cy="280" rx="30" ry="8" fill="#87CEEB" opacity="0.3"/>
          <path d="M 70 330 L 65 320 L 75 320 Z" fill="#228B22"/>
        </g>
      `,
    };
    
    return patterns[forest] || patterns.kakamega;
  }

  /**
   * Adapt forest pattern elements specifically for hummingbird badge
   */
  private adaptForestPatternForHummingbird(_svgContent: string, forest: string): string {
    const forestTheme = getForestTheme(forest as any);
    
    switch (forest) {
      case 'kakamega':
        return this.createKakamegaHummingbirdElements(forestTheme);
      case 'karura':
        return this.createKaruraHummingbirdElements(forestTheme);
      case 'mau':
        return this.createMauHummingbirdElements(forestTheme);
      default:
        return this.getDefaultForestPattern();
    }
  }

  /**
   * Create Kakamega forest elements adapted for hummingbird badge
   */
  private createKakamegaHummingbirdElements(theme: any): string {
    return `
      <!-- Kakamega tropical elements around hummingbird -->
      <g opacity="0.2">
        <!-- Tropical leaves in corners -->
        <path d="M 50 50 Q 45 65 40 85 Q 45 70 50 50 Q 55 70 60 85 Q 55 65 50 50" 
              fill="${theme.colors[0]}"/>
        <path d="M 350 60 Q 345 72 340 90 Q 345 76 350 60 Q 355 76 360 90 Q 355 72 350 60" 
              fill="${theme.colors[1]}"/>
        
        <!-- Butterfly near hummingbird -->
        <g transform="translate(120, 150)" opacity="0.3">
          <ellipse cx="-3" cy="-2" rx="4" ry="5" fill="${theme.colors[2]}" transform="rotate(-20)"/>
          <ellipse cx="3" cy="-2" rx="4" ry="5" fill="${theme.colors[2]}" transform="rotate(20)"/>
          <ellipse cx="-3" cy="2" rx="3" ry="4" fill="${theme.colors[1]}" transform="rotate(-20)"/>
          <ellipse cx="3" cy="2" rx="3" ry="4" fill="${theme.colors[1]}" transform="rotate(20)"/>
          <line x1="0" y1="-3" x2="0" y2="3" stroke="${theme.colors[0]}" stroke-width="1"/>
        </g>
        
        <!-- Rainfall effect -->
        <g opacity="0.15">
          <line x1="80" y1="0" x2="78" y2="30" stroke="${theme.colors[2]}" stroke-width="0.5"/>
          <line x1="320" y1="0" x2="318" y2="35" stroke="${theme.colors[1]}" stroke-width="0.5"/>
          <line x1="150" y1="50" x2="148" y2="80" stroke="${theme.colors[2]}" stroke-width="0.5"/>
        </g>
      </g>
    `;
  }

  /**
   * Create Karura forest elements adapted for hummingbird badge
   */
  private createKaruraHummingbirdElements(theme: any): string {
    return `
      <!-- Karura urban forest elements around hummingbird -->
      <g opacity="0.2">
        <!-- Tree silhouettes in background -->
        <circle cx="80" cy="320" r="25" fill="${theme.colors[0]}"/>
        <circle cx="70" cy="325" r="18" fill="${theme.colors[0]}" opacity="0.8"/>
        <circle cx="90" cy="325" r="18" fill="${theme.colors[0]}" opacity="0.8"/>
        
        <circle cx="320" cy="310" r="20" fill="${theme.colors[1]}"/>
        <circle cx="312" cy="315" r="14" fill="${theme.colors[1]}" opacity="0.8"/>
        <circle cx="328" cy="315" r="14" fill="${theme.colors[1]}" opacity="0.8"/>
        
        <!-- Birds in flight -->
        <g opacity="0.25">
          <path d="M 100 120 Q 95 117 90 120 Q 95 117 100 120" 
                fill="none" stroke="${theme.colors[0]}" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 300 100 Q 295 97 290 100 Q 295 97 300 100" 
                fill="none" stroke="${theme.colors[1]}" stroke-width="1.5" stroke-linecap="round"/>
        </g>
        
        <!-- Geometric nature elements -->
        <rect x="60" y="60" width="8" height="8" fill="none" stroke="${theme.colors[0]}" stroke-width="1" opacity="0.3"/>
        <circle cx="340" cy="70" r="6" fill="none" stroke="${theme.colors[1]}" stroke-width="1" opacity="0.3"/>
        
        <!-- Subtle city skyline -->
        <g opacity="0.1">
          <rect x="50" y="350" width="15" height="50" fill="${theme.colors[1]}"/>
          <rect x="70" y="340" width="12" height="60" fill="${theme.colors[1]}"/>
          <rect x="320" y="345" width="18" height="55" fill="${theme.colors[1]}"/>
          <rect x="345" y="355" width="14" height="45" fill="${theme.colors[1]}"/>
        </g>
      </g>
    `;
  }

  /**
   * Create Mau forest elements adapted for hummingbird badge
   */
  private createMauHummingbirdElements(theme: any): string {
    return `
      <!-- Mau highland elements around hummingbird -->
      <g opacity="0.2">
        <!-- Mountain ridges -->
        <path d="M 0 350 L 60 320 L 100 340 L 150 310 L 200 330 L 250 315 L 300 335 L 350 320 L 400 340 L 400 350 Z" 
              fill="${theme.colors[0]}"/>
        
        <!-- Water stream -->
        <path d="M 80 300 Q 100 320 120 350 Q 130 370 140 400" 
              fill="none" stroke="${theme.colors[2]}" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
        <path d="M 280 310 Q 260 330 240 360 Q 230 380 220 400" 
              fill="none" stroke="${theme.colors[2]}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
        
        <!-- Highland mist -->
        <ellipse cx="150" cy="280" rx="40" ry="12" fill="${theme.colors[2]}" opacity="0.3"/>
        <ellipse cx="280" cy="290" rx="35" ry="10" fill="${theme.colors[2]}" opacity="0.3"/>
        
        <!-- Conifer trees -->
        <g transform="translate(70, 330)" opacity="0.4">
          <path d="M 0 0 L -6 12 L 6 12 Z" fill="${theme.colors[0]}"/>
          <path d="M 0 6 L -8 18 L 8 18 Z" fill="${theme.colors[0]}"/>
          <rect x="-1.5" y="18" width="3" height="8" fill="${theme.colors[1]}"/>
        </g>
        
        <g transform="translate(330, 325)" opacity="0.4">
          <path d="M 0 0 L -5 10 L 5 10 Z" fill="${theme.colors[1]}"/>
          <path d="M 0 5 L -7 15 L 7 15 Z" fill="${theme.colors[1]}"/>
          <rect x="-1" y="15" width="2" height="6" fill="${theme.colors[0]}"/>
        </g>
        
        <!-- Snow caps on distant peaks -->
        <ellipse cx="150" cy="310" rx="12" ry="4" fill="${theme.colors[2]}" opacity="0.5"/>
        <ellipse cx="250" cy="315" rx="10" ry="3" fill="${theme.colors[2]}" opacity="0.5"/>
      </g>
    `;
  }

  /**
   * Get color palette based on configuration
   */
  private getColorPalette(palette: string, forest: string): {
    body: { start: string; middle: string; end: string };
    wings: { start: string; middle1: string; middle2: string; end: string };
    shimmer: { intensity: number };
  } {
    const forestTheme = getForestTheme(forest as any);
    
    switch (palette) {
      case 'vibrant':
        return {
          body: { start: '#20B2AA', middle: '#48D1CC', end: '#00CED1' },
          wings: { start: '#2E8B57', middle1: '#3CB371', middle2: '#20B2AA', end: '#48D1CC' },
          shimmer: { intensity: 0.8 },
        };
      case 'subtle':
        return {
          body: { start: '#5F9EA0', middle: '#708090', end: '#778899' },
          wings: { start: '#696969', middle1: '#708090', middle2: '#778899', end: '#87CEEB' },
          shimmer: { intensity: 0.4 },
        };
      case 'forest-themed':
        return {
          body: { start: forestTheme.colors[0], middle: forestTheme.colors[1], end: forestTheme.colors[2] },
          wings: { start: forestTheme.colors[0], middle1: forestTheme.colors[1], middle2: forestTheme.colors[2], end: forestTheme.colors[1] },
          shimmer: { intensity: 0.6 },
        };
      default:
        return this.getColorPalette('vibrant', forest);
    }
  }

  /**
   * Get tier-specific visual effects
   */
  private getTierSpecificEffects(tier: string): {
    glassBlur: number;
    glassOpacity: number;
    glowRadius: number;
    shadowBlur: number;
    shadowOffset: number;
    shadowOpacity: number;
    additionalFilters: string;
  } {
    const effects = {
      bronze: {
        glassBlur: 8,
        glassOpacity: 0.15,
        glowRadius: 2,
        shadowBlur: 3,
        shadowOffset: 1,
        shadowOpacity: 0.2,
        additionalFilters: '',
      },
      silver: {
        glassBlur: 10,
        glassOpacity: 0.2,
        glowRadius: 3,
        shadowBlur: 4,
        shadowOffset: 2,
        shadowOpacity: 0.25,
        additionalFilters: `
          <filter id="silverShine">
            <feGaussianBlur stdDeviation="2" result="shine"/>
            <feFlood flood-color="#E8E8E8" flood-opacity="0.3"/>
            <feComposite in2="shine" operator="in" result="shineEffect"/>
            <feMerge>
              <feMergeNode in="SourceGraphic"/>
              <feMergeNode in="shineEffect"/>
            </feMerge>
          </filter>
        `,
      },
      gold: {
        glassBlur: 12,
        glassOpacity: 0.25,
        glowRadius: 4,
        shadowBlur: 5,
        shadowOffset: 2,
        shadowOpacity: 0.3,
        additionalFilters: `
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="3" result="glow"/>
            <feFlood flood-color="#FFD700" flood-opacity="0.4"/>
            <feComposite in2="glow" operator="in" result="goldEffect"/>
            <feMerge>
              <feMergeNode in="goldEffect"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        `,
      },
      platinum: {
        glassBlur: 14,
        glassOpacity: 0.3,
        glowRadius: 5,
        shadowBlur: 6,
        shadowOffset: 3,
        shadowOpacity: 0.35,
        additionalFilters: `
          <filter id="platinumLuster">
            <feGaussianBlur stdDeviation="4" result="luster"/>
            <feFlood flood-color="#FFFFFF" flood-opacity="0.5"/>
            <feComposite in2="luster" operator="in" result="platinumEffect"/>
            <feMerge>
              <feMergeNode in="platinumEffect"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        `,
      },
      diamond: {
        glassBlur: 16,
        glassOpacity: 0.35,
        glowRadius: 6,
        shadowBlur: 8,
        shadowOffset: 4,
        shadowOpacity: 0.4,
        additionalFilters: `
          <filter id="diamondSparkle">
            <feGaussianBlur stdDeviation="5" result="sparkle"/>
            <feFlood flood-color="#B9F2FF" flood-opacity="0.6"/>
            <feComposite in2="sparkle" operator="in" result="sparkleEffect"/>
            <feGaussianBlur in="sparkleEffect" stdDeviation="1" result="sparkleBlur"/>
            <feMerge>
              <feMergeNode in="sparkleBlur"/>
              <feMergeNode in="sparkleEffect"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        `,
      },
    };
    
    return effects[tier as keyof typeof effects] || effects.bronze;
  }

  /**
   * Lighten a hex color by percentage
   */
  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, ((num >> 16) & 0xff) + amt);
    const G = Math.min(255, ((num >> 8) & 0xff) + amt);
    const B = Math.min(255, (num & 0xff) + amt);
    return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, '0')}`;
  }

  /**
   * Darken a hex color by percentage
   */
  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, ((num >> 16) & 0xff) - amt);
    const G = Math.max(0, ((num >> 8) & 0xff) - amt);
    const B = Math.max(0, (num & 0xff) - amt);
    return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, '0')}`;
  }

  /**
   * Get default forest pattern
   */
  private getDefaultForestPattern(): string {
    return `
      <circle cx="100" cy="100" r="30" fill="#2D5016" opacity="0.3"/>
      <circle cx="300" cy="150" r="40" fill="#2D5016" opacity="0.3"/>
      <circle cx="200" cy="300" r="35" fill="#2D5016" opacity="0.3"/>
    `;
  }

  /**
   * Remove animations from SVG
   */
  private removeAnimations(svg: string): string {
    return svg.replace(/<animateTransform[^>]*>[\s\S]*?<\/animateTransform>/g, '');
  }

  /**
   * Enhance animations in SVG
   */
  private enhanceAnimations(svg: string): string {
    // Add more dynamic wing flapping
    return svg.replace(
      'dur="0.3s"',
      'dur="0.2s"'
    ).replace(
      'repeatCount="indefinite"',
      'repeatCount="indefinite" begin="0s;2s"'
    );
  }

  /**
   * Embed hummingbird-specific metadata
   */
  private embedHummingbirdMetadata(svg: string, metadata: HummingbirdBadgeMetadata): string {
    // Safely access metadata properties with fallbacks
    const badgeName = metadata?.badgeName || 'Hummingbird Welcome Badge';
    const tierLevel = metadata?.tierLevel || 1;
    const forestName = metadata?.forestName || 'Forest';
    const achievementType = metadata?.achievementType || 'welcome_badge';
    const earnedDate = metadata?.earnedDate || new Date().toISOString();
    const uniqueBadgeId = metadata?.uniqueBadgeId || 'unknown';
    const userId = metadata?.userId || 'unknown';
    const welcomeMessage = metadata?.welcomeMessage || 'Welcome to the #GangGreen community!';
    const registrationDate = metadata?.registrationDate || earnedDate;
    const platformVersion = metadata?.platformVersion || '1.0.0';
    
    const metadataXML = `
    <metadata>
      <badge>
        <name>${this.escapeXML(badgeName)}</name>
        <tier>${tierLevel}</tier>
        <forest>${this.escapeXML(forestName)}</forest>
        <achievement>${achievementType}</achievement>
        <count>1</count>
        <date>${earnedDate}</date>
        <id>${uniqueBadgeId}</id>
        <user>${userId}</user>
        <welcomeMessage>${this.escapeXML(welcomeMessage)}</welcomeMessage>
        <registrationDate>${registrationDate}</registrationDate>
        <platformVersion>${platformVersion}</platformVersion>
      </badge>
    </metadata>
    `;
    
    // Insert metadata after opening svg tag
    return svg.replace(/<svg([^>]*)>/, `<svg$1>${metadataXML}`);
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Create default hummingbird badge configuration
   */
  createDefaultHummingbirdConfig(userId: string, tier: string = 'bronze', forest: string = 'kakamega'): HummingbirdBadgeConfig {
    const now = new Date().toISOString();
    
    return {
      id: `hummingbird-welcome-${userId}-${Date.now()}`,
      tier: tier as any,
      forest: forest as any,
      achievement: 'welcome_badge',
      wingStyle: 'hybrid',
      colorPalette: 'vibrant',
      animationLevel: 'subtle',
      metadata: {
        badgeName: 'Hummingbird Welcome Badge',
        tierLevel: 1,
        forestName: forest.charAt(0).toUpperCase() + forest.slice(1) + ' Forest',
        achievementType: 'welcome_badge',
        achievementCount: 1,
        earnedDate: now,
        uniqueBadgeId: `hummingbird-${userId}-${Date.now()}`,
        userId,
        welcomeMessage: 'Welcome to the #GangGreen community!',
        registrationDate: now,
        platformVersion: '1.0.0',
      } as HummingbirdBadgeMetadata,
    };
  }

  /**
   * Add accessibility attributes to SVG
   */
  private addAccessibilityAttributes(svg: string, config: HummingbirdBadgeConfig): string {
    const metadata = (config.metadata || {}) as HummingbirdBadgeMetadata;
    const tierName = config.tier ? config.tier.charAt(0).toUpperCase() + config.tier.slice(1) : 'Bronze';
    const badgeName = metadata.badgeName || 'Hummingbird Welcome Badge';
    const forestName = metadata.forestName || 'Forest';
    const welcomeMessage = metadata.welcomeMessage || 'Welcome to the #GangGreen community!';
    const earnedDate = metadata.earnedDate ? new Date(metadata.earnedDate).toLocaleDateString() : new Date().toLocaleDateString();
    
    // Create accessibility content
    const title = `${badgeName} - ${tierName} tier badge for ${forestName}`;
    const description = `Welcome badge featuring an abstract hummingbird design. ${welcomeMessage} Earned on ${earnedDate}.`;
    
    // Add accessibility attributes to the root SVG element
    const accessibleSvg = svg.replace(
      /<svg([^>]*)>/,
      `<svg$1 role="img" aria-labelledby="badge-title-${config.id}" aria-describedby="badge-desc-${config.id}">`
    );

    // Add title and description elements
    const accessibilityElements = `
      <title id="badge-title-${config.id}">${this.escapeXML(title)}</title>
      <desc id="badge-desc-${config.id}">${this.escapeXML(description)}</desc>
    `;

    // Insert accessibility elements after the opening svg tag and metadata
    return accessibleSvg.replace(
      /(<svg[^>]*>)(\s*<metadata>[\s\S]*?<\/metadata>)?/,
      `$1$2${accessibilityElements}`
    );
  }

  /**
   * Ensure WCAG AA color contrast compliance
   */
  private async ensureWCAGCompliance(svg: string, _config: HummingbirdBadgeConfig): Promise<string> {
    // Extract colors from SVG and check contrast ratios
    const colorPairs = this.extractColorPairs(svg);
    let compliantSvg = svg;

    for (const pair of colorPairs) {
      const contrastRatio = this.calculateContrastRatio(pair.foreground, pair.background);
      
      // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
      const requiredRatio = pair.isLargeText ? 3.0 : 4.5;
      
      if (contrastRatio < requiredRatio) {
        // Adjust colors to meet contrast requirements
        const adjustedColor = this.adjustColorForContrast(pair.foreground, pair.background, requiredRatio);
        compliantSvg = compliantSvg.replace(
          new RegExp(pair.foreground, 'g'),
          adjustedColor
        );
        
        console.log(`[HummingbirdBadgeService] Adjusted color for WCAG compliance: ${pair.foreground} -> ${adjustedColor}`);
      }
    }

    return compliantSvg;
  }

  /**
   * Optimize SVG for social media platforms
   */
  private optimizeForSocialMedia(svg: string, platform?: string): string {
    let optimizedSvg = svg;

    // Platform-specific optimizations
    switch (platform) {
      case 'twitter':
        // Twitter prefers high contrast and bold elements
        optimizedSvg = this.enhanceContrast(optimizedSvg, 1.2);
        optimizedSvg = this.increaseBorderWidth(optimizedSvg, 1.5);
        break;
      case 'facebook':
        // Facebook works well with vibrant colors
        optimizedSvg = this.enhanceVibrance(optimizedSvg, 1.1);
        break;
      case 'instagram':
        // Instagram benefits from square format optimization
        optimizedSvg = this.optimizeForSquareFormat(optimizedSvg);
        break;
      case 'linkedin':
        // LinkedIn prefers professional, subtle styling
        optimizedSvg = this.applyProfessionalStyling(optimizedSvg);
        break;
    }

    // Add social media metadata
    optimizedSvg = this.addSocialMediaMetadata(optimizedSvg, platform);

    return optimizedSvg;
  }

  /**
   * Add interactive features (hover states and animations)
   */
  private addInteractiveFeatures(svg: string, config: HummingbirdBadgeConfig): string {
    if (config.animationLevel === 'none') {
      return svg;
    }

    const interactiveCSS = `
      <style>
        <![CDATA[
          .hummingbird-badge {
            transition: all 0.3s ease;
          }
          
          .hummingbird-badge:hover {
            transform: scale(1.05);
            filter: brightness(1.1);
          }
          
          .hummingbird-wings {
            transform-origin: center;
            animation: wingFlutter 2s ease-in-out infinite;
          }
          
          .hummingbird-badge:hover .hummingbird-wings {
            animation-duration: 0.5s;
          }
          
          .hummingbird-shimmer {
            opacity: 0.6;
            animation: shimmer 3s ease-in-out infinite;
          }
          
          @keyframes wingFlutter {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(2deg); }
            75% { transform: rotate(-2deg); }
          }
          
          @keyframes shimmer {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          
          .tier-glow {
            filter: drop-shadow(0 0 8px currentColor);
            animation: tierPulse 4s ease-in-out infinite;
          }
          
          @keyframes tierPulse {
            0%, 100% { filter: drop-shadow(0 0 8px currentColor); }
            50% { filter: drop-shadow(0 0 12px currentColor); }
          }
        ]]>
      </style>
    `;

    // Add CSS to the SVG
    let interactiveSvg = svg.replace(
      /<defs>/,
      `<defs>${interactiveCSS}`
    );

    // Add CSS classes to relevant elements
    interactiveSvg = interactiveSvg.replace(
      /<g id="hummingbird-body"/g,
      '<g id="hummingbird-body" class="hummingbird-badge"'
    );

    interactiveSvg = interactiveSvg.replace(
      /<g id="hummingbird-wings"/g,
      '<g id="hummingbird-wings" class="hummingbird-wings"'
    );

    interactiveSvg = interactiveSvg.replace(
      /id="hummingbirdShimmer"/g,
      'id="hummingbirdShimmer" class="hummingbird-shimmer"'
    );

    interactiveSvg = interactiveSvg.replace(
      /id="tierGlow"/g,
      'id="tierGlow" class="tier-glow"'
    );

    return interactiveSvg;
  }

  /**
   * Export SVG to PNG with specified size
   */
  private async exportToPng(svgString: string, size: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Set high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          // Fill with transparent background
          ctx.clearRect(0, 0, size, size);
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, size, size);

          // Convert to PNG blob with high quality
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create PNG blob'));
              }
            },
            'image/png',
            1.0
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load SVG image'));
        };

        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get appropriate size for social media platform
   */
  private getSizeForPlatform(platform?: string, customSize?: number): number {
    if (customSize) return customSize;

    const sizes: Record<string, number> = {
      twitter: 1200,
      facebook: 1200,
      instagram: 1080,
      linkedin: 1200,
      'twitter-profile': 400,
      'facebook-profile': 400,
      'instagram-story': 1080,
    };

    return platform ? sizes[platform] || 1200 : 1200;
  }

  /**
   * Extract color pairs from SVG for contrast checking
   */
  private extractColorPairs(svg: string): Array<{
    foreground: string;
    background: string;
    isLargeText: boolean;
  }> {
    const pairs: Array<{ foreground: string; background: string; isLargeText: boolean }> = [];
    
    // Extract text elements and their backgrounds
    const textMatches = svg.match(/<text[^>]*>[\s\S]*?<\/text>/g) || [];
    
    for (const textMatch of textMatches) {
      const fillMatch = textMatch.match(/fill="([^"]+)"/);
      const fontSizeMatch = textMatch.match(/font-size="(\d+)"/);
      
      if (fillMatch) {
        const foreground = fillMatch[1];
        const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 16;
        const isLargeText = fontSize >= 18;
        
        // For now, assume white background for contrast checking
        // In a more sophisticated implementation, we'd extract the actual background
        pairs.push({
          foreground,
          background: '#FFFFFF',
          isLargeText,
        });
      }
    }

    return pairs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   */
  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Adjust color to meet contrast requirements
   */
  private adjustColorForContrast(foreground: string, background: string, targetRatio: number): string {
    const fgRgb = this.hexToRgb(foreground);
    
    if (!fgRgb) return foreground;

    // Try darkening or lightening the foreground color
    let adjustedColor = foreground;
    let bestRatio = this.calculateContrastRatio(foreground, background);

    // Try different adjustments
    for (let adjustment = 0.1; adjustment <= 1; adjustment += 0.1) {
      // Try darkening
      const darkerColor = this.adjustBrightness(foreground, -adjustment);
      const darkerRatio = this.calculateContrastRatio(darkerColor, background);
      
      if (darkerRatio >= targetRatio && darkerRatio > bestRatio) {
        adjustedColor = darkerColor;
        bestRatio = darkerRatio;
      }

      // Try lightening
      const lighterColor = this.adjustBrightness(foreground, adjustment);
      const lighterRatio = this.calculateContrastRatio(lighterColor, background);
      
      if (lighterRatio >= targetRatio && lighterRatio > bestRatio) {
        adjustedColor = lighterColor;
        bestRatio = lighterRatio;
      }

      // If we've met the target, stop
      if (bestRatio >= targetRatio) break;
    }

    return adjustedColor;
  }

  /**
   * Adjust brightness of a hex color
   */
  private adjustBrightness(hex: string, factor: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const adjust = (value: number) => {
      if (factor > 0) {
        // Lighten
        return Math.min(255, Math.round(value + (255 - value) * factor));
      } else {
        // Darken
        return Math.max(0, Math.round(value * (1 + factor)));
      }
    };

    const r = adjust(rgb.r).toString(16).padStart(2, '0');
    const g = adjust(rgb.g).toString(16).padStart(2, '0');
    const b = adjust(rgb.b).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  }

  /**
   * Enhance contrast of SVG elements
   */
  private enhanceContrast(svg: string, factor: number): string {
    // Increase stroke widths and adjust opacity for better contrast
    return svg
      .replace(/stroke-width="([^"]+)"/g, (_match, width) => {
        const newWidth = parseFloat(width) * factor;
        return `stroke-width="${newWidth}"`;
      })
      .replace(/opacity="0\.([^"]+)"/g, (_match, decimal) => {
        const newOpacity = Math.min(1, parseFloat(`0.${decimal}`) * factor);
        return `opacity="${newOpacity}"`;
      });
  }

  /**
   * Increase border width for better visibility
   */
  private increaseBorderWidth(svg: string, factor: number): string {
    return svg.replace(/stroke-width="([^"]+)"/g, (_match, width) => {
      const newWidth = parseFloat(width) * factor;
      return `stroke-width="${newWidth}"`;
    });
  }

  /**
   * Enhance color vibrance
   */
  private enhanceVibrance(svg: string, _factor: number): string {
    // This is a simplified implementation - in practice, you'd parse and adjust HSL values
    return svg.replace(/stop-color="([^"]+)"/g, (match) => {
      // For now, just return the original color
      // A full implementation would convert to HSL, increase saturation, and convert back
      return match;
    });
  }

  /**
   * Optimize for square format (Instagram)
   */
  private optimizeForSquareFormat(svg: string): string {
    // Ensure the badge fits well in a square format
    return svg.replace(/viewBox="([^"]+)"/, 'viewBox="0 0 500 500"');
  }

  /**
   * Apply professional styling for LinkedIn
   */
  private applyProfessionalStyling(svg: string): string {
    // Reduce animation intensity and use more subtle colors
    return svg
      .replace(/animation-duration: 0\.5s/g, 'animation-duration: 1s')
      .replace(/opacity: 1/g, 'opacity: 0.8');
  }

  /**
   * Add social media metadata to SVG
   */
  private addSocialMediaMetadata(svg: string, platform?: string): string {
    const socialMetadata = `
      <metadata>
        <social>
          <platform>${platform || 'general'}</platform>
          <optimized>true</optimized>
          <hashtags>#GangGreen #WelcomeBadge #CommunityEngagement</hashtags>
        </social>
      </metadata>
    `;

    return svg.replace(/<metadata>/, `<metadata>${socialMetadata}`);
  }

  /**
   * Validate hummingbird badge configuration
   */
  validateHummingbirdConfig(config: HummingbirdBadgeConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (config.achievement !== 'welcome_badge') {
      errors.push('Achievement type must be welcome_badge for hummingbird badges');
    }
    
    if (config.wingStyle && !['geometric', 'organic', 'hybrid'].includes(config.wingStyle)) {
      errors.push('Invalid wing style. Must be geometric, organic, or hybrid');
    }
    
    if (config.colorPalette && !['vibrant', 'subtle', 'forest-themed'].includes(config.colorPalette)) {
      errors.push('Invalid color palette. Must be vibrant, subtle, or forest-themed');
    }
    
    if (config.animationLevel && !['none', 'subtle', 'dynamic'].includes(config.animationLevel)) {
      errors.push('Invalid animation level. Must be none, subtle, or dynamic');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate optimized hummingbird badge with performance validation
   */
  async generateOptimizedHummingbirdBadge(config: HummingbirdBadgeConfig): Promise<{
    result: BadgeGenerationResult;
    validation: ValidationResult;
  }> {
    try {
      // Use performance service for optimized generation
      const optimizedResult = await hummingbirdBadgePerformanceService.optimizeGeneration(config);
      
      // Validate the result
      const validation = await hummingbirdBadgePerformanceService.validateHummingbirdBadge(
        config,
        optimizedResult.svg
      );

      return {
        result: {
          success: true,
          svg: optimizedResult.svg,
          metadata: config.metadata,
        },
        validation,
      };
    } catch (error) {
      console.error('[HummingbirdBadgeService] Optimized generation failed:', error);
      
      // Fallback to regular generation
      const fallbackResult = await this.generateHummingbirdBadge(config);
      const validation = await hummingbirdBadgePerformanceService.validateHummingbirdBadge(
        config,
        fallbackResult.svg
      );

      return {
        result: fallbackResult,
        validation,
      };
    }
  }

  /**
   * Validate performance requirements for existing badge
   */
  async validatePerformanceRequirements(
    config: HummingbirdBadgeConfig,
    svg?: string
  ): Promise<ValidationResult> {
    return await hummingbirdBadgePerformanceService.validateHummingbirdBadge(config, svg);
  }

  /**
   * Test vector scalability across size range
   */
  async testVectorScalability(svg: string): Promise<boolean> {
    try {
      const testSizes = [50, 100, 200, 400, 800, 1200];
      
      for (const size of testSizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;

        const img = new Image();
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const renderTest = new Promise<boolean>((resolve) => {
          img.onload = () => {
            try {
              ctx.drawImage(img, 0, 0, size, size);
              URL.revokeObjectURL(url);
              resolve(true);
            } catch (error) {
              URL.revokeObjectURL(url);
              resolve(false);
            }
          };

          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(false);
          };

          setTimeout(() => {
            URL.revokeObjectURL(url);
            resolve(false);
          }, 1000);
        });

        img.src = url;
        
        const renderSuccess = await renderTest;
        if (!renderSuccess) {
          console.warn(`[HummingbirdBadgeService] Scalability test failed at ${size}px`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[HummingbirdBadgeService] Scalability test error:', error);
      return false;
    }
  }

  /**
   * Test background contrast compatibility
   */
  async testBackgroundCompatibility(svg: string): Promise<boolean> {
    const testBackgrounds = [
      '#FFFFFF', '#000000', '#808080', '#FF0000', 
      '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
    ];

    for (const backgroundColor of testBackgrounds) {
      const contrastTest = await this.testSingleBackgroundContrast(svg, backgroundColor);
      if (!contrastTest) {
        console.warn(`[HummingbirdBadgeService] Contrast test failed for background: ${backgroundColor}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Test contrast against a single background color
   */
  private async testSingleBackgroundContrast(svg: string, backgroundColor: string): Promise<boolean> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return false;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, 400, 400);

      const img = new Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const contrastTest = new Promise<boolean>((resolve) => {
        img.onload = () => {
          try {
            ctx.drawImage(img, 0, 0, 400, 400);
            
            const imageData = ctx.getImageData(0, 0, 400, 400);
            const pixels = imageData.data;
            
            let hasContrast = false;
            const bgRgb = this.hexToRgb(backgroundColor);
            
            if (bgRgb) {
              for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];
                
                if (a < 128) continue;
                
                const colorDiff = Math.abs(r - bgRgb.r) + Math.abs(g - bgRgb.g) + Math.abs(b - bgRgb.b);
                if (colorDiff > 100) {
                  hasContrast = true;
                  break;
                }
              }
            }
            
            URL.revokeObjectURL(url);
            resolve(hasContrast);
          } catch (error) {
            URL.revokeObjectURL(url);
            resolve(false);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(false);
        };

        setTimeout(() => {
          URL.revokeObjectURL(url);
          resolve(false);
        }, 1000);
      });

      img.src = url;
      return await contrastTest;
    } catch (error) {
      console.error('[HummingbirdBadgeService] Background contrast test error:', error);
      return false;
    }
  }

}

// Export singleton instance
export const hummingbirdBadgeService = new HummingbirdBadgeService();

// Export classes for testing and usage
export { HummingbirdBadgeService, HummingbirdBadgeGenerator };

/**
 * Factory function to create a hummingbird badge generator
 */
export function createHummingbirdBadgeGenerator(config: HummingbirdBadgeConfig): HummingbirdBadgeGenerator {
  return new HummingbirdBadgeGenerator(config);
}

/**
 * Quick generation function for common use cases with performance optimization
 */
export async function generateWelcomeBadge(
  userId: string,
  options: {
    tier?: string;
    forest?: string;
    wingStyle?: 'geometric' | 'organic' | 'hybrid';
    colorPalette?: 'vibrant' | 'subtle' | 'forest-themed';
    animationLevel?: 'none' | 'subtle' | 'dynamic';
    optimized?: boolean;
  } = {}
): Promise<BadgeGenerationResult> {
  const config = hummingbirdBadgeService.createDefaultHummingbirdConfig(
    userId,
    options.tier,
    options.forest
  );
  
  if (options.wingStyle) config.wingStyle = options.wingStyle;
  if (options.colorPalette) config.colorPalette = options.colorPalette;
  if (options.animationLevel) config.animationLevel = options.animationLevel;
  
  // Use optimized generation by default
  if (options.optimized !== false) {
    try {
      const optimizedResult = await hummingbirdBadgeService.generateOptimizedHummingbirdBadge(config);
      
      if (optimizedResult.validation.isValid) {
        return optimizedResult.result;
      } else {
        console.warn('[generateWelcomeBadge] Optimized generation validation failed, using fallback:', 
          optimizedResult.validation.errors);
      }
    } catch (error) {
      console.warn('[generateWelcomeBadge] Optimized generation failed, using fallback:', error);
    }
  }
  
  // Fallback to regular generation
  const generator = new HummingbirdBadgeGenerator(config);
  return await generator.generate();
}

/**
 * Generate social media ready hummingbird badge
 */
export async function generateSocialMediaBadge(
  userId: string,
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin',
  options: {
    tier?: string;
    forest?: string;
    format?: 'svg' | 'png';
  } = {}
): Promise<Blob> {
  const config = hummingbirdBadgeService.createDefaultHummingbirdConfig(
    userId,
    options.tier,
    options.forest
  );

  // Optimize for social media
  config.colorPalette = 'vibrant';
  config.animationLevel = platform === 'instagram' ? 'dynamic' : 'subtle';

  return await hummingbirdBadgeService.exportHummingbirdBadge(config, {
    format: options.format || 'png',
    platform,
    socialMediaOptimized: true,
    wcagCompliant: true,
    includeAccessibility: true,
  });
}

/**
 * Get social media sharing text for hummingbird badge
 */
export function getSocialMediaText(
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin',
  _userDisplayName?: string
): string {
  const baseText = `Just joined the #GangGreen community and earned my Hummingbird Welcome Badge! 🌱✨`;
  const hashtags = '#GangGreen #CommunityEngagement #Sustainability #WangariMaathai';
  const callToAction = 'Join us in making Africa carbon-negative!';

  switch (platform) {
    case 'twitter':
      return `${baseText} ${callToAction} ${hashtags}`;
    case 'facebook':
      return `${baseText}\n\n${callToAction}\n\n${hashtags}`;
    case 'instagram':
      return `${baseText}\n\n${callToAction}\n\n${hashtags} #NewMember #WelcomeBadge`;
    case 'linkedin':
      return `Excited to announce that I've joined the #GangGreen platform! Just received my Hummingbird Welcome Badge as I begin my journey in community-driven environmental action.\n\n${callToAction}\n\n${hashtags} #ProfessionalDevelopment #EnvironmentalAction`;
    default:
      return `${baseText} ${callToAction} ${hashtags}`;
  }
}

/**
 * Validate performance requirements for hummingbird badge
 */
export async function validateHummingbirdPerformance(
  config?: HummingbirdBadgeConfig,
  svg?: string
): Promise<ValidationResult> {
  if (!config) {
    config = hummingbirdBadgeService.createDefaultHummingbirdConfig('validation-test');
  }
  
  return await hummingbirdBadgePerformanceService.validateHummingbirdBadge(config, svg);
}

/**
 * Validate badge for accessibility compliance
 */
export async function validateBadgeAccessibility(svgString: string): Promise<{
  compliant: boolean;
  issues: string[];
  suggestions: string[];
}> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for accessibility attributes
  if (!svgString.includes('role="img"')) {
    issues.push('Missing role="img" attribute');
    suggestions.push('Add role="img" to the root SVG element');
  }

  if (!svgString.includes('aria-labelledby')) {
    issues.push('Missing aria-labelledby attribute');
    suggestions.push('Add aria-labelledby pointing to a title element');
  }

  if (!svgString.includes('<title')) {
    issues.push('Missing title element');
    suggestions.push('Add a descriptive title element for screen readers');
  }

  if (!svgString.includes('<desc')) {
    issues.push('Missing description element');
    suggestions.push('Add a desc element with detailed badge information');
  }

  // Check for color contrast (simplified check)
  const textElements = svgString.match(/<text[^>]*fill="([^"]+)"[^>]*>/g) || [];
  if (textElements.length > 0) {
    // This is a simplified check - in practice, you'd analyze the actual background colors
    const hasLowContrastText = textElements.some(text => {
      const colorMatch = text.match(/fill="([^"]+)"/);
      if (colorMatch) {
        const color = colorMatch[1].toLowerCase();
        // Check for potentially low contrast colors
        return color.includes('gray') || color.includes('silver') || color === '#999999';
      }
      return false;
    });

    if (hasLowContrastText) {
      issues.push('Potentially low contrast text detected');
      suggestions.push('Ensure all text meets WCAG AA contrast requirements (4.5:1 for normal text)');
    }
  }

  return {
    compliant: issues.length === 0,
    issues,
    suggestions,
  };
}