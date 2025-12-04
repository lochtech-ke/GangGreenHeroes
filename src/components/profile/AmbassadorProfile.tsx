import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ambassadorService, Ambassador } from '../../services/ambassador.service';
import { supabase } from '../../services/supabase';

interface UserProfile {
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: {
    county: string;
    subCounty?: string;
  };
}

interface AmbassadorWithProfile extends Ambassador {
  profile?: UserProfile;
}

export const AmbassadorProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [ambassador, setAmbassador] = useState<AmbassadorWithProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadAmbassadorProfile();
    }
  }, [userId]);

  const loadAmbassadorProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const ambassadorData = await ambassadorService.getAmbassadorStatus(userId);

      if (!ambassadorData || ambassadorData.status !== 'active') {
        setError('Ambassador not found or not active');
        return;
      }

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('display_name, avatar, bio, location')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      setAmbassador({
        ...ambassadorData,
        profile: {
          displayName: profileData.display_name,
          avatar: profileData.avatar,
          bio: profileData.bio,
          location: profileData.location,
        },
      });
    } catch (err) {
      console.error('Error loading ambassador profile:', err);
      setError('Failed to load ambassador profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !ambassador) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error || 'Ambassador not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-green-600 to-green-700"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex items-start -mt-16 mb-4">
            {/* Avatar */}
            <div className="relative">
              {ambassador.profile?.avatar ? (
                <img
                  src={ambassador.profile.avatar}
                  alt={ambassador.profile.displayName}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              {/* Ambassador Badge */}
              <div className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 border-2 border-white">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>

            {/* Name and Location */}
            <div className="ml-6 mt-16">
              <h1 className="text-2xl font-bold text-gray-900">
                {ambassador.profile?.displayName || 'Ambassador'}
              </h1>
              <p className="text-gray-600 flex items-center mt-1">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {ambassador.county}{ambassador.subCounty ? `, ${ambassador.subCounty}` : ''}
              </p>
              <div className="mt-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Gang Green Ambassador
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {ambassador.profile?.bio && (
            <div className="mt-4">
              <p className="text-gray-700">{ambassador.profile.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {ambassador.impactScore}
          </div>
          <div className="text-sm text-gray-600">Impact Score</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {ambassador.eventsOrganized}
          </div>
          <div className="text-sm text-gray-600">Events Organized</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {ambassador.membersReferred}
          </div>
          <div className="text-sm text-gray-600">Members Referred</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {ambassador.approvedAt
              ? Math.floor((Date.now() - new Date(ambassador.approvedAt).getTime()) / (1000 * 60 * 60 * 24))
              : 0}
          </div>
          <div className="text-sm text-gray-600">Days as Ambassador</div>
        </div>
      </div>

      {/* Specializations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Areas of Expertise</h2>
        <div className="flex flex-wrap gap-2">
          {ambassador.specializations.map((specialization, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium"
            >
              {specialization}
            </span>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Achievements</h2>
        <div className="space-y-3">
          {ambassador.eventsOrganized >= 10 && (
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Event Master</h3>
                <p className="text-sm text-gray-600">Organized 10+ community events</p>
              </div>
            </div>
          )}

          {ambassador.membersReferred >= 20 && (
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Community Builder</h3>
                <p className="text-sm text-gray-600">Referred 20+ new members</p>
              </div>
            </div>
          )}

          {ambassador.impactScore >= 500 && (
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">High Impact Leader</h3>
                <p className="text-sm text-gray-600">Achieved 500+ impact score</p>
              </div>
            </div>
          )}

          {ambassador.eventsOrganized === 0 && ambassador.membersReferred === 0 && ambassador.impactScore < 500 && (
            <p className="text-gray-500 text-center py-4">
              No achievements yet. Keep up the great work!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
