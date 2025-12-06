import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { JourneyProvider } from './contexts/JourneyContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import CriticalErrorFallback from './components/common/CriticalErrorFallback';
import SectionErrorFallback from './components/common/SectionErrorFallback';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import InitiativesPage from './pages/InitiativesPage';
import { InitiativeDetailsPage } from './pages/InitiativeDetailsPage';
import { CreateInitiativePage } from './pages/CreateInitiativePage';
import { GamificationPage } from './pages/GamificationPage';
import { ForumPage } from './pages/ForumPage';
import { SettingsPage } from './pages/SettingsPage';
import { SocialFeedPage } from './pages/SocialFeedPage';
import { EventsPage } from './pages/EventsPage';
import { JourneyDashboardPage } from './pages/JourneyDashboardPage';
import GovernancePage from './pages/GovernancePage';
import { ProposalDetailPage } from './pages/ProposalDetailPage';
import { PetitionDetailPage } from './pages/PetitionDetailPage';
import { PetitionsPage } from './pages/PetitionsPage';
import BadgesPage from './pages/BadgesPage';
import { MarketplacePage } from './pages/MarketplacePage';
import {
  TermsOfServicePage,
  PrivacyPolicyPage,
  CookiePolicyPage,
  TaxReceiptPolicyPage,
  AcceptableUsePolicyPage,
} from './pages/legal';
import { LegalPage } from './pages/legal/LegalPage';
import { ProtectedRoute } from './components/auth';
import { ChatWidget } from './components/chatbot/ChatWidget';
import { Layout } from './components/layout';
import { SupabaseTest } from './components/auth/SupabaseTest';
import StickmanPreloader from './components/common/StickmanPreloader';
import VivianSplashScreen from './components/common/VivianSplashScreen';
import { DeprecatedRouteHandler } from './components/routing';
import { HummingbirdWelcome } from './components/badges';
import { useHummingbirdWelcome } from './hooks/useHummingbirdWelcome';
import OnboardingGuidePage from './pages/OnboardingGuidePage';
import { EducationalExplainerPage } from './pages/EducationalExplainerPage';
import { CommunitiesPage } from './pages/CommunitiesPage';
import { CommunityDetailPage } from './pages/CommunityDetailPage';
import { LearningDashboardPage } from './pages/LearningDashboardPage';
import { LearningModulePage } from './pages/LearningModulePage';
import { CertificatesPage } from './pages/CertificatesPage';
import MissionsPage from './pages/MissionsPage';
import MissionDetailsPage from './pages/MissionDetailsPage';
import MissionVerificationPage from './pages/MissionVerificationPage';
import { Track3DashboardPage } from './pages/Track3DashboardPage';
import { AmbassadorApplicationPage } from './pages/AmbassadorApplicationPage';
import { AmbassadorDashboardPage } from './pages/AmbassadorDashboardPage';
import { AmbassadorProfilePage } from './pages/AmbassadorProfilePage';
import { AmbassadorHallOfFamePage } from './pages/AmbassadorHallOfFamePage';
import { GreenCoinsPage } from './pages/GreenCoinsPage';

// Feature flags (can be moved to environment variables)
const CHATBOT_ENABLED = true;
const VIVIAN_SPLASH_ENABLED = true; // Feature flag for v1.0 Vivian splash screen - enabled (disables stickman)

/**
 * RouteErrorBoundary Component
 * 
 * Wraps individual routes with section-level error boundaries
 * to isolate errors and prevent them from affecting other routes.
 * 
 * Requirement C6.4: Add route-level boundaries
 */
