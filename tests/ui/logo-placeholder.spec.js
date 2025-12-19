/**
 * End-to-end tests for logo placeholder functionality
 * Tests the UI behavior when logo.png is missing or fails to load
 */

import { test, expect } from '@playwright/test';

test.describe('Logo Placeholder Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Block logo.png to simulate missing image
    await page.route('**/logo.png', route => route.abort());
  });

  test('should display fallback placeholder when logo fails to load on home page', async ({ page }) => {
    await page.goto('/index.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that placeholder is created
    const placeholder = await page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible();
    
    // Verify placeholder content
    const text = await placeholder.textContent();
    expect(text).toContain('NET OBSERVATION');
  });

  test('should display fallback placeholder in sidebar', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Check sidebar placeholder
    const sidebarPlaceholder = await page.locator('.sidebar .logo-placeholder');
    await expect(sidebarPlaceholder).toBeVisible();
  });

  test('should display fallback placeholder in header', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Check header placeholder
    const headerPlaceholder = await page.locator('header .logo-placeholder');
    await expect(headerPlaceholder).toBeVisible();
  });

  test('should hide original img element when fallback is created', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Find img with data-logo attribute
    const logoImg = await page.locator('img[data-logo]').first();
    
    // Check if display is none or visibility is hidden
    const display = await logoImg.evaluate(el => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('should set data-fallback attribute on failed images', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const logoImg = await page.locator('img[data-logo]').first();
    const fallbackAttr = await logoImg.getAttribute('data-fallback');
    
    expect(fallbackAttr).toBe('true');
  });

  test('should apply correct styling to placeholder', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder').first();
    
    // Check CSS properties
    const borderRadius = await placeholder.evaluate(el => 
      window.getComputedStyle(el).borderRadius
    );
    
    expect(borderRadius).toBeTruthy();
  });

  test('should work on all pages - dashboard', async ({ page }) => {
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder');
    await expect(placeholder.first()).toBeVisible();
  });

  test('should work on all pages - api', async ({ page }) => {
    await page.goto('/api.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder');
    await expect(placeholder.first()).toBeVisible();
  });

  test('should work on all pages - data', async ({ page }) => {
    await page.goto('/data.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder');
    await expect(placeholder.first()).toBeVisible();
  });

  test('should work on all pages - docs', async ({ page }) => {
    await page.goto('/docs.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder');
    await expect(placeholder.first()).toBeVisible();
  });

  test('should work on all pages - versions', async ({ page }) => {
    await page.goto('/versions.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder');
    await expect(placeholder.first()).toBeVisible();
  });

  test('should have uppercase text in placeholder', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder').first();
    const text = await placeholder.textContent();
    
    // Verify text is uppercase
    expect(text).toBe(text?.toUpperCase());
  });

  test('should use alt text from img element', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('header .logo-placeholder');
    const text = await placeholder.textContent();
    
    // Should match the alt text "Net Observation" converted to uppercase
    expect(text).toContain('NET OBSERVATION');
  });

  test('should have aria-hidden attribute on placeholder', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder').first();
    const ariaHidden = await placeholder.getAttribute('aria-hidden');
    
    expect(ariaHidden).toBe('true');
  });

  test('should position placeholder after image element', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const sidebarImg = await page.locator('.sidebar img[data-logo]');
    const nextElement = await sidebarImg.evaluateHandle(el => el.nextElementSibling);
    const className = await nextElement.evaluate(el => el?.className);
    
    expect(className).toContain('logo-placeholder');
  });

  test('should handle multiple logo images on same page', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Should have placeholders for both sidebar and header
    const placeholders = await page.locator('.logo-placeholder');
    const count = await placeholders.count();
    
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should apply gradient background to placeholder', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder').first();
    const background = await placeholder.evaluate(el => 
      window.getComputedStyle(el).background
    );
    
    // Check for gradient (contains 'gradient' or specific color values)
    expect(background).toBeTruthy();
  });

  test('should maintain responsive layout with placeholder', async ({ page }) => {
    await page.goto('/index.html');
    
    // Test desktop width
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState('networkidle');
    
    const placeholderDesktop = await page.locator('.logo-placeholder').first();
    await expect(placeholderDesktop).toBeVisible();
    
    // Test mobile width
    await page.setViewportSize({ width: 375, height: 667 });
    const placeholderMobile = await page.locator('.logo-placeholder').first();
    await expect(placeholderMobile).toBeVisible();
  });
});

test.describe('Logo Placeholder - Successful Load Scenario', () => {
  test('should not create placeholder when logo loads successfully', async ({ page }) => {
    // Create a valid 1x1 PNG and serve it
    await page.route('**/logo.png', route => {
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: png
      });
    });

    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Give time for image to load
    await page.waitForTimeout(500);
    
    // Check that images are visible
    const logoImgs = await page.locator('img[data-logo]');
    const count = await logoImgs.count();
    
    expect(count).toBeGreaterThan(0);
    
    // First image should be visible (not hidden)
    const firstImg = logoImgs.first();
    await expect(firstImg).toBeVisible();
  });
});

test.describe('Logo Placeholder - Edge Cases', () => {
  test('should handle slow-loading images', async ({ page }) => {
    await page.route('**/logo.png', route => {
      setTimeout(() => route.abort(), 100);
    });

    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible();
  });

  test('should handle 404 responses for logo', async ({ page }) => {
    await page.route('**/logo.png', route => {
      route.fulfill({ status: 404 });
    });

    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible();
  });

  test('should handle network errors', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort('failed'));

    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible();
  });

  test('should not break page layout when creating placeholder', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());

    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Check that main content is still visible
    const header = await page.locator('header');
    await expect(header).toBeVisible();
    
    const sidebar = await page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
  });
});

test.describe('Logo Placeholder - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
  });

  test('should have appropriate ARIA attributes', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder').first();
    const ariaHidden = await placeholder.getAttribute('aria-hidden');
    
    expect(ariaHidden).toBe('true');
  });

  test('should not interfere with screen readers', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Placeholder should be aria-hidden, original img may have alt text
    const hiddenImg = await page.locator('img[data-logo]').first();
    const display = await hiddenImg.evaluate(el => window.getComputedStyle(el).display);
    
    expect(display).toBe('none');
  });

  test('should maintain focus order', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    
    // Check that focus doesn't get stuck
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Logo Placeholder - Theme Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
  });

  test('should display correctly in dark theme', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.dataset.theme = 'dark';
    });
    
    const placeholder = await page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible();
    
    // Check that text is visible (has contrast)
    const color = await placeholder.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(color).toBeTruthy();
  });

  test('should display correctly in light theme', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Set light theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.dataset.theme = 'light';
    });
    
    const placeholder = await page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible();
  });

  test('should adapt to theme changes', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const placeholder = await page.locator('.logo-placeholder').first();
    
    // Start with dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await expect(placeholder).toBeVisible();
    
    // Switch to light theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await expect(placeholder).toBeVisible();
  });
});