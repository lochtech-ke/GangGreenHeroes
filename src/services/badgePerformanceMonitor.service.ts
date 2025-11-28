/**
 * Badge Performance Monitor Service
 * Tracks badge generation time, cache hit rates, and mobile performance metrics
 * Requirements: 11.1, 11.2, 11.3
 */

import { supabase } from './supabase';

/**
 * Performance metric types
 */
export type MetricType = 
  | 'badge_generation'
  | 'cache_hit'
  | 'cache_miss'
  | 'mobile_render'
  | 'desktop_render'
  | 'batch_render';

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  id?: string;
  metric_type: MetricType;
  duration_ms: number;
  badge_type?: string;
  tier?: string;
  size?: number;
  device_type?: 'mobile' | 'desktop';
  cache_hit?: boolean;
  batch_size?: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  metricType: MetricType;
  count: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  minDuration: number;
  maxDuration: number;
}

/**
 * Cache performance statistics
 */
export interface CachePerformanceStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  missRate: number;
  avgHitDuration: number;
  avgMissDuration: number;
}

/**
 * Mobile performance statistics
 */
export interface MobilePerformanceStats {
  totalRenders: number;
  avgRenderTime: number;
  p95RenderTime: number;
  renderUnder100ms: number;
  renderUnder100msRate: number;
  avgFileSize: number;
}

/**
 * Performance alert configuration
 */
export interface PerformanceAlert {
  type: 'generation_slow' | 'cache_low' | 'mobile_slow' | 'error_rate_high';
  threshold: number;
  currentValue: number;
  message: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
}

/**
 * Badge Performance Monitor Service Class
 */
