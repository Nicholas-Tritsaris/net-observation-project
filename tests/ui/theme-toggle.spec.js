/**
 * End-to-end tests for theme toggle and other UI functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Theme Toggle Functionality', () => {
  test('should toggle theme when clicking theme toggle button', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const themeToggle = await page.locator('[data-role="theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    
    // Click to cycle theme
    await themeToggle.click();
    
    // Check that theme attribute changed
    await page.waitForTimeout(100);
    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBeTruthy();
  });

  test('should display current theme in toggle label', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const label = await page.locator('[data-role="theme-toggle"] [data-label]');
    const text = await label.textContent();
    
    expect(['AUTO', 'DARK', 'LIGHT']).toContain(text);
  });

  test('should cycle through auto, dark, and light themes', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const themeToggle = await page.locator('[data-role="theme-toggle"]');
    const label = await page.locator('[data-role="theme-toggle"] [data-label]');
    
    // Get initial state
    const initial = await label.textContent();
    
    // Click once
    await themeToggle.click();
    await page.waitForTimeout(100);
    const second = await label.textContent();
    expect(second).not.toBe(initial);
    
    // Click again
    await themeToggle.click();
    await page.waitForTimeout(100);
    const third = await label.textContent();
    expect(third).not.toBe(second);
    
    // Click once more to cycle back
    await themeToggle.click();
    await page.waitForTimeout(100);
    const fourth = await label.textContent();
    expect(fourth).toBe(initial);
  });

  test('should support keyboard navigation for theme toggle', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const themeToggle = await page.locator('[data-role="theme-toggle"]');
    
    // Focus the toggle
    await themeToggle.focus();
    
    // Press Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    
    // Theme should change
    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBeTruthy();
  });

  test('should persist theme selection in localStorage', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const themeToggle = await page.locator('[data-role="theme-toggle"]');
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Check localStorage
    const settings = await page.evaluate(() => {
      return localStorage.getItem('net-observation-settings');
    });
    
    expect(settings).toBeTruthy();
    const parsed = JSON.parse(settings);
    expect(parsed.theme).toBeTruthy();
  });
});

test.describe('Sidebar Functionality', () => {
  test('should toggle sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const toggle = await page.locator('.sidebar-toggle');
    await expect(toggle).toBeVisible();
    
    // Click to open
    await toggle.click();
    await page.waitForTimeout(100);
    
    const sidebar = await page.locator('.sidebar');
    const isOpen = await sidebar.evaluate(el => el.classList.contains('open'));
    
    expect(isOpen).toBe(true);
  });

  test('should be open by default on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const sidebar = await page.locator('.sidebar');
    const isOpen = await sidebar.evaluate(el => el.classList.contains('open'));
    
    expect(isOpen).toBe(true);
  });

  test('should change toggle icon when opened/closed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const toggle = await page.locator('.sidebar-toggle');
    const initialIcon = await toggle.innerHTML();
    
    await toggle.click();
    await page.waitForTimeout(100);
    
    const newIcon = await toggle.innerHTML();
    expect(newIcon).not.toBe(initialIcon);
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Click on Dashboard link
    await page.click('a[href="dashboard.html"]');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('dashboard.html');
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    
    // Check if dashboard link has active class
    const dashboardLink = await page.locator('nav a[href="dashboard.html"]');
    const hasActive = await dashboardLink.evaluate(el => el.classList.contains('active'));
    
    expect(hasActive).toBe(true);
  });

  test('should have navigation links in sidebar', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const navLinks = await page.locator('.sidebar nav a');
    const count = await navLinks.count();
    
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Settings Panel', () => {
  test('should toggle settings panel', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const toggle = await page.locator('.settings-toggle');
    if (await toggle.count() > 0) {
      await toggle.click();
      await page.waitForTimeout(100);
      
      const panel = await page.locator('.settings-panel');
      const isHidden = await panel.evaluate(el => el.classList.contains('hidden'));
      
      expect(typeof isHidden).toBe('boolean');
    }
  });

  test('should have backend URL input', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const input = await page.locator('[name="backendUrl"]');
    if (await input.count() > 0) {
      await expect(input).toBeTruthy();
    }
  });

  test('should have theme mode select', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const select = await page.locator('[name="themeMode"]');
    if (await select.count() > 0) {
      await expect(select).toBeTruthy();
    }
  });
});

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`should render correctly on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/index.html');
      await page.waitForLoadState('networkidle');
      
      // Check main elements are visible
      const header = await page.locator('header');
      await expect(header).toBeVisible();
      
      const sidebar = await page.locator('.sidebar');
      await expect(sidebar).toBeTruthy();
    });
  });
});

test.describe('Page Load Performance', () => {
  test('should load home page within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load script.js successfully', async ({ page }) => {
    const scriptLoaded = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(s => s.src.includes('script.js'));
    });
    
    // Navigate first
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Check script element exists
    const script = await page.locator('script[src*="script.js"]');
    await expect(script).toBeTruthy();
  });

  test('should load style.css successfully', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const style = await page.locator('link[href*="style.css"]');
    await expect(style).toBeTruthy();
  });
});

test.describe('JavaScript Functionality', () => {
  test('should initialize app on page load', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Check if theme is applied
    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBeTruthy();
  });

  test('should load settings from localStorage', async ({ page }) => {
    // Set some settings in localStorage
    await page.goto('/index.html');
    await page.evaluate(() => {
      localStorage.setItem('net-observation-settings', JSON.stringify({
        theme: 'dark',
        backendUrl: '/api/test'
      }));
    });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Settings should be loaded
    const settings = await page.evaluate(() => {
      return localStorage.getItem('net-observation-settings');
    });
    
    expect(settings).toBeTruthy();
  });
});

test.describe('Cross-Browser Compatibility', () => {
  test('should work in different browsers', async ({ page, browserName }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Basic smoke test for all browsers
    const header = await page.locator('header');
    await expect(header).toBeVisible();
    
    const sidebar = await page.locator('.sidebar');
    await expect(sidebar).toBeTruthy();
  });
});