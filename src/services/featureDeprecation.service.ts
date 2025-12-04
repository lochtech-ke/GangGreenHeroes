import { supabase } from './supabase';
import {
  DeprecatedFeature,
  type FeatureStatus,
  type FeatureFlag,
  type RouteRedirect,
} from '../types/featureDeprecation.types';

/**
 * Feature Deprecation Service
 * Manages deprecated features and feature flags
 */
class FeatureDeprecationService {
  // Cache for feature flags
  private featureFlagCache: Map<string, FeatureFlag> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Deprecated features
  // Note: MARKETPLACE refers to carbon credits marketplace, not badge marketplace
  // Badge marketplace (/marketplace) is active
  private readonly deprecatedFeatures = new Set<DeprecatedFeature>([
    DeprecatedFeature.TREE_PLANTING,
    DeprecatedFeature.CARBON_CREDITS,
  ]);

  // Route redirects for deprecated features
  // Note: /marketplace is for badge marketplace (active), /carbon-credits is deprecated
  private readonly routeRedirects: RouteRedirect[] = [
    {
      from: '/trees',
      to: '/initiatives',
      message: 'Tree planting features have been moved to Initiatives',
    },
    {
      from: '/carbon-credits',
      to: '/initiatives',
      message: 'Carbon credit marketplace features are not currently available. Explore our initiatives!',
    },
  ];

  // Deprecated navigation items
  // Note: 'marketplace' removed - badge marketplace is active
  // Only carbon credits marketplace is deprecated
  private readonly deprecatedNavItems = new Set<string>([
    'trees',
    'carbon-credits',
    'carbon_credits',
  ]);

  // Deprecated component IDs
  // Note: 'marketplace-listing' removed - badge marketplace components are active
  // Only carbon credit marketplace components are deprecated
  private readonly deprecatedComponents = new Set<string>([
    'tree-planting-widget',
    'carbon-credit-marketplace',
    'tree-purchase-modal',
    'carbon-credit-purchase',
  ]);

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(feature: DeprecatedFeature): Promise<boolean> {
    // All deprecated features are disabled
    if (this.deprecatedFeatures.has(feature)) {
      return false;
    }

    // Check database for feature flag
    const flag = await this.getFeatureFlag(feature);
    return flag?.is_enabled ?? true;
  }

  /**
   * Get feature status with details
   */
  async getFeatureStatus(feature: DeprecatedFeature): Promise<FeatureStatus> {
    const flag = await this.getFeatureFlag(feature);

    if (!flag) {
      return {
        enabled: !this.deprecatedFeatures.has(feature),
      };
    }

    return {
      enabled: flag.is_enabled,
      deprecatedAt: flag.deprecated_at ? new Date(flag.deprecated_at) : undefined,
      removalDate: flag.removal_date ? new Date(flag.removal_date) : undefined,
      alternativeFeature: flag.alternative_feature || undefined,
      message: flag.message || undefined,
    };
  }

  /**
   * Check if a navigation item should be shown
   */
  shouldShowNavItem(navItem: string): boolean {
    const normalizedItem = navItem.toLowerCase().replace(/\s+/g, '-');
    return !this.deprecatedNavItems.has(normalizedItem);
  }

  /**
   * Get redirect for a deprecated route
   */
  getRedirectForDeprecatedRoute(route: string): RouteRedirect | null {
    const normalizedRoute = route.toLowerCase();
    return this.routeRedirects.find(r => r.from === normalizedRoute) || null;
  }

  /**
   * Check if a component should be rendered
   */
  shouldRenderComponent(componentId: string): boolean {
    const normalizedId = componentId.toLowerCase();
    return !this.deprecatedComponents.has(normalizedId);
  }

  /**
   * Filter deprecated data from a dataset
   */
  filterDeprecatedData<T extends Record<string, any>>(
    data: T[],
    dataType: string
  ): T[] {
    switch (dataType.toLowerCase()) {
      case 'trees':
      case 'tree_planting':
        // Filter out tree planting data
        return [];

      case 'carbon_credits':
        // Filter out carbon credit marketplace data
        // Note: Badge marketplace data is NOT filtered (it's active)
        return [];

      case 'initiatives':
        // Keep initiatives but filter out tree-planting specific ones
        return data.filter(item => {
          const type = item.type || item.initiative_type || '';
          return !type.toLowerCase().includes('tree') && !type.toLowerCase().includes('planting');
        });

      case 'badges':
        // Keep all badges
        return data;

      default:
        // By default, return all data
        return data;
    }
  }

  /**
   * Get all deprecated features
   */
  getDeprecatedFeatures(): DeprecatedFeature[] {
    return Array.from(this.deprecatedFeatures);
  }

  /**
   * Get all route redirects
   */
  getRouteRedirects(): RouteRedirect[] {
    return [...this.routeRedirects];
  }

  /**
   * Check if a feature name is deprecated
   */
  isDeprecated(featureName: string): boolean {
    const normalized = featureName.toLowerCase().replace(/\s+/g, '_');
    return this.deprecatedFeatures.has(normalized as DeprecatedFeature);
  }

  /**
   * Get alternative feature for a deprecated feature
   */
  async getAlternativeFeature(feature: DeprecatedFeature): Promise<string | null> {
    const status = await this.getFeatureStatus(feature);
    return status.alternativeFeature || null;
  }

  /**
   * Clear feature flag cache
   */
  clearCache(): void {
    this.featureFlagCache.clear();
    this.cacheExpiry = 0;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getFeatureFlag(feature: string): Promise<FeatureFlag | null> {
    // Check cache first
    if (this.isCacheValid() && this.featureFlagCache.has(feature)) {
      return this.featureFlagCache.get(feature) || null;
    }

    // Fetch from database
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('feature_name', feature)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      // Update cache
      this.featureFlagCache.set(feature, data as FeatureFlag);
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      return data as FeatureFlag;
    } catch (error) {
      console.error('[FeatureDeprecationService] Error fetching feature flag:', error);
      return null;
    }
  }

  private isCacheValid(): boolean {
    return Date.now() < this.cacheExpiry;
  }
}

// Export singleton instance
export const featureDeprecationService = new FeatureDeprecationService();

// Export class for testing
export { FeatureDeprecationService };
