/**
 * Badge SVG Generation Service
 * Main service for generating NFT badge SVGs
 */

import { BadgeConfig, BadgeGenerationResult, BadgeExportOptions } from '../types/badge.types';
import { generateSVGDefs } from '../utils/svgGenerators';
import { renderIcon } from '../utils/badgeIconRenderer';
import {
  loadBaseTemplate,
  loadForestPattern,
  replacePlaceholders,
  embedMetadata,
  validateBadgeConfig,
  optimizeSVG,
  extractSVGContent,
} from '../utils/badgeTemplateLoader';
import { BADGE_VIEWBOX } from '../assets/badges';
import { optimizeBadgeSVG, validateBadgeSVG, ensureSquareAspectRatio } from '../utils/badgeSvgOptimizer';

/**
 * Badge SVG Service Class
 */
class BadgeSvgService {
  private templateCache: Map<string, string> = new Map();
  private patternCache: Map<string, string> = new Map();

  /**
   * Generate complete badge SVG
   */
  async generateBadge(config: BadgeConfig): Promise<BadgeGenerationResult> {
    try {
      // Check if this is a hummingbird welcome badge
      if (config.achievement === 'welcome_badge') {
        const { hummingbirdBadgeService } = await import('./hummingbirdBadge.service');
        return await hummingbirdBadgeService.generateHummingbirdBadge(config as any);
      }

      // Check if this is a Hero badge
      if (config.tier === 'hero' || config.achievement === 'ganggreen_hero') {
        return await this.generateHeroBadge(config);
      }

      // Validate configuration
      const validation = validateBadgeConfig(config);
      if (!validation.valid) {
        console.error('[BadgeSvgService] Invalid configuration:', {
          badgeId: config.id,
          errors: validation.errors,
        });
        return {
          success: false,
          error: `Invalid configuration: ${validation.errors.join(', ')}`,
        };
      }

      // Load base template with error handling
      let template: string;
      try {
        template = await this.getTemplate();
      } catch (templateError) {
        console.error('[BadgeSvgService] Template loading failed:', {
          badgeId: config.id,
          error: templateError,
        });
        // Use fallback badge generation
        return this.generateFallbackBadgeResult(config);
      }

      // Generate SVG defs (gradients and filters)
      let defs: string;
      try {
        defs = generateSVGDefs(config.tier);
      } catch (defsError) {
        console.error('[BadgeSvgService] Defs generation failed:', {
          badgeId: config.id,
          tier: config.tier,
          error: defsError,
        });
        defs = ''; // Continue without defs
      }

      // Load forest pattern with fallback
      let forestPatternContent = '';
      try {
        const forestPattern = await this.getForestPattern(config.forest);
        forestPatternContent = extractSVGContent(forestPattern);
      } catch (patternError) {
        console.warn('[BadgeSvgService] Forest pattern loading failed, using default:', {
          badgeId: config.id,
          forest: config.forest,
          error: patternError,
        });
        // Use default pattern or empty
        forestPatternContent = this.getDefaultForestPattern();
      }

      // Render achievement icon with fallback
      let iconSVG = '';
      try {
        iconSVG = await renderIcon(config.achievement, 200, 180, {
          size: 120,
          backdropOpacity: 0.3,
        });
      } catch (iconError) {
        console.warn('[BadgeSvgService] Icon rendering failed, using fallback:', {
          badgeId: config.id,
          achievement: config.achievement,
          error: iconError,
        });
        iconSVG = this.getFallbackIcon();
      }

      // Build complete SVG
      let svg = template;

      // Replace placeholders
      try {
        svg = replacePlaceholders(svg, config);
      } catch (placeholderError) {
        console.error('[BadgeSvgService] Placeholder replacement failed:', {
          badgeId: config.id,
          error: placeholderError,
        });
        return this.generateFallbackBadgeResult(config);
      }

      // Insert defs
      if (defs) {
        svg = svg.replace('<defs>', `<defs>${defs}`);
      }

      // Insert forest pattern
      if (forestPatternContent) {
        svg = svg.replace(
          '<g id="forest-theme" opacity="0.2">',
          `<g id="forest-theme" opacity="0.2">${forestPatternContent}</g><g>`
        );
      }

      // Insert achievement icon
      if (iconSVG) {
        svg = svg.replace(
          '<!-- Icon will be inserted here -->',
          iconSVG
        );
      }

      // Embed metadata
      try {
        svg = embedMetadata(svg, config.metadata);
      } catch (metadataError) {
        console.warn('[BadgeSvgService] Metadata embedding failed, continuing without:', {
          badgeId: config.id,
          error: metadataError,
        });
        // Continue without metadata
      }

      // Apply comprehensive badge optimizations (viewBox, dimensions, aspect ratio, file size)
      try {
        svg = ensureSquareAspectRatio(svg);
        
        // Use comprehensive optimization that includes both rendering quality and file size
        const { optimizeBadgeComplete } = await import('../utils/badgeSvgOptimizer');
        const optimizationResult = optimizeBadgeComplete(svg, {
          renderingOptions: {
            addRenderingOptimizations: true,
          },
          fileSizeOptions: {
            removeComments: true,
            removeMetadata: !config.animated, // Keep metadata for animated badges
            minifyPaths: true,
            reducePrecision: 2,
            mergeRedundantPaths: true,
            removeEmptyGroups: true,
            removeUnusedDefs: true,
            minifyStyles: true,
            removeWhitespace: true,
          },
        });
        
        svg = optimizationResult.svg;
        
        // Log optimization results
        console.log('[BadgeSvgService] Badge optimization complete:', {
          badgeId: config.id,
          fileSize: `${optimizationResult.fileSize.actualKB}KB`,
          targetMet: optimizationResult.fileSize.passes,
          percentOfTarget: `${optimizationResult.fileSize.percentOfTarget}%`,
          validationPassed: optimizationResult.validation.valid,
        });
        
        // Warn if file size target not met
        if (!optimizationResult.fileSize.passes) {
          console.warn('[BadgeSvgService] Badge exceeds 50KB target:', {
            badgeId: config.id,
            actualKB: optimizationResult.fileSize.actualKB,
            targetKB: optimizationResult.fileSize.targetKB,
          });
        }
        
        // Warn about validation issues
        if (!optimizationResult.validation.valid) {
          console.warn('[BadgeSvgService] Badge SVG validation issues:', {
            badgeId: config.id,
            issues: optimizationResult.validation.issues,
          });
        }
      } catch (badgeOptError) {
        console.warn('[BadgeSvgService] Badge SVG optimization failed, using unoptimized:', {
          badgeId: config.id,
          error: badgeOptError,
        });
        // Continue with unoptimized SVG
      }

      console.log('[BadgeSvgService] Badge generated successfully:', {
        badgeId: config.id,
        tier: config.tier,
        forest: config.forest,
        achievement: config.achievement,
      });

      return {
        success: true,
        svg,
        metadata: config.metadata,
      };
    } catch (error) {
      console.error('[BadgeSvgService] Unexpected error generating badge:', {
        badgeId: config.id,
        tier: config.tier,
        forest: config.forest,
        achievement: config.achievement,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Return fallback badge
      return this.generateFallbackBadgeResult(config);
    }
  }

  /**
   * Export badge to PNG
   */
  async exportToPng(svgString: string, size: number = 1200): Promise<Blob> {
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

        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, size, size);

          // Convert to PNG blob
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
   * Export badge with options
   */
  async exportBadge(
    config: BadgeConfig,
    options: BadgeExportOptions & {
      includeAccessibility?: boolean;
      socialMediaOptimized?: boolean;
      wcagCompliant?: boolean;
    } = { format: 'svg' }
  ): Promise<Blob> {
    // Check if this is a hummingbird badge and use specialized export
    if (config.achievement === 'welcome_badge') {
      const { hummingbirdBadgeService } = await import('./hummingbirdBadge.service');
      return await hummingbirdBadgeService.exportHummingbirdBadge(config as any, options);
    }

    const result = await this.generateBadge(config);

    if (!result.success || !result.svg) {
      throw new Error(result.error || 'Failed to generate badge');
    }

    if (options.format === 'png') {
      const size = options.size || this.getSizeForPlatform(options.platform);
      return await this.exportToPng(result.svg, size);
    }

    // Return SVG as blob
    return new Blob([result.svg], { type: 'image/svg+xml;charset=utf-8' });
  }

  /**
   * Export Hero badge for social sharing
   */
  async exportHeroBadgeForSharing(
    config: BadgeConfig,
    platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' = 'twitter'
  ): Promise<Blob> {
    const size = this.getSizeForPlatform(platform);
    
    return await this.exportBadge(config, {
      format: 'png',
      size,
      platform,
      socialMediaOptimized: true,
    });
  }

  /**
   * Validate generated badge
   */
  validateBadge(svgString: string): boolean {
    try {
      // Check if it's valid XML
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');

      // Check for parse errors
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        console.error('SVG parse error:', parseError.textContent);
        return false;
      }

      // Check for required elements
      const svg = doc.querySelector('svg');
      if (!svg) {
        console.error('No SVG element found');
        return false;
      }

      // Check viewBox
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox !== BADGE_VIEWBOX) {
        console.warn('Unexpected viewBox:', viewBox);
      }

      return true;
    } catch (error) {
      console.error('Badge validation error:', error);
      return false;
    }
  }

