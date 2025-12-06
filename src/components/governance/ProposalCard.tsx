import { Link } from 'react-router-dom';
import type { Proposal } from '../../types/governance.types';

interface ProposalCardProps {
  proposal: Proposal;
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
  const participationRate = proposal.quorum_required > 0
    ? Math.round((totalVotes / proposal.quorum_required) * 100)
    : 0;

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      passed: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      tie: 'bg-yellow-100 text-yellow-800',
      invalid: 'bg-gray-100 text-gray-800',
      draft: 'bg-purple-100 text-purple-800',
    };

    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getCategoryBadge = (category: string) => {
    const badges = {
      feature: 'bg-indigo-100 text-indigo-800',
      improvement: 'bg-teal-100 text-teal-800',
      policy: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return badges[category as keyof typeof badges] || badges.other;
  };

  const getTimeRemaining = () => {
    if (!proposal.voting_ends_at || proposal.status !== 'active') return null;

    const now = new Date();
    const endDate = new Date(proposal.voting_ends_at);
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Voting ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return 'Less than 1 hour remaining';
    }
  };

  const getVotePercentages = () => {
    if (totalVotes === 0) {
      return { forPercent: 0, againstPercent: 0, abstainPercent: 0 };
    }

    return {
      forPercent: Math.round((proposal.votes_for / totalVotes) * 100),
      againstPercent: Math.round((proposal.votes_against / totalVotes) * 100),
      abstainPercent: Math.round((proposal.votes_abstain / totalVotes) * 100),
    };
  };

  const { forPercent, againstPercent, abstainPercent } = getVotePercentages();
  const timeRemaining = getTimeRemaining();

  return (
    <Link
      to={`/governance/proposals/${proposal.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(proposal.status)}`}>
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(proposal.category)}`}>
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
      {totalVotes > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Vote Distribution</span>
            <span>{totalVotes} total votes</span>
          </div>
          
          {/* Vote Bar */}
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
            {forPercent > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${forPercent}%` }}
                title={`For: ${forPercent}%`}
              />
            )}
            {againstPercent > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${againstPercent}%` }}
                title={`Against: ${againstPercent}%`}
              />
            )}
            {abstainPercent > 0 && (
              <div
                className="bg-gray-400"
                style={{ width: `${abstainPercent}%` }}
                title={`Abstain: ${abstainPercent}%`}
              />
            )}
          </div>

          {/* Vote Counts */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              For: {proposal.votes_for} ({forPercent}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              Against: {proposal.votes_against} ({againstPercent}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
              Abstain: {proposal.votes_abstain} ({abstainPercent}%)
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {/* Participation Rate */}
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{participationRate}% participation</span>
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Time Remaining */}
        {timeRemaining && proposal.status === 'active' && (
          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{timeRemaining}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
