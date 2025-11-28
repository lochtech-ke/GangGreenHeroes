/**
 * Badge Renderer Service
 * Central service for rendering badges with geometric designs as default
 * Integrates geometric badge generator, caching, and rendering utilities
 */

import {
  AchievementType,
  BadgeConfig,
} from '../types/badge.types';
import {
  generateGeometricBadgeWithTier,
  generateMobileBadge,
  generateGeometricIcon,
  GEOMETRIC_CONFIGS,
} from '../utils/geometricBadgeGenerator';
import {
  BadgeCacheManager,
  generateCacheKey,
  getGlobalCache,
} from '../utils/badgeCache';
import { renderIcon as renderIconUtil } from '../utils/badgeIconRenderer';
import { badgePerformanceMonitor } from './badgePerformanceMonitor.service';

/**
 * Rendering options for badge generation
 */
export interface RenderOptions {
  useGeometric?: boolean; // Default: true
  size?: number;
  format?: 'svg' | 'png';
  includeMetadata?: boolean;
  optimizeForMobile?: boolean;
  cacheKey?: string;
  cacheTTL?: number; // Time to live in milliseconds
}

/**
 * Default rendering options
 */
const DEFAULT_RENDER_OPTIONS: Required<RenderOptions> = {
  useGeometric: true,
  size: 400,
  format: 'svg',
  includeMetadata: true,
  optimizeForMobile: false,
  cacheKey: '',
  cacheTTL: 3600000, // 1 hour
};

/**
 * Badge Renderer Service Class
 * Provides centralized badge rendering with caching and optimization
 */
export class BadgeRendererService {
  private cacheManager: BadgeCacheManager;

  constructor(cacheManager?: BadgeCacheManager) {
    this.cacheManager = cacheManager || getGlobalCache();
  }

  /**
   * Render a badge with geometric design (default)
   * Main entry point for badge rendering
   */
  async renderBadge(
    config: BadgeConfig,
    options: RenderOptions = {}
  ): Promise<string> {
    const finalOptions = { ...DEFAULT_RENDER_OPTIONS, ...options };

    // Generate cache key if not provided
    const cacheKey =
      finalOptions.cacheKey ||
      generateCacheKey(
        config.achievement,
        config.tier,
        finalOptions.size,
        finalOptions.optimizeForMobile ? 'mobile' : 'desktop'
      );

    // Check cache first
    const cacheCheckStart = performance.now();
    const cached = await this.getCachedBadge(cacheKey);
    const cacheCheckDuration = performance.now() - cacheCheckStart;

    if (cached) {
      // Track cache hit
      await badgePerformanceMonitor.trackCacheHit(
        config.achievement,
        config.tier,
        cacheCheckDuration
      );
      return cached;
    }

    // Track cache miss
    await badgePerformanceMonitor.trackCacheMiss(
      config.achievement,
      config.tier,
      cacheCheckDuration
    );

    // Generate badge
    const generationStart = performance.now();
    let svg: string;

    if (finalOptions.useGeometric) {
      // Use geometric generator (default)
      if (finalOptions.optimizeForMobile) {
        svg = generateMobileBadge(
          config.achievement,
          config.tier,
          finalOptions.size
        );
      } else {
        svg = generateGeometricBadgeWithTier(
          config.achievement,
          config.tier,
          finalOptions.size,
          finalOptions.includeMetadata ? config.metadata : undefined
        );
      }
    } else {
      // Fallback to classic badge rendering
      svg = await this.renderClassicBadge(config, finalOptions);
    }

    const generationDuration = performance.now() - generationStart;

    // Track badge generation performance
    const deviceType = finalOptions.optimizeForMobile ? 'mobile' : 'desktop';
    await badgePerformanceMonitor.trackBadgeGeneration(
      config.achievement,
      config.tier,
      generationDuration,
      finalOptions.size,
      deviceType,
      {
        useGeometric: finalOptions.useGeometric,
        fileSize: new Blob([svg]).size,
      }
    );

    // Track mobile-specific metrics
    if (finalOptions.optimizeForMobile) {
      const fileSize = new Blob([svg]).size;
      await badgePerformanceMonitor.trackMobileRender(
        config.achievement,
        config.tier,
        generationDuration,
        fileSize
      );
    }

    // Cache the result
    await this.cacheManager.set(cacheKey, svg, finalOptions.cacheTTL);

    // Convert to PNG if requested
    if (finalOptions.format === 'png') {
      // Note: PNG conversion requires browser environment
      // This would need to be handled client-side or with a server-side renderer
      console.warn('PNG format conversion not yet implemented');
      return svg;
    }

    return svg;
  }

