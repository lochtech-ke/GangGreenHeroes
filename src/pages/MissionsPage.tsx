/**
 * Missions Page
 * Main page for browsing climate missions
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import MissionBrowser from '../components/missions/MissionBrowser';

const MissionsPage: React.FC = () => {
  const { user } = useAuth();

  // Get user's age cohort from profile if available
  const ageCohort = user?.user_metadata?.age_cohort;

  return (
    <div className="container mx-auto px-4 py-8">
      <MissionBrowser ageCohort={ageCohort} />
    </div>
  );
};

export default MissionsPage;
