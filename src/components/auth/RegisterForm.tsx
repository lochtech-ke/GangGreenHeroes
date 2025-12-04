import { useState, FormEvent } from 'react';
import { authService } from '../../services/auth.service';
import type { UserType, ClimateInterest } from '../../types/platform.types';

interface RegisterFormProps {
  onSuccess?: (userId: string, email: string) => void;
}

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
  climateInterests: ClimateInterest[];
  age?: number;
  dateOfBirth?: string;
  phone?: string;
  fullName?: string;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'individual',
    climateInterests: [],
    age: undefined,
    dateOfBirth: '',
    phone: '',
    fullName: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const validateStep1 = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.fullName || !formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }

    if (formData.climateInterests.length === 0) {
      setError('Please select at least one climate interest');
      return false;
    }

    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 13) {
        setError('You must be at least 13 years old to register');
        return false;
      }
      if (age > 120) {
        setError('Please enter a valid date of birth');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate current step
    if (currentStep === 1) {
      if (validateStep1()) {
        handleNext();
      }
      setLoading(false);
      return;
    }

    // Final validation for step 2
    if (!validateStep2()) {
      setLoading(false);
      return;
    }

    try {
      console.log('Starting registration for:', formData.email);
      
      // Calculate age from date of birth if provided
      const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : undefined;
      
      const { user, error: authError } = await authService.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
        // Map to existing auth service interface
        role: formData.userType === 'individual' ? 'individual' : 'organization',
      });

      console.log('Registration response:', { user, error: authError });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message || 'Registration failed. Please try again.');
        return;
      }

      // Check if email confirmation is required
      if (!user && !authError) {
        console.log('Email confirmation required');
        setNeedsEmailConfirmation(true);
        return;
      }

      if (user) {
        console.log('Registration successful, user:', user);
        
        // Store additional profile data that will be used during onboarding
        try {
          // This data will be picked up by the onboarding chatbot
          localStorage.setItem('pendingProfileData', JSON.stringify({
            userType: formData.userType,
            climateInterests: formData.climateInterests,
            age,
            dateOfBirth: formData.dateOfBirth,
            phone: formData.phone,
          }));
        } catch (storageError) {
          console.warn('Could not store pending profile data:', storageError);
        }
        
        onSuccess?.(user.id, formData.email);
      } else {
        console.warn('No user returned after registration');
        setError('Registration completed but user data is unavailable. Please try logging in.');
      }
    } catch (err) {
      console.error('Registration exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user starts typing
  };

  const handleClimateInterestToggle = (interest: ClimateInterest) => {
    setFormData(prev => ({
      ...prev,
      climateInterests: prev.climateInterests.includes(interest)
        ? prev.climateInterests.filter(i => i !== interest)
        : [...prev.climateInterests, interest]
    }));
    setError('');
  };

  // Show email confirmation message if needed
  if (needsEmailConfirmation) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-4">
              We've sent a confirmation link to:
            </p>
            <p className="text-green-700 font-semibold mb-4">{formData.email}</p>
            <p className="text-sm text-gray-600">
              Please click the link in the email to verify your account. After confirming, you can log in with your credentials.
            </p>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center">
              Didn't receive the email? Check your spam folder or try registering again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const userTypeOptions = [
    { value: 'individual', label: 'Individual', description: 'Personal climate action' },
    { value: 'corporate', label: 'Corporate', description: 'Business sustainability' },
    { value: 'community', label: 'Community/School', description: 'Group initiatives' },
    { value: 'partner', label: 'Partner', description: 'Organization collaboration' },
  ] as const;

  const climateInterestOptions = [
    { value: 'trees', label: 'Trees & Forests', icon: '🌳', description: 'Reforestation and forest conservation' },
    { value: 'water', label: 'Water Conservation', icon: '💧', description: 'Clean water and watershed protection' },
    { value: 'waste', label: 'Waste Management', icon: '♻️', description: 'Recycling and waste reduction' },
    { value: 'policy', label: 'Policy & Advocacy', icon: '📢', description: 'Environmental policy and activism' },
  ] as const;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-green-700 mb-2 text-center">
            Join #GangGreen
          </h2>
          <p className="text-sm text-gray-600 text-center">
            Step {currentStep} of 2: {currentStep === 1 ? 'Account Details' : 'Profile Information'}
          </p>
          
          {/* Progress bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="you@example.com"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Validating...' : 'Next: Profile Information →'}
              </button>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Your full name"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {userTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                        formData.userType === option.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userType"
                        value={option.value}
                        checked={formData.userType === option.value}
                        onChange={(e) => handleInputChange('userType', e.target.value as UserType)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                      {formData.userType === option.value && (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Climate Interests <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">Select all that interest you</p>
                <div className="grid grid-cols-1 gap-2">
                  {climateInterestOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                        formData.climateInterests.includes(option.value)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.climateInterests.includes(option.value)}
                        onChange={() => handleClimateInterestToggle(option.value)}
                        className="sr-only"
                      />
                      <div className="text-2xl mr-3">{option.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                      {formData.climateInterests.includes(option.value) && (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Used for age-appropriate content personalization. You can skip this and add it later.
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+254 700 000 000"
                  disabled={loading}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Optional. Can be used for SMS notifications and USSD access.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
