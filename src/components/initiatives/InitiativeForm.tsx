import { useState, FormEvent, useEffect } from 'react';
import { initiativeService } from '../../services';
import { calculateReach, type ReachEstimateResult } from '../../services/reachEstimation.service';
import type { CreateInitiativeData, Initiative } from '../../types/initiative.types';
import type { ForestPreference } from '../../types/user.types';
import { LocationPicker } from './LocationPicker';
import { AgeTargetingSelector, type AgeTargetingValue } from '../common/AgeTargetingSelector';

interface InitiativeFormProps {
  organizationId: string;
  onSuccess?: (initiative: Initiative) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateInitiativeData>;
}

export function InitiativeForm({
  organizationId,
  onSuccess,
  onCancel,
  initialData,
}: InitiativeFormProps) {
  const [formData, setFormData] = useState<CreateInitiativeData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    forest: initialData?.forest || 'kakamega',
    target_trees: initialData?.target_trees || 1000,
    start_date: initialData?.start_date || new Date().toISOString().split('T')[0],
    end_date: initialData?.end_date || '',
    location: initialData?.location || {
      type: 'Point',
      coordinates: [34.8522, 0.2827], // Default: Kakamega
    },
    area_hectares: initialData?.area_hectares || 10,
    organization_id: organizationId,
    min_age: initialData?.min_age,
    max_age: initialData?.max_age,
    target_cohorts: initialData?.target_cohorts,
  });

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reachEstimate, setReachEstimate] = useState<ReachEstimateResult | null>(null);
  const [loadingReach, setLoadingReach] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { initiative, error: createError } = await initiativeService.createInitiative(
        formData
      );

      if (createError) {
        setError(createError.message || 'Failed to create initiative');
        setLoading(false);
        return;
      }

      if (initiative) {
        onSuccess?.(initiative);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof CreateInitiativeData,
    value: string | number | ForestPreference
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate reach estimate when age targeting changes
  useEffect(() => {
    const fetchReachEstimate = async () => {
      setLoadingReach(true);
      try {
        const result = await calculateReach({
          min_age: formData.min_age,
          max_age: formData.max_age,
          target_cohorts: formData.target_cohorts,
        });
        setReachEstimate(result);
      } catch (err) {
        console.error('Failed to calculate reach:', err);
        setReachEstimate(null);
      } finally {
        setLoadingReach(false);
      }
    };

    fetchReachEstimate();
  }, [formData.min_age, formData.max_age, formData.target_cohorts]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-green-700 mb-6">
        Create New Initiative
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Initiative Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="e.g., Kakamega Forest Restoration 2025"
            disabled={loading}
            required
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Describe the initiative goals and activities..."
            rows={4}
            disabled={loading}
            required
          />
        </div>

        {/* Forest Selection */}
        <div>
          <label htmlFor="forest" className="block text-sm font-medium text-gray-700 mb-1">
            Target Forest *
          </label>
          <select
            id="forest"
            value={formData.forest}
            onChange={(e) => handleChange('forest', e.target.value as ForestPreference)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loading}
            required
          >
            <option value="kakamega">Kakamega Forest</option>
            <option value="karura">Karura Forest</option>
            <option value="mau">Mau Forest</option>
          </select>
        </div>

        {/* Target Trees and Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="target_trees"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Trees *
            </label>
            <input
              id="target_trees"
              type="number"
              value={formData.target_trees}
              onChange={(e) => handleChange('target_trees', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="1"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label
              htmlFor="area_hectares"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Area (hectares) *
            </label>
            <input
              id="area_hectares"
              type="number"
              step="0.01"
              value={formData.area_hectares}
              onChange={(e) => handleChange('area_hectares', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0.01"
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date *
            </label>
            <input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label
              htmlFor="end_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date (Optional)
            </label>
            <input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
        </div>

        {/* Location Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initiative Location *
          </label>
          <LocationPicker
            value={formData.location}
            onChange={(location) =>
              setFormData((prev) => ({ ...prev, location }))
            }
            disabled={loading}
            height="350px"
          />
        </div>

        {/* Age Targeting */}
        <div>
          <AgeTargetingSelector
            value={{
              min_age: formData.min_age,
              max_age: formData.max_age,
              target_cohorts: formData.target_cohorts,
            }}
            onChange={(ageTargeting: AgeTargetingValue) => {
              setFormData((prev) => ({
                ...prev,
                min_age: ageTargeting.min_age,
                max_age: ageTargeting.max_age,
                target_cohorts: ageTargeting.target_cohorts,
              }));
            }}
            disabled={loading}
          />

          {/* Reach Estimate Display */}
          {loadingReach ? (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600">Calculating reach...</p>
            </div>
          ) : reachEstimate && reachEstimate.estimatedReach > 0 ? (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="text-sm font-semibold text-green-800 mb-2">
                Estimated Reach
              </h4>
              <div className="space-y-2">
                <p className="text-lg font-bold text-green-700">
                  {reachEstimate.estimatedReach.toLocaleString()} users
                </p>
                <p className="text-sm text-green-600">
                  {reachEstimate.percentageOfPlatform}% of platform users
                </p>
                {reachEstimate.breakdown.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-xs font-medium text-green-700 mb-1">
                      Breakdown by cohort:
                    </p>
                    <ul className="text-xs text-green-600 space-y-1">
                      {reachEstimate.breakdown.map((item) => (
                        <li key={item.cohort}>
                          {item.cohort}: {item.userCount.toLocaleString()} users
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Initiative'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