function RouteErrorBoundary({ children, routeName }: { children: React.ReactNode; routeName: string }) {
  return (
    <ErrorBoundary
      level="section"
      fallback={SectionErrorFallback}
      isolationId={`route-${routeName}`}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * ChatbotWrapper Component with Error Boundary
 * 
 * Wraps the chatbot with a component-level error boundary to prevent
 * chatbot errors from affecting the rest of the application.
 * 
 * Requirement C6.4: Add component-level boundaries
 */
function ChatbotWrapper() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuthContext();
  const location = useLocation();

  // Don't show chatbot on register page (it has its own onboarding chatbot)
  if (location.pathname === '/register') {
    return null;
  }

  // Don't show if feature is disabled
  if (!CHATBOT_ENABLED) {
    return null;
  }

  return (
    <ErrorBoundary
      level="component"
      isolationId="chatbot"
      onError={(error) => {
        console.error('Chatbot error:', error);
        // Optionally track chatbot errors separately
      }}
    >
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-40"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          {/* Pulse animation for first-time users */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat Widget */}
      <ChatWidget
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        userId={user?.id}
        userEmail={user?.email}
        position="bottom-right"
        hasCompletedProfile={!!user?.profile?.full_name}
      />
    </ErrorBoundary>
  );
}

/**
 * AppContent Component with Route-Level Error Boundaries
 * 
 * Each route is wrapped with a section-level error boundary to isolate
 * errors to specific pages and allow the rest of the app to continue functioning.
 * 
 * Requirement C6.4: Add route-level boundaries
 */
function AppContent() {
  const { user } = useAuthContext();
  const { showWelcome, handleComplete } = useHummingbirdWelcome(user?.id);

  return (
    <>
      {/* Hummingbird Welcome Modal for New Users */}
      <HummingbirdWelcome isOpen={showWelcome} onComplete={handleComplete} />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/test-supabase" element={<SupabaseTest />} />

        {/* Social Feed */}
        <Route
          path="/social-feed"
          element={
            <Layout>
              <SocialFeedPage />
            </Layout>
          }
        />
        
        {/* Legal Pages - Dynamic route using Strapi CMS */}
        <Route
          path="/legal/:slug"
          element={
            <Layout>
              <LegalPage />
            </Layout>
          }
        />
        
        {/* Legacy Legal Pages - Keep for backwards compatibility */}
        <Route
          path="/legal/terms"
          element={
            <Layout>
              <TermsOfServicePage />
            </Layout>
          }
        />
        <Route
          path="/legal/privacy"
          element={
            <Layout>
              <PrivacyPolicyPage />
            </Layout>
          }
        />
        <Route
          path="/legal/cookies"
          element={
            <Layout>
              <CookiePolicyPage />
            </Layout>
          }
        />
        <Route
          path="/legal/tax-receipts"
          element={
            <Layout>
              <TaxReceiptPolicyPage />
            </Layout>
          }
        />
        <Route
          path="/legal/acceptable-use"
          element={
            <Layout>
              <AcceptableUsePolicyPage />
            </Layout>
          }
        />
        
        <Route
          path="/onboarding-guide"
          element={
            <RouteErrorBoundary routeName="onboarding-guide">
              <ProtectedRoute>
                <Layout>
                  <OnboardingGuidePage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/learn"
          element={
            <RouteErrorBoundary routeName="learn">
              <ProtectedRoute>
                <Layout>
                  <EducationalExplainerPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RouteErrorBoundary routeName="dashboard">
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/impact-dashboard"
          element={
            <RouteErrorBoundary routeName="impact-dashboard">
              <ProtectedRoute>
                <Layout>
                  <Track3DashboardPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/journey"
          element={
            <RouteErrorBoundary routeName="journey">
              <ProtectedRoute>
                <Layout>
                  <JourneyDashboardPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/badges"
          element={
            <RouteErrorBoundary routeName="badges">
              <ProtectedRoute>
                <Layout>
                  <BadgesPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/initiatives"
          element={
            <RouteErrorBoundary routeName="initiatives">
              <ProtectedRoute>
                <Layout>
                  <InitiativesPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/initiatives/create"
          element={
            <RouteErrorBoundary routeName="initiatives-create">
              <ProtectedRoute>
                <Layout>
                  <CreateInitiativePage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/initiatives/:id"
          element={
            <RouteErrorBoundary routeName="initiatives-detail">
              <ProtectedRoute>
                <Layout>
                  <InitiativeDetailsPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        {/* Badge Marketplace - Active for Track 3 */}
        <Route
          path="/marketplace"
          element={
            <RouteErrorBoundary routeName="marketplace">
              <ProtectedRoute>
                <Layout>
                  <MarketplacePage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        {/* Deprecated Routes - Track 3 Redirects */}
        <Route path="/trees" element={<DeprecatedRouteHandler />} />
        <Route path="/carbon-credits" element={<DeprecatedRouteHandler />} />
        <Route
          path="/gamification"
          element={
            <RouteErrorBoundary routeName="gamification">
              <ProtectedRoute>
                <Layout>
                  <GamificationPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/coins"
          element={
            <RouteErrorBoundary routeName="coins">
              <ProtectedRoute>
                <Layout>
                  <GreenCoinsPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/forum"
          element={
            <RouteErrorBoundary routeName="forum">
              <ProtectedRoute>
                <Layout>
                  <ForumPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/communities"
          element={
            <RouteErrorBoundary routeName="communities">
              <Layout>
                <CommunitiesPage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/communities/:communityId"
          element={
            <RouteErrorBoundary routeName="community-detail">
              <Layout>
                <CommunityDetailPage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/learning"
          element={
            <RouteErrorBoundary routeName="learning">
              <ProtectedRoute>
                <Layout>
                  <LearningDashboardPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/learning/:moduleId"
          element={
            <RouteErrorBoundary routeName="learning-module">
              <ProtectedRoute>
                <Layout>
                  <LearningModulePage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/certificates"
          element={
            <RouteErrorBoundary routeName="certificates">
              <ProtectedRoute>
                <Layout>
                  <CertificatesPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/missions"
          element={
            <RouteErrorBoundary routeName="missions">
              <Layout>
                <MissionsPage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/missions/:id"
          element={
            <RouteErrorBoundary routeName="mission-detail">
              <Layout>
                <MissionDetailsPage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/missions/:id/verify"
          element={
            <RouteErrorBoundary routeName="mission-verification">
              <ProtectedRoute>
                <Layout>
                  <MissionVerificationPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/events"
          element={
            <RouteErrorBoundary routeName="events">
              <ProtectedRoute>
                <Layout>
                  <EventsPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/profile"
          element={
            <RouteErrorBoundary routeName="profile">
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/settings"
          element={
            <RouteErrorBoundary routeName="settings">
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/governance"
          element={
            <RouteErrorBoundary routeName="governance">
              <ProtectedRoute>
                <Layout>
                  <GovernancePage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/governance/proposals"
          element={
            <RouteErrorBoundary routeName="governance-proposals">
              <ProtectedRoute>
                <Layout>
                  <GovernancePage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/governance/proposals/:id"
          element={
            <RouteErrorBoundary routeName="governance-proposal-detail">
              <ProtectedRoute>
                <Layout>
                  <ProposalDetailPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/petitions"
          element={
            <RouteErrorBoundary routeName="petitions">
              <Layout>
                <PetitionsPage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/petitions/:id"
          element={
            <RouteErrorBoundary routeName="petition-detail">
              <Layout>
                <PetitionDetailPage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/governance/petitions"
          element={
            <RouteErrorBoundary routeName="governance-petitions">
              <Layout>
                <PetitionsPage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/governance/petitions/:id"
          element={
            <RouteErrorBoundary routeName="governance-petition-detail">
              <Layout>
                <PetitionDetailPage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/ambassador/apply"
          element={
            <RouteErrorBoundary routeName="ambassador-apply">
              <ProtectedRoute>
                <Layout>
                  <AmbassadorApplicationPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/ambassador/dashboard"
          element={
            <RouteErrorBoundary routeName="ambassador-dashboard">
              <ProtectedRoute>
                <Layout>
                  <AmbassadorDashboardPage />
                </Layout>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/ambassador/:userId"
          element={
            <RouteErrorBoundary routeName="ambassador-profile">
              <Layout>
                <AmbassadorProfilePage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/ambassador/hall-of-fame"
          element={
            <RouteErrorBoundary routeName="ambassador-hall-of-fame">
              <Layout>
                <AmbassadorHallOfFamePage />
              </Layout>
            </RouteErrorBoundary>
          }
        />
      </Routes>
      <ChatbotWrapper />
    </>
  );
}

/**
 * App Component with Critical Error Boundary
 * 
 * Wraps the entire application with a critical-level error boundary
 * to catch and handle catastrophic errors that prevent the app from functioning.
 * 
 * Requirement C6.4: Add app-level boundary
 */
function App() {
  return (
    <ErrorBoundary
      level="critical"
      fallback={CriticalErrorFallback}
      isolationId="app-root"
    >
      <BrowserRouter>
        <AppWithRouter />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function AppWithRouter() {
  const location = useLocation();
  const [showVivianSplash, setShowVivianSplash] = useState(true);
  const [showStickmanPreloader, setShowStickmanPreloader] = useState(true);

  // Routes where splash screens should NOT be shown
  // Authentication pages need immediate interaction without waiting for animations
  const excludedRoutes = ['/login', '/register', '/reset-password', '/auth/callback'];
  const shouldShowSplash = !excludedRoutes.includes(location.pathname);

  // Determine which splash screen to show based on feature flag
  const useVivianSplash = VIVIAN_SPLASH_ENABLED && shouldShowSplash;
  const useStickmanPreloader = !VIVIAN_SPLASH_ENABLED && shouldShowSplash;

  return (
    <>
      {/* v1.0 Vivian Splash Screen - New polished experience */}
      {useVivianSplash && showVivianSplash && (
        <VivianSplashScreen
          minDisplayDuration={2000}
          maxDisplayDuration={5000}
          fadeOutDuration={500}
          onComplete={() => setShowVivianSplash(false)}
        />
      )}

      {/* Legacy Stickman Preloader - Fallback when Vivian splash is disabled */}
      {useStickmanPreloader && showStickmanPreloader && (
        <StickmanPreloader
          minDisplayDuration={1500}
          fadeOutDuration={500}
          backgroundColor="#0D4D2D"
          textColorCycleSpeed={800}
          onComplete={() => setShowStickmanPreloader(false)}
        />
      )}

      <AuthProvider>
        <JourneyProviderWrapper>
          <AppContent />
        </JourneyProviderWrapper>
      </AuthProvider>
    </>
  );
}

// Wrapper to provide user ID to JourneyProvider
function JourneyProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  return <JourneyProvider userId={user?.id || null}>{children}</JourneyProvider>;
}

export default App;
