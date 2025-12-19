import { useState, useEffect } from 'react';
import { BadgePurchaseModal } from './BadgePurchaseModal';
import { BadgePurchaseConfirmation } from './BadgePurchaseConfirmation';
import { BadgeComparisonView } from './BadgeComparisonView';
import { BADGE_PRICE_KES } from '../../types/badgePurchase.types';
import { BadgeSvgService } from '../../services/badgeSvg.service';
import { hummingbirdBadgeService } from '../../services/hummingbirdBadge.service';
import type { BadgeTier, ForestType, AchievementType } from '../../types/badge.types';
import { Award, SplitSquareHorizontal } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  type: AchievementType;
  tier: BadgeTier;
  forest: ForestType;
  description: string;
  image_url?: string;
  rarity_score: number;
  unlockRequirement?: string;
  priceGGCoins: number;
}

interface BadgeMarketplaceProps {
  userId: string;
  userEmail: string;
  userProfileUrl?: string;
}

// Comprehensive badge catalog matching homepage showcase
const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'badge-000-hummingbird-welcome',
    name: 'Hummingbird Welcome Badge',
    type: 'welcome_badge',
    tier: 'hummingbird',
    forest: 'kakamega',
    description: 'Your first badge! Like the hummingbird in Wangari Maathai\'s story, every small action counts. Welcome to the #GangGreen community!',
    rarity_score: 5,
    unlockRequirement: 'Complete registration',
    priceGGCoins: 0, // Free welcome badge
  },
  {
    id: 'badge-001-kakamega-tree-planter',
    name: 'Kakamega Tree Planter',
    type: 'tree_planter',
    tier: 'bronze',
    forest: 'kakamega',
    description: 'Plant your first tree in Kakamega Forest and start your conservation journey',
    rarity_score: 10,
    unlockRequirement: 'Plant 1 tree in Kakamega Forest',
    priceGGCoins: 50,
  },
  {
    id: 'badge-002-karura-forest-guardian',
    name: 'Karura Forest Guardian',
    type: 'forest_protector',
    tier: 'silver',
    forest: 'karura',
    description: 'Protect and nurture 10 trees in Karura urban forest',
    rarity_score: 25,
    unlockRequirement: 'Plant 10 trees in Karura Forest',
    priceGGCoins: 150,
  },
  {
    id: 'badge-003-mau-carbon-warrior',
    name: 'Mau Carbon Warrior',
    type: 'carbon_warrior',
    tier: 'gold',
    forest: 'mau',
    description: 'Offset 1 ton of CO₂ through verified conservation in Mau Forest',
    rarity_score: 50,
    unlockRequirement: 'Sequester 1 ton CO₂ in Mau Forest',
    priceGGCoins: 300,
  },
  {
    id: 'badge-004-kakamega-community-leader',
    name: 'Kakamega Community Leader',
    type: 'community_leader',
    tier: 'platinum',
    forest: 'kakamega',
    description: 'Lead a conservation initiative and inspire your community in Kakamega',
    rarity_score: 75,
    unlockRequirement: 'Create an initiative in Kakamega',
    priceGGCoins: 400,
  },
  {
    id: 'badge-005-karura-water-guardian',
    name: 'Karura Water Guardian',
    type: 'water_guardian',
    tier: 'silver',
    forest: 'karura',
    description: 'Protect water sources and support sustainable water management',
    rarity_score: 30,
    unlockRequirement: 'Complete 5 water conservation activities',
    priceGGCoins: 200,
  },
  {
    id: 'badge-006-mau-climate-hero',
    name: 'Mau Climate Hero',
    type: 'climate_hero',
    tier: 'diamond',
    forest: 'mau',
    description: 'Champion climate action and achieve diamond-level conservation impact',
    rarity_score: 100,
    unlockRequirement: 'Achieve 100 conservation actions',
    priceGGCoins: 500,
  },
  {
    id: 'badge-007-kakamega-biodiversity-champion',
    name: 'Kakamega Biodiversity Champion',
    type: 'biodiversity_champion',
    tier: 'gold',
    forest: 'kakamega',
    description: 'Protect endangered species and preserve biodiversity in Kakamega',
    rarity_score: 60,
    unlockRequirement: 'Complete 25 biodiversity activities',
    priceGGCoins: 350,
  },
  {
    id: 'badge-008-karura-tree-planter',
    name: 'Karura Tree Planter',
    type: 'tree_planter',
    tier: 'bronze',
    forest: 'karura',
    description: 'Begin your urban forestry journey in Karura Forest',
    rarity_score: 10,
    unlockRequirement: 'Plant 1 tree in Karura Forest',
    priceGGCoins: 50,
  },
];

