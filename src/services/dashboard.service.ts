/**
 * Impact Dashboard Service
 * Calculates and retrieves impact metrics for conservation efforts
 * Extended with age-based content curation
 * Requirements: 4.1, 4.2, 4.3, 4.4, 11.2, 11.3, B1.1, B2.1, B3.1
 */

import { supabase } from './supabase';
import { contentCurationService } from './contentCuration.service';
import type { CurationRequest, CuratedContentItem } from '../types/contentCuration.types';

export interface ImpactMetrics {
  forest: 'kakamega' | 'karura' | 'mau' | 'all';
  total_trees_planted: number;
  total_carbon_sequestered_tons: number;
  total_area_hectares: number;
  active_initiatives: number;
  total_participants: number;
  period_start: string;
  period_end: string;
}

export interface ForestStats {
  forest_name: string;
  forest_code: 'kakamega' | 'karura' | 'mau';
  total_area_hectares: number;
  trees_planted: number;
  carbon_sequestered_tons: number;
  active_initiatives: number;
  community_members: number;
}

export interface TrendData {
  date: string;
  trees_planted: number;
  carbon_sequestered: number;
  participants: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'initiative' | 'tree_plant' | 'transaction' | 'milestone';
  title: string;
  description: string;
  timestamp: string;
  forest?: string;
  user?: string;
}

export interface CuratedDashboard {
  metrics: ImpactMetrics;
  curatedContent: CuratedContentItem[];
  activities: ActivityFeedItem[];
  forestStats?: ForestStats[];
}

