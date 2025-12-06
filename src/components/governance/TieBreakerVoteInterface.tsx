import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tieBreakerService } from '../../services/tieBreaker.service';
import type { Proposal } from '../../types/governance.types';

interface TieBreakerVoteInterfaceProps {
  proposal: Proposal;
  onVoteSuccess?: () => void;
}

export default function TieBreakerVoteInterface({
  proposal,
  onVoteSuccess,
}: TieBreakerVoteInterfaceProps) {
  const { user } = useAuth();
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleVote = async () => {
    if (!user || !selectedVote) return;

    setLoading(true);
    try {
      const result = await tieBreakerService.castTieBreakerVote(
        proposal.id,
        user.id,
        selectedVote
      );

      if (result.success) {
        onVoteSuccess?.();
      } else {
        alert(result.error?.message || 'Failed to cast tie-breaker vote');
      }
    } catch (error) {
      console.error('Error casting tie-breaker vote:', error);
      alert('Failed to cast tie-breaker vote. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;

  return (
    <div className="space-y-6">
      {/* Proposal Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Tie-Breaker Required
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
            {proposal.category.charAt(0).toUpperCase() + proposal.category.slice(1)}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">{proposal.title}</h2>
        
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
        </div>

        {proposal.implementation_timeline && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Implementation Timeline</h4>
            <p className="text-sm text-blue-800">{proposal.implementation_timeline}</p>
          </div>
        )}
      </div>

      {/* Vote Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Vote Distribution</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{proposal.votes_for}</div>
            <div className="text-sm text-gray-600 mt-1">Votes For</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{proposal.votes_against}</div>
            <div className="text-sm text-gray-600 mt-1">Votes Against</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-600">{proposal.votes_abstain}</div>
            <div className="text-sm text-gray-600 mt-1">Abstained</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">Voting Deadlock</p>
              <p className="text-sm text-yellow-700 mt-1">
                This proposal has ended in a tie with {proposal.votes_for} votes for and {proposal.votes_against} votes against.
                Your tie-breaking vote will determine the final outcome.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tie-Breaker Vote */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cast Your Tie-Breaking Vote</h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-red-800">Important</p>
              <p className="text-sm text-red-700 mt-1">
                Your vote will immediately finalize this proposal. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {/* Vote For */}
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
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedVote === 'for'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedVote === 'for' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Approve Proposal</div>
                <div className="text-sm text-gray-600">Vote in favor of implementing this proposal</div>
              </div>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>

          {/* Vote Against */}
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
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedVote === 'against'
                    ? 'border-red-500 bg-red-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedVote === 'against' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Reject Proposal</div>
                <div className="text-sm text-gray-600">Vote against implementing this proposal</div>
              </div>
            </div>
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => setShowConfirmation(true)}
          disabled={!selectedVote || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            !selectedVote || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Tie-Breaking Vote'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Tie-Breaking Vote</h3>
            <p className="text-gray-700 mb-6">
              You are about to cast a tie-breaking vote to{' '}
              <span className={`font-semibold ${selectedVote === 'for' ? 'text-green-600' : 'text-red-600'}`}>
                {selectedVote === 'for' ? 'approve' : 'reject'}
              </span>{' '}
              this proposal. This action will immediately finalize the proposal and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={loading}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  selectedVote === 'for'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                {loading ? 'Submitting...' : 'Confirm Vote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
