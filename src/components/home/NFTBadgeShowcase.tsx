import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Coins, Sparkles, ExternalLink, Lock } from 'lucide-react';
import { GlassButton } from '../common/GlassButton';
import { AnimatedSection } from '../common/AnimatedSection';
import { BadgeSvgService } from '../../services/badgeSvg.service';
import { BadgeFallback, BadgeLoadingSpinner } from '../badges/BadgeFallback';
import type { BadgeTier, ForestType, AchievementType } from '../../types/badge.types';

interface FeaturedBadge {
  id: string;
  name: string;
  imageUrl?: string;
  description: string;
  priceGGCoins: number;
  priceKES: number;
  tier: BadgeTier;
  forest: ForestType;
  achievement: AchievementType;
  unlockRequirement?: string;
}

interface BadgeShowcaseProps {
  featuredBadges: FeaturedBadge[];
  onBadgeClick: (badgeId: string) => void;
  onViewAll: () => void;
}

// Tier configuration matching SVG badge system
const tierConfig = {
  hummingbird: {
    gradient: 'from-teal-400 to-teal-600',
    glow: 'shadow-teal-400/50',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
  },
  bronze: {
    gradient: 'from-orange-700 to-orange-900',
    glow: 'shadow-orange-700/50',
    border: 'border-orange-700/30',
    bg: 'bg-orange-700/10',
  },
  silver: {
    gradient: 'from-gray-300 to-gray-500',
    glow: 'shadow-gray-400/50',
    border: 'border-gray-400/30',
    bg: 'bg-gray-400/10',
  },
  gold: {
    gradient: 'from-yellow-400 to-yellow-600',
    glow: 'shadow-yellow-400/50',
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-400/10',
  },
  platinum: {
    gradient: 'from-slate-200 to-slate-400',
    glow: 'shadow-slate-300/50',
    border: 'border-slate-300/30',
    bg: 'bg-slate-300/10',
  },
  diamond: {
    gradient: 'from-cyan-300 to-cyan-500',
    glow: 'shadow-cyan-400/50',
    border: 'border-cyan-400/30',
    bg: 'bg-cyan-400/10',
  },
  hero: {
    gradient: 'from-yellow-300 to-orange-500',
    glow: 'shadow-yellow-400/50',
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-400/10',
  },
};

