/**
 * Mission Details Page
 * Page for viewing detailed information about a specific mission
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MissionDetails from '../components/missions/MissionDetails';

const MissionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/missions')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span>←</span>
        <span>Back to Missions</span>
      </button>
      
      <MissionDetails missionId={id} />
    </div>
  );
};

export default MissionDetailsPage;
