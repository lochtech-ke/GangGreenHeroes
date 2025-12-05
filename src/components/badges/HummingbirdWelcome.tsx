import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, ArrowRight, Share2, Twitter, Facebook, Instagram, Linkedin, Copy, Check } from 'lucide-react';
import { GlassButton } from '../common/GlassButton';
import { generateSocialMediaBadge, getSocialMediaText, generateWelcomeBadge } from '../../services/hummingbirdBadge.service';
import { useAuthContext } from '../../contexts/AuthContext';

interface HummingbirdWelcomeProps {
  isOpen: boolean;
  onComplete: () => void;
  isRetroactive?: boolean;
}

/**
 * Welcome modal shown when user earns their first Hummingbird badge
 * Supports both new user registration and retroactive badge assignment
 */
export const HummingbirdWelcome: React.FC<HummingbirdWelcomeProps> = ({
  isOpen,
  onComplete,
  isRetroactive = false,
}) => {
  const { user } = useAuthContext();
  const [showSharing, setShowSharing] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);

  const handleShare = async (platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin') => {
    if (!user?.id) return;

    try {
      setIsGeneratingBadge(true);
      
      // Generate social media optimized badge
      await generateSocialMediaBadge(user.id, platform, {
        format: 'png',
        tier: 'bronze',
        forest: 'kakamega'
      });

      // Get platform-specific text
      const shareText = getSocialMediaText(platform, user.profile?.full_name);
      
      // Create shareable URL based on platform
      let shareUrl = '';
      const encodedText = encodeURIComponent(shareText);
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodedText}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodedText}`;
          break;
        case 'instagram':
          // Instagram doesn't support direct sharing, so copy text to clipboard
          await navigator.clipboard.writeText(shareText);
          setCopiedText(true);
          setTimeout(() => setCopiedText(false), 2000);
          alert('Text copied to clipboard! Open Instagram and paste to share your badge.');
          return;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    } catch (error) {
      console.error('Error sharing badge:', error);
      alert('Sorry, there was an error sharing your badge. Please try again.');
    } finally {
      setIsGeneratingBadge(false);
    }
  };

  const copyShareText = async () => {
    const shareText = getSocialMediaText('twitter', user?.profile?.full_name);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (error) {
      console.error('Error copying text:', error);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onComplete}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="glass-heavy rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onComplete}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Animated Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="inline-block mb-6"
                >
                  <HummingbirdBadgePreview userId={user?.id} />
                </motion.div>

                {/* Welcome Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {isRetroactive ? (
                    <>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome Back! 🎉
                      </h2>
                      <p className="text-xl text-green-600 font-semibold mb-2">
                        You've received your Hummingbird Badge!
                      </p>
                      <p className="text-lg text-gray-700 mb-6">
                        We've introduced a new badge progression system, and as a valued member, you've been awarded the Hummingbird badge to start your journey
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome to #GangGreen!
                      </h2>
                      <p className="text-xl text-green-600 font-semibold mb-2">
                        🎉 You've earned your first badge: The Hummingbird
                      </p>
                      <p className="text-lg text-gray-700 mb-6">
                        Join thousands making Africa carbon-negative, one action at a time
                      </p>
                    </>
                  )}
                </motion.div>

                {/* Badge System Explanation for Retroactive Users */}
                {isRetroactive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="glass-green rounded-2xl p-6 mb-6 text-left"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      What's New: Badge Progression System
                    </h3>
                    <div className="space-y-3 text-gray-700">
                      <p>
                        We've launched a new badge progression system to recognize and reward your environmental impact!
                      </p>
                      <p>
                        As you continue your journey with #GangGreen, you'll progress through six badge tiers:
                      </p>
                      <div className="grid grid-cols-2 gap-2 my-3 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-white/50 rounded-lg">
                          <span className="font-semibold text-green-600">🐦 Hummingbird</span>
                          <span className="text-gray-500">(You are here)</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
                          <span className="font-semibold text-amber-700">🥉 Bronze</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
                          <span className="font-semibold text-gray-500">🥈 Silver</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
                          <span className="font-semibold text-yellow-600">🥇 Gold</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
                          <span className="font-semibold text-cyan-600">💎 Platinum</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white/30 rounded-lg">
                          <span className="font-semibold text-blue-600">💠 Diamond</span>
                        </div>
                      </div>
                      <p>
                        Your contributions, initiatives, and community engagement will help you advance through these tiers!
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Hummingbird Story */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="glass rounded-2xl p-6 mb-6 text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    The Hummingbird Story
                  </h3>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      One day a terrible fire broke out in a forest. All the animals fled, except for a tiny hummingbird.
                    </p>
                    <p>
                      The hummingbird flew to the stream, took a drop of water in its beak, and flew back to drop it on the fire. Back and forth it went, while the other animals watched.
                    </p>
                    <p>
                      "What are you doing?" they asked. "This fire is too big for you!"
                    </p>
                    <p className="font-semibold text-green-700">
                      The hummingbird replied: "I'm doing the best I can."
                    </p>
                  </div>
                </motion.div>

                {/* Call to Action */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-4"
                >
                  <p className="text-lg text-gray-700">
                    {isRetroactive 
                      ? "Continue making your impact and advance to the next badge tier!"
                      : "Like the hummingbird, every small action counts. Ready to make your impact?"
                    }
                  </p>

                  {/* Platform Introduction - Only for new users */}
                  {!isRetroactive && (
                    <div className="glass-green rounded-xl p-4 text-left mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Welcome to Africa's Carbon-Negative Movement</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        #GangGreen connects communities across Kenya's forests - from Kakamega's tropical canopy to Karura's urban oasis and Mau's highland watersheds. Together, we're reforesting Africa one tree at a time.
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-white/50 rounded-lg">
                          <div className="font-semibold text-green-700">50K+</div>
                          <div className="text-gray-600">Trees Planted</div>
                        </div>
                        <div className="text-center p-2 bg-white/50 rounded-lg">
                          <div className="font-semibold text-green-700">1.2K+</div>
                          <div className="text-gray-600">Active Members</div>
                        </div>
                        <div className="text-center p-2 bg-white/50 rounded-lg">
                          <div className="font-semibold text-green-700">3</div>
                          <div className="text-gray-600">Pilot Forests</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Next Steps Preview */}
                  <div className="glass rounded-xl p-4 text-left">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {isRetroactive ? "How to Advance to Bronze:" : "Your Journey Starts Here:"}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Complete micro-challenges and earn GG Coins</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Join forest conservation initiatives</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Connect with local environmental champions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Track your environmental impact</span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {!showSharing ? (
                      <>
                        <GlassButton
                          variant="secondary"
                          size="lg"
                          onClick={() => setShowSharing(true)}
                          className="w-full"
                          disabled={isGeneratingBadge}
                        >
                          <Share2 className="w-5 h-5 mr-2" />
                          Share My Badge
                        </GlassButton>
                        
                        <GlassButton
                          variant="primary"
                          size="lg"
                          onClick={onComplete}
                          className="w-full"
                        >
                          {isRetroactive ? "Continue My Journey" : "Begin My Journey"}
                        </GlassButton>
                      </>
                    ) : (
                      <>
                        {/* Social Media Sharing Options */}
                        <div className="glass rounded-xl p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 text-center">
                            Share your Hummingbird Badge
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                              onClick={() => handleShare('twitter')}
                              disabled={isGeneratingBadge}
                              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
                            >
                              <Twitter className="w-4 h-4" />
                              <span className="text-sm font-medium">Twitter</span>
                            </button>
                            
                            <button
                              onClick={() => handleShare('facebook')}
                              disabled={isGeneratingBadge}
                              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                            >
                              <Facebook className="w-4 h-4" />
                              <span className="text-sm font-medium">Facebook</span>
                            </button>
                            
                            <button
                              onClick={() => handleShare('instagram')}
                              disabled={isGeneratingBadge}
                              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-colors disabled:opacity-50"
                            >
                              <Instagram className="w-4 h-4" />
                              <span className="text-sm font-medium">Instagram</span>
                            </button>
                            
                            <button
                              onClick={() => handleShare('linkedin')}
                              disabled={isGeneratingBadge}
                              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-50"
                            >
                              <Linkedin className="w-4 h-4" />
                              <span className="text-sm font-medium">LinkedIn</span>
                            </button>
                          </div>
                          
                          {/* Copy Text Option */}
                          <button
                            onClick={copyShareText}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 text-gray-700 transition-colors"
                          >
                            {copiedText ? (
                              <>
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span className="text-sm font-medium">Copy Share Text</span>
                              </>
                            )}
                          </button>
                          
                          {isGeneratingBadge && (
                            <div className="text-center mt-3">
                              <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                                Preparing your badge...
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <GlassButton
                            variant="secondary"
                            size="md"
                            onClick={() => setShowSharing(false)}
                            className="flex-1"
                          >
                            Back
                          </GlassButton>
                          
                          <GlassButton
                            variant="primary"
                            size="md"
                            onClick={onComplete}
                            className="flex-1"
                          >
                            Continue
                          </GlassButton>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Component to preview the actual hummingbird badge
 */
const HummingbirdBadgePreview: React.FC<{ userId?: string }> = ({ userId }) => {
  const [badgeSvg, setBadgeSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const generatePreview = async () => {
      try {
        const result = await generateWelcomeBadge(userId, {
          tier: 'bronze',
          forest: 'kakamega',
          optimized: true
        });

        if (result.success && result.svg) {
          setBadgeSvg(result.svg);
        }
      } catch (error) {
        console.error('Error generating badge preview:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="aspect-square w-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl">
        <div className="aspect-square w-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (badgeSvg) {
    return (
      <div 
        className="aspect-square w-32 rounded-full shadow-2xl overflow-hidden bg-white"
        dangerouslySetInnerHTML={{ __html: badgeSvg }}
      />
    );
  }

  // Fallback to icon if badge generation fails
  return (
    <div className="aspect-square w-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl">
      <Award className="w-20 h-20 text-white" strokeWidth={1.5} />
    </div>
  );
};
