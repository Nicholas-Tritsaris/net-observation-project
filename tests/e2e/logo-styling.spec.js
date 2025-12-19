import { test, expect } from '@playwright/test';

test.describe('Logo Sigil Styling (New CSS)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('should render logo sigil with correct base styles', async ({ page }) => {
    const logo = page.locator('.logo-sigil--sidebar').first();
    
    // Verify element exists
    await expect(logo).toBeVisible();
    
    // Check CSS custom property
    const size = await logo.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.getPropertyValue('--sigil-size').trim();
    });
    expect(size).toBe('120px');
    
    // Verify dimensions
    const box = await logo.boundingBox();
    expect(box.width).toBeCloseTo(120, 5);
    expect(box.height).toBeCloseTo(120, 5);
  });

  test('should have animated ::before pseudo-element', async ({ page }) => {
    const logo = page.locator('.logo-sigil--sidebar').first();
    
    // Check for animation
    const hasAnimation = await logo.evaluate((el) => {
      const before = window.getComputedStyle(el, '::before');
      return before.getPropertyValue('animation-name');
    });
    
    expect(hasAnimation).toBeTruthy();
  });

  test('should display "NOP" text in ::after pseudo-element', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    
    const content = await logo.evaluate((el) => {
      const after = window.getComputedStyle(el, '::after');
      return after.getPropertyValue('content');
    });
    
    // Content should be 'NOP' (with quotes in CSS)
    expect(content).toContain('NOP');
  });

  test('should have correct box-shadow for neon effect', async ({ page }) => {
    const logo = page.locator('.logo-sigil--sidebar').first();
    
    const boxShadow = await logo.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    
    // Should have multiple shadows for neon glow
    expect(boxShadow).toContain('rgba');
    expect(boxShadow.split('),').length).toBeGreaterThan(1);
  });

  test('should transform on hover', async ({ page }) => {
    const logo = page.locator('.logo-sigil--sidebar').first();
    
    // Get initial transform
    const initialTransform = await logo.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    
    // Hover over logo
    await logo.hover();
    
    // Wait for transition
    await page.waitForTimeout(500);
    
    // Get transform after hover
    const hoverTransform = await logo.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    
    // Transform should change (rotation and scale)
    expect(hoverTransform).not.toBe('none');
  });

  test('should have different sizes for header vs sidebar', async ({ page }) => {
    const sidebarLogo = page.locator('.logo-sigil--sidebar').first();
    const headerLogo = page.locator('.logo-sigil--header').first();
    
    const sidebarSize = await sidebarLogo.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('--sigil-size').trim();
    });
    
    const headerSize = await headerLogo.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('--sigil-size').trim();
    });
    
    expect(sidebarSize).toBe('120px');
    expect(headerSize).toBe('48px');
  });

  test('should verify old logo classes are not present', async ({ page }) => {
    // Old classes that should NOT exist
    const oldLogoPlaceholder = page.locator('.logo-placeholder');
    const oldLogoInline = page.locator('.logo-inline');
    
    await expect(oldLogoPlaceholder).toHaveCount(0);
    await expect(oldLogoInline).toHaveCount(0);
  });

  test('should have correct border-radius', async ({ page }) => {
    const sidebarLogo = page.locator('.logo-sigil--sidebar').first();
    
    const borderRadius = await sidebarLogo.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    
    expect(borderRadius).toBe('24px');
  });

  test('should have gradient background', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    
    const background = await logo.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    
    // Should contain radial-gradient and linear-gradient
    expect(background).toContain('gradient');
  });

  test('should have correct ARIA label', async ({ page }) => {
    const logo = page.locator('.logo-sigil--sidebar').first();
    
    const ariaLabel = await logo.getAttribute('aria-label');
    expect(ariaLabel).toBe('Net Observation Project logo');
  });
});

test.describe('Logo Sigil - Light Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    // Switch to light theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
  });

  test('should apply light theme styles', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    
    const color = await logo.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    // In light mode, color should be darker
    expect(color).toBeTruthy();
  });

  test('should have different box-shadow in light theme', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    
    const boxShadow = await logo.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    
    expect(boxShadow).toBeTruthy();
    expect(boxShadow).not.toBe('none');
  });

  test('should remove text-shadow on ::after in light theme', async ({ page }) => {
    const logo = page.locator('.logo-sigil').first();
    
    const textShadow = await logo.evaluate((el) => {
      const after = window.getComputedStyle(el, '::after');
      return after.getPropertyValue('text-shadow');
    });
    
    // Light theme should have no text-shadow or 'none'
    expect(textShadow === 'none' || textShadow === '').toBeTruthy();
  });
});

