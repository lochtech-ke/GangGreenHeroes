import { useState, useEffect } from 'react';
import { BadgeAnalyticsDashboard } from '../components/dashboard/BadgeAnalyticsDashboard';
import { supabase } from '../services/supabase';
import { LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [badgeStyle, setBadgeStyle] = useState<'geometric' | 'classic'>('geometric');
  const [activeTab, setActiveTab] = useState<'general' | 'analytics'>('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Default to 'geometric' if not set
        setBadgeStyle(user.user_metadata?.badge_style || 'geometric');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleChange = async (style: 'geometric' | 'classic') => {
    setBadgeStyle(style);
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { badge_style: style }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully' });

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
      // Revert state on error
      if (user) {
        setBadgeStyle(user.user_metadata?.badge_style || 'geometric');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-700 mb-2">Settings</h1>
            <p className="text-gray-600">
              Manage your account preferences and application settings.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'general'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <SettingsIcon size={18} />
            General
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'analytics'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <LayoutDashboard size={18} />
            Analytics
          </button>
        </div>

        {activeTab === 'general' ? (
          <>
            {/* Appearance Section */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Appearance
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-base font-medium text-gray-900">Badge Style</label>
                  <p className="text-sm text-gray-500 mb-3">
                    Choose how you want your badges to appear across the dashboard and marketplace.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Geometric Option */}
                    <div
                      className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${badgeStyle === 'geometric' ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-300'
                        }`}
                      onClick={() => handleStyleChange('geometric')}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <p className={`font-medium ${badgeStyle === 'geometric' ? 'text-green-900' : 'text-gray-900'}`}>
                              Geometric (New)
                            </p>
                            <p className={`text-gray-500 ${badgeStyle === 'geometric' ? 'text-green-700' : ''}`}>
                              Modern, low-poly artistic style inspired by nature.
                            </p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${badgeStyle === 'geometric' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'
                          }`}>
                          {badgeStyle === 'geometric' && (
                            <div className="h-2.5 w-2.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Classic Option */}
                    <div
                      className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${badgeStyle === 'classic' ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-300'
                        }`}
                      onClick={() => handleStyleChange('classic')}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <p className={`font-medium ${badgeStyle === 'classic' ? 'text-green-900' : 'text-gray-900'}`}>
                              Classic
                            </p>
                            <p className={`text-gray-500 ${badgeStyle === 'classic' ? 'text-green-700' : ''}`}>
                              The original illustrated badge style.
                            </p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${badgeStyle === 'classic' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'
                          }`}>
                          {badgeStyle === 'classic' && (
                            <div className="h-2.5 w-2.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Status Message */}
            {message && (
              <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.type === 'success' ? (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Settings (Placeholder) */}
            <section className="mt-10 pt-10 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
              <div className="bg-gray-50 rounded-md p-4 text-gray-500 text-sm">
                More account settings coming soon.
              </div>
            </section>
          </>
        ) : (
          <BadgeAnalyticsDashboard />
        )}
      </div>
    </div>
  );
}
