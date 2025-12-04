import React, { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link, Check } from 'lucide-react';
import { treeWalletService } from '../../services/treeWallet.service';

interface SocialShareButtonProps {
  userName: string;
  totalTrees: number;
  totalCO2: number;
  treeId?: string;
  variant?: 'button' | 'icon';
}

/**
 * Social Share Button Component
 * Generates shareable impact content for social media
 * Requirements: A8.5
 */
export const SocialShareButton: React.FC<SocialShareButtonProps> = ({
  userName,
  totalTrees,
  totalCO2,
  treeId,
  variant = 'button',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate shareable content
  const shareContent = treeWalletService.generateShareableContent(
    userName,
    totalTrees,
    totalCO2
  );

  // Build share URL
  const baseUrl = window.location.origin;
  const shareUrl = treeId
    ? `${baseUrl}/trees/${treeId}`
    : `${baseUrl}/tree-wallet`;

  // Share handlers
  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareContent.text
    )}&url=${encodeURIComponent(shareUrl)}&hashtags=${shareContent.hashtags
      .map((h) => h.replace('#', ''))
      .join(',')}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}&quote=${encodeURIComponent(shareContent.text)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const shareOnLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${shareContent.text}\n\n${shareUrl}\n\n${shareContent.hashtags.join(' ')}`
      );
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Climate Impact',
          text: shareContent.text,
          url: shareUrl,
        });
        setShowMenu(false);
      } catch (error) {
        // User cancelled or error occurred
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <div className="relative">
      {/* Share Button */}
      {variant === 'button' ? (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Impact</span>
        </button>
      ) : (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      )}

      {/* Share Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          ></div>

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* Preview */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <p className="text-sm text-gray-700 mb-2">{shareContent.text}</p>
              <div className="flex flex-wrap gap-1">
                {shareContent.hashtags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Share Options */}
            <div className="p-2">
              {/* Twitter */}
              <button
                onClick={shareOnTwitter}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="bg-blue-400 rounded-full p-2">
                  <Twitter className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Share on Twitter
                </span>
              </button>

              {/* Facebook */}
              <button
                onClick={shareOnFacebook}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="bg-blue-600 rounded-full p-2">
                  <Facebook className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Share on Facebook
                </span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={shareOnLinkedIn}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="bg-blue-700 rounded-full p-2">
                  <Linkedin className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Share on LinkedIn
                </span>
              </button>

              {/* Native Share (if available) */}
              {navigator.share && (
                <button
                  onClick={shareNative}
                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="bg-gray-600 rounded-full p-2">
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    More options
                  </span>
                </button>
              )}

              {/* Copy Link */}
              <button
                onClick={copyLink}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="bg-gray-500 rounded-full p-2">
                  {copied ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Link className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {copied ? 'Copied!' : 'Copy link'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