// Badge Card Component with SVG Generation
const BadgeCard: React.FC<{
  badge: Badge;
  onPurchaseClick: (badge: Badge) => void;
  onCompareClick: (badge: Badge) => void;
  getTierColor: (tier: string) => string;
  style: 'geometric' | 'classic';
}> = ({ badge, onPurchaseClick, onCompareClick, getTierColor, style }) => {
  const [badgeSvg, setBadgeSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const generateBadge = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        let result;

        // Handle hummingbird badge generation
        if (badge.tier === 'hummingbird' && badge.type === 'welcome_badge') {
          const config = hummingbirdBadgeService.createDefaultHummingbirdConfig(
            'marketplace-preview',
            'bronze',
            badge.forest
          );
          result = await hummingbirdBadgeService.generateHummingbirdBadge(config);
        } else {
          // Handle regular badge generation
          const badgeService = new BadgeSvgService();
          result = await badgeService.generateBadge({
            id: badge.id,
            tier: badge.tier,
            forest: badge.forest,
            achievement: badge.type,
            metadata: {
              badgeName: badge.name,
              tierLevel: ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond'].indexOf(badge.tier),
              forestName: badge.forest,
              achievementType: badge.type,
              achievementCount: 0,
              earnedDate: new Date().toISOString(),
              uniqueBadgeId: badge.id,
              userId: 'marketplace-preview',
            },
            animated: badge.tier === 'diamond',
            style: style,
          });
        }

        if (result.success && result.svg) {
          setBadgeSvg(result.svg);
          setHasError(false);
        } else {
          console.error('[BadgeMarketplace] Badge generation failed:', {
            badgeId: badge.id,
            error: result.error,
          });
          setHasError(true);
        }
      } catch (error) {
        console.error('[BadgeMarketplace] Exception generating badge SVG:', {
          badgeId: badge.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    generateBadge();
  }, [badge, style]);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
      {/* Badge Image */}
      <div className="relative aspect-square bg-gradient-to-br from-green-50 to-blue-50 p-6 flex items-center justify-center">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
          </div>
        ) : badgeSvg && !hasError ? (
          <div
            className="w-full h-full group-hover:scale-110 transition-transform duration-300"
            dangerouslySetInnerHTML={{ __html: badgeSvg }}
          />
        ) : badge.image_url ? (
          <img
            src={badge.image_url}
            alt={badge.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Award size={80} className="text-gray-400" />
          </div>
        )}

        {/* GG Coin Badge */}
        <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">GG</span>
          </div>
          <span>+1</span>
        </div>

        {/* Compare Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCompareClick(badge);
          }}
          className="absolute top-2 left-2 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-sm transition-colors"
          title="Compare Styles"
        >
          <SplitSquareHorizontal size={16} />
        </button>
      </div>

      {/* Badge Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900">{badge.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getTierColor(badge.tier)}`}>
            {badge.tier}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{badge.description}</p>

        {/* Unlock Requirement */}
        {badge.unlockRequirement && (
          <div className="mb-3 text-xs text-gray-500 italic">
            🔓 {badge.unlockRequirement}
          </div>
        )}

        {/* Price and Purchase */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            {badge.priceGGCoins === 0 ? (
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-teal-600">FREE</p>
                <span className="text-xs text-teal-500">Welcome Badge</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-green-600">{badge.priceGGCoins} GG</p>
                <span className="text-xs text-gray-500">or</span>
                <p className="text-lg font-bold text-gray-700">KES {BADGE_PRICE_KES}</p>
              </div>
            )}
          </div>
          {badge.priceGGCoins === 0 ? (
            <div className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg font-medium text-sm">
              Earned on Join
            </div>
          ) : (
            <button
              onClick={() => onPurchaseClick(badge)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              Purchase
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const BadgeMarketplace: React.FC<BadgeMarketplaceProps> = ({
  userId,
  userEmail,
  userProfileUrl,
}) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [comparingBadge, setComparingBadge] = useState<Badge | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [purchasedBadge, setPurchasedBadge] = useState<Badge | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<'geometric' | 'classic'>('geometric');

  const handlePurchaseClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowPurchaseModal(true);
  };

  const handleCompareClick = (badge: Badge) => {
    setComparingBadge(badge);
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false);
    setPurchasedBadge(selectedBadge);
    setTransactionRef(`GG-${Date.now()}`);
    setShowConfirmation(true);
  };

  // Filter badges
  const filteredBadges = AVAILABLE_BADGES.filter((badge) => {
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || badge.tier === filterTier;
    const matchesType = filterType === 'all' || badge.type === filterType;
    return matchesSearch && matchesTier && matchesType;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'hummingbird': return 'text-teal-600 bg-teal-100';
      case 'bronze': return 'text-orange-600 bg-orange-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'platinum': return 'text-purple-600 bg-purple-100';
      case 'diamond': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Badge Marketplace</h1>
        <p className="text-gray-600">
          Purchase exclusive NFT badges and earn GG Coins with every purchase!
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-1">
          <input
            type="text"
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Tier Filter */}
        <div>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Tiers</option>
            <option value="hummingbird">🐦 Hummingbird</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
            <option value="diamond">Diamond</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="tree_planter">Tree Planter</option>
            <option value="donor">Donor</option>
            <option value="monitor">Monitor</option>
            <option value="ambassador">Ambassador</option>
            <option value="legend">Legend</option>
          </select>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBadges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            onPurchaseClick={handlePurchaseClick}
            onCompareClick={handleCompareClick}
            getTierColor={getTierColor}
            style={filterStyle}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No badges found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Modals */}
      {selectedBadge && (
        <>
          <BadgePurchaseModal
            isOpen={showPurchaseModal}
            onClose={() => setShowPurchaseModal(false)}
            badgeType={selectedBadge.type}
            tier={selectedBadge.tier}
            badgeName={selectedBadge.name}
            badgeImage={selectedBadge.image_url || ''}
            userId={userId}
            userEmail={userEmail}
            onSuccess={handlePurchaseSuccess}
          />

          {purchasedBadge && (
            <BadgePurchaseConfirmation
              isOpen={showConfirmation}
              onClose={() => setShowConfirmation(false)}
              badgeName={purchasedBadge.name}
              badgeType={purchasedBadge.type}
              tier={purchasedBadge.tier}
              badgeImage={purchasedBadge.image_url || ''}
              transactionReference={transactionRef}
              userProfileUrl={userProfileUrl}
            />
          )}
        </>
      )}

      {/* Comparison View Modal */}
      {comparingBadge && (
        <BadgeComparisonView
          badge={comparingBadge}
          onClose={() => setComparingBadge(null)}
        />
      )}
    </div>
  );
};

