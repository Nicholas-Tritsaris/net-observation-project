/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';

describe('CSS Style Changes Validation', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = readFileSync('docs/style.css', 'utf-8');
  });

  describe('Logo Placeholder Styles', () => {
    test('should define .logo-placeholder class', () => {
      expect(cssContent).toMatch(/\.logo-placeholder\s*{/);
    });

    test('should have flexbox display for logo-placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/display:\s*flex/);
    });

    test('should have text-transform uppercase for logo-placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/text-transform:\s*uppercase/);
    });

    test('should have gradient background for logo-placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/background:\s*linear-gradient/);
    });

    test('should have border-radius for logo-placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/border-radius:\s*14px/);
    });

    test('should have box-shadow for logo-placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/box-shadow:/);
    });

    test('should have letter-spacing for logo-placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/letter-spacing:/);
    });
  });

  describe('Header Logo Styles', () => {
    test('should define header img.logo styles', () => {
      expect(cssContent).toMatch(/header\s+img\.logo\s*{/);
    });

    test('should have height set for header logo', () => {
      const headerLogoBlock = cssContent.match(/header\s+img\.logo\s*{[^}]*}/s);
      expect(headerLogoBlock).not.toBeNull();
      expect(headerLogoBlock[0]).toMatch(/height:\s*48px/);
    });

    test('should have filter drop-shadow for header logo', () => {
      const headerLogoBlock = cssContent.match(/header\s+img\.logo\s*{[^}]*}/s);
      expect(headerLogoBlock).not.toBeNull();
      expect(headerLogoBlock[0]).toMatch(/filter:\s*drop-shadow/);
    });
  });

  describe('Header Logo Placeholder Styles', () => {
    test('should define header .logo-placeholder styles', () => {
      expect(cssContent).toMatch(/header\s+\.logo-placeholder\s*{/);
    });

    test('should have auto width for header placeholder', () => {
      const headerPlaceholderBlock = cssContent.match(/header\s+\.logo-placeholder\s*{[^}]*}/s);
      expect(headerPlaceholderBlock).not.toBeNull();
      expect(headerPlaceholderBlock[0]).toMatch(/width:\s*auto/);
    });

    test('should have padding for header placeholder', () => {
      const headerPlaceholderBlock = cssContent.match(/header\s+\.logo-placeholder\s*{[^}]*}/s);
      expect(headerPlaceholderBlock).not.toBeNull();
      expect(headerPlaceholderBlock[0]).toMatch(/padding:/);
    });

    test('should have fixed height for header placeholder', () => {
      const headerPlaceholderBlock = cssContent.match(/header\s+\.logo-placeholder\s*{[^}]*}/s);
      expect(headerPlaceholderBlock).not.toBeNull();
      expect(headerPlaceholderBlock[0]).toMatch(/height:\s*48px/);
    });
  });

  describe('Sidebar Logo Placeholder Styles', () => {
    test('should define sidebar .logo-placeholder styles', () => {
      expect(cssContent).toMatch(/\.sidebar\s+\.logo-placeholder\s*{/);
    });

    test('should have margin-bottom for sidebar placeholder', () => {
      const sidebarPlaceholderBlock = cssContent.match(/\.sidebar\s+\.logo-placeholder\s*{[^}]*}/s);
      expect(sidebarPlaceholderBlock).not.toBeNull();
      expect(sidebarPlaceholderBlock[0]).toMatch(/margin-bottom:\s*1rem/);
    });
  });

  describe('Removed Old Styles', () => {
    test('should not have .logo-inline styles', () => {
      expect(cssContent).not.toMatch(/\.logo-inline\s*{/);
    });

    test('should not reference aspect-ratio in logo context', () => {
      // Check that old aspect-ratio styling is removed
      const logoRelatedBlocks = cssContent.match(/\.logo[^{]*{[^}]*aspect-ratio[^}]*}/gs);
      expect(logoRelatedBlocks).toBeNull();
    });
  });

  describe('Theme Support', () => {
    test('should have theme-specific styles', () => {
      expect(cssContent).toMatch(/\[data-theme="light"\]/);
    });

    test('should define CSS variables', () => {
      expect(cssContent).toMatch(/--text/);
    });
  });

  describe('Responsive Design', () => {
    test('should have media queries', () => {
      expect(cssContent).toMatch(/@media/);
    });
  });

  describe('General Structure', () => {
    test('should define header styles', () => {
      expect(cssContent).toMatch(/^header\s*{/m);
    });

    test('should define sidebar styles', () => {
      expect(cssContent).toMatch(/\.sidebar\s*{/);
    });

    test('should have navigation styles', () => {
      expect(cssContent).toMatch(/nav/);
    });

    test('should have theme toggle styles', () => {
      expect(cssContent).toMatch(/\.theme-toggle/);
    });
  });

  describe('Color and Visual Effects', () => {
    test('should use cyan color in effects', () => {
      expect(cssContent).toMatch(/rgba?\(0,?\s*255,?\s*255/i);
    });

    test('should use gradient backgrounds', () => {
      expect(cssContent).toMatch(/linear-gradient/);
    });

    test('should have box-shadow definitions', () => {
      expect(cssContent).toMatch(/box-shadow:/);
    });

    test('should have border-radius for rounded corners', () => {
      expect(cssContent).toMatch(/border-radius:/);
    });
  });
});