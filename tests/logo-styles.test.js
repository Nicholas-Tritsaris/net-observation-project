/**
 * Tests for logo CSS styling in docs/style.css
 * Validates the new image-based logo styling and placeholder fallback styles
 */

const fs = require('fs');

describe('Logo CSS Styles', () => {
  let cssContent;
  
  beforeAll(() => {
    cssContent = fs.readFileSync('./docs/style.css', 'utf-8');
  });

  describe('Logo Image Styles', () => {
    test('should define header img.logo selector', () => {
      expect(cssContent).toMatch(/header\s+img\.logo\s*\{/);
    });

    test('should set logo height to 48px', () => {
      const headerLogoBlock = cssContent.match(/header\s+img\.logo\s*\{[^}]*\}/s);
      expect(headerLogoBlock).not.toBeNull();
      expect(headerLogoBlock[0]).toMatch(/height:\s*48px/);
    });

    test('should apply drop-shadow filter to logo', () => {
      const headerLogoBlock = cssContent.match(/header\s+img\.logo\s*\{[^}]*\}/s);
      expect(headerLogoBlock).not.toBeNull();
      expect(headerLogoBlock[0]).toMatch(/filter:\s*drop-shadow/);
    });

    test('should use cyan glow in drop-shadow', () => {
      const headerLogoBlock = cssContent.match(/header\s+img\.logo\s*\{[^}]*\}/s);
      expect(headerLogoBlock).not.toBeNull();
      expect(headerLogoBlock[0]).toMatch(/rgba\(0,\s*255,\s*255/);
    });
  });

  describe('Logo Placeholder Styles', () => {
    test('should define .logo-placeholder selector', () => {
      expect(cssContent).toMatch(/\.logo-placeholder\s*\{/);
    });

    test('should use flexbox for placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/display:\s*flex/);
    });

    test('should center placeholder content', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/align-items:\s*center/);
      expect(placeholderBlock[0]).toMatch(/justify-content:\s*center/);
    });

    test('should set placeholder border-radius', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/border-radius:\s*14px/);
    });

    test('should uppercase placeholder text', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/text-transform:\s*uppercase/);
    });

    test('should apply gradient background', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/background:\s*linear-gradient/);
    });

    test('should have cyan and magenta colors in gradient', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      const gradient = placeholderBlock[0].match(/linear-gradient\([^)]+\)/);
      expect(gradient).not.toBeNull();
      expect(gradient[0]).toMatch(/rgba\(0,\s*255,\s*255/); // cyan
      expect(gradient[0]).toMatch(/rgba\(255,\s*0,\s*255/); // magenta
    });

    test('should apply border to placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/border:/);
    });

    test('should apply box-shadow to placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/box-shadow:/);
    });
  });

  describe('Header Logo Placeholder Styles', () => {
    test('should define header-specific placeholder styles', () => {
      expect(cssContent).toMatch(/header\s+\.logo-placeholder\s*\{/);
    });

    test('should set header placeholder height to 48px', () => {
      const headerPlaceholderBlock = cssContent.match(/header\s+\.logo-placeholder\s*\{[^}]*\}/s);
      expect(headerPlaceholderBlock).not.toBeNull();
      expect(headerPlaceholderBlock[0]).toMatch(/height:\s*48px/);
    });

    test('should apply horizontal padding to header placeholder', () => {
      const headerPlaceholderBlock = cssContent.match(/header\s+\.logo-placeholder\s*\{[^}]*\}/s);
      expect(headerPlaceholderBlock).not.toBeNull();
      expect(headerPlaceholderBlock[0]).toMatch(/padding:\s*0\s+1\.6rem/);
    });

    test('should set auto width for header placeholder', () => {
      const headerPlaceholderBlock = cssContent.match(/header\s+\.logo-placeholder\s*\{[^}]*\}/s);
      expect(headerPlaceholderBlock).not.toBeNull();
      expect(headerPlaceholderBlock[0]).toMatch(/width:\s*auto/);
    });

    test('should set minimum width for header placeholder', () => {
      const headerPlaceholderBlock = cssContent.match(/header\s+\.logo-placeholder\s*\{[^}]*\}/s);
      expect(headerPlaceholderBlock).not.toBeNull();
      expect(headerPlaceholderBlock[0]).toMatch(/min-width:\s*160px/);
    });
  });

  describe('Sidebar Logo Placeholder Styles', () => {
    test('should define sidebar-specific placeholder styles', () => {
      expect(cssContent).toMatch(/\.sidebar\s+\.logo-placeholder\s*\{/);
    });

    test('should apply bottom margin to sidebar placeholder', () => {
      const sidebarPlaceholderBlock = cssContent.match(/\.sidebar\s+\.logo-placeholder\s*\{[^}]*\}/s);
      expect(sidebarPlaceholderBlock).not.toBeNull();
      expect(sidebarPlaceholderBlock[0]).toMatch(/margin-bottom:\s*1rem/);
    });
  });

  describe('Removed Old Styles', () => {
    test('should not contain .logo-inline class', () => {
      expect(cssContent).not.toMatch(/\.logo-inline\s*\{/);
    });

    test('should not have light theme .logo-inline overrides', () => {
      expect(cssContent).not.toMatch(/\[data-theme="light"\]\s+\.logo-inline/);
    });
  });

  describe('Responsive Design', () => {
    test('should have media query for mobile logo', () => {
      const mobileQuery = cssContent.match(/@media\s*\([^)]*max-width:\s*600px[^)]*\)[^{]*\{[^}]*header\s+img\.logo[^}]*\}/s);
      expect(mobileQuery).not.toBeNull();
    });

    test('should reduce logo height on mobile', () => {
      const mediaBlock = cssContent.match(/@media\s*\([^)]*max-width:\s*600px[^)]*\)\s*\{[\s\S]*?\n\}/m);
      if (mediaBlock) {
        expect(mediaBlock[0]).toMatch(/header\s+img\.logo\s*\{[\s\S]*?height:\s*40px/);
      }
    });
  });

  describe('Color Variables', () => {
    test('should use CSS custom properties for text color', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/color:\s*var\(--text\)/);
    });

    test('should maintain theme consistency', () => {
      expect(cssContent).toMatch(/--text:/);
      expect(cssContent).toMatch(/--accent:/);
    });
  });
});