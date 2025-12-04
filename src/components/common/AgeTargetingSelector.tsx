/**
 * Age Targeting Selector Component
 * Allows content creators to specify age targeting for their content
 * Requirements: B6.1, B6.2, B6.3
 */

import { useState, useEffect } from 'react';
import type { AgeCohort } from '../../types/platform.types';

export interface AgeTargetingValue {
  min_age?: number;
  max_age?: number;
  target_cohorts?: AgeCohort[];
}

interface AgeTargetingSelectorProps {
  value: AgeTargetingValue;
  onChange: (value: AgeTargetingValue) => void;
  disabled?: boolean;
  showReachEstimate?: boolean;
  estimatedReach?: number;
}

type TargetingMode = 'all' | 'cohorts' | 'custom';

const COHORT_OPTIONS: Array<{ value: AgeCohort; label: string; description: string }> = [
  { value: '13-17', label: 'Youth (13-17)', description: 'Teenagers and high school students' },
  { value: '18-24', label: 'Young Adults (18-24)', description: 'University students and early career' },
  { value: '25-34', label: 'Young Professionals (25-34)', description: 'Early to mid-career professionals' },
  { value: '35-49', label: 'Mid-Career (35-49)', description: 'Established professionals and parents' },
  { value: '50+', label: 'Seniors (50+)', description: 'Experienced professionals and retirees' },
];

export function AgeTargetingSelector({
  value,
  onChange,
  disabled = false,
  showReachEstimate = false,
  estimatedReach,
}: AgeTargetingSelectorProps) {
  const [mode, setMode] = useState<TargetingMode>('all');
  const [selectedCohorts, setSelectedCohorts] = useState<AgeCohort[]>(value.target_cohorts || []);
  const [customMin, setCustomMin] = useState<number>(value.min_age || 13);
  const [customMax, setCustomMax] = useState<number>(value.max_age || 120);

  // Initialize mode based on value
  useEffect(() => {
    if (value.target_cohorts && value.target_cohorts.length > 0) {
      setMode('cohorts');
      setSelectedCohorts(value.target_cohorts);
    } else if (value.min_age || value.max_age) {
      setMode('custom');
      setCustomMin(value.min_age || 13);
      setCustomMax(value.max_age || 120);
    } else {
      setMode('all');
    }
  }, [value]);

  const handleModeChange = (newMode: TargetingMode) => {
    setMode(newMode);
    
    if (newMode === 'all') {
      onChange({});
    } else if (newMode === 'cohorts') {
      onChange({ target_cohorts: selectedCohorts.length > 0 ? selectedCohorts : ['18-24'] });
    } else if (newMode === 'custom') {
      onChange({ min_age: customMin, max_age: customMax });
    }
  };

  const handleCohortToggle = (cohort: AgeCohort) => {
    const newCohorts = selectedCohorts.includes(cohort)
      ? selectedCohorts.filter(c => c !== cohort)
      : [...selectedCohorts, cohort];
    
    setSelectedCohorts(newCohorts);
    onChange({ target_cohorts: newCohorts.length > 0 ? newCohorts : undefined });
  };

  const handleCustomAgeChange = (min: number, max: number) => {
    setCustomMin(min);
    setCustomMax(max);
    onChange({ min_age: min, max_age: max });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Age Targeting
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Choose who can see this content based on age. This helps ensure age-appropriate engagement.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="targeting-mode"
            value="all"
            checked={mode === 'all'}
            onChange={() => handleModeChange('all')}
            disabled={disabled}
            className="text-green-600 focus:ring-green-500"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">All Ages</div>
            <div className="text-sm text-gray-500">Show to everyone (default)</div>
          </div>
        </label>

        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="targeting-mode"
            value="cohorts"
            checked={mode === 'cohorts'}
            onChange={() => handleModeChange('cohorts')}
            disabled={disabled}
            className="text-green-600 focus:ring-green-500"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Specific Age Groups</div>
            <div className="text-sm text-gray-500">Target specific demographic cohorts</div>
          </div>
        </label>

        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="targeting-mode"
            value="custom"
            checked={mode === 'custom'}
            onChange={() => handleModeChange('custom')}
            disabled={disabled}
            className="text-green-600 focus:ring-green-500"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Custom Age Range</div>
            <div className="text-sm text-gray-500">Set a specific age range</div>
          </div>
        </label>
      </div>

      {/* Cohort Selection */}
      {mode === 'cohorts' && (
        <div className="pl-4 space-y-2 border-l-2 border-green-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Select target age groups:
          </p>
          {COHORT_OPTIONS.map((cohort) => (
            <label
              key={cohort.value}
              className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCohorts.includes(cohort.value)}
                onChange={() => handleCohortToggle(cohort.value)}
                disabled={disabled}
                className="mt-1 text-green-600 focus:ring-green-500 rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">{cohort.label}</div>
                <div className="text-xs text-gray-500">{cohort.description}</div>
              </div>
            </label>
          ))}
          {selectedCohorts.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              Please select at least one age group
            </p>
          )}
        </div>
      )}

      {/* Custom Age Range */}
      {mode === 'custom' && (
        <div className="pl-4 space-y-3 border-l-2 border-green-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="min-age" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Age
              </label>
              <input
                id="min-age"
                type="number"
                min="13"
                max="120"
                value={customMin}
                onChange={(e) => handleCustomAgeChange(parseInt(e.target.value) || 13, customMax)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="max-age" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Age
              </label>
              <input
                id="max-age"
                type="number"
                min="13"
                max="120"
                value={customMax}
                onChange={(e) => handleCustomAgeChange(customMin, parseInt(e.target.value) || 120)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          {customMin > customMax && (
            <p className="text-sm text-red-600">
              Minimum age must be less than or equal to maximum age
            </p>
          )}
        </div>
      )}

      {/* Reach Estimate */}
      {showReachEstimate && estimatedReach !== undefined && mode !== 'all' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Estimated Reach: {estimatedReach.toLocaleString()} users
              </p>
              <p className="text-xs text-blue-700">
                Based on current platform demographics
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Age targeting helps personalize content for different demographics. 
          Users outside the target range won't see this content in their curated feed, but may still 
          find it through search or direct links.
        </p>
      </div>
    </div>
  );
}
