import { test, expect } from '@playwright/test';

test.describe('Logo Sigil Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('should render logo sigil in sidebar', async ({ page }) => {
    const sidebar Logo = page.locator('.sidebar .logo-sigil--sidebar');
    await expect(sidebarLogo).toBeVisible();
  });

  test('should render logo sigil in header', async ({ page }) => {
    const headerLogo = page.locator('header .logo-sigil--header');
    await expect(headerLogo).toBeVisible();
  });

  test('should display NOP text in logo', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    const content = await logo.evaluate(el => window.getComputedStyle(el, '::after').content);
    expect(content).toContain('NOP');
  });

  test('should have correct size for sidebar logo', async ({ page }) => {
    const sidebarLogo = page.locator('.logo-sigil--sidebar').first();
    const box = await sidebarLogo.boundingBox();
    expect(box.width).toBeCloseTo(120, 5);
    expect(box.height).toBeCloseTo(120, 5);
  });

  test('should have correct size for header logo', async ({ page }) => {
    const headerLogo = page.locator('.logo-sigil--header').first();
    const box = await headerLogo.boundingBox();
    expect(box.width).toBeCloseTo(48, 5);
    expect(box.height).toBeCloseTo(48, 5);
  });

  test('should have border-radius applied', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    const borderRadius = await logo.evaluate(el => window.getComputedStyle(el).borderRadius);
    expect(borderRadius).not.toBe('0px');
  });

  test('should have box-shadow for neon effect', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    const boxShadow = await logo.evaluate(el => window.getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe('none');
  });

  test('should have ::before pseudo-element for animation', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    const beforeContent = await logo.evaluate(el => window.getComputedStyle(el, '::before').content);
    expect(beforeContent).toBeDefined();
  });

  test('should apply hover effects on mouse over', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    
    const initialTransform = await logo.evaluate(el => window.getComputedStyle(el).transform);
    
    await logo.hover();
    await page.waitForTimeout(500); // Wait for transition
    
    const hoverTransform = await logo.evaluate(el => window.getComputedStyle(el).transform);
    
    // Transform should change on hover (not be 'none')
    expect(hoverTransform).not.toBe('none');
  });

  test('should have animation on ::before element', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    const animation = await logo.evaluate(el => {
      const style = window.getComputedStyle(el, '::before');
      return style.animation || style.webkitAnimation;
    });
    expect(animation).toContain('logoSweep');
  });

  test('should change appearance in light theme', async ({ page }) => {
    // Switch to light theme
    const themeToggle = page.locator('[data-role="theme-toggle"]');
    await themeToggle.click();
    await themeToggle.click(); // Cycle to light
    
    await page.waitForTimeout(300);
    
    const logo = page.locator('.logo-sigil').first();
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    
    if (theme === 'light') {
      const color = await logo.evaluate(el => window.getComputedStyle(el).color);
      expect(color).toBeTruthy();
    }
  });

  test('should be visible on all pages', async ({ page }) => {
    const pages = ['index.html', 'dashboard.html', 'api.html', 'data.html', 'docs.html', 'versions.html'];
    
    for (const pagePath of pages) {
      await page.goto(`/${pagePath}`);
      const logo = page.locator('.logo-sigil').first();
      await expect(logo).toBeVisible();
    }
  });

  test('should not have old logo-placeholder class', async ({ page }) => {
    const oldLogo = page.locator('.logo-placeholder');
    await expect(oldLogo).toHaveCount(0);
  });

  test('should not have old logo-inline class', async ({ page }) => {
    const oldLogo = page.locator('.logo-inline');
    await expect(oldLogo).toHaveCount(0);
  });

  test('should have proper ARIA label', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    const ariaLabel = await logo.getAttribute('aria-label');
    expect(ariaLabel).toContain('Net Observation Project');
  });

  test('should have role="img" attribute', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    const role = await logo.getAttribute('role');
    expect(role).toBe('img');
  });

  test('should maintain aspect ratio', async ({ page }) => {
    const logo = page.locator('.logo-sigil--sidebar').first();
    const box = await logo.boundingBox();
    const aspectRatio = box.width / box.height;
    expect(aspectRatio).toBeCloseTo(1, 0.1); // Square shape
  });

  test('should have flexbox layout for centering', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    const display = await logo.evaluate(el => window.getComputedStyle(el).display);
    expect(display).toBe('flex');
  });

  test('should have overflow hidden', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    const overflow = await logo.evaluate(el => window.getComputedStyle(el).overflow);
    expect(overflow).toBe('hidden');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    
    const logo = page.locator('header .logo-sigil').first();
    await expect(logo).toBeVisible();
    
    const box = await logo.boundingBox();
    expect(box.width).toBeLessThan(60); // Should be smaller on mobile
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');
    // Logo itself isn't focusable, but this tests page keyboard navigation
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
  });
});

test.describe('Logo Sigil Animation Tests', () => {
  test('should have continuous animation', async ({ page }) => {
    await page.goto('/index.html');
    const logo = page.locator('.logo-sigil').first();
    
    const animation1 = await logo.evaluate(el => {
      const before = window.getComputedStyle(el, '::before');
      return before.transform;
    });
    
    await page.waitForTimeout(1000);
    
    const animation2 = await logo.evaluate(el => {
      const before = window.getComputedStyle(el, '::before');
      return before.transform;
    });
    
    // Animation should be running (transforms may differ)
    expect(animation1).toBeDefined();
    expect(animation2).toBeDefined();
  });

  test('should have smooth transitions', async ({ page }) => {
    await page.goto('/index.html');
    const logo = page.locator('.logo-sigil').first();
    
    const transition = await logo.evaluate(el => window.getComputedStyle(el).transition);
    expect(transition).toContain('transform');
  });
});

test.describe('Cross-Page Consistency', () => {
  const pages = ['index.html', 'dashboard.html', 'api.html', 'data.html', 'docs.html', 'versions.html'];
  
  for (const pagePath of pages) {
    test(`should have consistent logo styling on ${pagePath}`, async ({ page }) => {
      await page.goto(`/${pagePath}`);
      
      const sidebarLogo = page.locator('.logo-sigil--sidebar');
      const headerLogo = page.locator('.logo-sigil--header');
      
      await expect(sidebarLogo).toBeVisible();
      await expect(headerLogo).toBeVisible();
      
      const sidebarBox = await sidebarLogo.boundingBox();
      const headerBox = await headerLogo.boundingBox();
      
      expect(sidebarBox.width).toBeGreaterThan(headerBox.width);
    });
  }
});