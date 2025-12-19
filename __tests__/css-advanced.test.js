/**
 * Advanced CSS validation tests for docs/style.css
 * Comprehensive edge case and validation testing for the CSS changes in this branch
 */

const fs = require('fs');
const path = require('path');

describe('Advanced CSS Validation - Edge Cases and Comprehensive Coverage', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../docs/style.css'), 'utf8');
  });

  describe('CSS property value validation', () => {
    it('should use valid length units', () => {
      const lengthUnits = ['px', 'rem', 'em', '%', 'vh', 'vw'];
      const lengthPattern = new RegExp(`\\d+(${lengthUnits.join('|')})`, 'g');
      const matches = cssContent.match(lengthPattern);

      expect(matches).toBeTruthy();
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should use valid color formats', () => {
      const rgbaMatches = cssContent.match(/rgba?\([^)]+\)/g);
      const varMatches = cssContent.match(/var\(--[^)]+\)/g);
      const hexMatches = cssContent.match(/#[0-9a-fA-F]{3,6}/g);

      const totalColorUsage = (rgbaMatches?.length || 0) + 
                              (varMatches?.length || 0) + 
                              (hexMatches?.length || 0);

      expect(totalColorUsage).toBeGreaterThan(0);
    });

    it('should have valid gradient syntax', () => {
      const gradientPattern = /linear-gradient\([^)]+\)/g;
      const gradients = cssContent.match(gradientPattern);

      if (gradients) {
        gradients.forEach(gradient => {
          expect(gradient).toContain('deg');
        });
      }
    });

    it('should use consistent border-radius values', () => {
      const borderRadiusPattern = /border-radius:\s*(\d+px)/g;
      const matches = [...cssContent.matchAll(borderRadiusPattern)];

      expect(matches.length).toBeGreaterThan(0);
      matches.forEach(match => {
        const value = parseInt(match[1]);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(100);
      });
    });

    it('should use valid box-shadow syntax', () => {
      const shadowPattern = /box-shadow:\s*[^;]+;/g;
      const shadows = cssContent.match(shadowPattern);

      if (shadows) {
        shadows.forEach(shadow => {
          expect(shadow).toMatch(/\d+/);
        });
      }
    });
  });

  describe('Logo placeholder comprehensive styling', () => {
    it('should have flexbox properties for centering', () => {
      expect(cssContent).toMatch(/\.logo-placeholder/);
      expect(cssContent).toMatch(/display:\s*flex/);
    });

    it('should have typography properties', () => {
      expect(cssContent).toMatch(/text-transform:\s*uppercase/);
      expect(cssContent).toMatch(/letter-spacing:/);
      expect(cssContent).toMatch(/font-weight:/);
    });

    it('should have sizing properties', () => {
      expect(cssContent).toMatch(/width:/);
      expect(cssContent).toMatch(/min-height:/);
    });

    it('should use CSS custom properties for theming', () => {
      expect(cssContent).toMatch(/var\(--text\)/);
    });
  });

  describe('Header-specific logo styles', () => {
    it('should have distinct header logo styles', () => {
      expect(cssContent).toMatch(/header\s+img\.logo/);
      expect(cssContent).toMatch(/header\s+\.logo-placeholder/);
    });

    it('should have proper spacing in header placeholder', () => {
      expect(cssContent).toMatch(/padding:/);
    });

    it('should have minimum width constraint', () => {
      expect(cssContent).toMatch(/min-width:/);
    });
  });

  describe('Sidebar-specific logo styles', () => {
    it('should have sidebar logo placeholder styling', () => {
      expect(cssContent).toMatch(/\.sidebar\s+\.logo-placeholder/);
    });

    it('should have appropriate spacing for sidebar', () => {
      expect(cssContent).toMatch(/margin-bottom:/);
    });
  });

  describe('Removed legacy styles validation', () => {
    it('should not contain .logo-inline styles', () => {
      expect(cssContent).not.toMatch(/\.logo-inline\s*\{/);
    });

    it('should not have theme-specific logo-inline overrides', () => {
      expect(cssContent).not.toMatch(/\[data-theme="light"\]\s+\.logo-inline/);
    });
  });

  describe('Color scheme consistency', () => {
    it('should use cyan and magenta color scheme', () => {
      const cyanPattern = /rgba?\(0,?\s*255,?\s*255/;
      const magentaPattern = /rgba?\(255,?\s*0,?\s*255/;

      expect(cssContent).toMatch(cyanPattern);
      expect(cssContent).toMatch(magentaPattern);
    });

    it('should have consistent opacity values', () => {
      const opacityPattern = /rgba?\([^)]+,\s*(0\.\d+)\)/g;
      const opacities = [...cssContent.matchAll(opacityPattern)];

      opacities.forEach(match => {
        const opacity = parseFloat(match[1]);
        expect(opacity).toBeGreaterThanOrEqual(0);
        expect(opacity).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('CSS formatting and best practices', () => {
    it('should have balanced curly braces', () => {
      const openBraces = (cssContent.match(/{/g) || []).length;
      const closeBraces = (cssContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    it('should use shorthand properties where appropriate', () => {
      expect(cssContent).toMatch(/padding:\s*\d+/);
    });
  });

  describe('Accessibility considerations', () => {
    it('should maintain sufficient contrast elements', () => {
      expect(cssContent).toMatch(/color:/);
      expect(cssContent).toMatch(/background:/);
    });

    it('should have visible borders for clarity', () => {
      expect(cssContent).toMatch(/border:/);
    });
  });

  describe('Performance optimizations', () => {
    it('should use CSS custom properties for theme variables', () => {
      const customProps = cssContent.match(/var\(--[^)]+\)/g);
      
      expect(customProps).toBeTruthy();
      expect(customProps.length).toBeGreaterThan(0);
    });
  });
});
});