  /**
   * Get template (with caching)
   */
  private async getTemplate(): Promise<string> {
    const cacheKey = 'base-template';

    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    const template = await loadBaseTemplate();
    this.templateCache.set(cacheKey, template);
    return template;
  }

  /**
   * Get forest pattern (with caching)
   */
  private async getForestPattern(forest: string): Promise<string> {
    if (this.patternCache.has(forest)) {
      return this.patternCache.get(forest)!;
    }

    const pattern = await loadForestPattern(forest);
    this.patternCache.set(forest, pattern);
    return pattern;
  }

  /**
   * Get export size for social media platform
   */
  private getSizeForPlatform(platform?: string): number {
    const sizes: Record<string, number> = {
      twitter: 1200,
      facebook: 1200,
      instagram: 1080,
      linkedin: 1200,
    };

    return platform ? sizes[platform] || 1200 : 1200;
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.templateCache.clear();
    this.patternCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { templates: number; patterns: number } {
    return {
      templates: this.templateCache.size,
      patterns: this.patternCache.size,
    };
  }

  /**
   * Check if templates are available
   */
  async checkTemplateAvailability(): Promise<boolean> {
    try {
      await this.getTemplate();
      return true;
    } catch (error) {
      console.error('[BadgeSvgService] Template availability check failed:', error);
      return false;
    }
  }

  /**
   * Generate hummingbird welcome badge with options
   */
  async generateHummingbirdBadge(
    userId: string,
    options: {
      tier?: string;
      forest?: string;
      wingStyle?: 'geometric' | 'organic' | 'hybrid';
      colorPalette?: 'vibrant' | 'subtle' | 'forest-themed';
      animationLevel?: 'none' | 'subtle' | 'dynamic';
    } = {}
  ): Promise<BadgeGenerationResult> {
    try {
      const { generateWelcomeBadge } = await import('./hummingbirdBadge.service');
      return await generateWelcomeBadge(userId, options);
    } catch (error) {
      console.error('[BadgeSvgService] Hummingbird badge generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hummingbird badge',
      };
    }
  }

  /**
   * Generate Hero badge SVG with unique styling
   */
  private async generateHeroBadge(config: BadgeConfig): Promise<BadgeGenerationResult> {
    try {
      console.log('[BadgeSvgService] Generating Hero badge:', {
        badgeId: config.id,
        tier: config.tier,
      });

      const badgeName = config.metadata?.badgeName || 'GangGreen Hero';
      const userName = config.metadata?.userName || 'Hero';
      const purchaseDate = config.metadata?.purchaseDate 
        ? new Date(config.metadata.purchaseDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        : new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });

      const svg = `
<svg viewBox="${BADGE_VIEWBOX}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Hero Gradient -->
    <linearGradient id="hero-gradient-${config.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FFA500;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FF8C00;stop-opacity:1" />
    </linearGradient>
    
    <!-- Hero Glow -->
    <filter id="hero-glow-${config.id}">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Hero Shadow -->
    <filter id="hero-shadow-${config.id}">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#FF8C00" flood-opacity="0.5"/>
    </filter>
    
    <!-- Radial Gradient for Background -->
    <radialGradient id="hero-bg-${config.id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="500" height="500" fill="url(#hero-bg-${config.id})"/>
  
  <!-- Outer Ring with Glow -->
  <circle cx="250" cy="250" r="230" fill="none" stroke="url(#hero-gradient-${config.id})" 
          stroke-width="6" filter="url(#hero-glow-${config.id})" opacity="0.8"/>
  
  <!-- Main Badge Circle -->
  <circle cx="250" cy="250" r="200" fill="url(#hero-gradient-${config.id})" 
          filter="url(#hero-shadow-${config.id})"/>
  
  <!-- Inner Circle -->
  <circle cx="250" cy="250" r="170" fill="none" stroke="white" stroke-width="3" opacity="0.4"/>
  
  <!-- Hero Crown Icon -->
  <g transform="translate(250, 200)">
    <path d="M0,-60 L15,-30 L45,-35 L25,-10 L30,20 L0,0 L-30,20 L-25,-10 L-45,-35 L-15,-30 Z" 
          fill="white" opacity="0.95" filter="url(#hero-glow-${config.id})"/>
    <circle cx="0" cy="-60" r="8" fill="white" opacity="0.95"/>
    <circle cx="45" cy="-35" r="6" fill="white" opacity="0.95"/>
    <circle cx="-45" cy="-35" r="6" fill="white" opacity="0.95"/>
  </g>
  
  <!-- Hero Text -->
  <text x="250" y="300" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="42" font-weight="bold" fill="white" opacity="0.95">
    HERO
  </text>
  
  <!-- Badge Name -->
  <text x="250" y="340" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="24" fill="white" opacity="0.85">
    ${badgeName}
  </text>
  
  <!-- User Name -->
  <text x="250" y="380" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="18" fill="white" opacity="0.7">
    ${userName}
  </text>
  
  <!-- Purchase Date -->
  <text x="250" y="410" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="14" fill="white" opacity="0.6">
    ${purchaseDate}
  </text>
  
  <!-- Decorative Stars -->
  <g opacity="0.6">
    <circle cx="100" cy="100" r="3" fill="white"/>
    <circle cx="400" cy="120" r="2" fill="white"/>
    <circle cx="380" cy="380" r="3" fill="white"/>
    <circle cx="120" cy="400" r="2" fill="white"/>
    <circle cx="450" cy="250" r="2" fill="white"/>
    <circle cx="50" cy="250" r="2" fill="white"/>
  </g>
  
  <!-- Metadata -->
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description>
        <dc:title>${badgeName}</dc:title>
        <dc:creator>GangGreen Platform</dc:creator>
        <dc:description>GangGreen Hero Badge - Premium supporter badge with exclusive benefits</dc:description>
        <dc:date>${purchaseDate}</dc:date>
        <dc:type>NFT Badge</dc:type>
        <dc:format>image/svg+xml</dc:format>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
</svg>
      `.trim();

      console.log('[BadgeSvgService] Hero badge generated successfully:', {
        badgeId: config.id,
        userName,
        purchaseDate,
      });

      return {
        success: true,
        svg,
        metadata: {
          ...config.metadata,
          badgeType: 'ganggreen_hero',
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[BadgeSvgService] Hero badge generation failed:', {
        badgeId: config.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate Hero badge',
      };
    }
  }

  /**
   * Generate fallback badge when normal generation fails
   */
  private generateFallbackBadgeResult(config: BadgeConfig): BadgeGenerationResult {
    console.log('[BadgeSvgService] Generating fallback badge:', {
      badgeId: config.id,
      tier: config.tier,
    });

    const svg = this.generateFallbackBadge(config);
    
    return {
      success: true,
      svg,
      metadata: config.metadata,
    };
  }

  /**
   * Generate simple fallback badge SVG
   * Enhanced with tier-specific styling and proper aspect ratio
   */
  private generateFallbackBadge(config: BadgeConfig): string {
    const tierColors: Record<string, { primary: string; secondary: string }> = {
      hummingbird: { primary: '#14B8A6', secondary: '#0D9488' },
      bronze: { primary: '#CD7F32', secondary: '#8B4513' },
      silver: { primary: '#C0C0C0', secondary: '#808080' },
      gold: { primary: '#FFD700', secondary: '#FFA500' },
      platinum: { primary: '#E5E4E2', secondary: '#B0B0B0' },
      diamond: { primary: '#B9F2FF', secondary: '#00CED1' },
      hero: { primary: '#FFD700', secondary: '#FF8C00' },
    };

    const colors = tierColors[config.tier] || tierColors.bronze;
    const badgeName = config.metadata?.badgeName || 'Badge';
    const tierName = config.tier.charAt(0).toUpperCase() + config.tier.slice(1);
    
    // Add glow filter for premium tiers
    const isPremiumTier = ['platinum', 'diamond', 'hero'].includes(config.tier);
    const glowFilter = isPremiumTier
      ? `<filter id="fallback-glow-${config.id}">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>`
      : '';
    
    const glowAttribute = isPremiumTier ? ` filter="url(#fallback-glow-${config.id})"` : '';
    
    // Add decorative stars for diamond tier
    const diamondStars = config.tier === 'diamond'
      ? `<g opacity="0.6">
          <circle cx="100" cy="100" r="3" fill="white"/>
          <circle cx="400" cy="120" r="2" fill="white"/>
          <circle cx="380" cy="380" r="3" fill="white"/>
          <circle cx="120" cy="400" r="2" fill="white"/>
        </g>`
      : '';

    return `
      <svg viewBox="${BADGE_VIEWBOX}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="fallback-gradient-${config.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
          <filter id="fallback-shadow-${config.id}">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
          </filter>
          ${glowFilter}
        </defs>
        
        <!-- Background Circle -->
        <circle cx="250" cy="250" r="180" fill="url(#fallback-gradient-${config.id})" filter="url(#fallback-shadow-${config.id})"/>
        
        <!-- Inner Circle -->
        <circle cx="250" cy="250" r="150" fill="none" stroke="white" stroke-width="3" opacity="0.3"/>
        
        <!-- Award Icon -->
        <g transform="translate(250, 230)">
          <path d="M0,-60 L15,-30 L45,-35 L25,-10 L30,20 L0,0 L-30,20 L-25,-10 L-45,-35 L-15,-30 Z" 
                fill="white" opacity="0.9"${glowAttribute}/>
          ${isPremiumTier ? '<circle cx="0" cy="-60" r="6" fill="white" opacity="0.95"/>' : ''}
        </g>
        
        <!-- Tier Text -->
        <text x="250" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" opacity="0.95">
          ${tierName}
        </text>
        
        <!-- Badge Name -->
        <text x="250" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white" opacity="0.8">
          ${badgeName.length > 20 ? badgeName.substring(0, 20) + '...' : badgeName}
        </text>
        
        ${diamondStars}
        
        <!-- Metadata -->
        <metadata>
          <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                   xmlns:dc="http://purl.org/dc/elements/1.1/">
            <rdf:Description>
              <dc:title>${badgeName}</dc:title>
              <dc:creator>GangGreen Platform</dc:creator>
              <dc:description>Fallback badge - ${tierName} tier</dc:description>
              <dc:type>NFT Badge Fallback</dc:type>
              <dc:format>image/svg+xml</dc:format>
            </rdf:Description>
          </rdf:RDF>
        </metadata>
      </svg>
    `.trim();
  }

  /**
   * Get default forest pattern when loading fails
   */
  private getDefaultForestPattern(): string {
    return `
      <circle cx="100" cy="100" r="30" fill="#2D5016" opacity="0.3"/>
      <circle cx="400" cy="150" r="40" fill="#2D5016" opacity="0.3"/>
      <circle cx="200" cy="400" r="35" fill="#2D5016" opacity="0.3"/>
    `.trim();
  }

  /**
   * Get fallback icon when rendering fails
   */
  private getFallbackIcon(): string {
    return `
      <g transform="translate(250, 250)">
        <circle cx="0" cy="0" r="60" fill="white" opacity="0.2"/>
        <path d="M0,-40 L12,-12 L40,-12 L18,6 L24,34 L0,16 L-24,34 L-18,6 L-40,-12 L-12,-12 Z" 
              fill="white" opacity="0.8"/>
      </g>
    `.trim();
  }
}

// Export singleton instance
export const badgeSvgService = new BadgeSvgService();

// Export class for testing
export { BadgeSvgService };
