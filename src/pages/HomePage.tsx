import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import {
  Header,
  HeroSection,
  NFTBadgeShowcase,
  ImpactMetrics,
  UserJourneyVisualization,
  PilotForestsMap,
  FeatureHighlights,
  SocialProofSection,
  LeaderboardPreview,
  PartnershipSection,
  UbuntuPhilosophySection,
} from '../components/home';
import { UnifiedFooter } from '../components/common/UnifiedFooter';

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  // Handler functions
  const handleGetStarted = () => navigate('/register');
  const handleExploreBadges = () => {
    // Scroll to badge section or navigate to marketplace
    const badgeSection = document.getElementById('nft-badges');
    if (badgeSection) {
      badgeSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const handleBadgeClick = (badgeId: string) => navigate(`/marketplace?badge=${badgeId}`);
  const handleViewAllBadges = () => navigate('/marketplace');
  const handleForestClick = (forestId: string) => console.log('Forest clicked:', forestId);
  const handleJoinInitiative = (forestId: string) => navigate(`/initiatives?forest=${forestId}`);
  const handleViewFullLeaderboard = () => navigate('/gamification');

  // Mock data - will be replaced with real data in later tasks
  const mockBadges: any[] = [];
  const mockSteps: any[] = [];
  const mockForests: any[] = [];
  const mockFeatures: any[] = [];
  const mockTestimonials: any[] = [];
  const mockAchievements: any[] = [];
  const mockPhotos: string[] = [];
  const mockTopUsers: any[] = [];
  const mockPartners: any[] = [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header isAuthenticated={isAuthenticated} />

      {/* Main Content */}
      <main>
        <HeroSection
          isAuthenticated={isAuthenticated}
          onGetStarted={handleGetStarted}
          onExploreBadges={handleExploreBadges}
        />

        <div id="nft-badges">
          <NFTBadgeShowcase
            featuredBadges={mockBadges}
            onBadgeClick={handleBadgeClick}
            onViewAll={handleViewAllBadges}
          />
        </div>

        <div id="impact">
          <ImpactMetrics />
        </div>

        <div id="journey">
          <UserJourneyVisualization steps={mockSteps} />
        </div>

        <div id="forests">
          <PilotForestsMap
            forests={mockForests}
            onForestClick={handleForestClick}
            onJoinInitiative={handleJoinInitiative}
          />
        </div>

        <div id="features">
          <FeatureHighlights features={mockFeatures} />
        </div>

        <div id="ubuntu">
          <UbuntuPhilosophySection />
        </div>

        <SocialProofSection
          testimonials={mockTestimonials}
          recentAchievements={mockAchievements}
          userPhotos={mockPhotos}
        />

        <LeaderboardPreview
          topUsers={mockTopUsers}
          currentPeriod="week"
          onViewFull={handleViewFullLeaderboard}
        />

        <PartnershipSection partners={mockPartners} />
      </main>

      {/* Footer */}
      <UnifiedFooter />
    </div>
  );
}
