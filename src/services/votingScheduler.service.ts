import { supabase } from './supabase';
import type { Proposal } from '../types/governance.types';

/**
 * Voting Scheduler Service
 * 
 * Manages automatic voting period transitions and notifications.
 * This service should be called periodically (e.g., via cron job or scheduled function).
 */
class VotingSchedulerService {
  /**
   * Start voting period for proposals that are ready
   */
  async startVotingPeriods(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Find proposals in draft status that should start voting
      const { data: proposals, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('status', 'draft')
        .lte('voting_starts_at', now);

      if (error) throw error;

      if (!proposals || proposals.length === 0) {
        return;
      }

      // Update proposals to active status
      for (const proposal of proposals) {
        await this.activateProposal(proposal.id);
      }

      console.log(`Started voting for ${proposals.length} proposals`);
    } catch (error) {
      console.error('Error starting voting periods:', error);
    }
  }

  /**
   * End voting period for proposals that have expired
   */
  async endVotingPeriods(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Find active proposals that should end voting
      const { data: proposals, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('status', 'active')
        .lte('voting_ends_at', now);

      if (error) throw error;

      if (!proposals || proposals.length === 0) {
        return;
      }

      // Finalize each proposal
      for (const proposal of proposals) {
        await this.finalizeProposal(proposal);
      }

      console.log(`Ended voting for ${proposals.length} proposals`);
    } catch (error) {
      console.error('Error ending voting periods:', error);
    }
  }

  /**
   * Activate a proposal and send notifications
   */
  private async activateProposal(proposalId: string): Promise<void> {
    try {
      // Update proposal status to active
      const { error: updateError } = await supabase
        .from('proposals')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      if (updateError) throw updateError;

      // Send notifications to eligible voters
      await this.notifyEligibleVoters(proposalId);

      console.log(`Activated proposal ${proposalId}`);
    } catch (error) {
      console.error(`Error activating proposal ${proposalId}:`, error);
    }
  }

  /**
   * Finalize a proposal based on voting results
   */
  private async finalizeProposal(proposal: Proposal): Promise<void> {
    try {
      // Check quorum
      const meetsQuorum = await this.checkQuorum(proposal);

      if (!meetsQuorum) {
        // Mark as invalid due to insufficient participation
        await supabase
          .from('proposals')
          .update({
            status: 'invalid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', proposal.id);

        await this.notifyProposalOutcome(proposal.id, 'invalid');
        return;
      }

      // Determine outcome
      const { votes_for, votes_against } = proposal;

      if (votes_for > votes_against) {
        // Proposal passed
        await supabase
          .from('proposals')
          .update({
            status: 'passed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', proposal.id);

        await this.notifyProposalOutcome(proposal.id, 'passed');
      } else if (votes_against > votes_for) {
        // Proposal rejected
        await supabase
          .from('proposals')
          .update({
            status: 'rejected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', proposal.id);

        await this.notifyProposalOutcome(proposal.id, 'rejected');
      } else {
        // Tie - requires tie-breaker
        await supabase
          .from('proposals')
          .update({
            status: 'tie',
            updated_at: new Date().toISOString(),
          })
          .eq('id', proposal.id);

        await this.notifyTieBreaker(proposal.id);
      }

      console.log(`Finalized proposal ${proposal.id}`);
    } catch (error) {
      console.error(`Error finalizing proposal ${proposal.id}:`, error);
    }
  }

  /**
   * Check if proposal meets quorum requirements
   */
  private async checkQuorum(proposal: Proposal): Promise<boolean> {
    try {
      const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
      return totalVotes >= proposal.quorum_required;
    } catch (error) {
      console.error('Error checking quorum:', error);
      return false;
    }
  }

  /**
   * Send notifications to eligible voters when proposal becomes active
   */
  private async notifyEligibleVoters(proposalId: string): Promise<void> {
    try {
      // Get proposal details
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('title, voting_ends_at')
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposal) return;

      // Get all users with governance tokens
      const { data: tokenHolders, error: tokensError } = await supabase
        .from('governance_tokens')
        .select('user_id')
        .gt('balance', 0);

      if (tokensError || !tokenHolders) return;

      // Create notifications for each eligible voter
      const notifications = tokenHolders.map((holder) => ({
        user_id: holder.user_id,
        type: 'governance_proposal_active',
        title: 'New Proposal Available for Voting',
        message: `"${proposal.title}" is now open for voting. Cast your vote before ${new Date(proposal.voting_ends_at).toLocaleDateString()}.`,
        metadata: {
          proposal_id: proposalId,
          voting_ends_at: proposal.voting_ends_at,
        },
      }));

      await supabase.from('notifications').insert(notifications);

      console.log(`Notified ${tokenHolders.length} eligible voters for proposal ${proposalId}`);
    } catch (error) {
      console.error('Error notifying eligible voters:', error);
    }
  }

  /**
   * Send notifications about proposal outcome
   */
  private async notifyProposalOutcome(
    proposalId: string,
    outcome: 'passed' | 'rejected' | 'invalid'
  ): Promise<void> {
    try {
      // Get proposal details
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('title')
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposal) return;

      // Get all users who voted on this proposal
      const { data: voters, error: votersError } = await supabase
        .from('votes')
        .select('user_id')
        .eq('proposal_id', proposalId);

      if (votersError || !voters) return;

      const outcomeMessages = {
        passed: 'has been approved and will be implemented',
        rejected: 'has been rejected',
        invalid: 'did not meet quorum requirements and is invalid',
      };

      // Create notifications for each voter
      const notifications = voters.map((voter) => ({
        user_id: voter.user_id,
        type: 'governance_proposal_outcome',
        title: `Proposal ${outcome === 'passed' ? 'Passed' : outcome === 'rejected' ? 'Rejected' : 'Invalid'}`,
        message: `"${proposal.title}" ${outcomeMessages[outcome]}.`,
        metadata: {
          proposal_id: proposalId,
          outcome,
        },
      }));

      await supabase.from('notifications').insert(notifications);

      console.log(`Notified ${voters.length} voters about outcome of proposal ${proposalId}`);
    } catch (error) {
      console.error('Error notifying proposal outcome:', error);
    }
  }

  /**
   * Notify senior user about tie-breaker requirement
   */
  private async notifyTieBreaker(proposalId: string): Promise<void> {
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

      // Create notification for senior user
      await supabase.from('notifications').insert({
        user_id: seniorUser.user_id,
        type: 'governance_tie_breaker_required',
        title: 'Tie-Breaker Vote Required',
        message: `"${proposal.title}" has ended in a tie (${proposal.votes_for} for, ${proposal.votes_against} against). Your tie-breaking vote is needed.`,
        metadata: {
          proposal_id: proposalId,
          votes_for: proposal.votes_for,
          votes_against: proposal.votes_against,
        },
      });

      console.log(`Notified senior user ${seniorUser.user_id} about tie-breaker for proposal ${proposalId}`);
    } catch (error) {
      console.error('Error notifying tie-breaker:', error);
    }
  }

