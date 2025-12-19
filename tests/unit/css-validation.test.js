import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('CSS Validation - style.css', () => {
  let cssContent;

  beforeAll(() => {
    const cssPath = resolve(process.cwd(), 'docs/style.css');
    cssContent = readFileSync(cssPath, 'utf-8');
  });

  describe('Logo Placeholder Styles', () => {
    it('should define .logo-placeholder class', () => {
      expect(cssContent).toContain('.logo-placeholder');
    });

    it('should set display flex on logo-placeholder', () => {
      const logoPlaceholderMatch = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      expect(logoPlaceholderMatch).toBeTruthy();
      
      if (logoPlaceholderMatch) {
        const styles = logoPlaceholderMatch[0];
        expect(styles).toMatch(/display\s*:\s*flex/);
      }
    });

    it('should set border-radius on logo-placeholder', () => {
      const match = cssContent.match(/\.logo-placeholder\s*{[^}]*border-radius[^}]*}/s);
      expect(match).toBeTruthy();
    });

    it('should include gradient background for logo-placeholder', () => {
      const match = cssContent.match(/\.logo-placeholder\s*{[^}]*background[^}]*gradient[^}]*}/s);
      expect(match).toBeTruthy();
    });

    it('should set text-transform uppercase on logo-placeholder', () => {
      const match = cssContent.match(/\.logo-placeholder\s*{[^}]*text-transform\s*:\s*uppercase[^}]*}/s);
      expect(match).toBeTruthy();
    });

    it('should define letter-spacing for logo-placeholder', () => {
      const match = cssContent.match(/\.logo-placeholder\s*{[^}]*letter-spacing[^}]*}/s);
      expect(match).toBeTruthy();
    });
  });

  describe('Header Logo Styles', () => {
    it('should define header img.logo styles', () => {
      expect(cssContent).toMatch(/header\s+img\.logo/);
    });

    it('should set height on header logo', () => {
      const match = cssContent.match(/header\s+img\.logo\s*{[^}]*height[^}]*}/s);
      expect(match).toBeTruthy();
    });

    it('should include drop-shadow filter on header logo', () => {
      const match = cssContent.match(/header\s+img\.logo\s*{[^}]*filter\s*:[^}]*drop-shadow[^}]*}/s);
      expect(match).toBeTruthy();
    });
  });

  describe('Header Placeholder Styles', () => {
    it('should define header .logo-placeholder styles', () => {
      expect(cssContent).toMatch(/header\s+\.logo-placeholder/);
    });

    it('should set specific dimensions for header placeholder', () => {
      const match = cssContent.match(/header\s+\.logo-placeholder\s*{[^}]*}/s);
      expect(match).toBeTruthy();
      
      if (match) {
        const styles = match[0];
        expect(styles).toMatch(/height|width|min-width/);
      }
    });
  });

  describe('Sidebar Logo Styles', () => {
    it('should define sidebar .logo-placeholder styles', () => {
      expect(cssContent).toMatch(/\.sidebar\s+\.logo-placeholder/);
    });

    it('should set margin-bottom on sidebar logo-placeholder', () => {
      const match = cssContent.match(/\.sidebar\s+\.logo-placeholder\s*{[^}]*margin-bottom[^}]*}/s);
      expect(match).toBeTruthy();
    });
  });

  describe('Removed Legacy Styles', () => {
    it('should not contain .logo-inline class', () => {
      expect(cssContent).not.toMatch(/\.logo-inline\s*{/);
    });

    it('should not have separate theme-specific logo-inline styles', () => {
      expect(cssContent).not.toMatch(/\[data-theme="light"\]\s+\.logo-inline/);
    });
  });

  describe('CSS Syntax Validation', () => {
    it('should have balanced curly braces', () => {
      const openBraces = (cssContent.match(/{/g) || []).length;
      const closeBraces = (cssContent.match(/}/g) || []).length;
      
      expect(openBraces).toBe(closeBraces);
    });

    it('should not have syntax errors in selectors', () => {
      // Check for common syntax errors
      expect(cssContent).not.toMatch(/{\s*{/); // Double opening brace
      expect(cssContent).not.toMatch(/}\s*}/); // Double closing brace without content
    });

    it('should have properly formatted color values', () => {
      const colorMatches = cssContent.match(/rgba?\([^)]+\)/g);
      
      if (colorMatches) {
        colorMatches.forEach(color => {
          // Basic validation - should have parentheses
          expect(color).toMatch(/^rgba?\(/);
          expect(color).toMatch(/\)$/);
        });
      }
    });

    it('should use valid CSS units', () => {
      const unitMatches = cssContent.match(/:\s*[\d.]+[a-z%]+/g);
      
      if (unitMatches) {
        const validUnits = ['px', 'em', 'rem', '%', 'vh', 'vw', 'pt', 'ch', 'ex'];
        unitMatches.forEach(match => {
          const hasValidUnit = validUnits.some(unit => match.includes(unit));
          if (match.match(/[\d.]+[a-z]/)) {
            expect(hasValidUnit).toBe(true);
          }
        });
      }
    });
  });

  describe('Responsive Design', () => {
    it('should maintain consistent border-radius values', () => {
      const radiusMatches = cssContent.match(/border-radius\s*:\s*[\d.]+px/g);
      
      expect(radiusMatches).toBeTruthy();
      if (radiusMatches) {
        expect(radiusMatches.length).toBeGreaterThan(0);
      }
    });

    it('should use CSS custom properties for theming', () => {
      expect(cssContent).toMatch(/var\(--[a-z-]+\)/);
    });
  });

  describe('Accessibility', () => {
    it('should not hide content with display:none inappropriately', () => {
      // Logo-placeholder styling should be visible
      const logoPlaceholderMatch = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      
      if (logoPlaceholderMatch) {
        expect(logoPlaceholderMatch[0]).not.toMatch(/display\s*:\s*none/);
      }
    });

    it('should have sufficient color contrast indicators', () => {
      // Check that box-shadow or border is defined for visual distinction
      const logoPlaceholderMatch = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      
      if (logoPlaceholderMatch) {
        const styles = logoPlaceholderMatch[0];
        const hasVisualIndicator = styles.match(/box-shadow|border/) !== null;
        expect(hasVisualIndicator).toBe(true);
      }
    });
  });
});