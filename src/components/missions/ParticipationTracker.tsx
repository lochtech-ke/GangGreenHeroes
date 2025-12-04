/**
 * Participation Tracker Component
 * Allows users to track and update their contributions to a mission
 */

import React, { useState } from 'react';
import { updateParticipationContribution } from '../../services/mission.service';
import type { MissionParticipation } from '../../types/mission.types';

interface ParticipationTrackerProps {
  participation: MissionParticipation;
  targetMetric?: string;
  onUpdate?: () => void;
}

const ParticipationTracker: React.FC<ParticipationTrackerProps> = ({
  participation,
  targetMetric,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [contributionValue, setContributionValue] = useState(
    participation.contribution_value?.toString() || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const value = parseFloat(contributionValue);
    if (isNaN(value) || value < 0) {
      setError('Please enter a valid positive number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await updateParticipationContribution(participation.id, {
        contribution_metric: targetMetric || participation.contribution_metric,
        contribution_value: value,
      });
      
      setIsEditing(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contribution');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setContributionValue(participation.contribution_value?.toString() || '');
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="participation-tracker bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Your Contribution</h3>
      
      {!isEditing ? (
        <div className="space-y-4">
          {/* Current Contribution */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Your contribution</p>
              <p className="text-2xl font-bold text-green-600">
                {participation.contribution_value || 0}
                {targetMetric && <span className="text-lg ml-2">{targetMetric}</span>}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Update
            </button>
          </div>

          {/* Participation Info */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Joined:</span>
              <span className="font-semibold">
                {new Date(participation.joined_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Verification Status:</span>
              <span className={`font-semibold capitalize ${
                participation.verification_status === 'approved' ? 'text-green-600' :
                participation.verification_status === 'rejected' ? 'text-red-600' :
                participation.verification_status === 'submitted' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {participation.verification_status}
              </span>
            </div>
            
            {participation.verified_at && (
              <div className="flex justify-between">
                <span>Verified:</span>
                <span className="font-semibold">
                  {new Date(participation.verified_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Field */}
          <div>
            <label htmlFor="contribution" className="block text-sm font-medium text-gray-700 mb-2">
              Contribution Amount {targetMetric && `(${targetMetric})`}
            </label>
            <input
              id="contribution"
              type="number"
              step="0.01"
              min="0"
              value={contributionValue}
              onChange={(e) => setContributionValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your contribution"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 Track your contribution to help measure the mission's impact. 
          Update this as you make progress!
        </p>
      </div>
    </div>
  );
};

export default ParticipationTracker;
