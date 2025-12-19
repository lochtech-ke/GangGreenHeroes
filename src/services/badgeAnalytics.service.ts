import { supabase } from './supabase';

export interface BadgeAnalytics {
  totalBadgesSold: number;
  totalRevenue: number;
  totalGGCoinsDistributed: number;
  salesByBadgeType: Array<{
    badge_type: string;
    count: number;
    revenue: number;
  }>;
  salesByTier: Array<{
    tier: string;
    count: number;
    revenue: number;
  }>;
  recentPurchases: Array<{
    id: string;
    user_id: string;
    badge_type: string;
    tier: string;
    amount_kes: number;
    gg_coins_awarded: number;
    created_at: string;
  }>;
  salesByStyle: {
    geometric: number;
    classic: number;
  };
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Badge Analytics Service
 * Provides analytics and reporting for badge purchases
 */
class BadgeAnalyticsService {
  /**
   * Get comprehensive badge purchase analytics
   */
  async getAnalytics(dateRange?: DateRange): Promise<BadgeAnalytics> {
    try {
      // Build date filter
      let query = supabase
        .from('badge_purchases')
        .select('*')
        .eq('payment_status', 'success');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate);
      }

      const { data: purchases, error } = await query;

      if (error) {
        console.error('[BadgeAnalyticsService] Error fetching purchases:', error);
        throw error;
      }

      // Calculate totals
      const totalBadgesSold = purchases?.length || 0;
      const totalRevenue = purchases?.reduce((sum, p) => sum + p.amount_kes, 0) || 0;
      const totalGGCoinsDistributed = purchases?.reduce((sum, p) => sum + p.gg_coins_awarded, 0) || 0;

      // Group by badge type
      const salesByBadgeType = this.groupByBadgeType(purchases || []);

      // Group by tier
      const salesByTier = this.groupByTier(purchases || []);

      // Group by style
      const salesByStyle = this.groupByStyle(purchases || []);