const FeaturedBadgeCard: React.FC<{
  badge: FeaturedBadge;
  onClick: () => void;
  index: number;
}> = ({ badge, onClick, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [badgeSvg, setBadgeSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const config = tierConfig[badge.tier];
  
  // Generate SVG badge using the badge service
  React.useEffect(() => {
    const generateBadge = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const badgeService = new BadgeSvgService();
        const result = await badgeService.generateBadge({
          id: badge.id,
          tier: badge.tier,
          forest: badge.forest,
          achievement: badge.achievement,
          metadata: {
            badgeName: badge.name,
            tierLevel: ['bronze', 'silver', 'gold', 'platinum', 'diamond'].indexOf(badge.tier) + 1,
            forestName: badge.forest,
            achievementType: badge.achievement,
            achievementCount: 0,
            earnedDate: new Date().toISOString(),
            uniqueBadgeId: badge.id,
            userId: 'preview',
          },
          animated: badge.tier === 'diamond',
        });
        
        if (result.success && result.svg) {
          setBadgeSvg(result.svg);
          setHasError(false);
        } else {
          console.error('[NFTBadgeShowcase] Badge generation failed:', {
            badgeId: badge.id,
            badgeName: badge.name,
            error: result.error,
          });
          setHasError(true);
        }
      } catch (error) {
        console.error('[NFTBadgeShowcase] Exception generating badge SVG:', {
          badgeId: badge.id,
          badgeName: badge.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateBadge();
  }, [badge]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          relative glass rounded-2xl overflow-hidden cursor-pointer
          border-2 ${config.border}
          transition-all duration-300
          ${isHovered ? `${config.glow} shadow-2xl` : 'shadow-lg'}
        `}
        onClick={onClick}
      >
        {/* Animated Gradient Border */}
        <div
          className={`
            absolute inset-0 opacity-0 transition-opacity duration-300
            bg-gradient-to-r ${config.gradient}
            ${isHovered ? 'opacity-20' : ''}
          `}
        />

        {/* Tier Badge with Sparkles */}
        <div className={`absolute top-3 right-3 glass ${config.bg} px-3 py-1 rounded-full flex items-center gap-1 z-10`}>
          <Sparkles size={12} className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`} />
          <span className={`text-xs font-bold uppercase bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
            {badge.tier}
          </span>
        </div>

        {/* Badge SVG with Rotation on Hover */}
        <div className="p-6 flex justify-center items-center bg-gradient-to-br from-green-50/50 to-emerald-50/50 backdrop-blur-sm">
          <motion.div
            className="flex items-center justify-center"
            style={{ width: 192, height: 192 }}
            animate={{ rotate: isHovered ? 5 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isLoading ? (
              // Loading state with glass effect
              <BadgeLoadingSpinner size="md" />
            ) : badgeSvg && !hasError ? (
              // Successfully generated SVG with rendering quality optimizations
              <div
                className="drop-shadow-2xl badge-svg"
                style={{ width: 192, height: 192 }}
                data-badge-svg
                dangerouslySetInnerHTML={{ __html: badgeSvg }}
              />
            ) : badge.imageUrl ? (
              // Fallback to imageUrl if provided
              <img
                src={badge.imageUrl}
                alt={badge.name}
                className="object-contain drop-shadow-2xl"
                style={{ width: 192, height: 192 }}
                onError={() => {
                  console.error('[NFTBadgeShowcase] Image load failed:', badge.imageUrl);
                  // Show BadgeFallback instead of hiding
                  setHasError(true);
                }}
              />
            ) : (
              // Final fallback: BadgeFallback component with tier-specific styling
              <BadgeFallback
                tier={badge.tier}
                badgeName={badge.name}
                size="md"
              />
            )}
          </motion.div>
        </div>

        {/* Badge Info */}
        <div className="p-6 relative z-10">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{badge.name}</h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{badge.description}</p>

          {/* Unlock Requirement Tooltip */}
          {badge.unlockRequirement && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="glass-green p-3 rounded-lg border border-green-400/30 flex items-start gap-2">
                <Lock size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-800 mb-1">Unlock Requirement:</p>
                  <p className="text-xs text-green-700">{badge.unlockRequirement}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full glass-green flex items-center justify-center">
                <Coins size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{badge.priceGGCoins} GG</p>
                <p className="text-xs text-gray-500">or KES {badge.priceKES}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Glow Effect */}
        {isHovered && (
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-10 pointer-events-none`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
    </motion.div>
  );
};

export const NFTBadgeShowcase: React.FC<BadgeShowcaseProps> = ({
  featuredBadges,
  onBadgeClick,
  onViewAll,
}) => {
  // Mock data for demonstration if no badges provided
  const mockBadges: FeaturedBadge[] = [
    {
      id: 'badge-000-hummingbird-welcome',
      name: 'Hummingbird Welcome Badge',
      description: 'Your journey begins here! Like the hummingbird in Wangari Maathai\'s story, every small action counts.',
      priceGGCoins: 0,
      priceKES: 0,
      tier: 'hummingbird',
      forest: 'kakamega',
      achievement: 'welcome_badge',
      unlockRequirement: 'Awarded automatically upon registration',
    },
    {
      id: 'badge-001-kakamega-tree-planter',
      name: 'Kakamega Tree Planter',
      description: 'Plant your first tree in Kakamega Forest and start your conservation journey',
      priceGGCoins: 50,
      priceKES: 200,
      tier: 'bronze',
      forest: 'kakamega',
      achievement: 'tree_planter',
      unlockRequirement: 'Plant 1 tree in Kakamega Forest',
    },
    {
      id: 'badge-002-karura-forest-guardian',
      name: 'Karura Forest Guardian',
      description: 'Protect and nurture 10 trees in Karura urban forest',
      priceGGCoins: 150,
      priceKES: 600,
      tier: 'silver',
      forest: 'karura',
      achievement: 'forest_protector',
      unlockRequirement: 'Plant 10 trees in Karura Forest',
    },
    {
      id: 'badge-003-mau-carbon-warrior',
      name: 'Mau Carbon Warrior',
      description: 'Offset 1 ton of CO₂ through verified conservation in Mau Forest',
      priceGGCoins: 300,
      priceKES: 1200,
      tier: 'gold',
      forest: 'mau',
      achievement: 'carbon_warrior',
      unlockRequirement: 'Sequester 1 ton CO₂ in Mau Forest',
    },
    {
      id: 'badge-004-kakamega-community-leader',
      name: 'Kakamega Community Leader',
      description: 'Lead a conservation initiative and inspire your community in Kakamega',
      priceGGCoins: 400,
      priceKES: 1600,
      tier: 'platinum',
      forest: 'kakamega',
      achievement: 'community_leader',
      unlockRequirement: 'Create an initiative in Kakamega',
    },
    {
      id: 'badge-005-karura-water-guardian',
      name: 'Karura Water Guardian',
      description: 'Protect water sources and support sustainable water management',
      priceGGCoins: 200,
      priceKES: 800,
      tier: 'silver',
      forest: 'karura',
      achievement: 'water_guardian',
      unlockRequirement: 'Complete 5 water conservation activities',
    },
    {
      id: 'badge-006-mau-climate-hero',
      name: 'Mau Climate Hero',
      description: 'Champion climate action and achieve diamond-level conservation impact',
      priceGGCoins: 500,
      priceKES: 2000,
      tier: 'diamond',
      forest: 'mau',
      achievement: 'climate_hero',
      unlockRequirement: 'Achieve 100 conservation actions',
    },
  ];

  const displayBadges = featuredBadges.length > 0 ? featuredBadges : mockBadges;

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with floating geometric shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Icon */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-green mb-6"
            >
              <Award size={40} className="text-green-600" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Earn Digital Badges
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-600 mx-auto mb-6 rounded-full" />
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Collect unique digital badges as you make an impact. Each badge represents your
              contribution to Africa's forests and can be purchased with GG Coins or cash.
            </p>
          </div>
        </AnimatedSection>

        {/* Badge Grid with Staggered Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayBadges.slice(0, 6).map((badge, index) => (
            <FeaturedBadgeCard
              key={badge.id}
              badge={badge}
              index={index}
              onClick={() => onBadgeClick(badge.id)}
            />
          ))}
        </div>

        {/* View All CTA with Glass Effect */}
        <AnimatedSection delay={0.6}>
          <div className="text-center">
            <GlassButton
              variant="primary"
              size="lg"
              icon={ExternalLink}
              onClick={onViewAll}
              className="min-w-[240px]"
            >
              View All Badges
            </GlassButton>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
