/**
 * Petitions Page
 * Task 20.1: Create petition browser
 * 
 * Main page for browsing and viewing petitions
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PetitionBrowser } from '../components/community/PetitionBrowser';

export const PetitionsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectPetition = (petitionId: string) => {
    navigate(`/petitions/${petitionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PetitionBrowser onSelectPetition={handleSelectPetition} />
      </div>
    </div>
  );
};
