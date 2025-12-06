import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { votingService } from '../../services/voting.service';
import { governanceTokenService } from '../../services/governanceToken.service';
import type { Vote } from '../../types/governance.types';

interface VoteButtonProps {
  proposalId: string;
  onVoteSuccess?: () => void;
}

export default function VoteButton({ proposalId, onVoteSuccess }: VoteButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [votingPower, setVotingPower] = useState(0);
  const [currentVote, setCurrentVote] = useState<Vote | null>(null);
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | 'abstain' | null>(null);

  useEffect(() => {
    if (user) {
      loadVotingData();
    }
  }, [user, proposalId]);

  const loadVotingData = async () => {
    if (!user) return;

    try {
      // Get voting power
      const power = await governanceTokenService.getVotingPower(user.id, proposalId);
      setVotingPower(power);

      // Get current vote if exists
      const vote = await votingService.getUserVote(proposalId, user.id);
      setCurrentVote(vote);
      if (vote) {
        setSelectedVote(vote.vote_type);
      }
    } catch (error) {
      console.error('Error loading voting data:', error);
    }
  };

  const handleVote = async () => {
    if (!user || !selectedVote) return;

    setLoading(true);
    try {
      const result = currentVote
        ? await votingService.updateVote(currentVote.id, selectedVote)
        : await votingService.castVote(proposalId, user.id, selectedVote);

      if (result.success) {
        setCurrentVote(result.data || null);
        onVoteSuccess?.();
      } else {
        alert(result.error?.message || 'Failed to cast vote');
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Failed to cast vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-800">Please sign in to vote on this proposal.</p>
      </div>
    );
  }

  if (votingPower === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">You need governance tokens to vote on proposals.</p>
        <p className="text-sm text-gray-500 mt-2">
          Earn tokens by planting trees, creating initiatives, and participating in the community.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cast Your Vote</h3>
        <p className="text-sm text-gray-600">
          Your voting power: <span className="font-medium text-green-600">{votingPower} tokens</span>
        </p>
        {currentVote && (
          <p className="text-sm text-blue-600 mt-1">
            You have already voted. You can change your vote below.
          </p>
        )}
      </div>

      {/* Vote Options */}
      <div className="space-y-3 mb-6">
        {/* For */}
        <button
          onClick={() => setSelectedVote('for')}
          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
            selectedVote === 'for'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedVote === 'for'
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              }`}
            >
              {selectedVote === 'for' && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Vote For</div>
              <div className="text-sm text-gray-600">Support this proposal</div>
            </div>
          </div>
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>

        {/* Against */}
        <button
          onClick={() => setSelectedVote('against')}
          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
            selectedVote === 'against'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedVote === 'against'
                  ? 'border-red-500 bg-red-500'
                  : 'border-gray-300'
              }`}
            >
              {selectedVote === 'against' && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Vote Against</div>
              <div className="text-sm text-gray-600">Oppose this proposal</div>
            </div>
          </div>
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Abstain */}
        <button
          onClick={() => setSelectedVote('abstain')}
          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
            selectedVote === 'abstain'
              ? 'border-gray-500 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedVote === 'abstain'
                  ? 'border-gray-500 bg-gray-500'
                  : 'border-gray-300'
              }`}
            >
              {selectedVote === 'abstain' && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Abstain</div>
              <div className="text-sm text-gray-600">No preference on this proposal</div>
            </div>
          </div>
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleVote}
        disabled={!selectedVote || loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          !selectedVote || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </span>
        ) : currentVote ? (
          'Update Vote'
        ) : (
          'Cast Vote'
        )}
      </button>
    </div>
  );
}
