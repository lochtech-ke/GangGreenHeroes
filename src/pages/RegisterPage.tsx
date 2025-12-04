import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth';
import { OnboardingWizard } from '../components/auth/OnboardingWizard';
import { authService } from '../services/auth.service';

type RegisterView = 'options' | 'email';

export function RegisterPage() {
  const navigate = useNavigate();
  const [registerView, setRegisterView] = useState<RegisterView>('options');
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<{
    isActive: boolean;
    userId: string | null;
    userEmail: string | null;
  }>({
    isActive: false,
    userId: null,
    userEmail: null,
  });

  const handleRegisterSuccess = (userId: string, email: string) => {
    // Set onboarding state to trigger chatbot
    setOnboardingState({
      isActive: true,
      userId,
      userEmail: email,
    });

    // Note: Dashboard redirect will be delayed until onboarding is complete
    // This will be handled by the ChatWidget component in future tasks
  };

  const handleOnboardingComplete = () => {
    // Called when user completes the onboarding chatbot flow
    setOnboardingState({
      isActive: false,
      userId: null,
      userEmail: null,
    });
    navigate('/dashboard');
  };

  const handleGoogleAuth = async () => {
    setOauthError(null);
    const { error } = await authService.signInWithGoogle();

    if (error) {
      console.error('Google sign-in error:', error);
      setOauthError(error.message);
    }
    // If successful, user will be redirected to Google
    // and then back to /auth/callback
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {registerView === 'options' && !onboardingState.isActive && (
          <>
            {oauthError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{oauthError}</p>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-4">
              <h2 className="text-2xl font-bold text-green-700 mb-2 text-center">
                Create Your Account
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Join #GangGreen and start making a difference
              </p>
              <div className="space-y-4">
                {/* Google OAuth Button */}
                <button
                  onClick={handleGoogleAuth}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg transition-all group"
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Sign up with Google</div>
                    <div className="text-sm text-gray-600">Quick and secure</div>
                  </div>
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
                  </div>
                </div>

                {/* Email Registration Button */}
                <button
                  onClick={() => setRegisterView('email')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg transition-all group"
                >
                  <svg
                    className="w-6 h-6 text-gray-600 group-hover:text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Email & Password</div>
                    <div className="text-sm text-gray-600">Traditional registration</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {registerView === 'email' && !onboardingState.isActive && (
          <>
            <RegisterForm onSuccess={handleRegisterSuccess} />
            <div className="mt-4 text-center">
              <button
                onClick={() => setRegisterView('options')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ← Back to options
              </button>
            </div>
          </>
        )}

        
        {/* Onboarding Wizard */}
        <OnboardingWizard
          isOpen={onboardingState.isActive}
          userId={onboardingState.userId || ''}
          userEmail={onboardingState.userEmail || ''}
          onComplete={handleOnboardingComplete}
          onClose={() => {
            // Allow users to skip onboarding and go directly to dashboard
            setOnboardingState({
              isActive: false,
              userId: null,
              userEmail: null,
            });
            navigate('/dashboard');
          }}
        />

        {!onboardingState.isActive && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign in
              </button>
            </p>
            {registerView === 'options' && (
              <p className="text-gray-600 mt-2">
                <button
                  onClick={() => navigate('/')}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  ← Back to Home
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
