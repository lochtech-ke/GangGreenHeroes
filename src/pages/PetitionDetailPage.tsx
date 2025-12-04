/**
 * Petition Detail Page
 * Task 20.2: Build petition details page
 * 
 * Full page view for a single petition with signing capability
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PetitionDetails } from '../components/community/PetitionDetails';
import { SignPetitionModal } from '../components/community/SignPetitionModal';
import { useAuth } from '../hooks/useAuth';

export const PetitionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSignModal, setShowSignModal] = useState(false);
  const [petitionTitle, setPetitionTitle] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Petition not found</p>
          <button
            onClick={() => navigate('/petitions')}
            className="mt-4 text-green-600 hover:text-green-700 underline"
          >
            Back to Petitions
          </button>
        </div>
      </div>
    );
  }

  const handleSign = (title?: string) => {
    if (!user) {
      navigate('/login', { state: { from: `/petitions/${id}` } });
      return;
    }
    if (title) {
      setPetitionTitle(title);
    }
    setShowSignModal(true);
  };

  const handleSignSuccess = () => {
    setShowSignModal(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh of petition details
    
    // Show success message
    alert('Thank you for signing! Your signature has been recorded.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/petitions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Petitions
        </button>

        <PetitionDetails
          key={refreshKey}
          petitionId={id}
          userId={user?.id}
          onSign={handleSign}
        />

        {/* Sign Modal */}
        {showSignModal && user && (
          <SignPetitionModal
            petitionId={id}
            petitionTitle={petitionTitle}
            userId={user.id}
            onClose={() => setShowSignModal(false)}
            onSuccess={handleSignSuccess}
          />
        )}
      </div>
    </div>
  );
};
