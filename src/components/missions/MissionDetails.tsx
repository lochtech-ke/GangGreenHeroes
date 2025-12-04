/**
 * Mission Details Component
 * Displays detailed information about a mission with participation options
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMissionById, joinMission, leaveMission } from '../../services/mission.service';
import { useAuth } from '../../hooks/useAuth';
import type { MissionWithParticipation } from '../../types/mission.types';

interface MissionDetailsProps {
  missionId: string;
}

const MissionDetails: React.FC<MissionDetailsProps> = ({ missionId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [mission, setMission] = useState<MissionWithParticipation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadMission();
  }, [missionId, user]);

  const loadMission = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getMissionById(missionId, user?.id);
      setMission(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mission');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMission = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/missions/${missionId}` } });
      return;
    }

    try {
      setActionLoading(true);
      await joinMission(missionId, user.id);
      await loadMission(); // Reload to get updated participation
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join mission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveMission = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to leave this mission?')) {
      return;
    }

    try {
      setActionLoading(true);
      await leaveMission(missionId, user.id);
      await loadMission(); // Reload to get updated participation
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to leave mission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitEvidence = () => {
    navigate(`/missions/${missionId}/verify`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">Loading mission details...</p>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Mission</h3>
        <p className="text-red-600">{error || 'Mission not found'}</p>
        <button
          onClick={() => navigate('/missions')}
          className="mt-4 text-red-600 hover:text-red-700 underline"
        >
          Back to Missions
        </button>
      </div>
    );
  }

  const getMissionTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      tree_planting: '🌳',
      waste_cleanup: '♻️',
      water_conservation: '💧',
      petition: '📝',
      fundraising: '💰',
    };
    return icons[type] || '🌍';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const progressPercentage = mission.target_value
    ? Math.min(100, (mission.current_value / mission.target_value) * 100)
    : 0;

  const isParticipating = !!mission.user_participation;
  const canSubmitEvidence = isParticipating && 
    mission.verification_required && 
    mission.user_participation?.verification_status === 'pending';

  return (
    <div className="mission-details">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-green-400 to-green-600 rounded-lg overflow-hidden mb-8">
        {mission.image_url ? (
          <img
            src={mission.image_url}
            alt={mission.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-9xl">
            {getMissionTypeIcon(mission.mission_type)}
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* Title and Status */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-4xl font-bold">{mission.title}</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(mission.status)}`}>
              {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getMissionTypeIcon(mission.mission_type)}</span>
              <span className="capitalize">{mission.mission_type.replace('_', ' ')}</span>
            </div>
            
            {mission.location_name && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{mission.location_name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>{mission.participant_count} participants</span>
            </div>
            
            {mission.green_coin_reward > 0 && (
              <div className="flex items-center gap-2 font-semibold">
                <span>🪙</span>
                <span>{mission.green_coin_reward} GG Coins</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Mission</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{mission.description}</p>
          </section>

          {/* Progress */}
          {mission.target_value && (
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span className="font-semibold">{mission.target_metric}</span>
                    <span>{progressPercentage.toFixed(1)}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-600 h-4 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span className="font-semibold">{mission.current_value} / {mission.target_value}</span>
                    <span>{mission.target_value - mission.current_value} remaining</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Location Map */}
          {mission.location_coordinates && (
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">📍</div>
                  <p className="text-gray-600">{mission.location_name}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Map integration coming soon
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Organizer */}
          {mission.organizer && (
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Organized By</h2>
              <div className="flex items-center gap-4">
                {mission.organizer.avatar ? (
                  <img
                    src={mission.organizer.avatar}
                    alt={mission.organizer.display_name}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold">
                    {mission.organizer.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{mission.organizer.display_name}</h3>
                  <p className="text-sm text-gray-600">Mission Organizer</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Take Action</h3>
            
            {/* Dates */}
            <div className="space-y-3 mb-6">
              {mission.start_date && (
                <div>
                  <p className="text-sm text-gray-600">Starts</p>
                  <p className="font-semibold text-gray-900">{formatDate(mission.start_date)}</p>
                </div>
              )}
              
              {mission.end_date && (
                <div>
                  <p className="text-sm text-gray-600">Ends</p>
                  <p className="font-semibold text-gray-900">{formatDate(mission.end_date)}</p>
                </div>
              )}
            </div>

            {/* Participation Status */}
            {isParticipating && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                  <span>✓</span>
                  <span>You're participating!</span>
                </div>
                <p className="text-sm text-green-700">
                  Verification Status: <span className="capitalize">{mission.user_participation?.verification_status}</span>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isParticipating ? (
                <button
                  onClick={handleJoinMission}
                  disabled={actionLoading || mission.status === 'completed' || mission.status === 'cancelled'}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Joining...' : 'Join Mission'}
                </button>
              ) : (
                <>
                  {canSubmitEvidence && (
                    <button
                      onClick={handleSubmitEvidence}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Submit Evidence
                    </button>
                  )}
                  
                  <button
                    onClick={handleLeaveMission}
                    disabled={actionLoading}
                    className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? 'Leaving...' : 'Leave Mission'}
                  </button>
                </>
              )}
            </div>

            {/* Verification Notice */}
            {mission.verification_required && (
              <p className="mt-4 text-xs text-gray-600 text-center">
                ⚠️ This mission requires photo and GPS verification to earn rewards
              </p>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mission Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Participants</span>
                <span className="font-semibold text-gray-900">{mission.participant_count}</span>
              </div>
              
              {mission.green_coin_reward > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reward</span>
                  <span className="font-semibold text-green-600">{mission.green_coin_reward} GC</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(mission.status)}`}>
                  {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionDetails;
