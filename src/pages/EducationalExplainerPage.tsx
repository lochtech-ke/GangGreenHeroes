/**
 * Educational Explainer Page
 * Dedicated page for environmental concept explanations and Q&A
 * Implements Requirement A2.2
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { EducationalExplainer } from '../components/chatbot/EducationalExplainer';
import { AgeCohort } from '../types/contentCuration.types';

export const EducationalExplainerPage: React.FC = () => {
  const { user } = useAuth();

  // Get user's age cohort from profile
  // @ts-ignore - user_metadata is available but not in type definition
  const ageCohort: AgeCohort = (user?.user_metadata?.age_cohort as AgeCohort) || '18-24';
  // @ts-ignore - user_metadata is available but not in type definition
  const userInterests = user?.user_metadata?.climate_interests || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🌍 Learn About Climate Action
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore environmental concepts explained in simple language, or ask Green Mentor any question about climate action in Kenya.
          </p>
        </div>

        {/* Educational Explainer Component */}
        <EducationalExplainer
          ageCohort={ageCohort}
          userInterests={userInterests}
        />

        {/* Additional Resources */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📖 More Learning Resources
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/learning"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="text-2xl mb-2">📚</div>
              <h4 className="font-semibold text-gray-900 mb-1">Learning Modules</h4>
              <p className="text-sm text-gray-600">
                Complete structured courses on conservation and climate justice
              </p>
            </a>
            <a
              href="/missions"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-semibold text-gray-900 mb-1">Climate Missions</h4>
              <p className="text-sm text-gray-600">
                Take action with tree planting and conservation missions
              </p>
            </a>
            <a
              href="/green-mentor"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-semibold text-gray-900 mb-1">Chat with Green Mentor</h4>
              <p className="text-sm text-gray-600">
                Get personalized guidance and recommendations
              </p>
            </a>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            Ready to Take Action?
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of Kenyans making a difference for our environment
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/missions"
              className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Missions
            </a>
            <a
              href="/communities"
              className="px-6 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition-colors"
            >
              Join a Community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
