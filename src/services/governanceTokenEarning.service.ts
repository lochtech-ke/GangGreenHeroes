import { governanceTokenService } from './governanceToken.service';
import { supabase } from './supabase';

/**
 * Governance Token Earning Service
 * 
 * Automates governance token awards for qualifying actions.
 * Integrates with existing gamification events to award tokens.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

export interface TokenEarningEvent {
  userId: string;
  actionType: string;
  amount?: number;
  metadata?: Record<string, any>;
}

class GovernanceTokenEarningService {
  /**
   * Award tokens for tree planting completion
   * Requirement: 1.1
   */
  async awardForTreePlanting(
    userId: string,
    treeCount: number = 1,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get token earning rule for tree planting
      const { data: rule, error } = await supabase
        .from('token_earning_rules')
        .select('tokens_awarded, is_active')
        .eq('action_type', 'tree_planting')
        .eq('is_active', true)
        .single();

      if (error || !rule) {
        console.warn('[GovernanceTokenEarning] No active rule for tree_planting');
        return false;
      }

      // Calculate tokens based on tree count
      const tokensToAward = rule.tokens_awarded * treeCount;

      // Award tokens
      const result = await governanceTokenService.awardTokens(
        userId,
        tokensToAward,
        'tree_planting',
        {
          tree_count: treeCount,
          ...metadata,
        }
      );

      if (result.success) {
        console.log(
          `[GovernanceTokenEarning] Awarded ${tokensToAward} tokens to ${userId} for planting ${treeCount} tree(s)`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[GovernanceTokenEarning] Error awarding tokens for tree planting:', error);
      return false;
    }
  }

  /**
   * Award tokens for initiative creation
   * Requirement: 1.2
   */
  async awardForInitiativeCreation(
    userId: string,
    initiativeId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get token earning rule for initiative creation
      const { data: rule, error } = await supabase
        .from('token_earning_rules')
        .select('tokens_awarded, is_active')
        .eq('action_type', 'initiative_creation')
        .eq('is_active', true)
        .single();

      if (error || !rule) {
        console.warn('[GovernanceTokenEarning] No active rule for initiative_creation');
        return false;
      }

      // Award tokens
      const result = await governanceTokenService.awardTokens(
        userId,
        rule.tokens_awarded,
        'initiative_creation',
        {
          initiative_id: initiativeId,
          ...metadata,
        }
      );

      if (result.success) {
        console.log(
          `[GovernanceTokenEarning] Awarded ${rule.tokens_awarded} tokens to ${userId} for creating initiative ${initiativeId}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[GovernanceTokenEarning] Error awarding tokens for initiative creation:', error);
      return false;
    }
  }

  /**
   * Award tokens for community engagement activities
   * Requirement: 1.3
   */
  async awardForCommunityEngagement(
    userId: string,
    engagementType: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get token earning rule for community engagement
      const { data: rule, error } = await supabase
        .from('token_earning_rules')
        .select('tokens_awarded, is_active')
        .eq('action_type', 'community_engagement')
        .eq('is_active', true)
        .single();

      if (error || !rule) {
        console.warn('[GovernanceTokenEarning] No active rule for community_engagement');
        return false;
      }

      // Award tokens
      const result = await governanceTokenService.awardTokens(
        userId,
        rule.tokens_awarded,
        'community_engagement',
        {
          engagement_type: engagementType,
          ...metadata,
        }
      );

      if (result.success) {
        console.log(
          `[GovernanceTokenEarning] Awarded ${rule.tokens_awarded} tokens to ${userId} for ${engagementType}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[GovernanceTokenEarning] Error awarding tokens for community engagement:', error);
      return false;
    }
  }

  /**
   * Award tokens for initiative participation
   */
  async awardForInitiativeParticipation(
    userId: string,
    initiativeId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { data: rule, error } = await supabase
        .from('token_earning_rules')
        .select('tokens_awarded, is_active')
        .eq('action_type', 'initiative_participation')
        .eq('is_active', true)
        .single();

      if (error || !rule) {
        console.warn('[GovernanceTokenEarning] No active rule for initiative_participation');
        return false;
      }

      const result = await governanceTokenService.awardTokens(
        userId,
        rule.tokens_awarded,
        'initiative_participation',
        {
          initiative_id: initiativeId,
          ...metadata,
        }
      );

      if (result.success) {
        console.log(
          `[GovernanceTokenEarning] Awarded ${rule.tokens_awarded} tokens to ${userId} for participating in initiative ${initiativeId}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[GovernanceTokenEarning] Error awarding tokens for initiative participation:', error);
      return false;
    }
  }

  /**
   * Award tokens for proposal creation
   */
  async awardForProposalCreation(
    userId: string,
    proposalId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { data: rule, error } = await supabase
        .from('token_earning_rules')
        .select('tokens_awarded, is_active')
        .eq('action_type', 'proposal_creation')
        .eq('is_active', true)
        .single();

      if (error || !rule) {
        console.warn('[GovernanceTokenEarning] No active rule for proposal_creation');
        return false;
      }

      const result = await governanceTokenService.awardTokens(
        userId,
        rule.tokens_awarded,
        'proposal_creation',
        {
          proposal_id: proposalId,
          ...metadata,
        }
      );

      if (result.success) {
        console.log(
          `[GovernanceTokenEarning] Awarded ${rule.tokens_awarded} tokens to ${userId} for creating proposal ${proposalId}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[GovernanceTokenEarning] Error awarding tokens for proposal creation:', error);
      return false;
    }
  }

  /**
   * Award tokens for voting participation
   */
  async awardForVotingParticipation(
    userId: string,
    proposalId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { data: rule, error } = await supabase
        .from('token_earning_rules')
        .select('tokens_awarded, is_active')
        .eq('action_type', 'voting_participation')
        .eq('is_active', true)
        .single();

      if (error || !rule) {
        console.warn('[GovernanceTokenEarning] No active rule for voting_participation');
        return false;
      }

      const result = await governanceTokenService.awardTokens(
        userId,
        rule.tokens_awarded,
        'voting_participation',
        {
          proposal_id: proposalId,
          ...metadata,
        }
      );

      if (result.success) {
        console.log(
          `[GovernanceTokenEarning] Awarded ${rule.tokens_awarded} tokens to ${userId} for voting on proposal ${proposalId}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[GovernanceTokenEarning] Error awarding tokens for voting participation:', error);
      return false;
    }
  }

  /**
   * Generic method to award tokens for any action type
   */
  async awardForAction(
    userId: string,
    actionType: string,
    multiplier: number = 1,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { data: rule, error } = await supabase
        .from('token_earning_rules')
        .select('tokens_awarded, is_active, minimum_threshold')
        .eq('action_type', actionType)
        .eq('is_active', true)
        .single();

      if (error || !rule) {
        console.warn(`[GovernanceTokenEarning] No active rule for ${actionType}`);
        return false;
      }

      // Check minimum threshold if applicable
      if (rule.minimum_threshold && multiplier < rule.minimum_threshold) {
        console.warn(
          `[GovernanceTokenEarning] Multiplier ${multiplier} below minimum threshold ${rule.minimum_threshold}`
        );
        return false;
      }

      const tokensToAward = rule.tokens_awarded * multiplier;

      const result = await governanceTokenService.awardTokens(
        userId,
        tokensToAward,
        actionType,
        metadata
      );

      if (result.success) {
        console.log(
          `[GovernanceTokenEarning] Awarded ${tokensToAward} tokens to ${userId} for ${actionType}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[GovernanceTokenEarning] Error awarding tokens for ${actionType}:`, error);
      return false;
    }
  }

  /**
   * Get all active token earning rules
   */
  async getActiveRules() {
    try {
      const { data, error } = await supabase
        .from('token_earning_rules')
        .select('*')
        .eq('is_active', true)
        .order('action_type');

      if (error) {
        console.error('[GovernanceTokenEarning] Error fetching active rules:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[GovernanceTokenEarning] Exception fetching active rules:', error);
      return [];
    }
  }
}

export const governanceTokenEarningService = new GovernanceTokenEarningService();
export default governanceTokenEarningService;
