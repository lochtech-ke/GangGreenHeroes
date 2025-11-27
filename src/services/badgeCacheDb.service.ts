/**
 * Badge Cache Database Service
 * Integrates badge caching with Supabase database
 * Provides persistent caching across sessions and devices
 */

import { supabase } from './supabase';
import { CacheStats } from '../utils/badgeCache';

export interface DbCacheEntry {
  id?: string;
  cache_key: string;
  badge_id?: string;
  svg_content: string;
  size: number;
  format: string;
  hit_count: number;
  last_accessed_at: string;
  expires_at?: string;
  created_at?: string;
}

/**
 * Badge Cache Database Service
 */
export class BadgeCacheDbService {
  private readonly tableName = 'badge_cache';

  /**
   * Get cached badge from database
   */
  async get(cacheKey: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('svg_content, expires_at, id')
        .eq('cache_key', cacheKey)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await this.delete(cacheKey);
        return null;
      }

      // Increment hit count
      await this.incrementHitCount(cacheKey);

      return data.svg_content;
    } catch (error) {
      console.error('Error getting cache from database:', error);
      return null;
    }
  }

  /**
   * Set badge in database cache
   */
  async set(
    cacheKey: string,
    svgContent: string,
    size: number,
    format: string = 'svg',
    badgeId?: string,
    ttl?: number
  ): Promise<boolean> {
    try {
      const expiresAt = ttl ? new Date(Date.now() + ttl).toISOString() : null;

      const entry: DbCacheEntry = {
        cache_key: cacheKey,
        badge_id: badgeId,
        svg_content: svgContent,
        size,
        format,
        hit_count: 0,
        last_accessed_at: new Date().toISOString(),
        expires_at: expiresAt || undefined,
      };

      const { error } = await supabase
        .from(this.tableName)
        .upsert(entry, { onConflict: 'cache_key' });

      if (error) {
        console.error('Error setting cache in database:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting cache in database:', error);
      return false;
    }
  }

  /**
   * Check if badge is cached in database
   */
  async has(cacheKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id, expires_at')
        .eq('cache_key', cacheKey)
        .single();

      if (error || !data) {
        return false;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await this.delete(cacheKey);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking cache in database:', error);
      return false;
    }
  }

  /**
   * Delete cached badge from database
   */
  async delete(cacheKey: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('cache_key', cacheKey);

      if (error) {
        console.error('Error deleting cache from database:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting cache from database:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries or entries for specific badge
   */
  async clear(badgeId?: string): Promise<boolean> {
    try {
      let query = supabase.from(this.tableName).delete();

      if (badgeId) {
        query = query.eq('badge_id', badgeId);
      } else {
        // Delete all - use a condition that's always true
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { error } = await query;

      if (error) {
        console.error('Error clearing cache from database:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error clearing cache from database:', error);
      return false;
    }
  }

  /**
   * Get cache statistics from database
   */
  async getStats(): Promise<CacheStats> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('svg_content, hit_count');

      if (error || !data) {
        return {
          totalEntries: 0,
          hitRate: 0,
          missRate: 0,
          averageSize: 0,
          totalSize: 0,
        };
      }

      const totalEntries = data.length;
      const totalSize = data.reduce(
        (sum, entry) => sum + new Blob([entry.svg_content]).size,
        0
      );
      const averageSize = totalEntries > 0 ? totalSize / totalEntries : 0;

      // Note: We can't calculate miss rate from database alone
      // This would need to be tracked separately
      return {
        totalEntries,
        hitRate: 0, // Would need separate tracking
        missRate: 0, // Would need separate tracking
        averageSize,
        totalSize,
      };
    } catch (error) {
      console.error('Error getting cache stats from database:', error);
      return {
        totalEntries: 0,
        hitRate: 0,
        missRate: 0,
        averageSize: 0,
        totalSize: 0,
      };
    }
  }

  /**
   * Clean expired cache entries from database
   */
  async cleanExpired(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning expired cache from database:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning expired cache from database:', error);
      return 0;
    }
  }

  /**
   * Increment hit count for cache entry
   */
  private async incrementHitCount(cacheKey: string): Promise<void> {
    try {
      // Use RPC function if available, otherwise use update
      const { error } = await supabase.rpc('increment_cache_hit', {
        p_cache_key: cacheKey,
      });

      if (error) {
        // Fallback to manual increment
        const { data } = await supabase
          .from(this.tableName)
          .select('hit_count')
          .eq('cache_key', cacheKey)
          .single();

        if (data) {
          await supabase
            .from(this.tableName)
            .update({
              hit_count: data.hit_count + 1,
              last_accessed_at: new Date().toISOString(),
            })
            .eq('cache_key', cacheKey);
        }
      }
    } catch (error) {
      console.error('Error incrementing hit count:', error);
    }
  }

  /**
   * Warm cache with popular badges
   */
  async warmCache(badgeIds: string[]): Promise<number> {
    let warmed = 0;

    for (const badgeId of badgeIds) {
      try {
        // This would be called after generating the badge
        // Implementation depends on badge generation service
        warmed++;
      } catch (error) {
        console.error(`Error warming cache for badge ${badgeId}:`, error);
      }
    }

    return warmed;
  }

  /**
   * Get most accessed badges
   */
  async getMostAccessed(limit: number = 10): Promise<DbCacheEntry[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('hit_count', { ascending: false })
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error getting most accessed badges:', error);
      return [];
    }
  }

  /**
   * Get cache entries by badge ID
   */
  async getByBadgeId(badgeId: string): Promise<DbCacheEntry[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('badge_id', badgeId);

      if (error || !data) {
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error getting cache by badge ID:', error);
      return [];
    }
  }
}

/**
 * Singleton instance for global database cache service
 */
let globalDbCacheInstance: BadgeCacheDbService | null = null;

/**
 * Get global database cache service instance
 */
export function getGlobalDbCache(): BadgeCacheDbService {
  if (!globalDbCacheInstance) {
    globalDbCacheInstance = new BadgeCacheDbService();
  }
  return globalDbCacheInstance;
}

/**
 * Reset global database cache service instance
 */
export function resetGlobalDbCache(): void {
  globalDbCacheInstance = null;
}
