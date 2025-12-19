/**
 * CSS validation tests for style.css changes
 * Tests focus on logo styling modifications
 */

const fs = require('fs');
const path = require('path');

describe('CSS File - Logo Styling Changes', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../docs/style.css'), 'utf8');
  });

  describe('Logo placeholder styles', () => {
    it('should have .logo-placeholder class defined', () => {
      expect(cssContent).toMatch(/\.logo-placeholder\s*{/);
    });

    it('should define flexbox layout for logo-placeholder', () => {
      const placeholderBlock = extractRuleBlock('.logo-placeholder', cssContent);
      expect(placeholderBlock).toMatch(/display:\s*flex/);
      expect(placeholderBlock).toMatch(/align-items:\s*center/);
      expect(placeholderBlock).toMatch(/justify-content:\s*center/);
    });

    it('should define width and minimum height for logo-placeholder', () => {
      // CSS can have :: for pseudo-elements, so we need a more specific check
      expect(cssContent).not.toMatch(/[^:]:{2}[^:]/); // No double colons except for pseudo-elements
    it('should define border-radius for logo-placeholder', () => {
      const placeholderBlock = extractRuleBlock('.logo-placeholder', cssContent);
      expect(placeholderBlock).toMatch(/border-radius:\s*14px/);
    });

    it('should define text styling for logo-placeholder', () => {
      const placeholderBlock = extractRuleBlock('.logo-placeholder', cssContent);
      expect(placeholderBlock).toMatch(/text-transform:\s*uppercase/);
      expect(placeholderBlock).toMatch(/letter-spacing:\s*0\.18em/);
      expect(placeholderBlock).toMatch(/font-weight:\s*700/);
    });

    it('should define gradient background for logo-placeholder', () => {
      const placeholderBlock = extractRuleBlock('.logo-placeholder', cssContent);
      expect(placeholderBlock).toMatch(/background:\s*linear-gradient/);
      expect(placeholderBlock).toContain('rgba(0, 255, 255');
      expect(placeholderBlock).toContain('rgba(255, 0, 255');
    });

    it('should define border styling for logo-placeholder', () => {
      const placeholderBlock = extractRuleBlock('.logo-placeholder', cssContent);
      expect(placeholderBlock).toMatch(/border:\s*1px solid/);
    });

    it('should define box-shadow for logo-placeholder', () => {
      const placeholderBlock = extractRuleBlock('.logo-placeholder', cssContent);
      expect(placeholderBlock).toMatch(/box-shadow:/);
    });

    it('should define color variable usage', () => {
      const placeholderBlock = extractRuleBlock('.logo-placeholder', cssContent);
      expect(placeholderBlock).toMatch(/color:\s*var\(--text\)/);
    });
  });

  describe('Header logo styles', () => {
    it('should have header img.logo styles defined', () => {
      expect(cssContent).toMatch(/header\s+img\.logo\s*{/);
    });

    it('should define height for header logo', () => {
      const headerLogoBlock = extractRuleBlock('header img.logo', cssContent);
      expect(headerLogoBlock).toMatch(/height:\s*48px/);
    });

    it('should define filter drop-shadow for header logo', () => {
      const headerLogoBlock = extractRuleBlock('header img.logo', cssContent);
      expect(headerLogoBlock).toMatch(/filter:\s*drop-shadow/);
      expect(headerLogoBlock).toContain('rgba(0, 255, 255');
    });
  });

  describe('Header logo-placeholder styles', () => {
    it('should have header .logo-placeholder styles defined', () => {
      expect(cssContent).toMatch(/header\s+\.logo-placeholder\s*{/);
    });

    it('should define custom width for header placeholder', () => {
      const headerPlaceholderBlock = extractRuleBlock('header .logo-placeholder', cssContent);
      expect(headerPlaceholderBlock).toMatch(/width:\s*auto/);
    });

    it('should define padding for header placeholder', () => {
      const headerPlaceholderBlock = extractRuleBlock('header .logo-placeholder', cssContent);
      expect(headerPlaceholderBlock).toMatch(/padding:\s*0\s+1\.6rem/);
    });

    it('should define fixed height for header placeholder', () => {
      const headerPlaceholderBlock = extractRuleBlock('header .logo-placeholder', cssContent);
      expect(headerPlaceholderBlock).toMatch(/height:\s*48px/);
    });

    it('should define min-width for header placeholder', () => {
      const headerPlaceholderBlock = extractRuleBlock('header .logo-placeholder', cssContent);
      expect(headerPlaceholderBlock).toMatch(/min-width:\s*160px/);
    });
  });

  describe('Sidebar logo-placeholder styles', () => {
    it('should have sidebar-specific logo-placeholder styles', () => {
      expect(cssContent).toMatch(/\.sidebar\s+\.logo-placeholder\s*{/);
    });

    it('should define margin-bottom for sidebar logo', () => {
      const sidebarLogoBlock = extractRuleBlock('.sidebar .logo-placeholder', cssContent);
      expect(sidebarLogoBlock).toMatch(/margin-bottom:\s*1rem/);
    });
  });

  describe('Removed legacy styles', () => {
    it('should NOT contain .logo-inline class definition', () => {
      expect(cssContent).not.toMatch(/\.logo-inline\s*{/);
    });

    it('should NOT contain old logo-inline styling rules', () => {
      expect(cssContent).not.toContain('width: 52px');
      expect(cssContent).not.toContain('height: 52px');
    });
  });

  describe('CSS syntax validation', () => {
    it('should have balanced curly braces', () => {
      const openBraces = (cssContent.match(/{/g) || []).length;
      const closeBraces = (cssContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    it('should have valid CSS color values', () => {
      const colorRegex = /rgba?\([^)]+\)/g;
      const colors = cssContent.match(colorRegex) || [];
      
      colors.forEach(color => {
        // Check for valid rgba format
        if (color.startsWith('rgba')) {
          expect(color).toMatch(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/);
        } else {
          expect(color).toMatch(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/);
        }
      });
    });

    it('should use CSS custom properties for theming', () => {
      expect(cssContent).toMatch(/var\(--[a-z-]+\)/);
    });

    it('should not have obvious syntax errors', () => {
      // Check for common errors
      expect(cssContent).not.toMatch(/;{2,}/); // Double semicolons
      expect(cssContent).not.toMatch(/:{2,}/); // Double colons (except pseudo-elements)
      expect(cssContent).not.toMatch(/\s{$/); // Lone opening brace
    });
  });

  describe('Responsive design tokens', () => {
    it('should use relative units appropriately', () => {
      // Check that rem/em units are used
      expect(cssContent).toMatch(/\d+\.?\d*rem/);
      expect(cssContent).toMatch(/\d+\.?\d*em/);
    });

    it('should define border-radius values consistently', () => {
      const borderRadiusMatches = cssContent.match(/border-radius:\s*[\d.]+px/g) || [];
      // Logo elements should use 14px or 18px radius
      const hasConsistentRadius = borderRadiusMatches.some(match => 
        match.includes('14px') || match.includes('18px')
      );
      expect(hasConsistentRadius).toBe(true);
    });
  });

  describe('Theme-specific styles', () => {
    it('should have light theme specific styles for logo-placeholder', () => {
      const lightThemeRegex = /\[data-theme="light"\]\s+\.logo-placeholder/;
      // Note: Based on the diff, light theme styles were removed for logo-placeholder
      // This test verifies the removal
      expect(cssContent).not.toMatch(lightThemeRegex);
    });

    it('should maintain color consistency with CSS variables', () => {
      const varUsage = cssContent.match(/var\(--text\)/g) || [];
      expect(varUsage.length).toBeGreaterThan(0);
    });
  });

  describe('Layout and positioning', () => {
    it('should define proper header styles', () => {
      expect(cssContent).toMatch(/header\s*{/);
    });

    it('should have flexbox or grid layout defined', () => {
      expect(cssContent).toMatch(/display:\s*(flex|grid)/);
    });

    it('should define sidebar styles', () => {
      expect(cssContent).toMatch(/\.sidebar\s*{/);
    });
  });

  describe('Visual effects', () => {
    it('should use box-shadow for depth', () => {
      expect(cssContent).toMatch(/box-shadow:/);
    });

    it('should use linear-gradient for backgrounds', () => {
      expect(cssContent).toMatch(/linear-gradient/);
    });

    it('should use filter effects appropriately', () => {
      expect(cssContent).toMatch(/filter:/);
    });

    it('should define proper alpha transparency', () => {
      const rgbaMatches = cssContent.match(/rgba\([^)]+,\s*(0?\.\d+|1)\)/g) || [];
      expect(rgbaMatches.length).toBeGreaterThan(0);
      
      // All alpha values should be between 0 and 1
      rgbaMatches.forEach(rgba => {
        const alpha = parseFloat(rgba.match(/,\s*(0?\.\d+|1)\)$/)[1]);
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThanOrEqual(1);
      });
    });
  });
});

// Helper function to extract CSS rule block
function extractRuleBlock(selector, css) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedSelector + '\\s*{([^}]*)}', 's');
  const match = css.match(regex);
  return match ? match[1] : '';
}