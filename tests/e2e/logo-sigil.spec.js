/**
 * End-to-end tests for logo-sigil visual rendering
 * Tests the CSS-generated neon sigil across different pages and themes
 */

const { test, expect } = require('@playwright/test');

test.describe('Logo Sigil Visual Rendering', () => {
  test('should render sidebar logo sigil on homepage', async ({ page }) => {
    await page.goto('/');
    
    const sidebarLogo = page.locator('.sidebar .logo-sigil--sidebar');
    await expect(sidebarLogo).toBeVisible();
  });

  test('should render header logo sigil on homepage', async ({ page }) => {
    await page.goto('/');
    
    const headerLogo = page.locator('header .logo-sigil--header');
    await expect(headerLogo).toBeVisible();
  });

  test('should have correct ARIA attributes', async ({ page }) => {
    await page.goto('/');
    
    const logo = page.locator('.logo-sigil').first();
    await expect(logo).toHaveAttribute('role', 'img');
    await expect(logo).toHaveAttribute('aria-label', /Net Observation Project/i);
  });

  test('should display NOP text via ::after pseudo-element', async ({ page }) => {
    await page.goto('/');
    
    const logo = page.locator('.logo-sigil').first();
    const afterContent = await logo.evaluate(el => 
      window.getComputedStyle(el, '::after').content
    );
    
    expect(afterContent).toContain('NOP');
  });

  test('should have logoSweep animation on ::before', async ({ page }) => {
    await page.goto('/');
    
    const logo = page.locator('.logo-sigil').first();
    const animation = await logo.evaluate(el => 
      window.getComputedStyle(el, '::before').animationName
    );
    
    expect(animation).toBe('logoSweep');
  });

  test('should render on all pages', async ({ page }) => {
    const pages = ['/', '/dashboard.html', '/api.html', '/data.html', '/docs.html', '/versions.html'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      const logo = page.locator('.logo-sigil').first();
      await expect(logo).toBeVisible();
    }
  });

  test('should not have old logo-placeholder class', async ({ page }) => {
    await page.goto('/');
    
    const oldLogo = page.locator('.logo-placeholder');
    await expect(oldLogo).toHaveCount(0);
  });

  test('should not have old logo-inline class', async ({ page }) => {
    await page.goto('/');
    
    const oldLogo = page.locator('.logo-inline');
    await expect(oldLogo).toHaveCount(0);
  });

  test('should be visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const logo = page.locator('.logo-sigil').first();
    await expect(logo).toBeVisible();
  });

  test('should maintain square aspect ratio', async ({ page }) => {
    await page.goto('/');
    
    const logo = page.locator('.logo-sigil--sidebar');
    const box = await logo.boundingBox();
    
    if (box) {
      const aspectRatio = box.width / box.height;
      expect(Math.abs(aspectRatio - 1)).toBeLessThan(0.1);
    }
  });
});

test.describe('Theme Integration', () => {
  test('should adapt to theme changes', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.locator('[data-role="theme-toggle"]');
    const logo = page.locator('.logo-sigil').first();
    
    // Click theme toggle
    await toggle.click();
    await expect(logo).toBeVisible();
    
    // Verify box shadow exists
    const boxShadow = await logo.evaluate(el => 
      window.getComputedStyle(el).boxShadow
    );
    expect(boxShadow).not.toBe('none');
  });
});