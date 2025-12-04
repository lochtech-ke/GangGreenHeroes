/**
 * Curation Preferences Component
 * Allows users to control content curation and privacy settings
 * Requirements: B5.2, B5.3
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

interface CurationPreferencesProps {
  userId: string;
}

interface Preferences {
  curation_enabled: boolean;
  allow_age_based: boolean;
  allow_engagement_tracking: boolean;
}

export function CurationPreferences({ userId }: CurationPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    curation_enabled: true,
    allow_age_based: true,
    allow_engagement_tracking: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('curation_enabled, curation_preferences')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences({
          curation_enabled: data.curation_enabled ?? true,
          allow_age_based: data.curation_preferences?.allow_age_based ?? true,
          allow_engagement_tracking: data.curation_preferences?.allow_engagement_tracking ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          curation_enabled: preferences.curation_enabled,
          curation_preferences: {
            allow_age_based: preferences.allow_age_based,
            allow_engagement_tracking: preferences.allow_engagement_tracking,
          },
        })
        .eq('user_id', userId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Preferences saved successfully' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof Preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Content Curation Preferences</h2>
      <p className="text-gray-600 mb-6">
        Control how we personalize your content experience
      </p>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="curation_enabled"
              type="checkbox"
              checked={preferences.curation_enabled}
              onChange={() => handleToggle('curation_enabled')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="curation_enabled" className="font-medium text-gray-900">
              Enable Content Curation
            </label>
            <p className="text-sm text-gray-600">
              Show personalized content based on your profile and interests. When disabled, you'll
              see content in chronological order.
            </p>
          </div>
        </div>

        {/* Age-Based Curation */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="allow_age_based"
              type="checkbox"
              checked={preferences.allow_age_based}
              onChange={() => handleToggle('allow_age_based')}
              disabled={!preferences.curation_enabled}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
            />
          </div>
          <div className="ml-3">
            <label
              htmlFor="allow_age_based"
              className={`font-medium ${
                preferences.curation_enabled ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Age-Based Content Filtering
            </label>
            <p className="text-sm text-gray-600">
              Show content appropriate for your age group. This helps ensure you see relevant
              initiatives, missions, and educational content.
            </p>
          </div>
        </div>

        {/* Engagement Tracking */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="allow_engagement_tracking"
              type="checkbox"
              checked={preferences.allow_engagement_tracking}
              onChange={() => handleToggle('allow_engagement_tracking')}
              disabled={!preferences.curation_enabled}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
            />
          </div>
          <div className="ml-3">
            <label
              htmlFor="allow_engagement_tracking"
              className={`font-medium ${
                preferences.curation_enabled ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Engagement-Based Recommendations
            </label>
            <p className="text-sm text-gray-600">
              Learn from your interactions to show more relevant content. We track which content
              you view, like, and engage with to improve recommendations.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Privacy Note</h3>
        <p className="text-sm text-blue-700">
          Your privacy is important to us. All personalization happens securely, and your data is
          never shared with third parties. You can change these settings at any time.
        </p>
      </div>
    </div>
  );
}
