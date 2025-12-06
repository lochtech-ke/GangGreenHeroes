import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { GovernanceToken, TokenTransaction } from '../types/governance.types';

/**
 * Hook for real-time governance token balance updates
 */
export function useGovernanceTokenBalance(userId: string | null) {
  const [balance, setBalance] = useState(0);
  const [tokenRecord, setTokenRecord] = useState<GovernanceToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Initial load
    loadBalance();

    // Subscribe to token balance changes
    const channel = supabase
      .channel(`governance-tokens-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'governance_tokens',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setBalance(0);
            setTokenRecord(null);
          } else {
            const record = payload.new as GovernanceToken;
            setBalance(record.balance);
            setTokenRecord(record);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadBalance = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('governance_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found
          setBalance(0);
          setTokenRecord(null);
        } else {
          throw error;
        }
      } else {
        setBalance(data.balance);
        setTokenRecord(data);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return { balance, tokenRecord, loading, refresh: loadBalance };
}

/**
 * Hook for real-time token transaction history
 */
export function useTokenTransactionsRealtime(userId: string | null, limit: number = 10) {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Initial load
    loadTransactions();

    // Subscribe to new transactions
    const channel = supabase
      .channel(`token-transactions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Reload transactions when new one is added
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, limit]);

  const loadTransactions = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return { transactions, loading, refresh: loadTransactions };
}

/**
 * Hook for real-time voting power (includes delegations)
 */
export function useVotingPowerRealtime(userId: string | null, proposalId?: string) {
  const [votingPower, setVotingPower] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Initial load
    loadVotingPower();

    // Subscribe to token changes (own tokens)
    const ownTokensChannel = supabase
      .channel(`voting-power-own-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'governance_tokens',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadVotingPower();
        }
      )
      .subscribe();

    // Subscribe to delegations TO this user
    const delegationsChannel = supabase
      .channel(`voting-power-delegations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'governance_tokens',
          filter: `delegated_to=eq.${userId}`,
        },
        () => {
          loadVotingPower();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ownTokensChannel);
      supabase.removeChannel(delegationsChannel);
    };
  }, [userId, proposalId]);

  const loadVotingPower = async () => {
    if (!userId) return;

    try {
      // Get user's own tokens
      const { data: userRecord } = await supabase
        .from('governance_tokens')
        .select('balance, delegated_to')
        .eq('user_id', userId)
        .single();

      let power = userRecord?.balance || 0;

      // If user has delegated their tokens, they have no voting power
      if (userRecord?.delegated_to) {
        power = 0;
      }

      // Add delegated power from others
      const { data: delegators } = await supabase
        .from('governance_tokens')
        .select('delegated_amount')
        .eq('delegated_to', userId);

      if (delegators) {
        const delegatedPower = delegators.reduce(
          (sum, record) => sum + (record.delegated_amount || 0),
          0
        );
        power += delegatedPower;
      }

      setVotingPower(power);
    } catch (error) {
      console.error('Error loading voting power:', error);
    } finally {
      setLoading(false);
    }
  };

  return { votingPower, loading, refresh: loadVotingPower };
}
