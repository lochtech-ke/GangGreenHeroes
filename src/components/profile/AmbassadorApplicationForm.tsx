import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ambassadorService, AmbassadorEligibility } from '../../services/ambassador.service';

const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
  'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi',
  'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const SPECIALIZATIONS = [
  'Tree Planting',
  'Waste Management',
  'Water Conservation',
  'Climate Education',
  'Community Organizing',
  'Youth Engagement',
  'Corporate Partnerships',
  'Policy Advocacy',
  'Event Management',
  'Social Media & Communications'
];

interface AmbassadorApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AmbassadorApplicationForm: React.FC<AmbassadorApplicationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [eligibility, setEligibility] = useState<AmbassadorEligibility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    county: '',
    subCounty: '',
    specializations: [] as string[],
    motivation: '',
    experience: '',
  });

  useEffect(() => {
    if (user?.id) {
      checkEligibility();
    }
  }, [user?.id]);

  const checkEligibility = async () => {
    if (!user?.id) return;

    try {
      setCheckingEligibility(true);
      const result = await ambassadorService.checkEligibility(user.id);
      setEligibility(result);
    } catch (err) {
      console.error('Error checking eligibility:', err);
      setError('Failed to check eligibility. Please try again.');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter((s) => s !== specialization)
        : [...prev.specializations, specialization],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validation
    if (!formData.county) {
      setError('Please select your county');
      return;
    }

    if (formData.specializations.length === 0) {
      setError('Please select at least one specialization');
      return;
    }

    if (!formData.motivation.trim()) {
      setError('Please provide your motivation for becoming an ambassador');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await ambassadorService.submitApplication({
        userId: user.id,
        county: formData.county,
        subCounty: formData.subCounty || undefined,
        specializations: formData.specializations,
        motivation: formData.motivation,
        experience: formData.experience || undefined,
      });

      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingEligibility) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!eligibility) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Unable to check eligibility. Please try again later.</p>
      </div>
    );
  }

  if (!eligibility.eligible) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">
          Ambassador Eligibility Requirements
        </h3>
        <p className="text-yellow-800 mb-4">
          You don't currently meet all the requirements to become an ambassador:
        </p>
        <ul className="space-y-2 mb-6">
          {eligibility.reasons.map((reason, index) => (
            <li key={index} className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span className="text-yellow-800">{reason}</span>
            </li>
          ))}
        </ul>
        <div className="bg-white rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Requirements Checklist:</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`mr-2 ${eligibility.requirements.hasGGCoins ? 'text-green-600' : 'text-gray-400'}`}>
                {eligibility.requirements.hasGGCoins ? '✓' : '○'}
              </span>
              <span className="text-gray-700">
                {eligibility.requirements.minGGCoins} GG Coins
              </span>
            </div>
            <div className="flex items-center">
              <span className={`mr-2 ${eligibility.requirements.hasTreesPlanted ? 'text-green-600' : 'text-gray-400'}`}>
                {eligibility.requirements.hasTreesPlanted ? '✓' : '○'}
              </span>
              <span className="text-gray-700">
                {eligibility.requirements.minTreesPlanted} Trees Planted
              </span>
            </div>
            <div className="flex items-center">
              <span className={`mr-2 ${eligibility.requirements.hasMissionsCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                {eligibility.requirements.hasMissionsCompleted ? '✓' : '○'}
              </span>
              <span className="text-gray-700">
                {eligibility.requirements.minMissionsCompleted} Missions Completed
              </span>
            </div>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="text-lg font-semibold text-green-900">Application Submitted!</h3>
        </div>
        <p className="text-green-800 mb-4">
          Your ambassador application has been submitted successfully. Our team will review your application
          and get back to you within 5-7 business days.
        </p>
        <p className="text-green-700 text-sm">
          You'll receive a notification once your application has been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ambassador Application
        </h2>
        <p className="text-gray-600">
          Join our community of climate leaders and help amplify environmental action in your region.
        </p>
      </div>

      {/* Eligibility Confirmation */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-green-900 mb-1">You're Eligible!</h3>
            <p className="text-green-800 text-sm">
              You meet all the requirements to become a Gang Green Ambassador.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* County Selection */}
        <div>
          <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
            County <span className="text-red-500">*</span>
          </label>
          <select
            id="county"
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">Select your county</option>
            {KENYAN_COUNTIES.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-County */}
        <div>
          <label htmlFor="subCounty" className="block text-sm font-medium text-gray-700 mb-2">
            Sub-County (Optional)
          </label>
          <input
            type="text"
            id="subCounty"
            value={formData.subCounty}
            onChange={(e) => setFormData({ ...formData, subCounty: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter your sub-county"
          />
        </div>

        {/* Specializations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Areas of Expertise <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Select all areas where you have experience or interest (minimum 1)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SPECIALIZATIONS.map((specialization) => (
              <label
                key={specialization}
                className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.specializations.includes(specialization)}
                  onChange={() => handleSpecializationToggle(specialization)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-3 text-gray-700">{specialization}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Motivation */}
        <div>
          <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-2">
            Why do you want to become an ambassador? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="motivation"
            value={formData.motivation}
            onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Tell us about your passion for climate action and what you hope to achieve as an ambassador..."
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.motivation.length} / 500 characters
          </p>
        </div>

        {/* Experience */}
        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
            Relevant Experience (Optional)
          </label>
          <textarea
            id="experience"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Share any relevant experience in environmental work, community organizing, or leadership..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Application'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
