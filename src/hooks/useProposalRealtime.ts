import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Proposal, Vote } from '../types/governance.types';

/**
 * Hook for real-time proposal updates
 */
export function useProposalRealtime(proposalId: string | null) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proposalId) {
      setLoading(false);
      return;
    }

    // Initial load
    loadProposal();
    loadVotes();

    // Subscribe to proposal changes
    const proposalChannel = supabase
      .channel(`proposal-${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposals',
          filter: `id=eq.${proposalId}`,
        },
        (payload) => {
          setProposal(payload.new as Proposal);
        }
      )
      .subscribe();

    // Subscribe to vote changes
    const votesChannel = supabase
      .channel(`votes-${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => {
          // Reload votes when any vote changes
          loadVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(proposalChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [proposalId]);

  const loadProposal = async () => {
    if (!proposalId) return;

    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (error) throw error;
      setProposal(data);
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVotes = async () => {
    if (!proposalId) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVotes(data || []);
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  return { proposal, votes, loading, refresh: loadProposal };
}

/**
 * Hook for real-time vote tally updates
 */
export function useVoteTallyRealtime(proposalId: string | null) {
  const [tally, setTally] = useState({
    votes_for: 0,
    votes_against: 0,
    votes_abstain: 0,
    total_voting_power: 0,
  });

  useEffect(() => {
    if (!proposalId) return;

    // Initial load
    loadTally();

    // Subscribe to proposal changes (which include vote counts)
    const channel = supabase
      .channel(`tally-${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposals',
          filter: `id=eq.${proposalId}`,
        },
        (payload) => {
          const proposal = payload.new as Proposal;
          setTally({
            votes_for: proposal.votes_for,
            votes_against: proposal.votes_against,
            votes_abstain: proposal.votes_abstain,
            total_voting_power: proposal.total_voting_power,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proposalId]);

  const loadTally = async () => {
    if (!proposalId) return;

    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('votes_for, votes_against, votes_abstain, total_voting_power')
        .eq('id', proposalId)
        .single();

      if (error) throw error;
      if (data) {
        setTally(data);
      }
    } catch (error) {
      console.error('Error loading tally:', error);
    }
  };

  return tally;
}

/**
 * Hook for real-time active proposals list
 */
export function useActiveProposalsRealtime() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    loadProposals();

    // Subscribe to proposal changes
    const channel = supabase
      .channel('active-proposals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals',
        },
        () => {
          // Reload proposals on any change
          loadProposals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  return { proposals, loading, refresh: loadProposals };
}
