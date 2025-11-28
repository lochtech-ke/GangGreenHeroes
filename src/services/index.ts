/**
 * Services Index
 * Central export point for all services
 */

export { supabase } from './supabase';
export { authService } from './auth.service';
export { profileService } from './profile.service';
export { initiativeService } from './initiative.service';
export { treeService } from './tree.service';
export { antugrowService } from './antugrow.service';
export { antugrowSyncService } from './antugrow-sync.service';
export { carbonCreditService } from './carbonCredit.service';
export { ggCoinService } from './ggCoin.service';
export { badgePurchaseService } from './badgePurchase.service';
export { badgeAnalyticsService } from './badgeAnalytics.service';
export { paystackService } from './paystack.service';
export { socialFeedService, socialFeedAnalyticsService } from './socialFeed.service';
export { journeyService } from './journey.service';
export { microChallengeService } from './microChallenge.service';
export { referralService } from './referral.service';
export { petitionService } from './petition.service';
export { githubService } from './github.service';
export { contributionAnalyzerService } from './contributionAnalyzer.service';
export { badgeSvgService } from './badgeSvg.service';
export { 
  hummingbirdBadgeService, 
  HummingbirdBadgeGenerator,
  createHummingbirdBadgeGenerator,
  generateWelcomeBadge 
} from './hummingbirdBadge.service';
export { gangGreenHeroBadgeService } from './gangGreenHeroBadge.service';
export { heroBadgeIntegrationService } from './heroBadgeIntegration.service';
export { heroRewardEngineService } from './heroRewardEngine.service';
export { heroRewardSchedulerService } from './heroRewardScheduler.service';
export { heroBenefitsService } from './heroBenefits.service';
export { 
  BadgeRendererService, 
  getBadgeRenderer, 
  resetBadgeRenderer 
} from './badgeRenderer.service';
export { badgeGeneratorService, BadgeGeneratorService } from './badgeGenerator.service';
export { badgeMigrationService, BadgeMigrationService } from './badgeMigration.service';
export { badgePerformanceMonitor } from './badgePerformanceMonitor.service';
export { badgeMigrationMonitor } from './badgeMigrationMonitor.service';