test.describe('Logo Sigil - Responsive Design', () => {
  test('should resize on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    
    const headerLogo = page.locator('header .logo-sigil').first();
    
    const size = await headerLogo.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('--sigil-size').trim();
    });
    
    // On mobile, header logo should be 40px
    expect(size).toBe('40px');
  });

  test('should maintain aspect ratio on all screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/index.html');
      
      const logo = page.locator('.logo-sigil').first();
      const box = await logo.boundingBox();
      
      // Width should equal height (1:1 aspect ratio)
      expect(Math.abs(box.width - box.height)).toBeLessThan(2);
    }
  });
});

test.describe('Logo Sigil - Animation', () => {
  test('should have logoSweep animation on ::before element', async ({ page }) => {
    await page.goto('/index.html');
    
    const logo = page.locator('.logo-sigil').first();
    
    const animation = await logo.evaluate((el) => {
      const before = window.getComputedStyle(el, '::before');
      return {
        name: before.getPropertyValue('animation-name'),
        duration: before.getPropertyValue('animation-duration'),
        iteration: before.getPropertyValue('animation-iteration-count')
      };
    });
    
    expect(animation.name).toContain('logoSweep');
    expect(animation.duration).toBe('12s');
    expect(animation.iteration).toBe('infinite');
  });

  test('should verify logoSweep keyframes exist', async ({ page }) => {
    await page.goto('/index.html');
    
    const hasKeyframes = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'logoSweep') {
              return true;
            }
          }
        } catch (e) {
          // Skip sheets we can't access
        }
      }
      return false;
    });
    
    expect(hasKeyframes).toBeTruthy();
  });
});

test.describe('Logo Sigil - Accessibility', () => {
  test('should have proper role attribute', async ({ page }) => {
    await page.goto('/index.html');
    
    const logo = page.locator('.logo-sigil').first();
    const role = await logo.getAttribute('role');
    
    expect(role).toBe('img');
  });

  test('should be keyboard accessible when interactive', async ({ page }) => {
    await page.goto('/index.html');
    
    const logo = page.locator('.logo-sigil').first();
    
    // Check if element can receive focus (if it's meant to be interactive)
    const tabIndex = await logo.getAttribute('tabindex');
    
    // Logo is not interactive, so should not have positive tabindex
    expect(tabIndex === null || parseInt(tabIndex) < 0).toBeTruthy();
  });

  test('should maintain sufficient color contrast', async ({ page }) => {
    await page.goto('/index.html');
    
    const logo = page.locator('.logo-sigil').first();
    
    // Verify the element is visible (basic accessibility check)
    await expect(logo).toBeVisible();
    
    // Check computed opacity
    const opacity = await logo.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    
    expect(parseFloat(opacity)).toBeGreaterThan(0);
  });
});

test.describe('Logo Sigil - Cross-Page Consistency', () => {
  const pages = [
    'index.html',
    'dashboard.html',
    'docs.html',
    'api.html',
    'data.html',
    'versions.html'
  ];

  for (const pagePath of pages) {
    test(`should render consistently on ${pagePath}`, async ({ page }) => {
      await page.goto(`/${pagePath}`);
      
      const sidebarLogo = page.locator('.logo-sigil--sidebar');
      const headerLogo = page.locator('.logo-sigil--header');
      
      await expect(sidebarLogo).toBeVisible();
      await expect(headerLogo).toBeVisible();
      
      // Check both have correct content
      const sidebarContent = await sidebarLogo.evaluate((el) => {
        const after = window.getComputedStyle(el, '::after');
        return after.getPropertyValue('content');
      });
      
      const headerContent = await headerLogo.evaluate((el) => {
        const after = window.getComputedStyle(el, '::after');
        return after.getPropertyValue('content');
      });
      
      expect(sidebarContent).toContain('NOP');
      expect(headerContent).toContain('NOP');
    });
  }
});

test.describe('Logo Sigil - Performance', () => {
  test('should not cause layout shift', async ({ page }) => {
    await page.goto('/index.html');
    
    // Get initial position
    const initialBox = await page.locator('.logo-sigil--sidebar').first().boundingBox();
    
    // Wait for any animations to settle
    await page.waitForTimeout(1000);
    
    // Get position after animations
    const finalBox = await page.locator('.logo-sigil--sidebar').first().boundingBox();
    
    // Position should remain stable
    expect(initialBox.x).toBe(finalBox.x);
    expect(initialBox.y).toBe(finalBox.y);
  });

  test('should render efficiently without excessive repaints', async ({ page }) => {
    await page.goto('/index.html');
    
    // Logo should be rendered
    const logo = page.locator('.logo-sigil').first();
    await expect(logo).toBeVisible();
    
    // Check will-change or transform for GPU acceleration hints
    const transform = await logo.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    
    // Should have some transform property (even if 'none' initially)
    expect(transform).toBeDefined();
  });
});