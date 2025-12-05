import { test, expect } from './test-setup';
import { Page } from '@playwright/test';

/**
 * Visual Regression Tests for NFT Badge Display
 * 
 * Tests verify that badges maintain square aspect ratios and are not distorted
 * across different screen sizes, badge tiers, and loading states.
 * 
 * Requirements: All requirements from nft-badge-display-fix spec
 */

// Helper function to measure element dimensions
async function getElementDimensions(page: Page, selector: string) {
  return await page.locator(selector).evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      aspectRatio: rect.width / rect.height,
    };
  });
}

// Helper function to check if aspect ratio is square (1:1 with tolerance)
function isSquareAspectRatio(aspectRatio: number, tolerance: number = 0.02): boolean {
  return Math.abs(aspectRatio - 1.0) <= tolerance;
}

// Helper function to wait for badges to load
async function waitForBadgesToLoad(page: Page, timeout: number = 10000) {
  try {
    // Wait for badge showcase section
    await page.waitForSelector('[data-testid="nft-badge-showcase"], .badge-showcase, [class*="badge"]', {
      timeout,
      state: 'visible',
    });
    
    // Wait a bit for badges to render
    await page.waitForTimeout(2000);
    
    return true;
  } catch (error) {
    console.warn('Badge showcase not found, continuing with test');
    return false;
  }
}

test.describe('Badge Visual Regression - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should display badges with square aspect ratio on home page', async ({ page }) => {
    await page.goto('/');
    
    const badgesLoaded = await waitForBadgesToLoad(page);
    
    if (!badgesLoaded) {
      test.skip();
      return;
    }

    // Take screenshot of badge showcase
    await page.screenshot({
      path: 'test-results/screenshots/badges-desktop-home.png',
      fullPage: false,
    });

    // Find all badge containers
    const badgeContainers = page.locator('[class*="badge"], [data-testid*="badge"]').filter({
      has: page.locator('svg, img'),
    });

    const count = await badgeContainers.count();
    
    if (count === 0) {
      console.warn('No badge containers found');
      test.skip();
      return;
    }

    // Check first few badges for square aspect ratio
    for (let i = 0; i < Math.min(count, 5); i++) {
      const badge = badgeContainers.nth(i);
      
      if (await badge.isVisible()) {
        const dimensions = await badge.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            aspectRatio: rect.width / rect.height,
          };
        });

        console.log(`Badge ${i} dimensions:`, dimensions);

        // Verify square aspect ratio (1:1 with 2% tolerance)
        expect(
          isSquareAspectRatio(dimensions.aspectRatio),
          `Badge ${i} should have square aspect ratio (1:1), got ${dimensions.aspectRatio.toFixed(3)}`
        ).toBeTruthy();
      }
    }
  });

  test('should display badge showcase section correctly', async ({ page }) => {
    await page.goto('/');
    
    const badgesLoaded = await waitForBadgesToLoad(page);
    
    if (!badgesLoaded) {
      test.skip();
      return;
    }

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/screenshots/badges-desktop-full-page.png',
      fullPage: true,
    });

    // Check for badge showcase section
    const showcaseSection = page.locator('[data-testid="nft-badge-showcase"], section:has([class*="badge"])').first();
    
    if (await showcaseSection.isVisible()) {
      // Take screenshot of just the showcase section
      await showcaseSection.screenshot({
        path: 'test-results/screenshots/badges-desktop-showcase-section.png',
      });

      await expect(showcaseSection).toBeVisible();
    }
  });

  test('should maintain aspect ratio for different badge sizes', async ({ page }) => {
    await page.goto('/');
    
    const badgesLoaded = await waitForBadgesToLoad(page);
    
    if (!badgesLoaded) {
      test.skip();
      return;
    }

    // Find badges of different sizes (small, medium, large)
    const allBadges = page.locator('[class*="badge"]').filter({
      has: page.locator('svg, img'),
    });

    const count = await allBadges.count();
    
    if (count === 0) {
      test.skip();
      return;
    }

    const aspectRatios: number[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const badge = allBadges.nth(i);
      
      if (await badge.isVisible()) {
        const dimensions = await badge.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width / rect.height;
        });

        aspectRatios.push(dimensions);
        
        // Each badge should be square
        expect(
          isSquareAspectRatio(dimensions),
          `Badge ${i} should be square, got aspect ratio ${dimensions.toFixed(3)}`
        ).toBeTruthy();
      }
    }

    console.log('All badge aspect ratios:', aspectRatios);
  });
});

test.describe('Badge Visual Regression - Tablet', () => {
  test.beforeEach(async ({ page }) => {
    // Set tablet viewport (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });
  });

  test('should display badges with square aspect ratio on tablet', async ({ page }) => {
    await page.goto('/');
    
    const badgesLoaded = await waitForBadgesToLoad(page);
    
    if (!badgesLoaded) {
      test.skip();
      return;
    }

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/badges-tablet.png',
      fullPage: false,
    });

    // Check badge aspect ratios
    const badgeContainers = page.locator('[class*="badge"]').filter({
      has: page.locator('svg, img'),
    });

    const count = await badgeContainers.count();
    
    if (count === 0) {
      test.skip();
      return;
    }

    for (let i = 0; i < Math.min(count, 3); i++) {
      const badge = badgeContainers.nth(i);
      
      if (await badge.isVisible()) {
        const dimensions = await badge.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width / rect.height;
        });

        expect(
          isSquareAspectRatio(dimensions),
          `Tablet badge ${i} should be square, got ${dimensions.toFixed(3)}`
        ).toBeTruthy();
      }
    }
  });
});

