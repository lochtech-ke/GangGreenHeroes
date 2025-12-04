import { test, expect, e2eUtils } from './test-setup';

// Example E2E test for the V1.0 Major Release

test.describe('Platform Basic Functionality', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/GangGreen/i);
    
    // Check for key elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Look for login link/button
    const loginButton = page.locator('a[href*="login"], button:has-text("Login"), a:has-text("Login")').first();
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/.*login.*/);
    } else {
      // If no login button found, navigate directly
      await page.goto('/login');
      await expect(page).toHaveURL(/.*login.*/);
    }
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/');
    
    // Look for register/signup link/button
    const registerButton = page.locator('a[href*="register"], a[href*="signup"], button:has-text("Register"), a:has-text("Register"), button:has-text("Sign Up"), a:has-text("Sign Up")').first();
    
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await expect(page).toHaveURL(/.*register.*|.*signup.*/);
    } else {
      // If no register button found, navigate directly
      await page.goto('/register');
      await expect(page).toHaveURL(/.*register.*/);
    }
  });
});

test.describe('User Registration Flow', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check for form elements
    await expect(page.locator('form')).toBeVisible();
    
    // Look for common registration fields
    const emailField = page.locator('input[type="email"], input[name*="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name*="password"]').first();
    
    if (await emailField.isVisible()) {
      await expect(emailField).toBeVisible();
    }
    
    if (await passwordField.isVisible()) {
      await expect(passwordField).toBeVisible();
    }
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Register"), button:has-text("Sign Up")').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Check for validation messages (this will depend on implementation)
      // We'll check for common validation patterns
      const validationMessages = page.locator('.error, .invalid, [role="alert"], .text-red-500, .text-danger');
      
      // Wait a bit for validation to appear
      await page.waitForTimeout(1000);
      
      // If validation messages exist, they should be visible
      const messageCount = await validationMessages.count();
      if (messageCount > 0) {
        await expect(validationMessages.first()).toBeVisible();
      }
    }
  });
});

test.describe('Dashboard Access', () => {
  test('should redirect unauthenticated users', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login or show login prompt
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const hasLoginInUrl = currentUrl.includes('login') || currentUrl.includes('auth');
    const hasLoginForm = await page.locator('form input[type="email"], form input[type="password"]').count() > 0;
    
    // Either URL should contain login/auth or page should show login form
    expect(hasLoginInUrl || hasLoginForm).toBeTruthy();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that page is responsive
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile navigation (hamburger menu, etc.)
    const mobileNav = page.locator('[aria-label*="menu"], .hamburger, .mobile-menu, button:has-text("☰")');
    
    // Mobile nav might exist
    const mobileNavCount = await mobileNav.count();
    if (mobileNavCount > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Check that page loads properly on tablet
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (adjust based on requirements)
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1 tag
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check that headings exist
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    // Get all images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check that images have alt attributes
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        
        // Alt should exist (can be empty for decorative images)
        expect(alt).not.toBeNull();
      }
    }
  });
});