/**
 * Post Composer Component
 * Create community posts with image upload and age targeting
 * Requirements: A3.3
 */

import React, { useState } from 'react';
import {
  createCommunityPost,
  uploadPostImages,
} from '../../services/community.service';
import { AgeCohort, AgeTargeting } from '../../types/platform.types';
import { useAuth } from '../../hooks/useAuth';

interface PostComposerProps {
  communityId: string;
  onPostCreated?: () => void;
  onCancel?: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  communityId,
  onPostCreated,
  onCancel,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>(['']);
  const [ageTargeting, setAgeTargeting] = useState<AgeTargeting>({});
  const [showAgeTargeting, setShowAgeTargeting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ageCohorts: AgeCohort[] = ['13-17', '18-24', '25-34', '35-49', '50+'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const handleRemoveImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);

    // Revoke old URL
    URL.revokeObjectURL(previewUrls[index]);

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleAddLink = () => {
    setLinks([...links, '']);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const handleCohortToggle = (cohort: AgeCohort) => {
    const currentCohorts = ageTargeting.targetCohorts || [];
    const newCohorts = currentCohorts.includes(cohort)
      ? currentCohorts.filter((c) => c !== cohort)
      : [...currentCohorts, cohort];

    setAgeTargeting({
      ...ageTargeting,
      targetCohorts: newCohorts.length > 0 ? newCohorts : undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to post');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadPostImages(selectedFiles, user.id);
      }

      // Filter out empty links
      const validLinks = links.filter((link) => link.trim() !== '');

      // Create post
      const result = await createCommunityPost({
        communityId,
        authorId: user.id,
        content: content.trim(),
        images: imageUrls.length > 0 ? imageUrls : undefined,
        links: validLinks.length > 0 ? validLinks : undefined,
        ageTargeting:
          showAgeTargeting && ageTargeting.targetCohorts?.length
            ? ageTargeting
            : undefined,
      });

      if (result.success) {
        // Reset form
        setContent('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        setLinks(['']);
        setAgeTargeting({});
        setShowAgeTargeting(false);

        // Notify parent
        if (onPostCreated) {
          onPostCreated();
        }
      } else {
        setError(result.error || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('An error occurred while creating the post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create a Post</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content Textarea */}
        <div>
          <label htmlFor="content" className="sr-only">
            Post content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Image Previews */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Links */}
        {links.some((link) => link !== '') && (
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Age Targeting */}
        {showAgeTargeting && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Target Age Groups</h4>
            <div className="flex flex-wrap gap-2">
              {ageCohorts.map((cohort) => (
                <button
                  key={cohort}
                  type="button"
                  onClick={() => handleCohortToggle(cohort)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    ageTargeting.targetCohorts?.includes(cohort)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cohort}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Leave empty to show to all age groups
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {/* Image Upload */}
            <label className="cursor-pointer p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={selectedFiles.length >= 4}
              />
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </label>

            {/* Add Link */}
            <button
              type="button"
              onClick={handleAddLink}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </button>

            {/* Age Targeting Toggle */}
            <button
              type="button"
              onClick={() => setShowAgeTargeting(!showAgeTargeting)}
              className={`p-2 rounded-lg transition-colors ${
                showAgeTargeting
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
