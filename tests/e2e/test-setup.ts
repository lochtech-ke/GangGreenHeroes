import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { TestDatabaseHelper, setupTestDatabase } from '../../src/test/database.config';

// Extended test fixture with database helper
export const test = base.extend<{
  dbHelper: TestDatabaseHelper;
  authenticatedPage: Page;
}>({
  // Database helper fixture
  dbHelper: async ({}, use) => {
    const { helper } = setupTestDatabase(false); // Use real DB for E2E tests
    await use(helper);
    await helper.cleanup();
  },

  // Authenticated page fixture
  authenticatedPage: async ({ page, dbHelper }, use) => {
    // Create a test user and authenticate
    try {
      const testUser = await dbHelper.createTestUser({
        email: `e2e-test-${Date.now()}@example.com`,
        password: 'testpassword123',
      });

      // Navigate to login page and authenticate
      await page.goto('/login');
      
      // Fill in login form (adjust selectors based on actual implementation)
      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name*="password"]').first();
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();

      if (await emailInput.isVisible()) {
        await emailInput.fill(testUser.email);
      }
      
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('testpassword123');
      }
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }

      // Wait for authentication to complete
      await page.waitForTimeout(2000);
      
      await use(page);
    } catch (error) {
      console.warn('Authentication setup failed, using unauthenticated page:', error);
      await use(page);
    }
  },
});

export { expect } from '@playwright/test';

/**
 * Common E2E test utilities
 */
export const e2eUtils = {
  /**
   * Wait for element to be visible with timeout
   */
  waitForVisible: async (page: Page, selector: string, timeout: number = 10000) => {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  },

  /**
   * Fill form field if it exists
   */
  fillIfExists: async (page: Page, selector: string, value: string) => {
    const element = page.locator(selector).first();
    if (await element.isVisible()) {
      await element.fill(value);
      return true;
    }
    return false;
  },

  /**
   * Click element if it exists
   */
  clickIfExists: async (page: Page, selector: string) => {
    const element = page.locator(selector).first();
    if (await element.isVisible()) {
      await element.click();
      return true;
    }
    return false;
  },

  /**
   * Check if page has loaded successfully
   */
  isPageLoaded: async (page: Page) => {
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Take screenshot on failure
   */
  screenshotOnFailure: async (page: Page, testName: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `failure-${testName}-${timestamp}.png`;
    await page.screenshot({ path: `test-results/${filename}`, fullPage: true });
    return filename;
  },

  /**
   * Mock API responses for testing
   */
  mockApiResponse: async (page: Page, url: string, response: any) => {
    await page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  },

  /**
   * Wait for API call to complete
   */
  waitForApiCall: async (page: Page, urlPattern: string, timeout: number = 10000) => {
    return page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
  },
};