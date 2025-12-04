/**
 * Mission Verification Page
 * Page for submitting verification evidence for a mission
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMissionById } from '../services/mission.service';
import { useAuth } from '../hooks/useAuth';
import VerificationSubmission from '../components/missions/VerificationSubmission';
import type { MissionWithParticipation } from '../types/mission.types';

const MissionVerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [mission, setMission] = useState<MissionWithParticipation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && user) {
      loadMission();
    }
  }, [id, user]);

  const loadMission = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await getMissionById(id, user.id);
      
      if (!data) {
        setError('Mission not found');
        return;
      }

      if (!data.user_participation) {
        setError('You must join this mission before submitting evidence');
        return;
      }

      setMission(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mission');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSuccess = () => {
    navigate(`/missions/${id}`, {
      state: { message: 'Evidence submitted successfully! It will be reviewed soon.' }
    });
  };

  const handleCancel = () => {
    navigate(`/missions/${id}`);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-yellow-800 font-semibold mb-2">Authentication Required</h3>
          <p className="text-yellow-600">Please log in to submit verification evidence</p>
          <button
            onClick={() => navigate('/login', { state: { from: `/missions/${id}/verify` } })}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Invalid Mission</h3>
          <p className="text-red-600">No mission ID provided</p>
          <button
            onClick={() => navigate('/missions')}
            className="mt-4 text-red-600 hover:text-red-700 underline"
          >
            Back to Missions
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading mission...</p>
        </div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error || 'Mission not found'}</p>
          <button
            onClick={() => navigate('/missions')}
            className="mt-4 text-red-600 hover:text-red-700 underline"
          >
            Back to Missions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/missions/${id}`)}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span>←</span>
        <span>Back to Mission</span>
      </button>

      {/* Mission Info */}
      <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{mission.title}</h1>
        <p className="text-gray-600">Submit evidence of your participation to earn rewards</p>
      </div>

      {/* Verification Form */}
      <VerificationSubmission
        missionId={id}
        participationId={mission.user_participation!.id}
        onSubmit={handleSubmitSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default MissionVerificationPage;
