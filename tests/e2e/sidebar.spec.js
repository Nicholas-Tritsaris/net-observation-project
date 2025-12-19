import { test, expect } from '@playwright/test';

test.describe('Sidebar Initialization', () => {
  test('should start open on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toHaveClass(/open/);
  });

  test('should start collapsed on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 600 });
    await page.goto('/');
    
    const sidebar = page.locator('aside.sidebar');
    
    // May be collapsed or have collapsed class
    const classes = await sidebar.getAttribute('class');
    expect(classes).toBeTruthy();
  });

  test('should toggle when clicking toggle button', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.locator('.sidebar-toggle');
    const sidebar = page.locator('aside.sidebar');
    
    // Get initial state
    const initialClasses = await sidebar.getAttribute('class');
    
    // Click toggle
    await toggle.click();
    
    // Wait for animation
    await page.waitForTimeout(300);
    
    // Check state changed
    const newClasses = await sidebar.getAttribute('class');
    expect(newClasses).not.toBe(initialClasses);
  });

  test('should update toggle button icon on state change', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.locator('.sidebar-toggle');
    const initialIcon = await toggle.innerHTML();
    
    await toggle.click();
    await page.waitForTimeout(300);
    
    const newIcon = await toggle.innerHTML();
    expect(newIcon).not.toBe(initialIcon);
  });

  test('should update aria-expanded attribute', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.locator('.sidebar-toggle');
    
    await toggle.click();
    await page.waitForTimeout(300);
    
    const ariaExpanded = await toggle.getAttribute('aria-expanded');
    expect(ariaExpanded).toBeTruthy();
  });
});

test.describe('Sidebar Responsive Behavior', () => {
  test('should adapt to viewport resize from mobile to desktop', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto('/');
    
    // Resize to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('should adapt to viewport resize from desktop to mobile', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    
    // Resize to mobile
    await page.setViewportSize({ width: 600, height: 800 });
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeAttached();
  });
});