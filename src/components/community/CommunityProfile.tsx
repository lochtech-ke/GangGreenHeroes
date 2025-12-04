/**
 * Community Profile Component
 * Display community details, members, and activity feed
 * Requirements: A3.1
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCommunityById,
  getCommunityMembers,
  isCommunityMember,
  joinCommunity,
  leaveCommunity,
  getCommunityStats,
} from '../../services/community.service';
import { Community } from '../../types/platform.types';
import { useAuth } from '../../hooks/useAuth';
import { CommunityFeed } from './CommunityFeed';

export const CommunityProfile: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    memberCount: 0,
    postCount: 0,
    activityLevel: 'low' as 'low' | 'medium' | 'high',
  });
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'about'>('feed');

  useEffect(() => {
    if (communityId) {
      loadCommunityData();
    }
  }, [communityId]);

  const loadCommunityData = async () => {
    if (!communityId) return;

    setLoading(true);
    try {
      const [communityData, statsData, membersData] = await Promise.all([
        getCommunityById(communityId),
        getCommunityStats(communityId),
        getCommunityMembers(communityId, 10, 0),
      ]);

      if (communityData) {
        setCommunity(communityData);
        setStats(statsData);
        setMembers(membersData.members);

        // Check if user is a member
        if (user?.id) {
          const memberStatus = await isCommunityMember(user.id, communityId);
          setIsMember(memberStatus);
        }
      } else {
        // Community not found
        navigate('/communities');
      }
    } catch (error) {
      console.error('Error loading community:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!user?.id || !communityId) return;

    setMembershipLoading(true);
    try {
      if (isMember) {
        const result = await leaveCommunity(user.id, communityId);
        if (result.success) {
          setIsMember(false);
          setStats((prev) => ({ ...prev, memberCount: prev.memberCount - 1 }));
        }
      } else {
        const result = await joinCommunity(user.id, communityId);
        if (result.success) {
          setIsMember(true);
          setStats((prev) => ({ ...prev, memberCount: prev.memberCount + 1 }));
        }
      }
    } catch (error) {
      console.error('Error updating membership:', error);
    } finally {
      setMembershipLoading(false);
    }
  };

  const getActivityLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Community not found</h2>
          <button
            onClick={() => navigate('/communities')}
            className="text-green-600 hover:text-green-700"
          >
            Back to communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-green-400 to-green-600 rounded-lg overflow-hidden mb-6">
        {community.coverImage && (
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Community Avatar */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end gap-4">
            {community.avatar ? (
              <img
                src={community.avatar}
                alt={community.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-white mb-1">{community.name}</h1>
              {community.location && (
                <p className="text-white text-opacity-90">
                  {community.location.county}
                  {community.location.subCounty && `, ${community.location.subCounty}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.memberCount}</div>
            <div className="text-sm text-gray-600">Members</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.postCount}</div>
            <div className="text-sm text-gray-600">Posts</div>
          </div>
          <div>
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getActivityLevelColor(
                stats.activityLevel
              )}`}
            >
              {stats.activityLevel} activity
            </span>
          </div>
          <div className="flex items-center justify-end">
            {user ? (
              <button
                onClick={handleJoinLeave}
                disabled={membershipLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isMember
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {membershipLoading ? 'Loading...' : isMember ? 'Leave Community' : 'Join Community'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Login to Join
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'feed'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'about'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              About
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'feed' && (
            <CommunityFeed communityId={community.id} isMember={isMember} />
          )}

          {activeTab === 'members' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Community Members ({stats.memberCount})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member: any) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                  >
                    {member.user_profiles?.avatar ? (
                      <img
                        src={member.user_profiles.avatar}
                        alt={member.user_profiles.display_name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-medium">
                          {member.user_profiles?.display_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {member.user_profiles?.display_name || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
              {members.length === 0 && (
                <p className="text-gray-600 text-center py-8">No members yet</p>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700">{community.description}</p>
              </div>

              {community.focusAreas && community.focusAreas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Focus Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {community.focusAreas.map((area, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {community.location && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                  <div className="flex items-center text-gray-700">
                    <svg
                      className="h-5 w-5 mr-2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {community.location.county}
                    {community.location.subCounty && `, ${community.location.subCounty}`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
