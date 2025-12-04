/**
 * Community Browser Component
 * Browse and search communities with age-appropriate filtering
 * Requirements: A3.1, A3.5
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchCommunities,
  CommunitySearchFilters,
} from '../../services/community.service';
import { Community, AgeCohort } from '../../types/platform.types';
import { useAuth } from '../../hooks/useAuth';

export const CommunityBrowser: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<'low' | 'medium' | 'high' | ''>('');
  const [page, setPage] = useState(0);
  
  const ITEMS_PER_PAGE = 12;

  // Kenyan counties for location filter
  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
    'Kakamega', 'Meru', 'Nyeri', 'Machakos', 'Kiambu', 'Kajiado',
  ];

  useEffect(() => {
    loadCommunities();
  }, [searchQuery, selectedCounty, selectedActivityLevel, page]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const filters: CommunitySearchFilters = {
        searchQuery: searchQuery || undefined,
        county: selectedCounty || undefined,
        activityLevel: selectedActivityLevel || undefined,
        ageCohort: user?.age_cohort as AgeCohort | undefined,
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE,
      };

      const result = await searchCommunities(filters);
      setCommunities(result.communities);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadCommunities();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCounty('');
    setSelectedActivityLevel('');
    setPage(0);
  };

  const handleCommunityClick = (communityId: string) => {
    navigate(`/communities/${communityId}`);
  };

  const getActivityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Community Hub
        </h1>
        <p className="text-gray-600">
          Connect with local climate action groups and join the movement
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Communities
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or description..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                id="county"
                value={selectedCounty}
                onChange={(e) => {
                  setSelectedCounty(e.target.value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Counties</option>
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Level Filter */}
            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">
                Activity Level
              </label>
              <select
                id="activity"
                value={selectedActivityLevel}
                onChange={(e) => {
                  setSelectedActivityLevel(e.target.value as any);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="high">High Activity</option>
                <option value="medium">Medium Activity</option>
                <option value="low">Low Activity</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        {loading ? (
          'Loading...'
        ) : (
          `Showing ${communities.length} of ${total} communities`
        )}
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No communities found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <div
                key={community.id}
                onClick={() => handleCommunityClick(community.id)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                {/* Cover Image */}
                {community.coverImage && (
                  <div className="h-32 bg-gradient-to-r from-green-400 to-green-600">
                    <img
                      src={community.coverImage}
                      alt={community.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!community.coverImage && (
                  <div className="h-32 bg-gradient-to-r from-green-400 to-green-600"></div>
                )}

                <div className="p-6">
                  {/* Community Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {community.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {community.description}
                  </p>

                  {/* Location */}
                  {community.location && (
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {community.location.county}
                      {community.location.subCounty && `, ${community.location.subCounty}`}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      {community.memberCount} members
                    </div>

                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityLevelColor(
                        community.activityLevel
                      )}`}
                    >
                      {community.activityLevel} activity
                    </span>
                  </div>

                  {/* Focus Areas */}
                  {community.focusAreas && community.focusAreas.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {community.focusAreas.slice(0, 3).map((area, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded"
                        >
                          {area}
                        </span>
                      ))}
                      {community.focusAreas.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{community.focusAreas.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(page > 0 || hasMore) && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page + 1}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