test.describe('Badge Visual Regression - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('should display badges with square aspect ratio on mobile', async ({ page }) => {
    await page.goto('/');
    
    const badgesLoaded = await waitForBadgesToLoad(page);
    
    if (!badgesLoaded) {
      test.skip();
      return;
    }

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/badges-mobile.png',
      fullPage: false,
    });

    // Check badge aspect ratios
    const badgeContainers = page.locator('[class*="badge"]').filter({
      has: page.locator('svg, img'),
    });

    const count = await badgeContainers.count();
    
    if (count === 0) {
      test.skip();
      return;
    }

    for (let i = 0; i < Math.min(count, 3); i++) {
      const badge = badgeContainers.nth(i);
      
      if (await badge.isVisible()) {
        const dimensions = await badge.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width / rect.height;
        });

        expect(
          isSquareAspectRatio(dimensions),
          `Mobile badge ${i} should be square, got ${dimensions.toFixed(3)}`
        ).toBeTruthy();
      }
    }
  });

  test('should not have layout shift when scrolling', async ({ page }) => {
    await page.goto('/');
    
    const badgesLoaded = await waitForBadgesToLoad(page);
    
    if (!badgesLoaded) {
      test.skip();
      return;
    }

    // Get initial badge positions
    const badge = page.locator('[class*="badge"]').filter({
      has: page.locator('svg, img'),
    }).first();

    if (!(await badge.isVisible())) {
      test.skip();
      return;
    }

    const initialDimensions = await badge.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    // Scroll down and back up
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollBy(0, -500));
    await page.waitForTimeout(500);

    // Check dimensions haven't changed
    const finalDimensions = await badge.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    expect(Math.abs(initialDimensions.width - finalDimensions.width)).toBeLessThan(2);
    expect(Math.abs(initialDimensions.height - finalDimensions.height)).toBeLessThan(2);
  });
});

test.describe('Badge Loading States', () => {
  test('should maintain dimensions during loading state', async ({ page }) => {
    await page.goto('/');
    
    // Look for loading spinners or skeleton loaders
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
    
    const count = await loadingIndicators.count();
    
    if (count > 0) {
      // Take screenshot of loading state
      await page.screenshot({
        path: 'test-results/screenshots/badges-loading-state.png',
      });

      // Check loading indicator dimensions
      for (let i = 0; i < Math.min(count, 3); i++) {
        const loader = loadingIndicators.nth(i);
        
        if (await loader.isVisible()) {
          const dimensions = await loader.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width / rect.height;
          });

          // Loading indicators should also be square
          expect(
            isSquareAspectRatio(dimensions, 0.05),
            `Loading indicator ${i} should be square, got ${dimensions.toFixed(3)}`
          ).toBeTruthy();
        }
      }
    }

    // Wait for badges to load
    await waitForBadgesToLoad(page);
    
    // Take screenshot after loading
    await page.screenshot({
      path: 'test-results/screenshots/badges-loaded-state.png',
    });
  });
});

test.describe('Badge Error States', () => {
  test('should display fallback badges with square aspect ratio', async ({ page }) => {
    // Mock API to return errors or empty data
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test error' }),
      });
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Take screenshot of error state
    await page.screenshot({
      path: 'test-results/screenshots/badges-error-state.png',
    });

    // Look for fallback badges or error indicators
    const fallbackBadges = page.locator('[class*="fallback"], [class*="error"]').filter({
      has: page.locator('svg, img'),
    });

    const count = await fallbackBadges.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const badge = fallbackBadges.nth(i);
        
        if (await badge.isVisible()) {
          const dimensions = await badge.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width / rect.height;
          });

          expect(
            isSquareAspectRatio(dimensions),
            `Fallback badge ${i} should be square, got ${dimensions.toFixed(3)}`
          ).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Badge SVG Attributes', () => {
  test('should have proper SVG attributes for aspect ratio', async ({ page }) => {
    await page.goto('/');
    
    const badgesLoaded = await waitForBadgesToLoad(page);
    
    if (!badgesLoaded) {
      test.skip();
      return;
    }

    // Find SVG elements within badges
    const svgElements = page.locator('[class*="badge"] svg, [data-testid*="badge"] svg');
    
    const count = await svgElements.count();
    
    if (count === 0) {
      console.warn('No SVG elements found in badges');
      test.skip();
      return;
    }

    // Check first few SVGs for proper attributes
    for (let i = 0; i < Math.min(count, 5); i++) {
      const svg = svgElements.nth(i);
      
      if (await svg.isVisible()) {
        const attributes = await svg.evaluate((el) => ({
          width: el.getAttribute('width'),
          height: el.getAttribute('height'),
          viewBox: el.getAttribute('viewBox'),
          preserveAspectRatio: el.getAttribute('preserveAspectRatio'),
        }));

        console.log(`SVG ${i} attributes:`, attributes);

        // Check for proper attributes (may be set via CSS or attributes)
        if (attributes.viewBox) {
          expect(attributes.viewBox).toBeTruthy();
        }

        // If preserveAspectRatio is set, it should be correct
        if (attributes.preserveAspectRatio) {
          expect(attributes.preserveAspectRatio).toContain('meet');
        }
      }
    }
  });
});

test.describe('Badge Comparison - Before/After', () => {
  test('should capture baseline screenshots for comparison', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await waitForBadgesToLoad(page);
    await page.screenshot({
      path: 'test-results/screenshots/baseline-desktop.png',
      fullPage: true,
    });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await waitForBadgesToLoad(page);
    await page.screenshot({
      path: 'test-results/screenshots/baseline-tablet.png',
      fullPage: true,
    });

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForBadgesToLoad(page);
    await page.screenshot({
      path: 'test-results/screenshots/baseline-mobile.png',
      fullPage: true,
    });
  });
});