export const dashboardService = {
  /**
   * Get curated dashboard with age-appropriate content
   * Requirements: B1.1, B2.1, B3.1
   */
  async getCuratedDashboard(
    userId: string,
    forest: 'kakamega' | 'karura' | 'mau' | 'all' = 'all',
    contentLimit: number = 10
  ): Promise<CuratedDashboard> {
    try {
      console.log('[Dashboard] Fetching curated dashboard for user:', userId);

      // Fetch metrics and activities in parallel
      const [metrics, activities] = await Promise.all([
        this.getImpactMetrics(forest),
        this.getActivityFeed(10)
      ]);

      // Get curated content for the user
      const curationRequest: CurationRequest = {
        userId,
        contentTypes: ['initiative', 'mission', 'educational', 'social_post', 'challenge'],
        limit: contentLimit
      };

      const curationResponse = await contentCurationService.getCuratedContent(curationRequest);

      console.log(`[Dashboard] Curated dashboard ready with ${curationResponse.items.length} content items`);

      return {
        metrics,
        curatedContent: curationResponse.items,
        activities
      };

    } catch (error) {
      console.error('[Dashboard] Error fetching curated dashboard:', error);
      throw error;
    }
  },

  /**
   * Get curated dashboard with forest stats
   * Requirements: B1.1, B2.1, B3.1, 11.2, 11.3
   */
  async getCuratedDashboardWithStats(
    userId: string,
    forest: 'kakamega' | 'karura' | 'mau' | 'all' = 'all',
    contentLimit: number = 10
  ): Promise<CuratedDashboard> {
    try {
      console.log('[Dashboard] Fetching curated dashboard with stats for user:', userId);

      // Fetch all data in parallel
      const [metrics, activities, forestStats] = await Promise.all([
        this.getImpactMetrics(forest),
        this.getActivityFeed(10),
        this.getForestStats()
      ]);

      // Get curated content for the user
      const curationRequest: CurationRequest = {
        userId,
        contentTypes: ['initiative', 'mission', 'educational', 'social_post', 'challenge'],
        limit: contentLimit
      };

      const curationResponse = await contentCurationService.getCuratedContent(curationRequest);

      console.log(`[Dashboard] Curated dashboard with stats ready`);

      return {
        metrics,
        curatedContent: curationResponse.items,
        activities,
        forestStats
      };

    } catch (error) {
      console.error('[Dashboard] Error fetching curated dashboard with stats:', error);
      throw error;
    }
  },

  /**
   * Get aggregated impact metrics
   * Requirements: 4.1, 4.2: Display aggregated impact metrics
   */
  async getImpactMetrics(
    forest: 'kakamega' | 'karura' | 'mau' | 'all' = 'all',
    periodStart?: string,
    periodEnd?: string
  ): Promise<ImpactMetrics> {
    try {
      console.log('[Dashboard] Fetching impact metrics for:', forest);

      // Build date range
      const start = periodStart || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const end = periodEnd || new Date().toISOString();

      // Get initiatives query
      let initiativesQuery = supabase
        .from('initiatives')
        .select('id, trees_planted, area_hectares, status, forest')
        .gte('created_at', start)
        .lte('created_at', end);

      if (forest !== 'all') {
        initiativesQuery = initiativesQuery.eq('forest', forest);
      }

      const { data: initiatives, error: initError } = await initiativesQuery;

      if (initError) {
        console.error('[Dashboard] Error fetching initiatives:', initError);
        throw initError;
      }

      // Calculate metrics
      const total_trees_planted = initiatives?.reduce((sum, i) => sum + (i.trees_planted || 0), 0) || 0;
      const total_area_hectares = initiatives?.reduce((sum, i) => sum + (i.area_hectares || 0), 0) || 0;
      const active_initiatives = initiatives?.filter(i => i.status === 'active').length || 0;

      // Carbon sequestration calculation (average 20kg CO2 per tree per year)
      const total_carbon_sequestered_tons = (total_trees_planted * 20) / 1000;

      // Get participants count
      let participantsQuery = supabase
        .from('initiative_participants')
        .select('user_id', { count: 'exact', head: false });

      if (forest !== 'all') {
        // Need to join with initiatives to filter by forest
        const initiativeIds = initiatives?.map(i => i.id) || [];
        participantsQuery = participantsQuery.in('initiative_id', initiativeIds);
      }

      const { data: participants, error: partError } = await participantsQuery;

      if (partError) {
        console.error('[Dashboard] Error fetching participants:', partError);
        throw partError;
      }

      // Get unique participants
      const uniqueParticipants = new Set(participants?.map(p => p.user_id) || []);
      const total_participants = uniqueParticipants.size;

      const metrics: ImpactMetrics = {
        forest,
        total_trees_planted,
        total_carbon_sequestered_tons: Math.round(total_carbon_sequestered_tons * 10) / 10,
        total_area_hectares: Math.round(total_area_hectares * 10) / 10,
        active_initiatives,
        total_participants,
        period_start: start,
        period_end: end
      };

      console.log('[Dashboard] Metrics calculated:', metrics);
      return metrics;
    } catch (error) {
      console.error('[Dashboard] Failed to fetch impact metrics:', error);
      throw error;
    }
  },

  /**
   * Get forest-specific statistics
   * Requirements: 11.2, 11.3: Display forest-specific metrics and comparisons
   */
  async getForestStats(): Promise<ForestStats[]> {
    try {
      console.log('[Dashboard] Fetching forest statistics');

      const forests: Array<'kakamega' | 'karura' | 'mau'> = ['kakamega', 'karura', 'mau'];
      const forestNames = {
        kakamega: 'Kakamega Forest',
        karura: 'Karura Forest',
        mau: 'Mau Forest'
      };

      const stats: ForestStats[] = [];

      for (const forest of forests) {
        // Get initiatives for this forest
        const { data: initiatives, error: initError } = await supabase
          .from('initiatives')
          .select('id, trees_planted, area_hectares, status')
          .eq('forest', forest);

        if (initError) {
          console.error(`[Dashboard] Error fetching ${forest} initiatives:`, initError);
          continue;
        }

        const trees_planted = initiatives?.reduce((sum, i) => sum + (i.trees_planted || 0), 0) || 0;
        const total_area_hectares = initiatives?.reduce((sum, i) => sum + (i.area_hectares || 0), 0) || 0;
        const active_initiatives = initiatives?.filter(i => i.status === 'active').length || 0;

        // Get participants for this forest
        const initiativeIds = initiatives?.map(i => i.id) || [];
        const { data: participants } = await supabase
          .from('initiative_participants')
          .select('user_id')
          .in('initiative_id', initiativeIds);

        const uniqueParticipants = new Set(participants?.map(p => p.user_id) || []);
        const community_members = uniqueParticipants.size;

        const carbon_sequestered_tons = (trees_planted * 20) / 1000;

        stats.push({
          forest_name: forestNames[forest],
          forest_code: forest,
          total_area_hectares: Math.round(total_area_hectares * 10) / 10,
          trees_planted,
          carbon_sequestered_tons: Math.round(carbon_sequestered_tons * 10) / 10,
          active_initiatives,
          community_members
        });
      }

      console.log('[Dashboard] Forest stats calculated:', stats.length);
      return stats;
    } catch (error) {
      console.error('[Dashboard] Failed to fetch forest stats:', error);
      throw error;
    }
  },

  /**
   * Get trend data for visualization
   * Requirements: 4.2: Provide trend visualizations for key metrics over time
   */
  async getTrendData(
    forest: 'kakamega' | 'karura' | 'mau' | 'all' = 'all',
    days: number = 30
  ): Promise<TrendData[]> {
    try {
      console.log('[Dashboard] Fetching trend data for:', forest, 'days:', days);

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Get trees planted over time
      let treesQuery = supabase
        .from('trees')
        .select('planted_date, initiative_id')
        .gte('planted_date', startDate.toISOString().split('T')[0])
        .lte('planted_date', endDate.toISOString().split('T')[0]);

      // If filtering by forest, need to join with initiatives
      if (forest !== 'all') {
        const { data: initiatives } = await supabase
          .from('initiatives')
          .select('id')
          .eq('forest', forest);

        const initiativeIds = initiatives?.map(i => i.id) || [];
        treesQuery = treesQuery.in('initiative_id', initiativeIds);
      }

      const { data: trees, error: treesError } = await treesQuery;

      if (treesError) {
        console.error('[Dashboard] Error fetching trees:', treesError);
        throw treesError;
      }

      // Get participants over time
      const { data: participants } = await supabase
        .from('initiative_participants')
        .select('joined_at, initiative_id')
        .gte('joined_at', startDate.toISOString())
        .lte('joined_at', endDate.toISOString());

      // Group by date
      const trendMap = new Map<string, TrendData>();

      // Initialize all dates
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        trendMap.set(dateStr, {
          date: dateStr,
          trees_planted: 0,
          carbon_sequestered: 0,
          participants: 0
        });
      }

      // Aggregate trees
      trees?.forEach(tree => {
        const dateStr = tree.planted_date;
        const existing = trendMap.get(dateStr);
        if (existing) {
          existing.trees_planted += 1;
          existing.carbon_sequestered = (existing.trees_planted * 20) / 1000;
        }
      });

      // Aggregate participants
      participants?.forEach(p => {
        const dateStr = p.joined_at.split('T')[0];
        const existing = trendMap.get(dateStr);
        if (existing) {
          existing.participants += 1;
        }
      });

      // Convert to array and calculate cumulative
      const trendData = Array.from(trendMap.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );

      // Make cumulative
      for (let i = 1; i < trendData.length; i++) {
        trendData[i].trees_planted += trendData[i - 1].trees_planted;
        trendData[i].carbon_sequestered += trendData[i - 1].carbon_sequestered;
        trendData[i].participants += trendData[i - 1].participants;
      }

      console.log(`[Dashboard] Trend data calculated: ${trendData.length} points`);
      return trendData;
    } catch (error) {
      console.error('[Dashboard] Failed to fetch trend data:', error);
      throw error;
    }
  },

  /**
   * Get recent activity feed
   * Requirements: 4.4: Display recent activities
   */
  async getActivityFeed(limit: number = 10): Promise<ActivityFeedItem[]> {
    try {
      console.log('[Dashboard] Fetching activity feed, limit:', limit);

      const activities: ActivityFeedItem[] = [];

      // Get recent initiatives
      const { data: initiatives } = await supabase
        .from('initiatives')
        .select('id, title, forest, created_at, organization_id')
        .order('created_at', { ascending: false })
        .limit(limit);

      initiatives?.forEach(init => {
        activities.push({
          id: init.id,
          type: 'initiative',
          title: 'New Initiative Created',
          description: `${init.title} in ${init.forest} forest`,
          timestamp: init.created_at,
          forest: init.forest
        });
      });

      // Get recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          quantity_tons,
          transaction_date,
          buyer_id,
          carbon_credit:carbon_credits (
            initiative:initiatives (
              title,
              forest
            )
          )
        `)
        .eq('payment_status', 'completed')
        .order('transaction_date', { ascending: false })
        .limit(limit);

      transactions?.forEach((txn: any) => {
        const initiative = Array.isArray(txn.carbon_credit?.initiative) 
          ? txn.carbon_credit.initiative[0] 
          : txn.carbon_credit?.initiative;
        
        activities.push({
          id: txn.id,
          type: 'transaction',
          title: 'Carbon Credits Purchased',
          description: `${txn.quantity_tons} tons from ${initiative?.title || 'Unknown'}`,
          timestamp: txn.transaction_date,
          forest: initiative?.forest
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return activities.slice(0, limit);
    } catch (error) {
      console.error('[Dashboard] Failed to fetch activity feed:', error);
      throw error;
    }
  },

  /**
   * Generate impact report (PDF data)
   * Requirement 4.4: Generate downloadable PDF with detailed impact data
   */
  async generateReportData(
    forest: 'kakamega' | 'karura' | 'mau' | 'all' = 'all',
    periodStart?: string,
    periodEnd?: string
  ): Promise<{
    metrics: ImpactMetrics;
    forestStats: ForestStats[];
    trends: TrendData[];
    activities: ActivityFeedItem[];
  }> {
    try {
      console.log('[Dashboard] Generating report data for:', forest);

      const [metrics, forestStats, trends, activities] = await Promise.all([
        this.getImpactMetrics(forest, periodStart, periodEnd),
        this.getForestStats(),
        this.getTrendData(forest, 90), // 90 days for reports
        this.getActivityFeed(50) // More activities for reports
      ]);

      return {
        metrics,
        forestStats,
        trends,
        activities
      };
    } catch (error) {
      console.error('[Dashboard] Failed to generate report data:', error);
      throw error;
    }
  }
};