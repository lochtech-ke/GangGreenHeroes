import { supabase } from './supabase';
import { governanceTokenService } from './governanceToken.service';
import type {
  TokenDistribution,
  DistributionConfig,
  ManualTokenAward,
  TokenDistributionError,
  TokenDistributionErrorCode,
  TokenDistributionResponse,
  DistributionSummary,
  TokenAllocationMap,
} from '../types/tokenDistribution.types';
import type { ContributionScore } from '../types/contributionAnalyzer.types';

/**
 * Token Distribution Service
 * Manages the actual distribution of governance tokens to contributors
 */
class TokenDistributionService {
  /**
   * Distribute tokens for a completed distribution cycle
   */
  async distributeTokensForCycle(cycleId: string): Promise<TokenDistributionResponse<TokenDistribution[]>> {
    const startTime = Date.now();

    try {
      console.log(`[TokenDistribution] Starting distribution for cycle ${cycleId}`);

      // Validate cycle status
      const { data: cycle, error: cycleError } = await supabase
        .from('distribution_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();

      if (cycleError || !cycle) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.CYCLE_NOT_FOUND,
            `Distribution cycle ${cycleId} not found`
          ),
        };
      }

      if (cycle.status === 'distributed') {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.CYCLE_ALREADY_DISTRIBUTED,
            `Cycle ${cycleId} has already been distributed`
          ),
        };
      }

      if (cycle.status !== 'completed') {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.INVALID_CYCLE_STATUS,
            `Cycle must be in 'completed' status. Current status: ${cycle.status}`
          ),
        };
      }

      // Get contribution scores for this cycle
      const { data: scores, error: scoresError } = await supabase
        .from('contribution_scores')
        .select('*')
        .eq('cycle_id', cycleId)
        .eq('is_flagged', false) // Only distribute to non-flagged contributors
        .order('weighted_score', { ascending: false });

      if (scoresError) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.DATABASE_ERROR,
            `Failed to fetch contribution scores: ${scoresError.message}`
          ),
        };
      }

      if (!scores || scores.length === 0) {
        console.log(`[TokenDistribution] No eligible contributors found for cycle ${cycleId}`);
        return {
          data: [],
          error: null,
          metadata: {
            cycle_id: cycleId,
            total_tokens_distributed: 0,
            contributors_count: 0,
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      // Get distribution configuration
      const config = await this.getDistributionConfig();
      if (!config) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.CONFIGURATION_ERROR,
            'Distribution configuration not found'
          ),
        };
      }

      // Filter by minimum threshold
      const eligibleScores = scores.filter(
        score => score.weighted_score >= config.minimum_contribution_threshold
      );

      if (eligibleScores.length === 0) {
        console.log(`[TokenDistribution] No contributors meet minimum threshold for cycle ${cycleId}`);
        return {
          data: [],
          error: null,
          metadata: {
            cycle_id: cycleId,
            total_tokens_distributed: 0,
            contributors_count: 0,
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      // Calculate token allocations
      const allocationMap = await this.calculateTokenAllocation(
        eligibleScores,
        cycle.total_token_pool,
        config.max_tokens_per_contributor
      );

      // Update contribution scores with token allocations
      for (const score of eligibleScores) {
        const allocation = allocationMap.get(score.user_id) || 0;
        await supabase
          .from('contribution_scores')
          .update({ token_allocation: allocation })
          .eq('id', score.id);
      }

      // Distribute tokens and create distribution records
      const distributions: TokenDistribution[] = [];
      let totalDistributed = 0;

      for (const score of eligibleScores) {
        const tokensAwarded = allocationMap.get(score.user_id) || 0;
        
        if (tokensAwarded > 0) {
          // Award tokens using governance token service
          const awardResult = await governanceTokenService.awardTokens(
            score.user_id,
            tokensAwarded,
            'github_contribution',
            {
              cycle_id: cycleId,
              cycle_number: cycle.cycle_number,
              github_username: score.github_username,
              contribution_score: score.weighted_score,
            }
          );

          if (!awardResult.success) {
            console.error(`[TokenDistribution] Failed to award tokens to ${score.github_username}:`, awardResult.error);
            continue;
          }

          // Create distribution record
          const { data: distribution, error: distError } = await supabase
            .from('token_distributions')
            .insert({
              cycle_id: cycleId,
              user_id: score.user_id,
              github_username: score.github_username,
              tokens_awarded: tokensAwarded,
              contribution_score: score.weighted_score,
              distribution_type: 'automated',
              distributed_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (distError) {
            console.error(`[TokenDistribution] Failed to create distribution record:`, distError);
            continue;
          }

          distributions.push(distribution);
          totalDistributed += tokensAwarded;
        }
      }

      // Update cycle status
      await supabase
        .from('distribution_cycles')
        .update({
          status: 'distributed',
          tokens_distributed: totalDistributed,
          contributors_count: distributions.length,
          completed_at: new Date().toISOString(),
        })
        .eq('id', cycleId);

      const processingTime = Date.now() - startTime;
      console.log(`[TokenDistribution] Distribution completed in ${processingTime}ms. Distributed ${totalDistributed} tokens to ${distributions.length} contributors`);

      return {
        data: distributions,
        error: null,
        metadata: {
          cycle_id: cycleId,
          total_tokens_distributed: totalDistributed,
          contributors_count: distributions.length,
          processing_time_ms: processingTime,
        },
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof TokenDistributionError ? error : new TokenDistributionError(
          TokenDistributionErrorCode.DISTRIBUTION_FAILED,
          `Failed to distribute tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Award manual bonus tokens to a contributor
   */
  async awardManualBonus(award: Omit<ManualTokenAward, 'id' | 'awarded_at'>): Promise<TokenDistributionResponse<ManualTokenAward>> {
    try {
      // Validate justification
      if (!award.justification || award.justification.trim().length === 0) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.MISSING_JUSTIFICATION,
            'Justification is required for manual token awards'
          ),
        };
      }

      if (award.tokens_awarded <= 0) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.INVALID_TOKEN_AMOUNT,
            'Token amount must be greater than 0'
          ),
        };
      }

      // Award tokens using governance token service
      const awardResult = await governanceTokenService.awardTokens(
        award.user_id,
        award.tokens_awarded,
        'manual_bonus',
        {
          category: award.category,
          justification: award.justification,
          awarded_by: award.awarded_by,
        }
      );

      if (!awardResult.success) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.TOKEN_AWARD_FAILED,
            `Failed to award tokens: ${awardResult.error?.message || 'Unknown error'}`
          ),
        };
      }

      // Create manual award record
      const { data: manualAward, error: recordError } = await supabase
        .from('manual_token_awards')
        .insert({
          user_id: award.user_id,
          tokens_awarded: award.tokens_awarded,
          awarded_by: award.awarded_by,
          justification: award.justification,
          category: award.category,
          awarded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (recordError) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.DATABASE_ERROR,
            `Failed to record manual award: ${recordError.message}`
          ),
        };
      }

      console.log(`[TokenDistribution] Manual bonus awarded: ${award.tokens_awarded} tokens to user ${award.user_id}`);

      return {
        data: manualAward,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: new TokenDistributionError(
          TokenDistributionErrorCode.TOKEN_AWARD_FAILED,
          `Failed to award manual bonus: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Get distribution history for a user
   */
  async getDistributionHistory(userId: string, limit: number = 50): Promise<TokenDistributionResponse<TokenDistribution[]>> {
    try {
      const { data, error } = await supabase
        .from('token_distributions')
        .select(`
          *,
          distribution_cycles!inner(cycle_number, start_date, end_date)
        `)
        .eq('user_id', userId)
        .order('distributed_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.DATABASE_ERROR,
            `Failed to fetch distribution history: ${error.message}`
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
        error: new TokenDistributionError(
          TokenDistributionErrorCode.DATABASE_ERROR,
          `Failed to fetch distribution history: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Get current distribution configuration
   */
  async getDistributionConfig(): Promise<DistributionConfig | null> {
    try {
      const { data, error } = await supabase
        .from('distribution_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('[TokenDistribution] Error fetching config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[TokenDistribution] Error fetching config:', error);
      return null;
    }
  }

  /**
   * Update distribution configuration (admin only)
   */
  async updateDistributionConfig(
    config: Partial<DistributionConfig>,
    updatedBy: string
  ): Promise<TokenDistributionResponse<DistributionConfig>> {
    try {
      // Get current config
      const currentConfig = await this.getDistributionConfig();
      if (!currentConfig) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.CONFIGURATION_ERROR,
            'No active configuration found'
          ),
        };
      }

      // Update config
      const { data: updatedConfig, error: updateError } = await supabase
        .from('distribution_config')
        .update({
          ...config,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        })
        .eq('id', currentConfig.id)
        .select()
        .single();

      if (updateError) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.DATABASE_ERROR,
            `Failed to update configuration: ${updateError.message}`
          ),
        };
      }

      console.log(`[TokenDistribution] Configuration updated by ${updatedBy}`);

      return {
        data: updatedConfig,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: new TokenDistributionError(
          TokenDistributionErrorCode.CONFIGURATION_ERROR,
          `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }

  /**
   * Calculate token allocation based on contribution scores
   * Uses proportional distribution with maximum cap enforcement
   */
  async calculateTokenAllocation(
    scores: ContributionScore[],
    tokenPool: number,
    maxTokensPerContributor: number
  ): Promise<TokenAllocationMap> {
    const allocationMap = new Map<string, number>();

    if (scores.length === 0) {
      return allocationMap;
    }

    // Calculate total weighted score
    const totalWeightedScore = scores.reduce((sum, score) => sum + score.weighted_score, 0);

    if (totalWeightedScore === 0) {
      // If all scores are 0, distribute equally
      const tokensPerContributor = Math.min(
        Math.floor(tokenPool / scores.length),
        maxTokensPerContributor
      );

      scores.forEach(score => {
        allocationMap.set(score.user_id, tokensPerContributor);
      });

      return allocationMap;
    }

    // First pass: Calculate proportional allocation
    let remainingTokens = tokenPool;
    const cappedContributors = new Set<string>();

    scores.forEach(score => {
      const proportionalAllocation = Math.floor(
        (score.weighted_score / totalWeightedScore) * tokenPool
      );
      
      const allocation = Math.min(proportionalAllocation, maxTokensPerContributor);
      allocationMap.set(score.user_id, allocation);
      remainingTokens -= allocation;

      if (allocation >= maxTokensPerContributor) {
        cappedContributors.add(score.user_id);
      }
    });

    // Second pass: Redistribute remaining tokens to non-capped contributors
    if (remainingTokens > 0) {
      const nonCappedScores = scores.filter(score => !cappedContributors.has(score.user_id));
      
      if (nonCappedScores.length > 0) {
        const nonCappedTotalScore = nonCappedScores.reduce((sum, score) => sum + score.weighted_score, 0);
        
        nonCappedScores.forEach(score => {
          const currentAllocation = allocationMap.get(score.user_id) || 0;
          const additionalAllocation = Math.floor(
            (score.weighted_score / nonCappedTotalScore) * remainingTokens
          );
          
          const newAllocation = Math.min(
            currentAllocation + additionalAllocation,
            maxTokensPerContributor
          );
          
          allocationMap.set(score.user_id, newAllocation);
        });
      }
    }

    return allocationMap;
  }

  /**
   * Get distribution summary for a cycle
   */
  async getDistributionSummary(cycleId: string): Promise<TokenDistributionResponse<DistributionSummary>> {
    try {
      const { data: cycle, error: cycleError } = await supabase
        .from('distribution_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();

      if (cycleError || !cycle) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.CYCLE_NOT_FOUND,
            `Distribution cycle ${cycleId} not found`
          ),
        };
      }

      const { data: distributions, error: distError } = await supabase
        .from('token_distributions')
        .select('*')
        .eq('cycle_id', cycleId);

      if (distError) {
        return {
          data: null,
          error: new TokenDistributionError(
            TokenDistributionErrorCode.DATABASE_ERROR,
            `Failed to fetch distributions: ${distError.message}`
          ),
        };
      }

      const tokenAmounts = distributions?.map(d => d.tokens_awarded) || [];
      const totalDistributed = tokenAmounts.reduce((sum, amount) => sum + amount, 0);
      const averageTokens = tokenAmounts.length > 0 ? totalDistributed / tokenAmounts.length : 0;
      
      const sortedAmounts = [...tokenAmounts].sort((a, b) => a - b);
      const medianTokens = sortedAmounts.length > 0 
        ? sortedAmounts[Math.floor(sortedAmounts.length / 2)]
        : 0;

      const summary: DistributionSummary = {
        cycle_id: cycleId,
        cycle_number: cycle.cycle_number,
        status: cycle.status,
        total_token_pool: cycle.total_token_pool,
        tokens_distributed: totalDistributed,
        tokens_remaining: cycle.total_token_pool - totalDistributed,
        contributors_count: distributions?.length || 0,
        average_tokens_per_contributor: Math.round(averageTokens),
        median_tokens: medianTokens,
        distribution_date: cycle.completed_at,
      };

      return {
        data: summary,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: new TokenDistributionError(
          TokenDistributionErrorCode.DATABASE_ERROR,
          `Failed to get distribution summary: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }
}

// Export singleton instance
export const tokenDistributionService = new TokenDistributionService();
