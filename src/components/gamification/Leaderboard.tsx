/**
 * Leaderboard Component
 * Displays rankings by various metrics with different timeframes and scopes
 * Requirements: A9.3
 */

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, MapPin, Calendar, Award } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { 
  LeaderboardEntry, 
  LeaderboardType, 
  Timeframe, 
  Scope 
} from '../../types/platform.types';

interface LeaderboardProps {
  currentUserId?: string;
  defaultType?: LeaderboardType;
  defaultTimeframe?: Timeframe;
  defaultScope?: Scope;
  limit?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  currentUserId,
  defaultType = 'green_coins',
  defaultTimeframe = 'monthly',
  defaultScope = 'global',
  limit = 50
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<LeaderboardType>(defaultType);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [selectedScope, setSelectedScope] = useState<Scope>(defaultScope);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedType, selectedTimeframe, selectedScope]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const timeframeFilter = getTimeframeFilter(selectedTimeframe);
      
      let query;
      
      switch (selectedType) {
        case 'gg_coins':
          query = buildGGCoinsQuery(timeframeFilter);
          break;
        case 'trees_planted':
          query = buildTreesPlantedQuery(timeframeFilter);
          break;
        case 'community_impact':
          query = buildCommunityImpactQuery(timeframeFilter);
          break;
        default:
          query = buildGGCoinsQuery(timeframeFilter);
      }

      // Apply scope filter
      if (selectedScope !== 'global') {
        // For county/community scope, we'd need to join with user_profiles
        // This is a simplified version
        query = query.limit(limit);
      } else {
        query = query.limit(limit);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Transform data to LeaderboardEntry format
      const leaderboardEntries: LeaderboardEntry[] = (data || []).map((entry: any, index: number) => ({
        userId: entry.user_id,
        displayName: entry.display_name || 'Anonymous User',
        avatar: entry.avatar,
        score: entry.score,
        rank: index + 1
      }));

      setEntries(leaderboardEntries);

      // Find current user's rank if provided
      if (currentUserId) {
        const userEntry = leaderboardEntries.find(e => e.userId === currentUserId);
        if (userEntry) {
          setCurrentUserRank(userEntry);
        } else {
          // User not in top entries, fetch their rank separately
          await fetchCurrentUserRank();
        }
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const buildGGCoinsQuery = (timeframeFilter: string) => {
    return supabase
      .from('gg_coin_transactions')
      .select(`
        user_id,
        user_profiles!inner(display_name, avatar)
      `)
      .gte('created_at', timeframeFilter)
      .eq('transaction_type', 'earn')
      .order('amount', { ascending: false });
  };

  const buildTreesPlantedQuery = (timeframeFilter: string) => {
    return supabase
      .from('planted_trees')
      .select(`
        user_id,
        user_profiles!inner(display_name, avatar)
      `)
      .gte('planted_date', timeframeFilter)
      .order('planted_date', { ascending: false });
  };

  const buildCommunityImpactQuery = (timeframeFilter: string) => {
    // Community impact could be a combination of missions, posts, and engagement
    return supabase
      .from('mission_participations')
      .select(`
        user_id,
        user_profiles!inner(display_name, avatar)
      `)
      .gte('joined_at', timeframeFilter)
      .order('joined_at', { ascending: false });
  };

  const getTimeframeFilter = (timeframe: Timeframe): string => {
    const now = new Date();
    switch (timeframe) {
      case 'daily':
        return new Date(now.setDate(now.getDate() - 1)).toISOString();
      case 'weekly':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case 'all_time':
        return new Date(0).toISOString();
      default:
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    }
  };

  const fetchCurrentUserRank = async () => {
    if (!currentUserId) return;

    try {
      // This would need a more sophisticated query to get exact rank
      // For now, we'll just indicate the user is outside top entries
      setCurrentUserRank({
        userId: currentUserId,
        displayName: 'You',
        score: 0,
        rank: limit + 1
      });
    } catch (err) {
      console.error('Error fetching user rank:', err);
    }
  };

  const getTypeLabel = (type: LeaderboardType): string => {
    const labels = {
      gg_coins: 'GG Coins',
      trees_planted: 'Trees Planted',
      community_impact: 'Community Impact'
    };
    return labels[type];
  };

  const getTypeIcon = (type: LeaderboardType) => {
    const icons = {
      green_coins: Award,
      trees_planted: TrendingUp,
      community_impact: Users
    };
    return icons[type];
  };

  const getTimeframeLabel = (timeframe: Timeframe): string => {
    const labels = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month',
      all_time: 'All Time'
    };
    return labels[timeframe];
  };

  const getScopeLabel = (scope: Scope): string => {
    const labels = {
      global: 'Global',
      county: 'County',
      community: 'Community'
    };
    return labels[scope];
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50';
    if (rank === 2) return 'text-gray-600 bg-gray-50';
    if (rank === 3) return 'text-orange-600 bg-orange-50';
    return 'text-gray-700 bg-white';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className="w-5 h-5" />;
    }
    return <span className="text-sm font-semibold">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  const TypeIcon = getTypeIcon(selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <TypeIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
            <p className="text-sm text-gray-600">
              {getTypeLabel(selectedType)} • {getTimeframeLabel(selectedTimeframe)} • {getScopeLabel(selectedScope)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metric
          </label>
          <div className="flex flex-col gap-2">
            {(['green_coins', 'trees_planted', 'community_impact'] as LeaderboardType[]).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  selectedType === type
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Timeframe
          </label>
          <div className="flex flex-col gap-2">
            {(['daily', 'weekly', 'monthly', 'all_time'] as Timeframe[]).map(timeframe => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  selectedTimeframe === timeframe
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTimeframeLabel(timeframe)}
              </button>
            ))}
          </div>
        </div>

        {/* Scope Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Scope
          </label>
          <div className="flex flex-col gap-2">
            {(['global', 'county', 'community'] as Scope[]).map(scope => (
              <button
                key={scope}
                onClick={() => setSelectedScope(scope)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  selectedScope === scope
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getScopeLabel(scope)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current User Rank (if outside top entries) */}
      {currentUserRank && currentUserRank.rank > 10 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">#{currentUserRank.rank}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Your Rank</p>
                <p className="text-sm text-gray-600">{currentUserRank.score} points</p>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      )}

      {/* Leaderboard Entries */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No entries yet. Be the first!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {entries.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  entry.userId === currentUserId ? 'bg-blue-50' : ''
                } ${getRankColor(entry.rank)}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank */}
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {entry.avatar ? (
                      <img 
                        src={entry.avatar} 
                        alt={entry.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-600">
                        {entry.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {entry.displayName}
                      {entry.userId === currentUserId && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{entry.score.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">
                      {selectedType === 'green_coins' && 'coins'}
                      {selectedType === 'trees_planted' && 'trees'}
                      {selectedType === 'community_impact' && 'points'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
