/**
 * Badge Cache Manager
 * Manages caching of rendered badge SVGs for performance optimization
 * Supports both browser localStorage and in-memory caching
 */

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  averageSize: number;
  totalSize: number;
}

export interface CacheEntry {
  key: string;
  svg: string;
  timestamp: number;
  ttl?: number;
  hits: number;
  size: number;
}

/**
 * Badge Cache Manager Class
 * Provides efficient caching with TTL support and statistics tracking
 */
export class BadgeCacheManager {
  private cache: Map<string, CacheEntry>;
  private hits: number;
  private misses: number;
  private readonly storageKey = 'badge_cache';
  private readonly useLocalStorage: boolean;
  private readonly maxCacheSize: number;

  constructor(useLocalStorage: boolean = true, maxCacheSize: number = 100) {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
    this.useLocalStorage = useLocalStorage && this.isLocalStorageAvailable();
    this.maxCacheSize = maxCacheSize;

    // Load from localStorage if available
    if (this.useLocalStorage) {
      this.loadFromStorage();
    }
  }

  /**
   * Get cached badge SVG
   */
  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      this.syncToStorage();
      return null;
    }

    // Update hit count
    entry.hits++;
    this.hits++;
    this.cache.set(key, entry);
    this.syncToStorage();

    return entry.svg;
  }

  /**
   * Set badge in cache
   */
  async set(key: string, svg: string, ttl?: number): Promise<void> {
    // Check cache size limit
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      // Remove least recently used entry
      this.evictLRU();
    }

    const entry: CacheEntry = {
      key,
      svg,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size: new Blob([svg]).size,
    };

    this.cache.set(key, entry);
    this.syncToStorage();
  }

  /**
   * Check if badge is cached
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.syncToStorage();
      return false;
    }

    return true;
  }

  /**
   * Clear specific badge or all badges
   */
  async clear(key?: string): Promise<void> {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
      this.hits = 0;
      this.misses = 0;
    }

    this.syncToStorage();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalRequests = this.hits + this.misses;

    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
      averageSize: entries.length > 0 ? totalSize / entries.length : 0,
      totalSize,
    };
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpired(): Promise<number> {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.syncToStorage();
    }

    return cleaned;
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry details
   */
  getEntry(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lruHits) {
        lruHits = entry.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.entries);
        this.hits = data.hits || 0;
        this.misses = data.misses || 0;

        // Clean expired entries on load
        this.cleanExpired();
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  /**
   * Sync cache to localStorage
   */
  private syncToStorage(): void {
    if (!this.useLocalStorage) {
      return;
    }

    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        hits: this.hits,
        misses: this.misses,
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to sync cache to storage:', error);
      // If storage is full, clear old entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.evictLRU();
        this.syncToStorage();
      }
    }
  }
}

/**
 * Generate cache key for badge
 */
export function generateCacheKey(
  achievementType: string,
  tier: string,
  size: number,
  variant?: string
): string {
  const parts = [achievementType, tier, size.toString()];
  if (variant) {
    parts.push(variant);
  }
  return parts.join(':');
}

/**
 * Singleton instance for global cache management
 */
let globalCacheInstance: BadgeCacheManager | null = null;

/**
 * Get global cache instance
 */
export function getGlobalCache(): BadgeCacheManager {
  if (!globalCacheInstance) {
    globalCacheInstance = new BadgeCacheManager(true, 100);
  }
  return globalCacheInstance;
}

/**
 * Reset global cache instance
 */
export function resetGlobalCache(): void {
  globalCacheInstance = null;
}
