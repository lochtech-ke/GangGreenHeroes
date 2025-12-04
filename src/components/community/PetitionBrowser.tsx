/**
 * Petition Browser Component
 * Task 20.1: Create petition browser
 * 
 * Displays active petitions with filtering and search
 */

import React, { useState, useEffect } from 'react';
import { getPetitions } from '../../services/petition.service';
import type { PetitionWithCreator, PetitionFilters, PetitionTargetAudience } from '../../types/petition.types';

interface PetitionBrowserProps {
  onSelectPetition?: (petitionId: string) => void;
  filters?: PetitionFilters;
}

export const PetitionBrowser: React.FC<PetitionBrowserProps> = ({
  onSelectPetition,
  filters: initialFilters,
}) => {
  const [petitions, setPetitions] = useState<PetitionWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PetitionFilters>(initialFilters || {});
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadPetitions();
  }, [filters]);

  const loadPetitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPetitions(filters, 20, 0);
      setPetitions(result.petitions);
      setTotal(result.total);
    } catch (err) {
      setError('Failed to load petitions. Please try again.');
      console.error('Error loading petitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery });
  };

  const handleFilterChange = (key: keyof PetitionFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const getProgressPercentage = (petition: PetitionWithCreator) => {
    return Math.min(100, Math.round((petition.current_signatures / petition.signature_goal) * 100));
  };

  const getDaysRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  };

  const getTargetAudienceLabel = (audience: PetitionTargetAudience) => {
    const labels = {
      county: 'County Level',
      national: 'National Level',
      international: 'International',
    };
    return labels[audience];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Active Petitions</h2>
          <p className="text-gray-600 mt-1">
            {total} {total === 1 ? 'petition' : 'petitions'} for environmental policy change
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search petitions..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          <select
            value={filters.target_audience || ''}
            onChange={(e) => handleFilterChange('target_audience', e.target.value || undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Levels</option>
            <option value="county">County Level</option>
            <option value="national">National Level</option>
            <option value="international">International</option>
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Active & Successful</option>
            <option value="active">Active Only</option>
            <option value="successful">Successful Only</option>
            <option value="closed">Closed</option>
          </select>

          {(filters.search || filters.target_audience || filters.status) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadPetitions}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Petitions List */}
      {petitions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600 text-lg">No petitions found</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {petitions.map((petition) => {
            const progress = getProgressPercentage(petition);
            const daysRemaining = getDaysRemaining(petition.deadline);

            return (
              <div
                key={petition.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => onSelectPetition?.(petition.id)}
              >
                {/* Status Badge */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2">
                  <div className="flex items-center justify-between text-white text-sm">
                    <span className="font-medium">
                      {getTargetAudienceLabel(petition.target_audience)}
                    </span>
                    {petition.status === 'successful' && (
                      <span className="bg-white text-green-600 px-2 py-1 rounded-full text-xs font-bold">
                        ✓ Successful
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                    {petition.title}
                  </h3>

                  {/* Target Organization */}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Target:</span> {petition.target_organization}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">
                        {petition.current_signatures.toLocaleString()} signatures
                      </span>
                      <span className="text-gray-600">
                        Goal: {petition.signature_goal.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {progress}% complete
                    </p>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm">
                      {daysRemaining > 0 ? (
                        <span className="text-gray-600">
                          <span className="font-bold text-gray-900">{daysRemaining}</span> days left
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">Expired</span>
                      )}
                    </div>
                    {petition.creator && (
                      <div className="flex items-center gap-2">
                        {petition.creator.avatar && (
                          <img
                            src={petition.creator.avatar}
                            alt={petition.creator.display_name}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span className="text-sm text-gray-600">
                          {petition.creator.display_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
