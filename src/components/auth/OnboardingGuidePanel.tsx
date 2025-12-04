/**
 * Onboarding Guide Panel Component
 * Displays AI-powered step-by-step guidance during onboarding
 */

import { useState, useEffect } from 'react';
import { onboardingGuideService, type OnboardingStep, type OnboardingProgress } from '../../services/onboardingGuide.service';
import type { Recommendation } from '../../types/aiCompanion.types';

interface OnboardingGuidePanelProps {
  userId: string;
  onStepComplete?: (stepId: string) => void;
  onAllComplete?: () => void;
}

export function OnboardingGuidePanel({ userId, onStepComplete, onAllComplete }: OnboardingGuidePanelProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [guidance, setGuidance] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadOnboardingData();
  }, [userId]);

  const loadOnboardingData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load progress
      const progressData = await onboardingGuideService.getProgress(userId);
      setProgress(progressData);

      // Load next action
      const nextAction = await onboardingGuideService.getNextAction(userId);
      
      if (nextAction) {
        setCurrentStep(nextAction.step);
        setGuidance(nextAction.guidance);
        setRecommendations(nextAction.recommendations);
      } else {
        // All steps complete
        if (onAllComplete) {
          onAllComplete();
        }
      }
    } catch (err) {
      console.error('Error loading onboarding data:', err);
      setError('Failed to load onboarding guidance. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStep = async (stepId: string) => {
    try {
      await onboardingGuideService.completeStep(userId, stepId);
      
      if (onStepComplete) {
        onStepComplete(stepId);
      }

      // Reload data to get next step
      await loadOnboardingData();
    } catch (err) {
      console.error('Error completing step:', err);
      setError('Failed to mark step as complete. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={loadOnboardingData}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStep || !progress) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-700 mb-2">
          Onboarding Complete! 🎉
        </h3>
        <p className="text-gray-600">
          You're all set to start your climate action journey!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Your Onboarding Journey</h3>
          <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
            {progress.percentComplete}% Complete
          </span>
        </div>
        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
        <p className="text-sm mt-2 text-green-100">
          Step {progress.currentStep + 1} of {progress.totalSteps}
        </p>
      </div>

      {/* Current Step */}
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-700 font-bold">{progress.currentStep + 1}</span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-1">
              {currentStep.title}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {currentStep.description}
            </p>
            {currentStep.estimatedMinutes && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>~{currentStep.estimatedMinutes} minutes</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Guidance */}
        {guidance && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 mb-1">
                  Green Mentor says:
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {guidance}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Recommended for you:
            </h5>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                    </div>
                    <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {rec.type}
                    </span>
                  </div>
                  {rec.reason && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {rec.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {currentStep.actionRequired ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Complete this action to continue your journey
            </p>
            <button
              onClick={() => handleCompleteStep(currentStep.id)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors text-sm font-medium"
            >
              Mark as Complete
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleCompleteStep(currentStep.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors font-medium"
          >
            Continue to Next Step →
          </button>
        )}
      </div>

      {/* All Steps Preview */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <button
          onClick={() => {/* Could expand to show all steps */}}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View all steps
        </button>
      </div>
    </div>
  );
}