      // Get recent purchases
      const recentPurchases = (purchases || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          user_id: p.user_id,
          badge_type: p.badge_type,
          tier: p.tier,
          amount_kes: p.amount_kes,
          gg_coins_awarded: p.gg_coins_awarded,
          created_at: p.created_at,
        }));

      return {
        totalBadgesSold,
        totalRevenue,
        totalGGCoinsDistributed,
        salesByBadgeType,
        salesByTier,
        salesByStyle,
        recentPurchases,
      };
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Get total badges sold
   */
  async getTotalBadgesSold(dateRange?: DateRange): Promise<number> {
    try {
      let query = supabase
        .from('badge_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('payment_status', 'success');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate);
      }

      const { count, error } = await query;

      if (error) {
        console.error('[BadgeAnalyticsService] Error getting total badges:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error getting total badges:', error);
      return 0;
    }
  }

  /**
   * Get total revenue in KES
   */
  async getTotalRevenue(dateRange?: DateRange): Promise<number> {
    try {
      let query = supabase
        .from('badge_purchases')
        .select('amount_kes')
        .eq('payment_status', 'success');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BadgeAnalyticsService] Error getting revenue:', error);
        return 0;
      }

      return data?.reduce((sum, p) => sum + p.amount_kes, 0) || 0;
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error getting revenue:', error);
      return 0;
    }
  }

  /**
   * Get total GG Coins distributed
   */
  async getTotalGGCoinsDistributed(dateRange?: DateRange): Promise<number> {
    try {
      let query = supabase
        .from('badge_purchases')
        .select('gg_coins_awarded')
        .eq('payment_status', 'success')
        .eq('gg_coins_credited', true);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BadgeAnalyticsService] Error getting GG Coins:', error);
        return 0;
      }

      return data?.reduce((sum, p) => sum + p.gg_coins_awarded, 0) || 0;
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error getting GG Coins:', error);
      return 0;
    }
  }

  /**
   * Export analytics data as CSV
   */
  async exportToCSV(dateRange?: DateRange): Promise<string> {
    try {
      let query = supabase
        .from('badge_purchases')
        .select('*')
        .eq('payment_status', 'success')
        .order('created_at', { ascending: false });

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Create CSV header
      const headers = [
        'Purchase ID',
        'User ID',
        'Badge Type',
        'Tier',
        'Amount (KES)',
        'GG Coins Awarded',
        'GG Coins Credited',
        'Paystack Reference',
        'Purchase Date',
      ];

      // Create CSV rows
      const rows = (data || []).map(p => [
        p.id,
        p.user_id,
        p.badge_type,
        p.tier,
        p.amount_kes,
        p.gg_coins_awarded,
        p.gg_coins_credited ? 'Yes' : 'No',
        p.paystack_reference,
        new Date(p.created_at).toISOString(),
      ]);

      // Combine headers and rows
      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      return csv;
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error exporting CSV:', error);
      throw error;
    }
  }

  /**
   * Helper method to group purchases by badge type
   */
  private groupByBadgeType(
    purchases: any[]
  ): Array<{ badge_type: string; count: number; revenue: number }> {
    const grouped = purchases.reduce((acc, p) => {
      const key = p.badge_type;
      if (!acc[key]) {
        acc[key] = { count: 0, revenue: 0 };
      }
      acc[key].count += 1;
      acc[key].revenue += p.amount_kes;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    return Object.entries(grouped).map(([key, value]) => ({
      badge_type: key,
      count: (value as { count: number; revenue: number }).count,
      revenue: (value as { count: number; revenue: number }).revenue,
    }));
  }

  /**
   * Helper method to group purchases by tier
   */
  private groupByTier(
    purchases: any[]
  ): Array<{ tier: string; count: number; revenue: number }> {
    const grouped = purchases.reduce((acc, p) => {
      const key = p.tier;
      if (!acc[key]) {
        acc[key] = { count: 0, revenue: 0 };
      }
      acc[key].count += 1;
      acc[key].revenue += p.amount_kes;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    return Object.entries(grouped).map(([key, value]) => ({
      tier: key,
      count: (value as { count: number; revenue: number }).count,
      revenue: (value as { count: number; revenue: number }).revenue,
    }));
  }

  /**
   * Helper method to group purchases by style
   */
  private groupByStyle(
    purchases: any[]
  ): { geometric: number; classic: number } {
    let geometric = 0;
    let classic = 0;

    purchases.forEach(p => {
      const style = p.metadata?.style || 'classic';
      if (style === 'geometric') {
        geometric++;
      } else {
        classic++;
      }
    });

    return { geometric, classic };
  }

  /**
   * Track badge view event
   * Requirement: 8.5
   */
  async trackBadgeView(
    userId: string,
    badgeId: string,
    badgeType: string,
    tier: string,
    designType: 'geometric' | 'classic'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('badge_analytics_events')
        .insert({
          event_type: 'badge_view',
          user_id: userId,
          badge_id: badgeId,
          badge_type: badgeType,
          tier,
          design_type: designType,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });

      if (error) {
        console.error('[BadgeAnalyticsService] Error tracking badge view:', error);
      }
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error tracking badge view:', error);
    }
  }

  /**
   * Track badge share event
   * Requirement: 8.5
   */
  async trackBadgeShare(
    userId: string,
    badgeId: string,
    badgeType: string,
    tier: string,
    designType: 'geometric' | 'classic',
    platform: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('badge_analytics_events')
        .insert({
          event_type: 'badge_share',
          user_id: userId,
          badge_id: badgeId,
          badge_type: badgeType,
          tier,
          design_type: designType,
          metadata: {
            platform,
            timestamp: new Date().toISOString(),
          },
        });

      if (error) {
        console.error('[BadgeAnalyticsService] Error tracking badge share:', error);
      }
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error tracking badge share:', error);
    }
  }

  /**
   * Track achievement unlock event
   * Requirement: 8.5
   */
  async trackAchievementUnlock(
    userId: string,
    badgeId: string,
    badgeType: string,
    tier: string,
    designType: 'geometric' | 'classic'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('badge_analytics_events')
        .insert({
          event_type: 'achievement_unlock',
          user_id: userId,
          badge_id: badgeId,
          badge_type: badgeType,
          tier,
          design_type: designType,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });

      if (error) {
        console.error('[BadgeAnalyticsService] Error tracking achievement unlock:', error);
      }
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error tracking achievement unlock:', error);
    }
  }

  /**
   * Track badge generation event
   * Requirement: 8.5
   */
  async trackBadgeGeneration(
    userId: string,
    badgeType: string,
    tier: string,
    designType: 'geometric' | 'classic'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('badge_analytics_events')
        .insert({
          event_type: 'badge_generation',
          user_id: userId,
          badge_type: badgeType,
          tier,
          design_type: designType,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });

      if (error) {
        console.error('[BadgeAnalyticsService] Error tracking badge generation:', error);
      }
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error tracking badge generation:', error);
    }
  }

  /**
   * Get geometric vs classic usage statistics
   * Requirement: 8.5
   */
  async getDesignTypeUsage(dateRange?: DateRange): Promise<{
    geometric: number;
    classic: number;
    geometricPercentage: number;
    classicPercentage: number;
    totalEvents: number;
  }> {
    try {
      let query = supabase
        .from('badge_analytics_events')
        .select('design_type');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BadgeAnalyticsService] Error fetching design type usage:', error);
        throw error;
      }

      const geometric = data?.filter(e => e.design_type === 'geometric').length || 0;
      const classic = data?.filter(e => e.design_type === 'classic').length || 0;
      const totalEvents = geometric + classic;

      const geometricPercentage = totalEvents > 0 ? (geometric / totalEvents) * 100 : 0;
      const classicPercentage = totalEvents > 0 ? (classic / totalEvents) * 100 : 0;

      return {
        geometric,
        classic,
        geometricPercentage: Math.round(geometricPercentage * 100) / 100,
        classicPercentage: Math.round(classicPercentage * 100) / 100,
        totalEvents,
      };
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error getting design type usage:', error);
      throw error;
    }
  }

  /**
   * Get badge view statistics
   * Requirement: 8.5
   */
  async getBadgeViewStats(dateRange?: DateRange): Promise<{
    totalViews: number;
    uniqueUsers: number;
    viewsByBadgeType: Array<{ badge_type: string; count: number }>;
    viewsByTier: Array<{ tier: string; count: number }>;
    viewsByDesignType: { geometric: number; classic: number };
  }> {
    try {
      let query = supabase
        .from('badge_analytics_events')
        .select('*')
        .eq('event_type', 'badge_view');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BadgeAnalyticsService] Error fetching badge views:', error);
        throw error;
      }

      const totalViews = data?.length || 0;
      const uniqueUsers = new Set(data?.map(e => e.user_id)).size;

      // Group by badge type
      const viewsByBadgeType = this.groupByField(data || [], 'badge_type');

      // Group by tier
      const viewsByTier = this.groupByField(data || [], 'tier');

      // Group by design type
      const geometric = data?.filter(e => e.design_type === 'geometric').length || 0;
      const classic = data?.filter(e => e.design_type === 'classic').length || 0;

      return {
        totalViews,
        uniqueUsers,
        viewsByBadgeType,
        viewsByTier,
        viewsByDesignType: { geometric, classic },
      };
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error getting badge view stats:', error);
      throw error;
    }
  }

  /**
   * Get badge share statistics
   * Requirement: 8.5
   */
  async getBadgeShareStats(dateRange?: DateRange): Promise<{
    totalShares: number;
    uniqueUsers: number;
    sharesByPlatform: Array<{ platform: string; count: number }>;
    sharesByBadgeType: Array<{ badge_type: string; count: number }>;
    sharesByDesignType: { geometric: number; classic: number };
  }> {
    try {
      let query = supabase
        .from('badge_analytics_events')
        .select('*')
        .eq('event_type', 'badge_share');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BadgeAnalyticsService] Error fetching badge shares:', error);
        throw error;
      }

      const totalShares = data?.length || 0;
      const uniqueUsers = new Set(data?.map(e => e.user_id)).size;

      // Group by platform
      const platformCounts: Record<string, number> = {};
      data?.forEach(e => {
        const platform = e.metadata?.platform || 'unknown';
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });
      const sharesByPlatform = Object.entries(platformCounts).map(([platform, count]) => ({
        platform,
        count,
      }));

      // Group by badge type
      const sharesByBadgeType = this.groupByField(data || [], 'badge_type');

      // Group by design type
      const geometric = data?.filter(e => e.design_type === 'geometric').length || 0;
      const classic = data?.filter(e => e.design_type === 'classic').length || 0;

      return {
        totalShares,
        uniqueUsers,
        sharesByPlatform,
        sharesByBadgeType,
        sharesByDesignType: { geometric, classic },
      };
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error getting badge share stats:', error);
      throw error;
    }
  }

  /**
   * Get achievement unlock statistics
   * Requirement: 8.5
   */
  async getAchievementUnlockStats(dateRange?: DateRange): Promise<{
    totalUnlocks: number;
    uniqueUsers: number;
    unlocksByBadgeType: Array<{ badge_type: string; count: number }>;
    unlocksByTier: Array<{ tier: string; count: number }>;
    unlocksByDesignType: { geometric: number; classic: number };
  }> {
    try {
      let query = supabase
        .from('badge_analytics_events')
        .select('*')
        .eq('event_type', 'achievement_unlock');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BadgeAnalyticsService] Error fetching achievement unlocks:', error);
        throw error;
      }

      const totalUnlocks = data?.length || 0;
      const uniqueUsers = new Set(data?.map(e => e.user_id)).size;

      // Group by badge type
      const unlocksByBadgeType = this.groupByField(data || [], 'badge_type');

      // Group by tier
      const unlocksByTier = this.groupByField(data || [], 'tier');

      // Group by design type
      const geometric = data?.filter(e => e.design_type === 'geometric').length || 0;
      const classic = data?.filter(e => e.design_type === 'classic').length || 0;

      return {
        totalUnlocks,
        uniqueUsers,
        unlocksByBadgeType,
        unlocksByTier,
        unlocksByDesignType: { geometric, classic },
      };
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error getting achievement unlock stats:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics dashboard
   * Requirement: 8.5
   */
  async getAnalyticsDashboard(dateRange?: DateRange) {
    try {
      const [
        designTypeUsage,
        viewStats,
        shareStats,
        unlockStats,
      ] = await Promise.all([
        this.getDesignTypeUsage(dateRange),
        this.getBadgeViewStats(dateRange),
        this.getBadgeShareStats(dateRange),
        this.getAchievementUnlockStats(dateRange),
      ]);

      return {
        designTypeUsage,
        views: viewStats,
        shares: shareStats,
        unlocks: unlockStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[BadgeAnalyticsService] Error getting analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Helper method to group events by a field
   */
  private groupByField(
    events: any[],
    field: string
  ): any[] {
    const grouped = events.reduce((acc, e) => {
      const key = e[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([key, count]) => ({
      [field]: key,
      count,
    }));
  }
}

// Export singleton instance
export const badgeAnalyticsService = new BadgeAnalyticsService();
