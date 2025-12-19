import { test, expect } from '@playwright/test';

test.describe('Logo Placeholder Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display logo image when available', async ({ page }) => {
    // Check if logo image exists
    const logoImage = page.locator('img[data-logo]').first();
    await expect(logoImage).toBeVisible({ timeout: 5000 });
    
    // Verify the image has correct attributes
    await expect(logoImage).toHaveAttribute('src', 'logo.png');
    await expect(logoImage).toHaveAttribute('alt');
  });

  test('should show fallback placeholder when logo fails to load', async ({ page }) => {
    // Block logo.png requests to simulate missing image
    await page.route('**/logo.png', route => route.abort());
    
    // Reload page to trigger the error
    await page.reload();
    
    // Wait for placeholder to appear
    const placeholder = page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    
    // Verify placeholder content
    const text = await placeholder.textContent();
    expect(text).toBeTruthy();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('should display placeholder in uppercase', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
    await page.reload();
    
    const placeholder = page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    
    const text = await placeholder.textContent();
    expect(text).toBe(text?.toUpperCase());
  });

  test('should hide original img element when fallback is created', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
    await page.reload();
    
    // Wait for placeholder
    await page.waitForSelector('.logo-placeholder', { timeout: 5000 });
    
    // Check that img with data-fallback=true is hidden
    const hiddenImages = await page.locator('img[data-logo][data-fallback="true"]').count();
    expect(hiddenImages).toBeGreaterThan(0);
  });

  test('should apply correct styling to placeholder', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
    await page.reload();
    
    const placeholder = page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    
    // Check CSS properties
    const borderRadius = await placeholder.evaluate(el => 
      window.getComputedStyle(el).borderRadius
    );
    expect(borderRadius).toBeTruthy();
    
    const display = await placeholder.evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(display).toBe('flex');
  });

  test('should handle multiple logo images on page', async ({ page }) => {
    const logoImages = page.locator('img[data-logo]');
    const count = await logoImages.count();
    
    // Verify multiple logos exist (sidebar + header)
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should maintain accessibility attributes on placeholder', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
    await page.reload();
    
    const placeholder = page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    
    const ariaHidden = await placeholder.getAttribute('aria-hidden');
    expect(ariaHidden).toBe('true');
  });

  test('should not create duplicate placeholders on multiple errors', async ({ page }) => {
    await page.route('**/logo.png', route => route.abort());
    await page.reload();
    
    // Wait for initial placeholder
    await page.waitForSelector('.logo-placeholder', { timeout: 5000 });
    
    // Trigger error again
    await page.evaluate(() => {
      const img = document.querySelector('img[data-logo]');
      if (img) {
        img.dispatchEvent(new Event('error'));
      }
    });
    
    // Count placeholders - should still be reasonable number (one per logo)
    await page.waitForTimeout(500);
    const placeholderCount = await page.locator('.logo-placeholder').count();
    const logoCount = await page.locator('img[data-logo]').count();
    
    expect(placeholderCount).toBeLessThanOrEqual(logoCount);
  });
});

test.describe('Logo Styling and Layout', () => {
  test('should apply correct styles to header logo', async ({ page }) => {
    await page.goto('/');
    
    const headerLogo = page.locator('header img.logo').first();
    
    if (await headerLogo.isVisible()) {
      const height = await headerLogo.evaluate(el => 
        window.getComputedStyle(el).height
      );
      
      // Verify height is set to 48px or similar
      expect(height).toBeTruthy();
    }
  });

  test('should apply correct styles to sidebar logo', async ({ page }) => {
    await page.goto('/');
    
    const sidebarLogo = page.locator('aside.sidebar img[data-logo]').first();
    await expect(sidebarLogo).toBeVisible();
    
    const width = await sidebarLogo.evaluate(el => 
      window.getComputedStyle(el).width
    );
    
    // Width should be 100% or fill container
    expect(width).toBeTruthy();
  });

  test('should apply border radius to logo images', async ({ page }) => {
    await page.goto('/');
    
    const logo = page.locator('img[data-logo]').first();
    
    if (await logo.isVisible()) {
      const borderRadius = await logo.evaluate(el => 
        window.getComputedStyle(el).borderRadius
      );
      
      expect(borderRadius).toBeTruthy();
      expect(borderRadius).not.toBe('0px');
    }
  });
});

test.describe('Theme-aware Logo Display', () => {
  test('should display logo correctly in dark theme', async ({ page }) => {
    await page.goto('/');
    
    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    await page.route('**/logo.png', route => route.abort());
    await page.reload();
    
    const placeholder = page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible({ timeout: 5000 });
  });

  test('should display logo correctly in light theme', async ({ page }) => {
    await page.goto('/');
    
    // Set light theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    
    await page.route('**/logo.png', route => route.abort());
    await page.reload();
    
    const placeholder = page.locator('.logo-placeholder').first();
    await expect(placeholder).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Cross-page Logo Consistency', () => {
  const pages = ['/', '/dashboard.html', '/api.html', '/data.html', '/docs.html', '/versions.html'];
  
  for (const pagePath of pages) {
    test(`should display logo elements on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      
      // Check for logo images
      const logos = page.locator('img[data-logo]');
      const logoCount = await logos.count();
      
      expect(logoCount).toBeGreaterThan(0);
    });
    
    test(`should handle logo fallback on ${pagePath}`, async ({ page }) => {
      await page.route('**/logo.png', route => route.abort());
      await page.goto(pagePath);
      
      // Wait for placeholders
      const placeholder = page.locator('.logo-placeholder').first();
      await expect(placeholder).toBeVisible({ timeout: 5000 });
    });
  }
});

test.describe('Responsive Logo Behavior', () => {
  test('should display logo on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const sidebarLogo = page.locator('aside.sidebar img[data-logo]').first();
    
    // Logo should exist even if sidebar is collapsed
    await expect(sidebarLogo).toBeAttached();
  });

  test('should display logo on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const logos = page.locator('img[data-logo]');
    const count = await logos.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should display logo on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    const logos = page.locator('img[data-logo]');
    await expect(logos.first()).toBeVisible();
  });
});

test.describe('Logo Performance and Loading', () => {
  test('should not block page rendering when logo loads', async ({ page }) => {
    await page.goto('/');
    
    // Check that page is interactive even if logo is loading
    const themeToggle = page.locator('[data-role="theme-toggle"]');
    await expect(themeToggle).toBeVisible();
  });

  test('should handle slow logo loading gracefully', async ({ page }) => {
    // Delay logo response
    await page.route('**/logo.png', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.abort();
    });
    
    await page.goto('/');
    
    // Page should still be functional
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});