class BadgePerformanceMonitorService {
  private metricsBuffer: PerformanceMetric[] = [];
  private bufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoFlush();
  }

  /**
   * Track badge generation time
   */
  async trackBadgeGeneration(
    badgeType: string,
    tier: string,
    durationMs: number,
    size: number,
    deviceType: 'mobile' | 'desktop' = 'desktop',
    metadata?: Record<string, any>
  ): Promise<void> {
    const metric: PerformanceMetric = {
      metric_type: 'badge_generation',
      duration_ms: durationMs,
      badge_type: badgeType,
      tier,
      size,
      device_type: deviceType,
      metadata,
    };

    await this.recordMetric(metric);

    // Check for performance alerts
    if (durationMs > 100) {
      await this.triggerAlert({
        type: 'generation_slow',
        threshold: 100,
        currentValue: durationMs,
        message: `Badge generation took ${durationMs}ms (threshold: 100ms)`,
        severity: durationMs > 200 ? 'critical' : 'warning',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Track cache hit
   */
  async trackCacheHit(
    badgeType: string,
    tier: string,
    durationMs: number
  ): Promise<void> {
    const metric: PerformanceMetric = {
      metric_type: 'cache_hit',
      duration_ms: durationMs,
      badge_type: badgeType,
      tier,
      cache_hit: true,
    };

    await this.recordMetric(metric);
  }

  /**
   * Track cache miss
   */
  async trackCacheMiss(
    badgeType: string,
    tier: string,
    durationMs: number
  ): Promise<void> {
    const metric: PerformanceMetric = {
      metric_type: 'cache_miss',
      duration_ms: durationMs,
      badge_type: badgeType,
      tier,
      cache_hit: false,
    };

    await this.recordMetric(metric);
  }

  /**
   * Track mobile render performance
   */
  async trackMobileRender(
    badgeType: string,
    tier: string,
    durationMs: number,
    fileSize: number
  ): Promise<void> {
    const metric: PerformanceMetric = {
      metric_type: 'mobile_render',
      duration_ms: durationMs,
      badge_type: badgeType,
      tier,
      device_type: 'mobile',
      metadata: { fileSize },
    };

    await this.recordMetric(metric);

    // Check for mobile performance alerts
    if (durationMs > 150) {
      await this.triggerAlert({
        type: 'mobile_slow',
        threshold: 150,
        currentValue: durationMs,
        message: `Mobile render took ${durationMs}ms (threshold: 150ms)`,
        severity: durationMs > 200 ? 'critical' : 'warning',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Track batch render performance
   */
  async trackBatchRender(
    batchSize: number,
    durationMs: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const metric: PerformanceMetric = {
      metric_type: 'batch_render',
      duration_ms: durationMs,
      batch_size: batchSize,
      metadata,
    };

    await this.recordMetric(metric);
  }

  /**
   * Get performance statistics for a metric type
   */
  async getPerformanceStats(
    metricType: MetricType,
    hoursBack: number = 24
  ): Promise<PerformanceStats> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hoursBack);

      const { data, error } = await supabase
        .from('badge_performance_metrics')
        .select('duration_ms')
        .eq('metric_type', metricType)
        .gte('created_at', startTime.toISOString())
        .order('duration_ms', { ascending: true });

      if (error) {
        console.error('[BadgePerformanceMonitor] Error fetching stats:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          metricType,
          count: 0,
          avgDuration: 0,
          p50Duration: 0,
          p95Duration: 0,
          p99Duration: 0,
          minDuration: 0,
          maxDuration: 0,
        };
      }

      const durations = data.map(d => d.duration_ms);
      const count = durations.length;
      const sum = durations.reduce((a, b) => a + b, 0);
      const avgDuration = sum / count;

      // Calculate percentiles
      const p50Index = Math.floor(count * 0.5);
      const p95Index = Math.floor(count * 0.95);
      const p99Index = Math.floor(count * 0.99);

      return {
        metricType,
        count,
        avgDuration: Math.round(avgDuration * 100) / 100,
        p50Duration: durations[p50Index],
        p95Duration: durations[p95Index],
        p99Duration: durations[p99Index],
        minDuration: durations[0],
        maxDuration: durations[count - 1],
      };
    } catch (error) {
      console.error('[BadgePerformanceMonitor] Error calculating stats:', error);
      throw error;
    }
  }

  /**
   * Get cache performance statistics
   */
  async getCachePerformanceStats(hoursBack: number = 24): Promise<CachePerformanceStats> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hoursBack);

      const { data, error } = await supabase
        .from('badge_performance_metrics')
        .select('metric_type, duration_ms, cache_hit')
        .in('metric_type', ['cache_hit', 'cache_miss'])
        .gte('created_at', startTime.toISOString());

      if (error) {
        console.error('[BadgePerformanceMonitor] Error fetching cache stats:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalRequests: 0,
          cacheHits: 0,
          cacheMisses: 0,
          hitRate: 0,
          missRate: 0,
          avgHitDuration: 0,
          avgMissDuration: 0,
        };
      }

      const hits = data.filter(d => d.metric_type === 'cache_hit');
      const misses = data.filter(d => d.metric_type === 'cache_miss');

      const totalRequests = data.length;
      const cacheHits = hits.length;
      const cacheMisses = misses.length;
      const hitRate = (cacheHits / totalRequests) * 100;
      const missRate = (cacheMisses / totalRequests) * 100;

      const avgHitDuration = hits.length > 0
        ? hits.reduce((sum, h) => sum + h.duration_ms, 0) / hits.length
        : 0;

      const avgMissDuration = misses.length > 0
        ? misses.reduce((sum, m) => sum + m.duration_ms, 0) / misses.length
        : 0;

      const stats: CachePerformanceStats = {
        totalRequests,
        cacheHits,
        cacheMisses,
        hitRate: Math.round(hitRate * 100) / 100,
        missRate: Math.round(missRate * 100) / 100,
        avgHitDuration: Math.round(avgHitDuration * 100) / 100,
        avgMissDuration: Math.round(avgMissDuration * 100) / 100,
      };

      // Check for cache performance alerts
      if (stats.hitRate < 70) {
        await this.triggerAlert({
          type: 'cache_low',
          threshold: 70,
          currentValue: stats.hitRate,
          message: `Cache hit rate is ${stats.hitRate}% (threshold: 70%)`,
          severity: stats.hitRate < 50 ? 'critical' : 'warning',
          timestamp: new Date(),
        });
      }

      return stats;
    } catch (error) {
      console.error('[BadgePerformanceMonitor] Error calculating cache stats:', error);
      throw error;
    }
  }

  /**
   * Get mobile performance statistics
   */
  async getMobilePerformanceStats(hoursBack: number = 24): Promise<MobilePerformanceStats> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hoursBack);

      const { data, error } = await supabase
        .from('badge_performance_metrics')
        .select('duration_ms, metadata')
        .eq('metric_type', 'mobile_render')
        .gte('created_at', startTime.toISOString())
        .order('duration_ms', { ascending: true });

      if (error) {
        console.error('[BadgePerformanceMonitor] Error fetching mobile stats:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalRenders: 0,
          avgRenderTime: 0,
          p95RenderTime: 0,
          renderUnder100ms: 0,
          renderUnder100msRate: 0,
          avgFileSize: 0,
        };
      }

      const totalRenders = data.length;
      const durations = data.map(d => d.duration_ms);
      const avgRenderTime = durations.reduce((a, b) => a + b, 0) / totalRenders;
      const p95Index = Math.floor(totalRenders * 0.95);
      const p95RenderTime = durations[p95Index];
      const renderUnder100ms = durations.filter(d => d < 100).length;
      const renderUnder100msRate = (renderUnder100ms / totalRenders) * 100;

      const fileSizes = data
        .map(d => d.metadata?.fileSize)
        .filter(size => size !== undefined);
      const avgFileSize = fileSizes.length > 0
        ? fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length
        : 0;

      return {
        totalRenders,
        avgRenderTime: Math.round(avgRenderTime * 100) / 100,
        p95RenderTime,
        renderUnder100ms,
        renderUnder100msRate: Math.round(renderUnder100msRate * 100) / 100,
        avgFileSize: Math.round(avgFileSize),
      };
    } catch (error) {
      console.error('[BadgePerformanceMonitor] Error calculating mobile stats:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive performance dashboard data
   */
  async getPerformanceDashboard(hoursBack: number = 24) {
    try {
      const [
        generationStats,
        cacheStats,
        mobileStats,
      ] = await Promise.all([
        this.getPerformanceStats('badge_generation', hoursBack),
        this.getCachePerformanceStats(hoursBack),
        this.getMobilePerformanceStats(hoursBack),
      ]);

      return {
        generation: generationStats,
        cache: cacheStats,
        mobile: mobileStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[BadgePerformanceMonitor] Error getting dashboard:', error);
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private async recordMetric(metric: PerformanceMetric): Promise<void> {
    // Add to buffer
    this.metricsBuffer.push(metric);

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.bufferSize) {
      await this.flushMetrics();
    }
  }

  /**
   * Flush metrics buffer to database
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    try {
      const metricsToFlush = [...this.metricsBuffer];
      this.metricsBuffer = [];

      const { error } = await supabase
        .from('badge_performance_metrics')
        .insert(metricsToFlush);

      if (error) {
        console.error('[BadgePerformanceMonitor] Error flushing metrics:', error);
        // Put metrics back in buffer on error
        this.metricsBuffer.unshift(...metricsToFlush);
      }
    } catch (error) {
      console.error('[BadgePerformanceMonitor] Error flushing metrics:', error);
    }
  }

  /**
   * Start automatic metric flushing
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushMetrics().catch(error => {
        console.error('[BadgePerformanceMonitor] Auto-flush error:', error);
      });
    }, this.flushInterval);
  }

  /**
   * Stop automatic metric flushing
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Trigger a performance alert
   */
  private async triggerAlert(alert: PerformanceAlert): Promise<void> {
    try {
      console.warn('[BadgePerformanceMonitor] Performance Alert:', alert);

      // Store alert in database
      const { error } = await supabase
        .from('badge_performance_alerts')
        .insert({
          alert_type: alert.type,
          threshold: alert.threshold,
          current_value: alert.currentValue,
          message: alert.message,
          severity: alert.severity,
          created_at: alert.timestamp.toISOString(),
        });

      if (error) {
        console.error('[BadgePerformanceMonitor] Error storing alert:', error);
      }
    } catch (error) {
      console.error('[BadgePerformanceMonitor] Error triggering alert:', error);
    }
  }

  /**
   * Get recent performance alerts
   */
  async getRecentAlerts(limit: number = 10): Promise<PerformanceAlert[]> {
    try {
      const { data, error } = await supabase
        .from('badge_performance_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[BadgePerformanceMonitor] Error fetching alerts:', error);
        return [];
      }

      return (data || []).map(alert => ({
        type: alert.alert_type,
        threshold: alert.threshold,
        currentValue: alert.current_value,
        message: alert.message,
        severity: alert.severity,
        timestamp: new Date(alert.created_at),
      }));
    } catch (error) {
      console.error('[BadgePerformanceMonitor] Error fetching alerts:', error);
      return [];
    }
  }

  /**
   * Clear old metrics (cleanup)
   */
  async clearOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('badge_performance_metrics')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('[BadgePerformanceMonitor] Error clearing old metrics:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('[BadgePerformanceMonitor] Error clearing old metrics:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const badgePerformanceMonitor = new BadgePerformanceMonitorService();