  /**
   * Render badge icon only
   * Useful for displaying icons in UI components
   */
  async renderIcon(
    achievementType: AchievementType,
    size: number = 120,
    useGeometric: boolean = true
  ): Promise<string> {
    const cacheKey = generateCacheKey(achievementType, 'icon', size);

    // Check cache
    const cached = await this.getCachedBadge(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate icon
    let svg: string;

    if (useGeometric) {
      svg = generateGeometricIcon(achievementType, size);
    } else {
      // Fallback to classic icon rendering
      svg = await renderIconUtil(achievementType, 0, 0, { size }, false);
    }

    // Cache the result
    await this.cacheManager.set(cacheKey, svg);

    return svg;
  }

  /**
   * Batch render multiple badges
   * Optimized for rendering badge collections
   */
  async renderBadges(
    configs: BadgeConfig[],
    options: RenderOptions = {}
  ): Promise<Map<string, string>> {
    const startTime = performance.now();
    const results = new Map<string, string>();

    // Process badges in parallel
    const renderPromises = configs.map(async (config) => {
      const svg = await this.renderBadge(config, options);
      const key = config.id || `${config.achievement}-${config.tier}`;
      return { key, svg };
    });

    const rendered = await Promise.all(renderPromises);

    // Build results map
    rendered.forEach(({ key, svg }) => {
      results.set(key, svg);
    });

    // Track batch render performance
    const duration = performance.now() - startTime;
    await badgePerformanceMonitor.trackBatchRender(
      configs.length,
      duration,
      {
        avgPerBadge: duration / configs.length,
        useGeometric: options.useGeometric ?? true,
      }
    );

    return results;
  }

  /**
   * Get cached badge if available
   */
  async getCachedBadge(badgeId: string): Promise<string | null> {
    return await this.cacheManager.get(badgeId);
  }

  /**
   * Clear badge cache
   * If badgeId is provided, clears specific badge
   * Otherwise, clears entire cache
   */
  async clearCache(badgeId?: string): Promise<void> {
    await this.cacheManager.clear(badgeId);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await this.cacheManager.getStats();
  }

  /**
   * Preload badges for better performance
   * Useful for preloading user's badge collection
   */
  async preloadBadges(configs: BadgeConfig[]): Promise<void> {
    // Render badges in background without waiting
    configs.forEach((config) => {
      this.renderBadge(config).catch((error) => {
        console.error('Failed to preload badge:', error);
      });
    });
  }

  /**
   * Render classic badge (fallback)
   * Used when useGeometric is false for backward compatibility
   */
  private async renderClassicBadge(
    config: BadgeConfig,
    options: Required<RenderOptions>
  ): Promise<string> {
    // This is a simplified fallback
    // In a real implementation, this would call the classic badge generator
    const geometricConfig = GEOMETRIC_CONFIGS[config.achievement];
    const primaryColor = geometricConfig.primaryColors[0];

    return `
      <svg viewBox="0 0 ${options.size} ${options.size}" xmlns="http://www.w3.org/2000/svg">
        <title>${config.achievement} ${config.tier} Badge (Classic)</title>
        <rect width="${options.size}" height="${options.size}" fill="${primaryColor}" rx="${options.size * 0.05}"/>
        <text x="${options.size / 2}" y="${options.size / 2}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="${options.size * 0.1}" 
              fill="#FFFFFF">
          ${config.tier.toUpperCase()}
        </text>
      </svg>
    `.trim();
  }

  /**
   * Validate badge configuration
   */
  validateConfig(config: BadgeConfig): boolean {
    if (!config.achievement || !config.tier) {
      console.error('Badge config must include achievement and tier');
      return false;
    }

    if (!GEOMETRIC_CONFIGS[config.achievement]) {
      console.error(`Invalid achievement type: ${config.achievement}`);
      return false;
    }

    return true;
  }
}

/**
 * Singleton instance for global badge rendering
 */
let globalRendererInstance: BadgeRendererService | null = null;

/**
 * Get global badge renderer instance
 */
export function getBadgeRenderer(): BadgeRendererService {
  if (!globalRendererInstance) {
    globalRendererInstance = new BadgeRendererService();
  }
  return globalRendererInstance;
}

/**
 * Reset global renderer instance
 */
export function resetBadgeRenderer(): void {
  globalRendererInstance = null;
}
