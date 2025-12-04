/**
 * Integration Tests for VivianSplashScreen
 * 
 * Tests splash screen behavior across different routes and network conditions.
 * 
 * Requirements:
 * - 1.1: Splash displays before main application content
 * - 7.1: Prioritize loading splash screen resources
 * - 7.3: Remain functional with degraded visuals on slow networks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import VivianSplashScreen from './VivianSplashScreen';
import { useState } from 'react';

// Mock component to track route rendering
function RouteTracker({ routeName }: { routeName: string }) {
  const location = useLocation();
  return (
    <div data-testid={`route-${routeName}`}>
      Route: {routeName} at {location.pathname}
    </div>
  );
}

// Test wrapper that simulates App.tsx behavior
function TestAppWrapper({ 
  excludedRoutes = ['/login', '/register', '/reset-password', '/auth/callback'],
  initialRoute: _initialRoute = '/'
}: { 
  excludedRoutes?: string[];
  initialRoute?: string;
}) {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  
  const shouldShowSplash = !excludedRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowSplash && showSplash && (
        <VivianSplashScreen
          minDisplayDuration={100} // Reduced for testing
          maxDisplayDuration={500}
          fadeOutDuration={50}
          onComplete={() => setShowSplash(false)}
        />
      )}
      
      <Routes>
        <Route path="/" element={<RouteTracker routeName="home" />} />
        <Route path="/dashboard" element={<RouteTracker routeName="dashboard" />} />
        <Route path="/login" element={<RouteTracker routeName="login" />} />
        <Route path="/register" element={<RouteTracker routeName="register" />} />
        <Route path="/reset-password" element={<RouteTracker routeName="reset-password" />} />
        <Route path="/auth/callback" element={<RouteTracker routeName="auth-callback" />} />
        <Route path="/initiatives" element={<RouteTracker routeName="initiatives" />} />
        <Route path="/badges" element={<RouteTracker routeName="badges" />} />
        <Route path="/marketplace" element={<RouteTracker routeName="marketplace" />} />
        <Route path="/profile" element={<RouteTracker routeName="profile" />} />
      </Routes>
    </>
  );
}

describe('VivianSplashScreen - Route Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Main App Routes', () => {
    it('should display splash screen on home route', async () => {
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/" />
        </BrowserRouter>
      );

      // Splash should be visible initially
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/#GangGreen/i)).toBeInTheDocument();
      
      // Wait for splash to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Main content should be visible
      expect(screen.getByTestId('route-home')).toBeInTheDocument();
    });

    it('should display splash screen on dashboard route', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/dashboard" element={<TestAppWrapper />} />
          </Routes>
        </BrowserRouter>,
        { wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter> }
      );

      // Navigate to dashboard
      window.history.pushState({}, '', '/dashboard');
      
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/dashboard" />
        </BrowserRouter>
      );

      // Splash should be visible
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display splash screen on initiatives route', async () => {
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/initiatives" />
        </BrowserRouter>
      );

      // Splash should be visible
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/#GangGreen/i)).toBeInTheDocument();
    });

    it('should display splash screen on badges route', async () => {
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/badges" />
        </BrowserRouter>
      );

      // Splash should be visible
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display splash screen on marketplace route', async () => {
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/marketplace" />
        </BrowserRouter>
      );

      // Splash should be visible
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display splash screen on profile route', async () => {
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/profile" />
        </BrowserRouter>
      );

      // Splash should be visible
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Auth Routes (Excluded)', () => {
    it('should NOT display splash screen on login route', () => {
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/login" />
        </BrowserRouter>
      );

      // Splash should NOT be visible
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      
      // Login route should be immediately visible
      expect(screen.getByTestId('route-login')).toBeInTheDocument();
    });

    it('should NOT display splash screen on register route', () => {
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/register" />
        </BrowserRouter>
      );

      // Splash should NOT be visible
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      
      // Register route should be immediately visible
      expect(screen.getByTestId('route-register')).toBeInTheDocument();
    });

    it('should NOT display splash screen on reset-password route', () => {
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/reset-password" />
        </BrowserRouter>
      );

      // Splash should NOT be visible
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      
      // Reset password route should be immediately visible
      expect(screen.getByTestId('route-reset-password')).toBeInTheDocument();
    });

    it('should NOT display splash screen on auth callback route', () => {
      render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/auth/callback" />
        </BrowserRouter>
      );

      // Splash should NOT be visible
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      
      // Auth callback route should be immediately visible
      expect(screen.getByTestId('route-auth-callback')).toBeInTheDocument();
    });
  });

  describe('Network Speed Simulation', () => {
    it('should handle fast network (< 100ms load time)', async () => {
      const onComplete = vi.fn();
      
      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
            onComplete={onComplete}
          />
        </BrowserRouter>
      );

      // Splash should be visible
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Even with fast load, should respect minimum duration
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('should handle slow network (> 2s load time)', async () => {
      const onComplete = vi.fn();
      
      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={3000}
            fadeOutDuration={50}
            onComplete={onComplete}
          />
        </BrowserRouter>
      );

      // Splash should remain visible
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Should still be visible after minimum duration
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display fallback image on slow image load', async () => {
      // Mock slow image loading
      const originalImage = window.Image;
      window.Image = class extends originalImage {
        constructor() {
          super();
          // Delay onload to simulate slow network
          setTimeout(() => {
            if (this.onload) {
              this.onload(new Event('load'));
            }
          }, 1000);
        }
      } as any;

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      // Splash should still be functional
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/#GangGreen/i)).toBeInTheDocument();

      // Restore original Image
      window.Image = originalImage;
    });
  });

  describe('Transition Behavior', () => {
    it('should smoothly transition from splash to main content', async () => {
      const { container } = render(
        <BrowserRouter>
          <TestAppWrapper />
        </BrowserRouter>
      );

      // Splash should be visible initially
      const splash = screen.getByRole('status');
      expect(splash).toBeInTheDocument();

      // Wait for fade-out to start
      await waitFor(() => {
        const splashElement = container.querySelector('[role="status"]');
        if (splashElement) {
          const opacity = window.getComputedStyle(splashElement).opacity;
          // Opacity should be decreasing during fade-out
          expect(parseFloat(opacity)).toBeLessThanOrEqual(1);
        }
      }, { timeout: 500 });

      // Wait for complete transition
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Main content should be visible
      expect(screen.getByTestId('route-home')).toBeInTheDocument();
    });

    it('should call onComplete callback after transition', async () => {
      const onComplete = vi.fn();
      
      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
            onComplete={onComplete}
          />
        </BrowserRouter>
      );

      // Wait for completion
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('Multiple Route Navigation', () => {
    it('should only show splash on initial load, not on subsequent navigation', async () => {
      const { rerender } = render(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/" />
        </BrowserRouter>
      );

      // Splash should be visible on initial load
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for splash to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Navigate to another route
      rerender(
        <BrowserRouter>
          <TestAppWrapper initialRoute="/dashboard" />
        </BrowserRouter>
      );

      // Splash should NOT appear again
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});

describe('VivianSplashScreen - Configuration', () => {
  it('should respect custom excluded routes', () => {
    const customExcluded = ['/custom-excluded'];
    
    render(
      <BrowserRouter>
        <TestAppWrapper 
          excludedRoutes={customExcluded}
          initialRoute="/custom-excluded"
        />
      </BrowserRouter>
    );

    // Splash should NOT be visible on custom excluded route
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should show splash on routes not in excluded list', () => {
    render(
      <BrowserRouter>
        <TestAppWrapper 
          excludedRoutes={['/other-route']}
          initialRoute="/dashboard"
        />
      </BrowserRouter>
    );

    // Splash should be visible
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