  /**
   * Send voting reminder notifications
   * Should be called periodically (e.g., 24 hours before voting ends)
   */
  async sendVotingReminders(): Promise<void> {
    try {
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Find active proposals ending soon
      const { data: proposals, error } = await supabase
        .from('proposals')
        .select('id, title, voting_ends_at')
        .eq('status', 'active')
        .gte('voting_ends_at', now.toISOString())
        .lte('voting_ends_at', reminderWindow.toISOString());

      if (error) throw error;

      if (!proposals || proposals.length === 0) {
        return;
      }

      for (const proposal of proposals) {
        await this.sendProposalReminder(proposal);
      }

      console.log(`Sent reminders for ${proposals.length} proposals`);
    } catch (error) {
      console.error('Error sending voting reminders:', error);
    }
  }

  /**
   * Send reminder for a specific proposal
   */
  private async sendProposalReminder(proposal: {
    id: string;
    title: string;
    voting_ends_at: string;
  }): Promise<void> {
    try {
      // Get users who haven't voted yet
      const { data: tokenHolders, error: tokensError } = await supabase
        .from('governance_tokens')
        .select('user_id')
        .gt('balance', 0);

      if (tokensError || !tokenHolders) return;

      const { data: voters, error: votersError } = await supabase
        .from('votes')
        .select('user_id')
        .eq('proposal_id', proposal.id);

      if (votersError) return;

      const voterIds = new Set(voters?.map((v) => v.user_id) || []);
      const nonVoters = tokenHolders.filter((holder) => !voterIds.has(holder.user_id));

      if (nonVoters.length === 0) return;

      // Create reminder notifications
      const notifications = nonVoters.map((holder) => ({
        user_id: holder.user_id,
        type: 'governance_voting_reminder',
        title: 'Voting Ends Soon',
        message: `Reminder: Voting for "${proposal.title}" ends in 24 hours. Cast your vote now!`,
        metadata: {
          proposal_id: proposal.id,
          voting_ends_at: proposal.voting_ends_at,
        },
      }));

      await supabase.from('notifications').insert(notifications);

      console.log(`Sent reminders to ${nonVoters.length} users for proposal ${proposal.id}`);
    } catch (error) {
      console.error('Error sending proposal reminder:', error);
    }
  }

  /**
   * Run all scheduled tasks
   * This method should be called periodically (e.g., every 5 minutes)
   */
  async runScheduledTasks(): Promise<void> {
    console.log('Running governance scheduled tasks...');
    await this.startVotingPeriods();
    await this.endVotingPeriods();
    await this.sendVotingReminders();
    console.log('Governance scheduled tasks completed');
  }
}

export const votingSchedulerService = new VotingSchedulerService();
export default votingSchedulerService;
