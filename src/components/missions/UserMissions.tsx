/**
 * User Missions Component
 * Displays missions the user has joined
 */

import React, { useState, useEffect } from 'react';
import { getUserMissions } from '../../services/mission.service';
import { useAuth } from '../../hooks/useAuth';
import type { MissionWithParticipation } from '../../types/mission.types';
import MissionCard from './MissionCard';

const UserMissions: React.FC = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<MissionWithParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      loadUserMissions();
    }
  }, [user]);

  const loadUserMissions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await getUserMissions(user.id);
      setMissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your missions');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to view your missions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">Loading your missions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadUserMissions}
          className="mt-4 text-red-600 hover:text-red-700 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Filter missions
  const filteredMissions = missions.filter(mission => {
    if (filter === 'all') return true;
    if (filter === 'active') return mission.status === 'active' || mission.status === 'upcoming';
    if (filter === 'completed') return mission.status === 'completed';
    return true;
  });

  // Group by verification status
  const pendingVerification = filteredMissions.filter(
    m => m.user_participation?.verification_status === 'pending'
  );
  const submitted = filteredMissions.filter(
    m => m.user_participation?.verification_status === 'submitted'
  );
  const verified = filteredMissions.filter(
    m => m.user_participation?.verification_status === 'approved'
  );

  return (
    <div className="user-missions">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Missions</h2>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({missions.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Active ({missions.filter(m => m.status === 'active' || m.status === 'upcoming').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completed ({missions.filter(m => m.status === 'completed').length})
          </button>
        </div>
      </div>

      {filteredMissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌍</div>
          <p className="text-gray-600 text-lg">No missions found</p>
          <p className="text-gray-500 mt-2">
            {filter === 'all' 
              ? "You haven't joined any missions yet"
              : `No ${filter} missions`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Verification */}
          {pendingVerification.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⏳ Needs Verification ({pendingVerification.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingVerification.map(mission => (
                  <div key={mission.id} className="relative">
                    <MissionCard mission={mission} />
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Action Required
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Submitted for Review */}
          {submitted.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔍 Under Review ({submitted.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submitted.map(mission => (
                  <MissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            </section>
          )}

          {/* Verified */}
          {verified.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✅ Verified ({verified.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {verified.map(mission => (
                  <MissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            </section>
          )}

          {/* Other Missions */}
          {filteredMissions.filter(
            m => !['pending', 'submitted', 'approved'].includes(m.user_participation?.verification_status || '')
          ).length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Other Missions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMissions
                  .filter(m => !['pending', 'submitted', 'approved'].includes(m.user_participation?.verification_status || ''))
                  .map(mission => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default UserMissions;
