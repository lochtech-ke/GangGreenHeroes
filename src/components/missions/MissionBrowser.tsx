/**
 * Mission Browser Component
 * Displays a filterable, searchable list of climate missions
 */

import React, { useState, useEffect } from 'react';
import { getMissions } from '../../services/mission.service';
import type { MissionWithOrganizer, MissionFilters, MissionType, MissionStatus } from '../../types/mission.types';
import MissionCard from './MissionCard';
import MissionMap from './MissionMap';

interface MissionBrowserProps {
  ageCohort?: string;
  initialFilters?: MissionFilters;
}

const MissionBrowser: React.FC<MissionBrowserProps> = ({ ageCohort: _ageCohort, initialFilters }) => {
  const [missions, setMissions] = useState<MissionWithOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // Filter state
  const [filters, setFilters] = useState<MissionFilters>(initialFilters || {});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    loadMissions();
  }, [filters, page]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * pageSize;
      const result = await getMissions(filters, pageSize, offset);
      
      setMissions(result.missions);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery });
    setPage(1);
  };

  const handleFilterChange = (key: keyof MissionFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleTypeToggle = (type: MissionType) => {
    const currentTypes = filters.mission_type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    handleFilterChange('mission_type', newTypes.length > 0 ? newTypes : undefined);
  };

  const handleStatusToggle = (status: MissionStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    handleFilterChange('status', newStatuses.length > 0 ? newStatuses : undefined);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const missionTypeLabels: Record<MissionType, string> = {
    tree_planting: '🌳 Tree Planting',
    waste_cleanup: '♻️ Waste Cleanup',
    water_conservation: '💧 Water Conservation',
    petition: '📝 Petition',
    fundraising: '💰 Fundraising',
  };

  const statusLabels: Record<MissionStatus, string> = {
    upcoming: 'Upcoming',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mission-browser">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Climate Missions</h1>
        <p className="text-gray-600">
          Join local and global climate action initiatives. Make a real impact!
        </p>
      </div>

      {/* Search and View Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search missions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Search
            </button>
          </div>
        </form>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'map'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-gray-700">Filters:</span>
          
          {/* Mission Type Filters */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(missionTypeLabels) as MissionType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.mission_type?.includes(type)
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {missionTypeLabels[type]}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusLabels) as MissionStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.status?.includes(status)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {(filters.mission_type || filters.status || filters.search) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 underline"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading missions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadMissions}
            className="mt-2 text-red-600 hover:text-red-700 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Results Count */}
          <div className="mb-4 text-gray-600">
            Showing {missions.length} of {total} missions
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <>
              {missions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No missions found</p>
                  <p className="text-gray-500 mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {missions.map((mission) => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <MissionMap missions={missions} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MissionBrowser;
