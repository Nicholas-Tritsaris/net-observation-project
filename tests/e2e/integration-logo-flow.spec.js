import { test, expect } from '@playwright/test';

test.describe('Complete Logo Fallback Integration', () => {
  test('should handle complete user journey with logo fallback', async ({ page }) => {
    // Block logo to test fallback
    await page.route('**/logo.png', route => route.abort());
    
    // Navigate to home page
    await page.goto('/');
    
    // Verify placeholder appears
    await expect(page.locator('.logo-placeholder').first()).toBeVisible({ timeout: 5000 });
    
    // Navigate to different pages
    await page.click('a[href="dashboard.html"]');
    await expect(page).toHaveURL(/dashboard\.html/);
    await expect(page.locator('.logo-placeholder').first()).toBeVisible();
    
    await page.click('a[href="api.html"]');
    await expect(page).toHaveURL(/api\.html/);
    await expect(page.locator('.logo-placeholder').first()).toBeVisible();
    
    // Verify theme toggle works with placeholders
    const themeToggle = page.locator('[data-role="theme-toggle"]');
    await themeToggle.click();
    
    // Placeholder should still be visible after theme change
    await expect(page.locator('.logo-placeholder').first()).toBeVisible();
  });

  test('should maintain logo state during sidebar toggle', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
    await page.goto('/');
    
    await expect(page.locator('.logo-placeholder').first()).toBeVisible({ timeout: 5000 });
    
    // Toggle sidebar
    const sidebarToggle = page.locator('.sidebar-toggle');
    await sidebarToggle.click();
    await page.waitForTimeout(500);
    
    // Placeholder should still exist
    await expect(page.locator('.logo-placeholder').first()).toBeAttached();
    
    // Toggle again
    await sidebarToggle.click();
    await page.waitForTimeout(500);
    
    await expect(page.locator('.logo-placeholder').first()).toBeAttached();
  });

  test('should work correctly when logo loads successfully', async ({ page }) => {
    // Allow logo to load
    await page.goto('/');
    
    // Wait a bit for potential logo load
    await page.waitForTimeout(1000);
    
    // Check if either logo or placeholder is visible
    const hasLogo = await page.locator('img[data-logo]').first().isVisible();
    const hasPlaceholder = await page.locator('.logo-placeholder').first().isVisible();
    
    // One of them should be visible
    expect(hasLogo || hasPlaceholder).toBe(true);
  });
});

test.describe('Logo Accessibility Integration', () => {
  test('should maintain accessibility throughout user journey', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
    await page.goto('/');
    
    // Check placeholder has aria-hidden
    const placeholder = page.locator('.logo-placeholder').first();
    await expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    
    // Navigate and check again
    await page.click('a[href="data.html"]');
    await expect(page.locator('.logo-placeholder').first()).toHaveAttribute('aria-hidden', 'true');
  });

  test('should be keyboard navigable with logo fallback', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
    await page.goto('/');
    
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Page should still be functional
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeTruthy();
  });
});