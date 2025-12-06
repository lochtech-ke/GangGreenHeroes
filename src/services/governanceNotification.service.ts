import { supabase } from './supabase';
import type { Proposal } from '../types/governance.types';

/**
 * Governance Notification Service
 * 
 * Handles all notification creation for governance events.
 */
class GovernanceNotificationService {
  /**
   * Notify eligible voters about a new proposal
   */
  async notifyNewProposal(proposal: Proposal): Promise<void> {
    try {
      // Get all users with governance tokens
      const { data: tokenHolders, error } = await supabase
        .from('governance_tokens')
        .select('user_id')
        .gt('balance', 0);

      if (error || !tokenHolders || tokenHolders.length === 0) {
        console.log('No eligible voters to notify');
        return;
      }

      // Create notifications for each eligible voter
      const notifications = tokenHolders.map((holder) => ({
        user_id: holder.user_id,
        type: 'governance_proposal_new',
        title: 'New Governance Proposal',
        message: `A new proposal "${proposal.title}" is now available for voting.`,
        metadata: {
          proposal_id: proposal.id,
          proposal_title: proposal.title,
          category: proposal.category,
          voting_ends_at: proposal.voting_ends_at,
        },
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      console.log(`Notified ${tokenHolders.length} users about new proposal ${proposal.id}`);
    } catch (error) {
      console.error('Error notifying new proposal:', error);
    }
  }

  /**
   * Send voting reminder to users who haven't voted
   */
  async sendVotingReminder(proposalId: string): Promise<void> {
    try {
      // Get proposal details
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('title, voting_ends_at')
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposal) return;

      // Get all token holders
      const { data: tokenHolders, error: tokensError } = await supabase
        .from('governance_tokens')
        .select('user_id')
        .gt('balance', 0);

      if (tokensError || !tokenHolders) return;

      // Get users who have already voted
      const { data: voters, error: votersError } = await supabase
        .from('votes')
        .select('user_id')
        .eq('proposal_id', proposalId);

      if (votersError) return;

      // Filter out users who have already voted
      const voterIds = new Set(voters?.map((v) => v.user_id) || []);
      const nonVoters = tokenHolders.filter((holder) => !voterIds.has(holder.user_id));

      if (nonVoters.length === 0) return;

      // Calculate time remaining
      const hoursRemaining = Math.floor(
        (new Date(proposal.voting_ends_at).getTime() - Date.now()) / (1000 * 60 * 60)
      );

      // Create reminder notifications
      const notifications = nonVoters.map((holder) => ({
        user_id: holder.user_id,
        type: 'governance_voting_reminder',
        title: 'Voting Reminder',
        message: `Don't forget to vote on "${proposal.title}". Voting ends in ${hoursRemaining} hours.`,
        metadata: {
          proposal_id: proposalId,
          proposal_title: proposal.title,
          voting_ends_at: proposal.voting_ends_at,
          hours_remaining: hoursRemaining,
        },
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      console.log(`Sent voting reminders to ${nonVoters.length} users for proposal ${proposalId}`);
    } catch (error) {
      console.error('Error sending voting reminder:', error);
    }
  }

  /**
   * Notify senior user about tie-breaker requirement
   */
  async notifyTieBreaker(proposalId: string): Promise<void> {
    try {
      // Get proposal details
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('title, votes_for, votes_against')
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposal) return;

      // Get senior user with highest seniority
      const { data: seniorUser, error: seniorError } = await supabase
        .from('senior_users')
        .select('user_id')
        .eq('can_break_ties', true)
        .order('seniority_level', { ascending: false })
        .limit(1)
        .single();

      if (seniorError || !seniorUser) {
        console.error('No senior user available for tie-breaking');
        return;
      }

      // Create notification
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: seniorUser.user_id,
          type: 'governance_tie_breaker_required',
          title: 'Tie-Breaker Vote Required',
          message: `The proposal "${proposal.title}" has ended in a tie (${proposal.votes_for} for, ${proposal.votes_against} against). Your tie-breaking vote is needed.`,
          metadata: {
            proposal_id: proposalId,
            proposal_title: proposal.title,
            votes_for: proposal.votes_for,
            votes_against: proposal.votes_against,
          },
        });

      if (insertError) throw insertError;

      console.log(`Notified senior user ${seniorUser.user_id} about tie-breaker for proposal ${proposalId}`);
    } catch (error) {
      console.error('Error notifying tie-breaker:', error);
    }
  }

  /**
   * Notify participants about proposal outcome
   */
  async notifyProposalOutcome(
    proposalId: string,
    outcome: 'passed' | 'rejected' | 'invalid'
  ): Promise<void> {
    try {
      // Get proposal details
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('title, implementation_timeline')
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposal) return;

      // Get all users who voted on this proposal
      const { data: voters, error: votersError } = await supabase
        .from('votes')
        .select('user_id')
        .eq('proposal_id', proposalId);

      if (votersError || !voters || voters.length === 0) return;

      const outcomeMessages = {
        passed: `has been approved${proposal.implementation_timeline ? ` and will be implemented ${proposal.implementation_timeline}` : ''}`,
        rejected: 'has been rejected by the community',
        invalid: 'did not meet quorum requirements and is invalid',
      };

      const outcomeEmoji = {
        passed: '✅',
        rejected: '❌',
        invalid: '⚠️',
      };

      // Create notifications for each voter
      const notifications = voters.map((voter) => ({
        user_id: voter.user_id,
        type: 'governance_proposal_outcome',
        title: `${outcomeEmoji[outcome]} Proposal ${outcome === 'passed' ? 'Passed' : outcome === 'rejected' ? 'Rejected' : 'Invalid'}`,
        message: `"${proposal.title}" ${outcomeMessages[outcome]}.`,
        metadata: {
          proposal_id: proposalId,
          proposal_title: proposal.title,
          outcome,
          implementation_timeline: proposal.implementation_timeline,
        },
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      console.log(`Notified ${voters.length} voters about outcome of proposal ${proposalId}`);
    } catch (error) {
      console.error('Error notifying proposal outcome:', error);
    }
  }

  /**
   * Notify user about token earnings
   */
  async notifyTokenEarned(
    userId: string,
    amount: number,
    source: string,
    sourceDetails?: string
  ): Promise<void> {
    try {
      const sourceMessages: Record<string, string> = {
        tree_planting: 'planting trees',
        initiative_creation: 'creating a conservation initiative',
        initiative_participation: 'participating in an initiative',
        community_engagement: 'community engagement',
        proposal_creation: 'creating a governance proposal',
        voting_participation: 'voting on a proposal',
      };

      const message = sourceDetails
        ? `You earned ${amount} governance tokens for ${sourceDetails}!`
        : `You earned ${amount} governance tokens for ${sourceMessages[source] || source}!`;

      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'governance_tokens_earned',
        title: '🪙 Governance Tokens Earned',
        message,
        metadata: {
          amount,
          source,
          source_details: sourceDetails,
        },
      });

      if (error) throw error;

      console.log(`Notified user ${userId} about earning ${amount} tokens`);
    } catch (error) {
      console.error('Error notifying token earned:', error);
    }
  }

  /**
   * Notify user about delegation
   */
  async notifyDelegationReceived(
    userId: string,
    fromUserId: string,
    amount: number
  ): Promise<void> {
    try {
      // Get delegator's profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, username')
        .eq('user_id', fromUserId)
        .single();

      const delegatorName = profile?.full_name || profile?.username || 'A user';

      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'governance_delegation_received',
        title: 'Voting Power Delegated to You',
        message: `${delegatorName} has delegated ${amount} governance tokens to you. You can now vote with their power.`,
        metadata: {
          from_user_id: fromUserId,
          amount,
        },
      });

      if (error) throw error;

      console.log(`Notified user ${userId} about delegation from ${fromUserId}`);
    } catch (error) {
      console.error('Error notifying delegation received:', error);
    }
  }

  /**
   * Notify user about delegation revocation
   */
  async notifyDelegationRevoked(userId: string, toUserId: string, amount: number): Promise<void> {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: toUserId,
        type: 'governance_delegation_revoked',
        title: 'Delegation Revoked',
        message: `A delegation of ${amount} governance tokens has been revoked. Your voting power has been updated.`,
        metadata: {
          from_user_id: userId,
          amount,
        },
      });

      if (error) throw error;

      console.log(`Notified user ${toUserId} about delegation revocation from ${userId}`);
    } catch (error) {
      console.error('Error notifying delegation revoked:', error);
    }
  }
}

export const governanceNotificationService = new GovernanceNotificationService();
export default governanceNotificationService;
