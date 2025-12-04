/**
 * Green Mentor Page
 * Dedicated page for interacting with the AI Climate Companion
 */

import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../components/chatbot/ChatInterface';
import { RecommendationsPanel } from '../components/chatbot/RecommendationsPanel';
import { useAuth } from '../hooks/useAuth';
import { ChatContext } from '../types/aiCompanion.types';
import { Sparkles, MessageCircle } from 'lucide-react';

export const GreenMentorPage: React.FC = () => {
  const { user } = useAuth();
  const [chatContext, setChatContext] = useState<ChatContext | undefined>();

  useEffect(() => {
    if (user) {
      // Build chat context from user data
      // TODO: Fetch user profile data to get climate interests and location
      const context: ChatContext = {
        userInterests: [], // Will be populated from user profile
        ageCohort: '18-24', // Will be calculated from user age
        currentPage: '/green-mentor',
        recentActions: [],
        journeyStage: 'engagement'
      };
      setChatContext(context);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to chat with Green Mentor
          </h2>
          <p className="text-gray-600">
            Create an account to get personalized climate action guidance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Green Mentor</h1>
              <p className="text-gray-600">Your AI Climate Companion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <ChatInterface 
              context={chatContext}
              className="h-[700px]"
            />
          </div>

          {/* Recommendations Panel - Takes 1 column */}
          <div className="lg:col-span-1">
            {chatContext && (
              <RecommendationsPanel
                request={{
                  userInterests: chatContext.userInterests,
                  ageCohort: chatContext.ageCohort,
                  location: chatContext.location,
                  limit: 5
                }}
                onRecommendationClick={(rec) => {
                  console.log('Recommendation clicked:', rec);
                  // TODO: Navigate to recommendation
                }}
              />
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              🌱 Get Personalized Guidance
            </h3>
            <p className="text-sm text-gray-600">
              Ask Green Mentor about tree planting, conservation, or how to get started with climate action.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              📚 Learn About Climate
            </h3>
            <p className="text-sm text-gray-600">
              Get simple explanations of environmental concepts and learn about Kenya's conservation efforts.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              🎯 Discover Opportunities
            </h3>
            <p className="text-sm text-gray-600">
              Receive recommendations for missions, learning modules, and communities based on your interests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
