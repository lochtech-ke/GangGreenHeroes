/**
 * Engagement Tracker Service
 * 
 * Tracks user interactions with content and provides analytics for
 * cohort-based engagement patterns and adaptive learning.
 * 
 * Requirements: B7.1, B7.2, B7.4
 */

import { supabase } from './supabase';
import {
  AgeCohort,
  ContentType,
  EngagementEvent,
  EngagementMetrics,
  InteractionType,
  Interaction,
  CohortEngagementSummary,
} from '../types/contentCuration.types';

// ============================================================================
// Types
// ============================================================================

interface UserEngagementHistory {
  userId: string;
  interactions: Interaction[];
  totalInteractions: number;
  lastActivity: Date;
}

interface EventQueueItem {
  event: EngagementEvent;
  retries: number;
  timestamp: Date;
}

// ============================================================================
// Engagement Tracker Service
// ============================================================================

export class EngagementTrackerService {
  private eventQueue: EventQueueItem[] = [];
  private processingQueue: boolean = false;
  private readonly BATCH_SIZE = 50;
  private readonly MAX_RETRIES = 3;
  private readonly QUEUE_PROCESS_INTERVAL = 5000; // 5 seconds

  constructor() {
    // Start async event processing
    this.startQueueProcessor();
  }

  /**
   * Tracks a user interaction event
   * Implements async event processing (Requirement B7.1)
   * 
   * @param event - Engagement event to track
   * @returns Promise that resolves when event is queued
   */
  async trackEvent(event: Omit<EngagementEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Create complete event with ID and timestamp
      const completeEvent: EngagementEvent = {
        ...event,
        id: this.generateEventId(),
        timestamp: new Date(),
      };

      // Add to queue for async processing
      this.eventQueue.push({
        event: completeEvent,
        retries: 0,
        timestamp: new Date(),
      });

      // Log for debugging
      console.log(`[EngagementTracker] Event queued: ${completeEvent.eventType} on ${completeEvent.itemType} by user ${completeEvent.userId}`);

      // Trigger immediate processing if queue is large
      if (this.eventQueue.length >= this.BATCH_SIZE && !this.processingQueue) {
        this.processQueue();
      }
    } catch (error) {
      console.error('[EngagementTracker] Error queuing event:', error);
      throw error;
    }
  }

  /**
   * Gets engagement metrics for a specific cohort and content type
   * Implements cohort analytics (Requirement B7.2)
   * 
   * @param cohort - Age cohort to analyze
   * @param contentType - Type of content (optional, returns all if not specified)
   * @param dateRange - Date range for metrics
   * @returns Array of engagement metrics
   */
  async getMetrics(
    cohort: AgeCohort,
    contentType?: ContentType,
    dateRange?: { start: Date; end: Date }
  ): Promise<EngagementMetrics[]> {
    try {
      // Build query
      let query = supabase
        .from('cohort_engagement_metrics')
        .select('*')
        .eq('cohort', cohort);

      // Add content type filter if specified
      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      // Add date range filter if specified
      if (dateRange) {
        query = query
          .gte('date', dateRange.start.toISOString().split('T')[0])
          .lte('date', dateRange.end.toISOString().split('T')[0]);
      } else {
        // Default to last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
      }

      // Execute query
      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.error('[EngagementTracker] Error fetching metrics:', error);
        throw error;
      }

      // Transform database records to EngagementMetrics
      return (data || []).map(record => ({
        cohort: record.cohort as AgeCohort,
        contentType: record.content_type as ContentType,
        date: new Date(record.date),
        impressions: record.impressions || 0,
        clicks: record.clicks || 0,
        saves: record.saves || 0,
        joins: record.joins || 0,
        shares: record.shares || 0,
        clickThroughRate: record.impressions > 0 
          ? (record.clicks || 0) / record.impressions 
          : 0,
        avgEngagementTime: record.avg_engagement_seconds || 0,
        conversionRate: record.impressions > 0
          ? ((record.joins || 0) + (record.saves || 0)) / record.impressions
          : 0,
      }));
    } catch (error) {
      console.error('[EngagementTracker] Error in getMetrics:', error);
      throw error;
    }
  }

  /**
   * Gets user's personal interaction history
   * Implements personal history tracking (Requirement B7.2)
   * 
   * @param userId - User ID
   * @param limit - Maximum number of interactions to return
   * @returns User's engagement history
   */
  async getUserHistory(userId: string, limit: number = 100): Promise<UserEngagementHistory> {
    try {
      // Fetch user interactions from database
      const { data, error } = await supabase
        .from('content_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[EngagementTracker] Error fetching user history:', error);
        throw error;
      }

      // Transform to Interaction objects
      const interactions: Interaction[] = (data || []).map(record => ({
        contentId: record.content_id,
        contentType: record.content_type as ContentType,
        interactionType: record.interaction_type as InteractionType,
        timestamp: new Date(record.timestamp),
        duration: record.metadata?.duration,
        metadata: record.metadata,
      }));

      return {
        userId,
        interactions,
        totalInteractions: interactions.length,
        lastActivity: interactions.length > 0 ? interactions[0].timestamp : new Date(),
      };
    } catch (error) {
      console.error('[EngagementTracker] Error in getUserHistory:', error);
      throw error;
    }
  }

  /**
   * Gets comprehensive engagement summary for a cohort
   * 
   * @param cohort - Age cohort
   * @param days - Number of days to analyze (default: 30)
   * @returns Cohort engagement summary
   */
  async getCohortSummary(cohort: AgeCohort, days: number = 30): Promise<CohortEngagementSummary> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get metrics for the period
      const metrics = await this.getMetrics(cohort, undefined, {
        start: startDate,
        end: new Date(),
      });

      // Calculate aggregated statistics
      const contentTypeEngagement = new Map<ContentType, number>();
      const dailyEngagement = new Map<string, number>();
      let totalImpressions = 0;
      let totalClicks = 0;

      for (const metric of metrics) {
        // Aggregate by content type
        const currentEngagement = contentTypeEngagement.get(metric.contentType) || 0;
        contentTypeEngagement.set(
          metric.contentType,
          currentEngagement + metric.clickThroughRate
        );

        // Aggregate by date
        const dateKey = metric.date.toISOString().split('T')[0];
        const currentDaily = dailyEngagement.get(dateKey) || 0;
        dailyEngagement.set(dateKey, currentDaily + metric.clickThroughRate);

        totalImpressions += metric.impressions;
        totalClicks += metric.clicks;
      }

      // Calculate top content types
      const topContentTypes = Array.from(contentTypeEngagement.entries())
        .map(([type, engagement]) => ({
          type,
          engagementRate: engagement / metrics.filter(m => m.contentType === type).length,
        }))
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, 5);

      // Calculate engagement trends
      const engagementTrends = Array.from(dailyEngagement.entries())
        .map(([date, score]) => ({
          date: new Date(date),
          engagementScore: score,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Get user counts (this would need a separate query in production)
      const totalUsers = await this.getCohortUserCount(cohort);
      const activeUsers = await this.getActiveCohortUserCount(cohort, days);

      return {
        cohort,
        totalUsers,
        activeUsers,
        avgSessionDuration: metrics.reduce((sum, m) => sum + m.avgEngagementTime, 0) / metrics.length || 0,
        topContentTypes,
        engagementTrends,
      };
    } catch (error) {
      console.error('[EngagementTracker] Error in getCohortSummary:', error);
      throw error;
    }
  }

  /**
   * Tracks low engagement and updates relevance scores
   * Implements low engagement penalty (Requirement B7.4)
   * 
   * @param contentId - Content item ID
   * @param contentType - Content type
   * @param cohort - Age cohort
   * @returns Whether penalty was applied
   */
  async applyLowEngagementPenalty(
    contentId: string,
    contentType: ContentType,
    cohort: AgeCohort
  ): Promise<boolean> {
    try {
      // Get last 7 days of metrics for this content and cohort
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: interactions, error } = await supabase
        .from('content_interactions')
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('age_cohort', cohort)
        .gte('timestamp', sevenDaysAgo.toISOString());

      if (error) {
        console.error('[EngagementTracker] Error checking engagement:', error);
        return false;
      }

      // Calculate engagement rate
      const impressions = interactions?.filter(i => i.interaction_type === 'impression').length || 0;
      const engagements = interactions?.filter(i => 
        ['click', 'save', 'join', 'share', 'complete'].includes(i.interaction_type)
      ).length || 0;

      const engagementRate = impressions > 0 ? engagements / impressions : 0;

      // Get cohort average engagement rate
      const cohortAverage = await this.getCohortAverageEngagement(cohort, contentType);

      // Apply penalty if below average for 7 consecutive days
      if (engagementRate < cohortAverage && impressions >= 10) {
        // Get current scores and reduce by 20%
        const { data: currentScores, error: fetchError } = await supabase
          .from('relevance_scores')
          .select('score')
          .eq('content_id', contentId)
          .eq('content_type', contentType);

        if (fetchError || !currentScores || currentScores.length === 0) {
          console.error('[EngagementTracker] Error fetching current scores:', fetchError);
          return false;
        }

        // Update each score
        for (const scoreRecord of currentScores) {
          const newScore = scoreRecord.score * 0.8;
          const { error: updateError } = await supabase
            .from('relevance_scores')
            .update({
              score: newScore,
              calculated_at: new Date().toISOString(),
            })
            .eq('content_id', contentId)
            .eq('content_type', contentType);

          if (updateError) {
            console.error('[EngagementTracker] Error applying penalty:', updateError);
            return false;
          }
        }

        console.log(`[EngagementTracker] Applied low engagement penalty to ${contentId} for cohort ${cohort}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[EngagementTracker] Error in applyLowEngagementPenalty:', error);
      return false;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Starts the async queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0 && !this.processingQueue) {
        this.processQueue();
      }
    }, this.QUEUE_PROCESS_INTERVAL);
  }

  /**
   * Processes queued events in batches
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      // Take a batch from the queue
      const batch = this.eventQueue.splice(0, this.BATCH_SIZE);
      
      console.log(`[EngagementTracker] Processing batch of ${batch.length} events`);

      // Process each event
      const results = await Promise.allSettled(
        batch.map(item => this.persistEvent(item.event))
      );

      // Handle failures
      const failures: EventQueueItem[] = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const item = batch[index];
          if (item.retries < this.MAX_RETRIES) {
            failures.push({
              ...item,
              retries: item.retries + 1,
            });
          } else {
            console.error(`[EngagementTracker] Event failed after ${this.MAX_RETRIES} retries:`, item.event);
          }
        }
      });

      // Re-queue failures
      if (failures.length > 0) {
        this.eventQueue.push(...failures);
      }

      // Update daily metrics
      await this.updateDailyMetrics(batch.map(item => item.event));
    } catch (error) {
      console.error('[EngagementTracker] Error processing queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Persists a single event to the database
   */
  private async persistEvent(event: EngagementEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_interactions')
        .insert({
          id: event.id,
          user_id: event.userId,
          content_id: event.itemId,
          content_type: event.itemType,
          interaction_type: event.eventType,
          age_cohort: event.ageCohort,
          timestamp: event.timestamp.toISOString(),
          metadata: event.metadata || {},
        });

      if (error) {
        console.error('[EngagementTracker] Error persisting event:', error);
        throw error;
      }
    } catch (error) {
      console.error('[EngagementTracker] Error in persistEvent:', error);
      throw error;
    }
  }

  /**
   * Updates daily aggregated metrics
   */
  private async updateDailyMetrics(events: EngagementEvent[]): Promise<void> {
    try {
      // Group events by cohort, content type, and date
      const metricsMap = new Map<string, {
        cohort: AgeCohort;
        contentType: ContentType;
        date: string;
        impressions: number;
        clicks: number;
        saves: number;
        joins: number;
        shares: number;
        totalEngagementTime: number;
        engagementCount: number;
      }>();

      for (const event of events) {
        if (!event.ageCohort) continue;

        const dateKey = event.timestamp.toISOString().split('T')[0];
        const key = `${event.ageCohort}-${event.itemType}-${dateKey}`;

        const existing = metricsMap.get(key) || {
          cohort: event.ageCohort,
          contentType: event.itemType,
          date: dateKey,
          impressions: 0,
          clicks: 0,
          saves: 0,
          joins: 0,
          shares: 0,
          totalEngagementTime: 0,
          engagementCount: 0,
        };

        // Update counts based on event type
        if (event.eventType === 'impression') existing.impressions++;
        if (event.eventType === 'click') existing.clicks++;
        if (event.eventType === 'save') existing.saves++;
        if (event.eventType === 'join') existing.joins++;
        if (event.eventType === 'share') existing.shares++;

        // Track engagement time if available
        if (event.metadata?.duration) {
          existing.totalEngagementTime += event.metadata.duration;
          existing.engagementCount++;
        }

        metricsMap.set(key, existing);
      }

      // Upsert metrics to database
      for (const metrics of metricsMap.values()) {
        const avgEngagementTime = metrics.engagementCount > 0
          ? Math.round(metrics.totalEngagementTime / metrics.engagementCount)
          : 0;

        await supabase
          .from('cohort_engagement_metrics')
          .upsert({
            cohort: metrics.cohort,
            content_type: metrics.contentType,
            date: metrics.date,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            saves: metrics.saves,
            joins: metrics.joins,
            shares: metrics.shares,
            avg_engagement_seconds: avgEngagementTime,
          }, {
            onConflict: 'cohort,content_type,date',
          });
      }
    } catch (error) {
      console.error('[EngagementTracker] Error updating daily metrics:', error);
    }
  }

  /**
   * Gets average engagement rate for a cohort and content type
   */
  private async getCohortAverageEngagement(
    cohort: AgeCohort,
    contentType: ContentType
  ): Promise<number> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('cohort_engagement_metrics')
        .select('impressions, clicks')
        .eq('cohort', cohort)
        .eq('content_type', contentType)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

      if (error || !data || data.length === 0) {
        return 0.1; // Default baseline
      }

      const totalImpressions = data.reduce((sum, m) => sum + (m.impressions || 0), 0);
      const totalClicks = data.reduce((sum, m) => sum + (m.clicks || 0), 0);

      return totalImpressions > 0 ? totalClicks / totalImpressions : 0.1;
    } catch (error) {
      console.error('[EngagementTracker] Error calculating cohort average:', error);
      return 0.1;
    }
  }

  /**
   * Gets total user count for a cohort
   */
  private async getCohortUserCount(cohort: AgeCohort): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('age_cohort', cohort);

      if (error) {
        console.error('[EngagementTracker] Error getting user count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[EngagementTracker] Error in getCohortUserCount:', error);
      return 0;
    }
  }

  /**
   * Gets active user count for a cohort in the last N days
   */
  private async getActiveCohortUserCount(cohort: AgeCohort, days: number): Promise<number> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('content_interactions')
        .select('user_id')
        .eq('age_cohort', cohort)
        .gte('timestamp', startDate.toISOString());

      if (error) {
        console.error('[EngagementTracker] Error getting active users:', error);
        return 0;
      }

      // Count unique users
      const uniqueUsers = new Set(data?.map(d => d.user_id) || []);
      return uniqueUsers.size;
    } catch (error) {
      console.error('[EngagementTracker] Error in getActiveCohortUserCount:', error);
      return 0;
    }
  }

  /**
   * Generates a unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets the current queue size (for monitoring)
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Forces immediate queue processing (for testing/debugging)
   */
  async flushQueue(): Promise<void> {
    await this.processQueue();
  }
}

// Export singleton instance
export const engagementTracker = new EngagementTrackerService();
