import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { tieBreakerService } from '../../services/tieBreaker.service';
import type { Proposal } from '../../types/governance.types';
import TieBreakerVoteInterface from './TieBreakerVoteInterface';

export default function TieBreakerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSeniorUser, setIsSeniorUser] = useState(false);
  const [tieProposals, setTieProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (user) {
      checkSeniorStatus();
      loadTieProposals();
    }
  }, [user]);

  const checkSeniorStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('senior_users')
        .select('can_break_ties')
        .eq('user_id', user.id)
        .eq('can_break_ties', true)
        .single();

      if (!error && data) {
        setIsSeniorUser(true);
      }
    } catch (error) {
      console.error('Error checking senior status:', error);
    }
  };

  const loadTieProposals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('status', 'tie')
        .order('voting_ends_at', { ascending: true });

      if (error) throw error;

      setTieProposals(data || []);
    } catch (error) {
      console.error('Error loading tie proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSuccess = () => {
    setSelectedProposal(null);
    loadTieProposals();
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">Please sign in to access the tie-breaker dashboard.</p>
      </div>
    );
  }

  if (!isSeniorUser) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">
          This dashboard is only accessible to senior users with tie-breaking authority.
        </p>
      </div>
    );
  }

  if (selectedProposal) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProposal(null)}
          className="flex items-center gap-2 text-green-600 hover:text-green-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <TieBreakerVoteInterface
          proposal={selectedProposal}
          onVoteSuccess={handleVoteSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tie-Breaker Dashboard</h2>
            <p className="text-gray-600">Resolve voting deadlocks with your tie-breaking authority</p>
          </div>
        </div>

        {tieProposals.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-yellow-800">
                  {tieProposals.length} proposal{tieProposals.length > 1 ? 's' : ''} require{tieProposals.length === 1 ? 's' : ''} your tie-breaking vote
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Your decision will finalize these proposals and determine their outcome.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proposals Requiring Tie-Breaking */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : tieProposals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tie-Breakers Needed</h3>
          <p className="text-gray-600">
            There are currently no proposals requiring your tie-breaking vote.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tieProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              {/* Proposal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Tie
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {proposal.category.charAt(0).toUpperCase() + proposal.category.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {proposal.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {proposal.description}
                  </p>
                </div>
              </div>

              {/* Vote Distribution */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Current Vote Distribution</span>
                  <span className="font-medium text-yellow-600">Tied</span>
                </div>
                
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-700">For: {proposal.votes_for}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-gray-700">Against: {proposal.votes_against}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                    <span className="text-gray-700">Abstain: {proposal.votes_abstain}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedProposal(proposal)}
                className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                Cast Tie-Breaking Vote
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
