/**
 * Onboarding Guide Page
 * Displays AI-powered step-by-step onboarding guidance
 * Requirements: A2.3 - Suggest appropriate onboarding steps, learning modules, or actions
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { OnboardingGuidePanel } from '../components/auth/OnboardingGuidePanel';
import { onboardingGuideService, type OnboardingStep } from '../services/onboardingGuide.service';

export default function OnboardingGuidePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allSteps, setAllSteps] = useState<OnboardingStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadAllSteps();
  }, [user, navigate]);

  const loadAllSteps = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const context = {
        userId: user.id,
        userType: 'individual' as const,
        climateInterests: [],
        hasCompletedProfile: false,
        hasJoinedCommunity: false,
        hasCompletedLearning: false,
        hasJoinedMission: false
      };

      const steps = await onboardingGuideService.getOnboardingSteps(context);
      setAllSteps(steps);
    } catch (error) {
      console.error('Error loading steps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepComplete = (stepId: string) => {
    console.log('Step completed:', stepId);
    loadAllSteps(); // Reload to update completion status
  };

  const handleAllComplete = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to #GangGreen! 🌱
          </h1>
          <p className="text-gray-600">
            Let's get you started on your climate action journey with personalized guidance from your Green Mentor.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Guide Panel */}
          <div className="lg:col-span-2">
            <OnboardingGuidePanel
              userId={user.id}
              onStepComplete={handleStepComplete}
              onAllComplete={handleAllComplete}
            />
          </div>

          {/* Sidebar - All Steps Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Your Journey</h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {allSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        step.completed
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.completed
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {step.completed ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            step.completed ? 'text-green-700' : 'text-gray-900'
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
              <p className="text-sm text-blue-800 mb-3">
                Your Green Mentor is here to guide you every step of the way. If you have questions, 
                just ask in the chat and I'll provide personalized assistance based on your interests and goals.
              </p>
              <button
                onClick={() => navigate('/green-mentor')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Chat with Green Mentor
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
