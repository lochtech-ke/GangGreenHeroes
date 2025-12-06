import { supabase } from './supabase';
import { contributionAnalyzerService } from './contributionAnalyzer.service';
import { tokenDistributionService } from './tokenDistribution.service';
import {
  DistributionCycleError,
  DistributionCycleErrorCode,
} from '../types/distributionCycle.types';
import type {
  DistributionCycle,
  DistributionCycleResponse,
  CycleCreationParams,
  CycleExecutionResult,
  CycleStatus,
} from '../types/distributionCycle.types';

/**
 * Distribution Cycle Service
 * Manages distribution cycles including creation, execution, and status management
 */
class DistributionCycleService {
  /**
   * Create a new distribution cycle
   */
  async createCycle(params: CycleCreationParams): Promise<DistributionCycleResponse<DistributionCycle>> {
    try {
      // Validate date range
      const startDate = new Date(params.start_date);
      const endDate = new Date(params.end_date);

      if (startDate >= endDate) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.INVALID_DATE_RANGE,
            'Start date must be before end date'
          ),
        };
      }

      // Check for overlapping cycles
      const hasOverlap = await this.checkCycleOverlap(params.start_date, params.end_date);
      if (hasOverlap) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.CYCLE_OVERLAP,
            'Date range overlaps with an existing cycle'
          ),
        };
      }

      // Get next cycle number
      const { data: lastCycle } = await supabase
        .from('distribution_cycles')
        .select('cycle_number')
        .order('cycle_number', { ascending: false })
        .limit(1)
        .single();

      const cycleNumber = (lastCycle?.cycle_number || 0) + 1;

      // Create cycle
      const { data: cycle, error: createError } = await supabase
        .from('distribution_cycles')
        .insert({
          cycle_number: cycleNumber,
          start_date: params.start_date,
          end_date: params.end_date,
          status: 'pending',
          total_token_pool: params.total_token_pool,
          tokens_distributed: 0,
          contributors_count: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.DATABASE_ERROR,
            `Failed to create cycle: ${createError.message}`
          ),
        };
      }

      console.log(`[DistributionCycle] Created cycle ${cycleNumber} (${cycle.id})`);

      return {
        data: cycle,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: new DistributionCycleError(
          DistributionCycleErrorCode.CREATION_FAILED,
          `Failed to create cycle: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Execute a distribution cycle (analyze contributions and distribute tokens)
   */
  async executeCycle(cycleId: string): Promise<DistributionCycleResponse<CycleExecutionResult>> {
    const startTime = Date.now();

    try {
      console.log(`[DistributionCycle] Starting execution for cycle ${cycleId}`);

      // Get cycle
      const cycle = await this.getCycle(cycleId);
      if (!cycle) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.CYCLE_NOT_FOUND,
            `Cycle ${cycleId} not found`
          ),
        };
      }

      // Validate cycle status
      if (cycle.status !== 'pending') {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.INVALID_CYCLE_STATUS,
            `Cycle must be in 'pending' status. Current status: ${cycle.status}`
          ),
        };
      }

      // Update status to calculating
      await this.updateCycleStatus(cycleId, 'calculating');

      // Step 1: Analyze all contributors
      console.log(`[DistributionCycle] Analyzing contributors for cycle ${cycleId}`);
      const analysisResult = await contributionAnalyzerService.analyzeAllContributors(cycleId);

      if (analysisResult.error) {
        await this.updateCycleStatus(cycleId, 'pending'); // Revert status
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.ANALYSIS_FAILED,
            `Contribution analysis failed: ${analysisResult.error.message}`
          ),
        };
      }

      const contributorsAnalyzed = analysisResult.data?.length || 0;
      const flagsRaised = analysisResult.metadata?.flags_raised || 0;

      // Update status to completed (ready for distribution)
      await this.updateCycleStatus(cycleId, 'completed');

      // Step 2: Distribute tokens
      console.log(`[DistributionCycle] Distributing tokens for cycle ${cycleId}`);
      const distributionResult = await tokenDistributionService.distributeTokensForCycle(cycleId);

      if (distributionResult.error) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.DISTRIBUTION_FAILED,
            `Token distribution failed: ${distributionResult.error.message}`
          ),
        };
      }

      const tokensDistributed = distributionResult.metadata?.total_tokens_distributed || 0;
      const contributorsRewarded = distributionResult.metadata?.contributors_count || 0;

      const processingTime = Date.now() - startTime;
      console.log(`[DistributionCycle] Cycle ${cycleId} executed successfully in ${processingTime}ms`);

      const result: CycleExecutionResult = {
        cycle_id: cycleId,
        cycle_number: cycle.cycle_number,
        status: 'distributed',
        contributors_analyzed: contributorsAnalyzed,
        contributors_rewarded: contributorsRewarded,
        tokens_distributed: tokensDistributed,
        flags_raised: flagsRaised,
        execution_time_ms: processingTime,
        completed_at: new Date().toISOString(),
      };

      return {
        data: result,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: new DistributionCycleError(
          DistributionCycleErrorCode.EXECUTION_FAILED,
          `Failed to execute cycle: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Get a distribution cycle by ID
   */
  async getCycle(cycleId: string): Promise<DistributionCycle | null> {
    try {
      const { data, error } = await supabase
        .from('distribution_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();

      if (error) {
        console.error('[DistributionCycle] Error fetching cycle:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[DistributionCycle] Error fetching cycle:', error);
      return null;
    }
  }

  /**
   * Get all distribution cycles
   */
  async getAllCycles(limit: number = 50): Promise<DistributionCycleResponse<DistributionCycle[]>> {
    try {
      const { data, error } = await supabase
        .from('distribution_cycles')
        .select('*')
        .order('cycle_number', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.DATABASE_ERROR,
            `Failed to fetch cycles: ${error.message}`
          ),
        };
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: new DistributionCycleError(
          DistributionCycleErrorCode.DATABASE_ERROR,
          `Failed to fetch cycles: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Get current active cycle (if any)
   */
  async getCurrentCycle(): Promise<DistributionCycle | null> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('distribution_cycles')
        .select('*')
        .lte('start_date', now)
        .gte('end_date', now)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No current cycle found
          return null;
        }
        console.error('[DistributionCycle] Error fetching current cycle:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[DistributionCycle] Error fetching current cycle:', error);
      return null;
    }
  }

  /**
   * Get the most recent completed cycle
   */
  async getLastCompletedCycle(): Promise<DistributionCycle | null> {
    try {
      const { data, error } = await supabase
        .from('distribution_cycles')
        .select('*')
        .eq('status', 'distributed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[DistributionCycle] Error fetching last completed cycle:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[DistributionCycle] Error fetching last completed cycle:', error);
      return null;
    }
  }

  /**
   * Update cycle status
   */
  async updateCycleStatus(cycleId: string, status: CycleStatus): Promise<DistributionCycleResponse<DistributionCycle>> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Set completed_at when status changes to distributed
      if (status === 'distributed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('distribution_cycles')
        .update(updateData)
        .eq('id', cycleId)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.DATABASE_ERROR,
            `Failed to update cycle status: ${error.message}`
          ),
        };
      }

      console.log(`[DistributionCycle] Cycle ${cycleId} status updated to ${status}`);

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: new DistributionCycleError(
          DistributionCycleErrorCode.DATABASE_ERROR,
          `Failed to update cycle status: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Finalize a cycle (mark as completed, ready for distribution)
   */
  async finalizeCycle(cycleId: string): Promise<DistributionCycleResponse<DistributionCycle>> {
    try {
      const cycle = await this.getCycle(cycleId);
      if (!cycle) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.CYCLE_NOT_FOUND,
            `Cycle ${cycleId} not found`
          ),
        };
      }

      if (cycle.status !== 'calculating') {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.INVALID_CYCLE_STATUS,
            `Cycle must be in 'calculating' status to finalize. Current status: ${cycle.status}`
          ),
        };
      }

      return await this.updateCycleStatus(cycleId, 'completed');
    } catch (error) {
      return {
        data: null,
        error: new DistributionCycleError(
          DistributionCycleErrorCode.FINALIZATION_FAILED,
          `Failed to finalize cycle: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Check if a date range overlaps with existing cycles
   */
  private async checkCycleOverlap(startDate: string, endDate: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('distribution_cycles')
        .select('id')
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (error) {
        console.error('[DistributionCycle] Error checking overlap:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('[DistributionCycle] Error checking overlap:', error);
      return false;
    }
  }

  /**
   * Create next cycle automatically based on configuration
   */
  async createNextCycle(): Promise<DistributionCycleResponse<DistributionCycle>> {
    try {
      // Get distribution configuration
      const config = await tokenDistributionService.getDistributionConfig();
      if (!config) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.CONFIGURATION_ERROR,
            'Distribution configuration not found'
          ),
        };
      }

      // Get last cycle to determine next cycle dates
      const lastCycle = await this.getLastCompletedCycle();
      
      let startDate: Date;
      let endDate: Date;

      if (lastCycle) {
        // Start after last cycle ended
        startDate = new Date(lastCycle.end_date);
        startDate.setDate(startDate.getDate() + 1);
      } else {
        // First cycle starts today
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      }

      // Calculate end date based on frequency
      endDate = new Date(startDate);
      switch (config.cycle_frequency) {
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
      }
      endDate.setDate(endDate.getDate() - 1); // End on last day of period
      endDate.setHours(23, 59, 59, 999);

      // Create cycle
      return await this.createCycle({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        total_token_pool: config.token_pool_per_cycle,
      });
    } catch (error) {
      return {
        data: null,
        error: new DistributionCycleError(
          DistributionCycleErrorCode.CREATION_FAILED,
          `Failed to create next cycle: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Get cycles by status
   */
  async getCyclesByStatus(status: CycleStatus): Promise<DistributionCycleResponse<DistributionCycle[]>> {
    try {
      const { data, error } = await supabase
        .from('distribution_cycles')
        .select('*')
        .eq('status', status)
        .order('cycle_number', { ascending: false });

      if (error) {
        return {
          data: null,
          error: new DistributionCycleError(
            DistributionCycleErrorCode.DATABASE_ERROR,
            `Failed to fetch cycles by status: ${error.message}`
          ),
        };
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: new DistributionCycleError(
          DistributionCycleErrorCode.DATABASE_ERROR,
          `Failed to fetch cycles by status: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }
}

// Export singleton instance
export const distributionCycleService = new DistributionCycleService();
