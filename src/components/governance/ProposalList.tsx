import { useState, useEffect } from 'react';
import { proposalService } from '../../services/proposal.service';
import type { Proposal, ProposalFilters } from '../../types/governance.types';
import ProposalCard from './ProposalCard';

interface ProposalListProps {
  initialFilters?: ProposalFilters;
}

export default function ProposalList({ initialFilters }: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProposalFilters>(initialFilters || {});
  const [sortBy, setSortBy] = useState<'recent' | 'votes' | 'ending_soon'>('recent');

  useEffect(() => {
    loadProposals();
  }, [filters, sortBy]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const result = await proposalService.getProposalHistory(filters);
      if (result.success && result.data) {
        let sorted = [...result.data];
        
        // Apply sorting
        switch (sortBy) {
          case 'votes':
            sorted.sort((a, b) => {
              const aTotal = a.votes_for + a.votes_against + a.votes_abstain;
              const bTotal = b.votes_for + b.votes_against + b.votes_abstain;
              return bTotal - aTotal;
            });
            break;
          case 'ending_soon':
            sorted.sort((a, b) => {
              if (!a.voting_ends_at || !b.voting_ends_at) return 0;
              return new Date(a.voting_ends_at).getTime() - new Date(b.voting_ends_at).getTime();
            });
            break;
          case 'recent':
          default:
            sorted.sort((a, b) => {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
        }
        
        setProposals(sorted);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ProposalFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              <option value="feature">Feature</option>
              <option value="improvement">Improvement</option>
              <option value="policy">Policy</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="passed">Passed</option>
              <option value="rejected">Rejected</option>
              <option value="tie">Tie</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="recent">Most Recent</option>
              <option value="votes">Most Votes</option>
              <option value="ending_soon">Ending Soon</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {Object.keys(filters).length > 0 && (
          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Proposals List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No proposals found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}
