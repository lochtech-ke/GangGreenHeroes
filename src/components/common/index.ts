/**
 * Common Components Index
 * Central export point for shared/common components
 */

export { PixiPreloader } from './PixiPreloader';
export { FallbackLoader } from './FallbackLoader';

// Glassmorphism Components
export { GlassCard } from './GlassCard';
export { GlassButton } from './GlassButton';
export { GlassTooltip } from './GlassTooltip';
export { AnimatedSection } from './AnimatedSection';

// Initiatives & Trees Shared Components
export { default as MapView } from './MapView';
export { default as ProgressBar } from './ProgressBar';
export { default as StatsCard } from './StatsCard';
export { default as ImageViewer } from './ImageViewer';
export { default as ShareButton } from './ShareButton';
export { default as ExportButton } from './ExportButton';

// Error Boundary Components
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as CriticalErrorFallback } from './CriticalErrorFallback';
export { default as SectionErrorFallback } from './SectionErrorFallback';
export { default as ComponentErrorFallback } from './ComponentErrorFallback';

// Notification Components
export { CoinEarnedToast, CoinEarnedToastContainer } from './CoinEarnedToast';
export type { CoinEarnedToastProps, CoinEarnedToastContainerProps } from './CoinEarnedToast';

// Splash Screen Components (v1.0 Vivian)
export { default as VivianSplashScreen } from './VivianSplashScreen';
export { default as HummingbirdAnimation } from './HummingbirdAnimation';
export { default as VersionDisplay } from './VersionDisplay';
export { default as ContributorTicker } from './ContributorTicker';
export { default as StickmanPreloader } from './StickmanPreloader';
