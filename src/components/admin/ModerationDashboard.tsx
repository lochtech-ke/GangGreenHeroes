import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { SocialPost, ModerationFlag } from '../../types/socialFeed.types';
import { AlertTriangle, Check, X, Eye, ExternalLink } from 'lucide-react';

interface FlaggedPost extends SocialPost {
  flags: ModerationFlag[];
}

export const ModerationDashboard: React.FC = () => {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [selectedPost, setSelectedPost] = useState<FlaggedPost | null>(null);

  useEffect(() => {
    fetchFlaggedPosts();
  }, [filter]);

  const fetchFlaggedPosts = async () => {
    setLoading(true);
    try {
      // Fetch flagged posts
      const query = supabase
        .from('social_posts')
        .select('*')
        .eq('moderation_status', 'flagged');

      const { data: posts, error: postsError } = await query;

      if (postsError) throw postsError;

      // Fetch flags for each post
      const postsWithFlags: FlaggedPost[] = [];
      for (const post of posts || []) {
        const { data: flags } = await supabase
          .from('moderation_flags')
          .select('*')
          .eq('post_id', post.id);

        postsWithFlags.push({
          ...transformPost(post),
          flags: flags || [],
        });
      }

      // Apply filter
      const filtered = postsWithFlags.filter((post) => {
        if (filter === 'pending') {
          return post.flags.some((f) => !f.reviewedAt);
        } else if (filter === 'reviewed') {
          return post.flags.every((f) => f.reviewedAt);
        }
        return true;
      });

      setFlaggedPosts(filtered);
    } catch (error) {
      console.error('Error fetching flagged posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformPost = (row: any): SocialPost => ({
    id: row.id,
    externalId: row.external_id,
    platform: row.platform,
    author: {
      name: row.author_name,
      username: row.author_username,
      avatarUrl: row.author_avatar_url || '',
      profileUrl: row.author_profile_url || '',
    },
    caption: row.caption || '',
    media: {
      type: row.media_type,
      url: row.media_url,
      thumbnailUrl: row.media_thumbnail_url,
    },
    postUrl: row.post_url,
    engagement: {
      likes: row.likes_count,
      comments: row.comments_count,
      shares: row.shares_count,
      total: row.likes_count + row.comments_count + row.shares_count,
    },
    locationTag: row.location_tag,
    postedAt: row.posted_at,
    fetchedAt: row.fetched_at,
    moderationStatus: row.moderation_status,
    isVisible: row.is_visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const handleApprove = async (post: FlaggedPost) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update post status
      await supabase
        .from('social_posts')
        .update({
          moderation_status: 'approved',
          is_visible: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      // Update flags
      await supabase
        .from('moderation_flags')
        .update({
          reviewed_by: user.id,
          review_decision: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('post_id', post.id)
        .is('reviewed_at', null);

      fetchFlaggedPosts();
      setSelectedPost(null);
    } catch (error) {
      console.error('Error approving post:', error);
    }
  };

  const handleReject = async (post: FlaggedPost, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update post status
      await supabase
        .from('social_posts')
        .update({
          moderation_status: 'rejected',
          is_visible: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      // Update flags
      await supabase
        .from('moderation_flags')
        .update({
          reviewed_by: user.id,
          review_decision: 'rejected',
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('post_id', post.id)
        .is('reviewed_at', null);

      fetchFlaggedPosts();
      setSelectedPost(null);
    } catch (error) {
      console.error('Error rejecting post:', error);
    }
  };

  const getFlagTypeColor = (type: string) => {
    switch (type) {
      case 'profanity':
        return 'bg-red-100 text-red-800';
      case 'spam':
        return 'bg-orange-100 text-orange-800';
      case 'inappropriate_image':
        return 'bg-purple-100 text-purple-800';
      case 'negative_sentiment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Moderation</h1>
        <p className="text-gray-600">Review and moderate flagged social media posts</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({flaggedPosts.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'reviewed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Reviewed
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      )}

      {/* Posts Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flaggedPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={post.media.thumbnailUrl || post.media.url}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {post.flags.length}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={post.author.avatarUrl || 'https://via.placeholder.com/32'}
                    alt={post.author.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{post.author.name}</p>
                    <p className="text-xs text-gray-500">@{post.author.username}</p>
                  </div>
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.flags.map((flag, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-1 rounded-full ${getFlagTypeColor(flag.flagType)}`}
                    >
                      {flag.flagType}
                    </span>
                  ))}
                </div>

                {/* Caption */}
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{post.caption}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && flaggedPosts.length === 0 && (
        <div className="text-center py-12">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600">No flagged posts to review</p>
        </div>
      )}

      {/* Review Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold">Review Post</h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  <img
                    src={selectedPost.media.url}
                    alt="Post"
                    className="w-full rounded-lg"
                  />
                </div>

                {/* Details */}
                <div>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Author</h3>
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedPost.author.avatarUrl || 'https://via.placeholder.com/40'}
                        alt={selectedPost.author.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{selectedPost.author.name}</p>
                        <p className="text-sm text-gray-500">@{selectedPost.author.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Caption</h3>
                    <p className="text-gray-700">{selectedPost.caption}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Flags</h3>
                    <div className="space-y-2">
                      {selectedPost.flags.map((flag, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm px-2 py-1 rounded-full ${getFlagTypeColor(flag.flagType)}`}>
                              {flag.flagType}
                            </span>
                            {flag.confidenceScore && (
                              <span className="text-sm text-gray-600">
                                {(flag.confidenceScore * 100).toFixed(0)}% confidence
                              </span>
                            )}
                          </div>
                          {flag.reviewNotes && (
                            <p className="text-sm text-gray-600 mt-2">{flag.reviewNotes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedPost)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <Check className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedPost)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      <X className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
