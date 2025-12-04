import { useState, useEffect } from 'react';
import type { UserType, ClimateInterest, AgeCohort } from '../../types/platform.types';
import { onboardingGuideService } from '../../services/onboardingGuide.service';

interface OnboardingWizardProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  onComplete: () => void;
  onClose: () => void;
}

interface OnboardingData {
  userType: UserType;
  climateInterests: ClimateInterest[];
  age?: number;
  dateOfBirth?: string;
  phone?: string;
  fullName?: string;
  ageCohort?: AgeCohort;
}

interface WelcomeVideoProps {
  onVideoEnd: () => void;
}

function WelcomeVideo({ onVideoEnd }: WelcomeVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      const duration = 30000; // 30 seconds simulated video
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (duration / 100));
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(onVideoEnd, 500);
            return 100;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPlaying, onVideoEnd]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleSkip = () => {
    setProgress(100);
    onVideoEnd();
  };

  return (
    <div className="text-center">
      <div className="relative bg-green-50 rounded-lg p-8 mb-6">
        {!isPlaying ? (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-700">Welcome to #GangGreen!</h3>
            <p className="text-gray-600">
              Watch this quick introduction to learn about our five pillars of climate action
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handlePlay}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                ▶ Play Video
              </button>
              <button
                onClick={handleSkip}
                className="text-green-600 hover:text-green-700 px-6 py-2 rounded-md transition-colors"
              >
                Skip →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="bg-white rounded-lg p-6 text-left">
              <h4 className="font-semibold text-green-700 mb-3">The Five Pillars of #GangGreen</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">1.</span>
                  <div>
                    <strong>Community Engagement:</strong> Connect with local groups and participate in collective climate action
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">2.</span>
                  <div>
                    <strong>Education & Learning:</strong> Access daily environmental lessons and earn certificates
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">3.</span>
                  <div>
                    <strong>Real-World Action:</strong> Participate in tree planting, waste cleanup, and conservation missions
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">4.</span>
                  <div>
                    <strong>Verification & Impact:</strong> Track your environmental impact with verified, transparent reporting
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">5.</span>
                  <div>
                    <strong>Recognition & Rewards:</strong> Earn GG Coins, badges, and climb the leaderboards
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-green-600 hover:text-green-700 text-sm"
            >
              Skip to next step →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function OnboardingWizard({ isOpen, userId, userEmail, onComplete, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    userType: 'individual',
    climateInterests: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load any pending profile data from registration
  useEffect(() => {
    if (isOpen) {
      try {
        const pendingData = localStorage.getItem('pendingProfileData');
        if (pendingData) {
          const parsed = JSON.parse(pendingData);
          setOnboardingData(prev => ({ ...prev, ...parsed }));
          localStorage.removeItem('pendingProfileData');
        }
      } catch (err) {
        console.warn('Could not load pending profile data:', err);
      }
    }
  }, [isOpen]);

  const calculateAgeCohort = (age: number): AgeCohort => {
    if (age >= 13 && age <= 17) return '13-17';
    if (age >= 18 && age <= 24) return '18-24';
    if (age >= 25 && age <= 34) return '25-34';
    if (age >= 35 && age <= 49) return '35-49';
    return '50+';
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleNext = () => {
    setError('');
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Calculate age and cohort if date of birth is provided
      let age: number | undefined;
      let ageCohort: AgeCohort | undefined;
      
      if (onboardingData.dateOfBirth) {
        age = calculateAge(onboardingData.dateOfBirth);
        ageCohort = calculateAgeCohort(age);
      }

      // Here we would save the onboarding data to the database
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Onboarding completed with data:', {
        ...onboardingData,
        age,
        ageCohort,
        userId,
        userEmail,
      });

      // Mark initial onboarding steps as complete
      try {
        await onboardingGuideService.completeStep(userId, 'welcome');
        await onboardingGuideService.completeStep(userId, 'meet_mentor');
        await onboardingGuideService.completeStep(userId, 'complete_profile');
      } catch (err) {
        console.warn('Could not update onboarding progress:', err);
      }

      onComplete();
    } catch (err) {
      setError('Failed to complete onboarding. Please try again.');
      console.error('Onboarding completion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleClimateInterest = (interest: ClimateInterest) => {
    setOnboardingData(prev => ({
      ...prev,
      climateInterests: prev.climateInterests.includes(interest)
        ? prev.climateInterests.filter(i => i !== interest)
        : [...prev.climateInterests, interest]
    }));
    setError('');
  };

  const steps = [
    {
      title: 'Welcome Video',
      component: (
        <WelcomeVideo onVideoEnd={handleNext} />
      )
    },
    {
      title: 'Meet Your Green Mentor',
      component: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">Meet Your Green Mentor! 🤖</h3>
            <p className="text-gray-600 mb-4">
              I'm your AI-powered climate companion. I'll help you:
            </p>
            <div className="text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-green-600">✓</span>
                <span>Find age-appropriate climate actions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-600">✓</span>
                <span>Explain environmental concepts simply</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-600">✓</span>
                <span>Recommend personalized missions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-600">✓</span>
                <span>Guide you through your climate journey</span>
              </div>
            </div>
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-700">
                <strong className="text-green-700">💡 Pro Tip:</strong> I'll provide step-by-step guidance 
                throughout your onboarding journey. Just follow my suggestions and you'll be taking 
                climate action in no time!
              </p>
            </div>
          </div>
          <button
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md transition-colors"
          >
            Let's Get Started! →
          </button>
        </div>
      )
    },
    {
      title: 'Complete Your Profile',
      component: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-green-700 mb-2">Complete Your Profile</h3>
            <p className="text-gray-600">Help us personalize your experience</p>
          </div>

          {!onboardingData.fullName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={onboardingData.fullName || ''}
                onChange={(e) => updateData('fullName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your full name"
                required
              />
            </div>
          )}

          {onboardingData.climateInterests.length === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Climate Interests <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-3">Select all that interest you</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'trees', label: 'Trees & Forests', icon: '🌳' },
                  { value: 'water', label: 'Water Conservation', icon: '💧' },
                  { value: 'waste', label: 'Waste Management', icon: '♻️' },
                  { value: 'policy', label: 'Policy & Advocacy', icon: '📢' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                      onboardingData.climateInterests.includes(option.value as ClimateInterest)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={onboardingData.climateInterests.includes(option.value as ClimateInterest)}
                      onChange={() => toggleClimateInterest(option.value as ClimateInterest)}
                      className="sr-only"
                    />
                    <div className="text-2xl mr-3">{option.icon}</div>
                    <div className="flex-1 font-medium text-gray-900">{option.label}</div>
                    {onboardingData.climateInterests.includes(option.value as ClimateInterest) && (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {!onboardingData.dateOfBirth && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth (Optional)
              </label>
              <input
                type="date"
                value={onboardingData.dateOfBirth || ''}
                onChange={(e) => updateData('dateOfBirth', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-600 mt-1">
                Helps us show you age-appropriate content and opportunities
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleComplete}
              disabled={isLoading || !onboardingData.fullName || onboardingData.climateInterests.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Completing...' : 'Complete Setup →'}
            </button>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {steps[currentStep].title}
              </h2>
              <p className="text-sm text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-6 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Current step content */}
          <div className="min-h-[300px]">
            {steps[currentStep].component}
          </div>
        </div>
      </div>
    </div>
  );
}