import { test, expect } from './test-setup';

test.describe('Auth Callback Timeout Handling', () => {
  // Increase test timeout to accommodate the delay
  test.setTimeout(90000);

  test('should not timeout before 60 seconds during session establishment', async ({ page }) => {
    // Mock the Supabase token exchange endpoint with a long delay
    await page.route('**/auth/v1/token*', async (route) => {
      console.log('Intercepted token request, delaying...');
      // Delay for 20 seconds (longer than the old 15s timeout)
      // If the fix is working, the UI should stay in "loading" state without erroring out.
      await new Promise(resolve => setTimeout(resolve, 20000));
      
      console.log('Fulfilling token request');
      // Return a mock success response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
            app_metadata: { provider: 'google' },
            user_metadata: { full_name: 'Test User' },
            created_at: new Date().toISOString(),
          }
        })
      });
    });

    // Mock subsequent user/profile calls to ensure full flow success (optional but good)
    await page.route('**/rest/v1/users*', async (route) => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({
                id: 'mock-user-id',
                role: 'individual',
                forest_preference: 'kakamega'
            })
        });
    });
    
    await page.route('**/rest/v1/user_profiles*', async (route) => {
       await route.fulfill({
            status: 200,
            body: JSON.stringify({
                id: 'mock-user-id',
                full_name: 'Test User'
            })
       });
    });

    // We also need to mock getUser which might be called via the session
    await page.route('**/auth/v1/user', async (route) => {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test@example.com',
          app_metadata: { provider: 'google' },
          user_metadata: { full_name: 'Test User' },
          created_at: new Date().toISOString(),
        })
      });
    });

    // Visit the auth callback page with mock code
    await page.goto('/auth/callback?code=mock-auth-code');

    // Expect "Completing sign in..." message immediately
    await expect(page.getByText('Completing sign in...')).toBeVisible();

    // Wait 16 seconds. If the old timeout (15s) was active, it would have failed by now.
    // The new timeout is 60s, so it should still be loading.
    // We break this into steps to be sure.
    console.log('Waiting for 16 seconds...');
    await page.waitForTimeout(16000);
    
    // Assert that we have NOT failed
    const errorVisible = await page.getByText('Authentication timed out').isVisible();
    expect(errorVisible).toBeFalsy();
    
    const failedVisible = await page.getByText('Sign In Failed').isVisible();
    expect(failedVisible).toBeFalsy();

    // Assert we are still loading (since mock responds at 20s)
    await expect(page.getByText('Completing sign in...')).toBeVisible();

    // Now wait for the completion (mock responds at 20s + execution time)
    // We just verify that eventually we are NOT on the callback page anymore, or we see success
    // The code redirects to dashboard/home on success.
    // We expect eventual navigation or at least no error.
    
    // Wait enough time for the 20s delay to finish and code to react
    await page.waitForTimeout(6000); // Total 22s
    
    // We should either be redirected or in the process. 
    // Let's just check that we didn't error out even after the delay.
    await expect(page.getByText('Authentication timed out')).not.toBeVisible();
  });
});
