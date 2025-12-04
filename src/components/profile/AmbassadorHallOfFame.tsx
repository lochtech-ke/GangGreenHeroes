import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ambassadorService, Ambassador } from '../../services/ambassador.service';
import { supabase } from '../../services/supabase';

interface AmbassadorWithProfile extends Ambassador {
  displayName?: string;
  avatar?: string;
}

export const AmbassadorHallOfFame: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ambassadors, setAmbassadors] = useState<AmbassadorWithProfile[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const KENYAN_COUNTIES = [
    'All Counties',
    'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
    'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
    'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
    'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi',
    'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
    'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
  ];

  useEffect(() => {
    loadAmbassadors();
  }, [selectedCounty]);

  const loadAmbassadors = async () => {
    try {
      setLoading(true);
      let ambassadorData: Ambassador[];

      if (selectedCounty === 'all') {
        ambassadorData = await ambassadorService.getActiveAmbassadors();
      } else {
        ambassadorData = await ambassadorService.getAmbassadorsByCounty(selectedCounty);
      }

      // Load user profiles for each ambassador
      const ambassadorsWithProfiles = await Promise.all(
        ambassadorData.map(async (ambassador) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, avatar')
            .eq('user_id', ambassador.userId)
            .single();

          return {
            ...ambassador,
            displayName: profile?.display_name || 'Ambassador',
            avatar: profile?.avatar,
          };
        })
      );

      setAmbassadors(ambassadorsWithProfiles);
    } catch (err) {
      console.error('Error loading ambassadors:', err);
      setError('Failed to load ambassadors');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
          <span className="text-white font-bold text-lg">🥇</span>
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
          <span className="text-white font-bold text-lg">🥈</span>
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
          <span className="text-white font-bold text-lg">🥉</span>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-center mb-4">
          <svg className="w-12 h-12 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h1 className="text-3xl font-bold">Ambassador Hall of Fame</h1>
        </div>
        <p className="text-center text-green-100">
          Celebrating our top climate action leaders making a difference in their communities
        </p>
      </div>

      {/* County Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <label htmlFor="county-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by County
        </label>
        <select
          id="county-filter"
          value={selectedCounty}
          onChange={(e) => setSelectedCounty(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {KENYAN_COUNTIES.map((county) => (
            <option key={county} value={county === 'All Counties' ? 'all' : county}>
              {county}
            </option>
          ))}
        </select>
      </div>

      {/* Top 3 Ambassadors */}
      {ambassadors.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ambassadors.slice(0, 3).map((ambassador, index) => (
            <div
              key={ambassador.userId}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => navigate(`/ambassador/${ambassador.userId}`)}
            >
              <div className="relative">
                <div className="h-24 bg-gradient-to-r from-green-500 to-green-600"></div>
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                  {ambassador.avatar ? (
                    <img
                      src={ambassador.avatar}
                      alt={ambassador.displayName}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-green-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  {getRankBadge(index + 1)}
                </div>
              </div>
              <div className="pt-16 pb-6 px-6 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {ambassador.displayName}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {ambassador.county}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Impact Score</span>
                    <span className="font-bold text-green-600">{ambassador.impactScore}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Events</span>
                    <span className="font-semibold text-gray-900">{ambassador.eventsOrganized}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Referrals</span>
                    <span className="font-semibold text-gray-900">{ambassador.membersReferred}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Ambassadors List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            All Ambassadors ({ambassadors.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {ambassadors.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No ambassadors found for this county.
            </div>
          ) : (
            ambassadors.map((ambassador, index) => (
              <div
                key={ambassador.userId}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/ambassador/${ambassador.userId}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 text-gray-400 font-bold flex items-center justify-center">
                      #{index + 1}
                    </div>
                    {ambassador.avatar ? (
                      <img
                        src={ambassador.avatar}
                        alt={ambassador.displayName}
                        className="w-12 h-12 rounded-full object-cover ml-4"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center ml-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-900">
                        {ambassador.displayName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ambassador.county}{ambassador.subCounty ? `, ${ambassador.subCounty}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {ambassador.impactScore}
                      </div>
                      <div className="text-xs text-gray-500">Impact</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {ambassador.eventsOrganized}
                      </div>
                      <div className="text-xs text-gray-500">Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {ambassador.membersReferred}
                      </div>
                      <div className="text-xs text-gray-500">Referrals</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
