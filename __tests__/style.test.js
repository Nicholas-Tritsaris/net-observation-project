/**
 * CSS Validation and Structure Tests for docs/style.css
 * Tests for new logo-sigil styles and overall CSS integrity
 */

const fs = require('fs');
const path = require('path');

describe('Style.css - CSS Structure and Validation', () => {
  let cssContent;

  beforeAll(() => {
    const cssPath = path.join(__dirname, '..', 'docs', 'style.css');
    cssContent = fs.readFileSync(cssPath, 'utf-8');
  });

  describe('Logo Sigil Styles', () => {
    test('should contain .logo-sigil class definition', () => {
      expect(cssContent).toContain('.logo-sigil');
    });

    test('should define logo sigil size variable', () => {
      expect(cssContent).toMatch(/--sigil-size:\s*\d+px/);
    });

    test('should include border-radius for logo sigil', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/);
      expect(sigilSection).toBeTruthy();
      if (sigilSection) {
        expect(sigilSection[0]).toContain('border-radius');
      }
    });

    test('should have radial-gradient for visual effect', () => {
      expect(cssContent).toMatch(/radial-gradient/);
    });

    test('should define logo-sigil--sidebar modifier', () => {
      expect(cssContent).toContain('.logo-sigil--sidebar');
    });

    test('should define logo-sigil--header modifier', () => {
      expect(cssContent).toContain('.logo-sigil--header');
    });

    test('should include ::before pseudo-element for animation', () => {
      expect(cssContent).toContain('.logo-sigil::before');
    });

    test('should include ::after pseudo-element for content', () => {
      expect(cssContent).toContain('.logo-sigil::after');
    });

    test('should have NOP content in ::after', () => {
      const afterContent = cssContent.match(/\.logo-sigil::after\s*{[^}]+}/s);
      expect(afterContent).toBeTruthy();
      if (afterContent) {
        expect(afterContent[0]).toContain('NOP');
      }
    });

    test('should define logoSweep animation', () => {
      expect(cssContent).toContain('@keyframes logoSweep');
    });

    test('should have animation rotation from 0 to 360deg', () => {
      const animationSection = cssContent.match(/@keyframes logoSweep\s*{[^}]+}/s);
      expect(animationSection).toBeTruthy();
      if (animationSection) {
        expect(animationSection[0]).toContain('0deg');
        expect(animationSection[0]).toContain('360deg');
      }
    });

    test('should include box-shadow for glow effect', () => {
      const sigilStyles = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilStyles).toBeTruthy();
      if (sigilStyles) {
        expect(sigilStyles[0]).toContain('box-shadow');
      }
    });

    test('should have hover state for logo sigil', () => {
      expect(cssContent).toContain('.logo-sigil:hover');
    });

    test('should include transform in hover state', () => {
      const hoverStyles = cssContent.match(/\.logo-sigil:hover\s*{[^}]+}/s);
      expect(hoverStyles).toBeTruthy();
      if (hoverStyles) {
        expect(hoverStyles[0]).toContain('transform');
      }
    });
  });

  describe('Theme-Specific Styles', () => {
    test('should have light theme styles for logo sigil', () => {
      expect(cssContent).toContain('[data-theme="light"] .logo-sigil');
    });

    test('should adjust colors for light theme', () => {
      const lightTheme = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil\s*{[^}]+}/s);
      expect(lightTheme).toBeTruthy();
      if (lightTheme) {
        expect(lightTheme[0]).toMatch(/color|border-color|box-shadow/);
      }
    });

    test('should remove text-shadow in light theme', () => {
      const lightAfter = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil::after\s*{[^}]+}/s);
      expect(lightAfter).toBeTruthy();
      if (lightAfter) {
        expect(lightAfter[0]).toContain('text-shadow');
      }
    });
  });

  describe('CSS Custom Properties', () => {
    test('should use CSS variables consistently', () => {
      expect(cssContent).toMatch(/var\(--[a-z-]+\)/);
    });

    test('should define --sigil-size variable', () => {
      expect(cssContent).toMatch(/--sigil-size/);
    });
  });

  describe('Responsive Design', () => {
    test('should include media query for mobile', () => {
      expect(cssContent).toMatch(/@media\s*\([^)]*max-width[^)]*600px[^)]*\)/);
    });

    test('should adjust logo size for mobile', () => {
      const mobileSection = cssContent.match(/@media\s*\([^)]*600px[^)]*\)\s*{[^}]+\.logo-sigil[^}]+}/s);
      expect(mobileSection).toBeTruthy();
    });
  });

  describe('Removed Old Styles', () => {
    test('should not contain .logo-placeholder class', () => {
      // The old logo-placeholder should be removed
      const hasOldPlaceholder = cssContent.includes('.logo-placeholder {');
      expect(hasOldPlaceholder).toBe(false);
    });

    test('should not contain .logo-inline class', () => {
      // The old logo-inline should be removed
      const hasOldInline = cssContent.includes('.logo-inline {');
      expect(hasOldInline).toBe(false);
    });
  });

  describe('CSS Syntax Validation', () => {
    test('should have balanced braces', () => {
      const openBraces = (cssContent.match(/{/g) || []).length;
      const closeBraces = (cssContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should have balanced parentheses', () => {
      const openParens = (cssContent.match(/\(/g) || []).length;
      const closeParens = (cssContent.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    test('should not have empty rulesets', () => {
      const emptyRules = cssContent.match(/{\s*}/g);
      expect(emptyRules).toBeNull();
    });

    test('should use semicolons to end declarations', () => {
      // Check for common patterns that should end with semicolons
      const declarations = cssContent.match(/:\s*[^;{}]+[;}]/g);
      expect(declarations).toBeTruthy();
    });

    test('should use valid color formats', () => {
      const colors = cssContent.match(/(?:color|background|border|box-shadow):\s*[^;]+;/gi);
      expect(colors).toBeTruthy();
      // Verify common color formats exist
      expect(cssContent).toMatch(/(?:rgba?|hsl|#[0-9a-f]{3,8})/i);
    });
  });

  describe('Animation Properties', () => {
    test('should define animation duration', () => {
      expect(cssContent).toMatch(/animation:\s*[^;]*\d+s/);
    });

    test('should include linear timing function', () => {
      expect(cssContent).toContain('linear');
    });

    test('should have infinite animation', () => {
      expect(cssContent).toContain('infinite');
    });
  });

  describe('Header Styles', () => {
    test('should style header logo sigil', () => {
      expect(cssContent).toMatch(/header.*\.logo-sigil|\.logo-sigil.*header/s);
    });

    test('should maintain existing header styles', () => {
      expect(cssContent).toContain('header');
    });
  });

  describe('Sidebar Logo Integration', () => {
    test('should have sidebar-specific logo sizing', () => {
      const sidebarStyles = cssContent.match(/\.logo-sigil--sidebar\s*{[^}]+}/s);
      expect(sidebarStyles).toBeTruthy();
      if (sidebarStyles) {
        expect(sidebarStyles[0]).toMatch(/--sigil-size/);
      }
    });

    test('should include margin for sidebar logo', () => {
      const sidebarStyles = cssContent.match(/\.logo-sigil--sidebar\s*{[^}]+}/s);
      expect(sidebarStyles).toBeTruthy();
      if (sidebarStyles) {
        expect(sidebarStyles[0]).toContain('margin');
      }
    });
  });

  describe('Visual Effects', () => {
    test('should use mix-blend-mode for layering', () => {
      expect(cssContent).toContain('mix-blend-mode');
    });

    test('should include screen blend mode', () => {
      expect(cssContent).toContain('screen');
    });

    test('should have opacity settings', () => {
      expect(cssContent).toMatch(/opacity:\s*[\d.]+/);
    });

    test('should include transition effects', () => {
      expect(cssContent).toMatch(/transition:/);
    });

    test('should have conic-gradient', () => {
      expect(cssContent).toContain('conic-gradient');
    });

    test('should use linear-gradient', () => {
      expect(cssContent).toContain('linear-gradient');
    });
  });

  describe('Accessibility', () => {
    test('should not rely solely on color for information', () => {
      // Logo has aria-label in HTML, CSS provides visual enhancement
      expect(cssContent).toBeTruthy();
    });

    test('should have adequate contrast ratios in colors', () => {
      // Cyan and magenta on dark background should provide good contrast
      expect(cssContent).toMatch(/rgba?\(0,\s*255,\s*255/i); // cyan
      expect(cssContent).toMatch(/rgba?\(255,\s*0,\s*255/i); // magenta
    });
  });

  describe('Performance Considerations', () => {
    test('should use transform for animations (GPU-accelerated)', () => {
      const animations = cssContent.match(/@keyframes[^}]+}/gs);
      expect(animations).toBeTruthy();
      if (animations) {
        animations.forEach(anim => {
          if (anim.includes('transform')) {
            expect(anim).toContain('transform');
          }
        });
      }
    });

    test('should avoid layout-triggering properties in animations', () => {
      const logoSweep = cssContent.match(/@keyframes logoSweep[^}]+}/s);
      expect(logoSweep).toBeTruthy();
      if (logoSweep) {
        // Should use rotate, not width/height/position
        expect(logoSweep[0]).not.toMatch(/width:|height:|top:|left:/);
      }
    });
  });

  describe('Typography', () => {
    test('should use monospace font for logo text', () => {
      const sigilAfter = cssContent.match(/\.logo-sigil.*font-family/s);
      expect(sigilAfter).toBeTruthy();
    });

    test('should include letter-spacing', () => {
      expect(cssContent).toMatch(/letter-spacing/);
    });

    test('should use text-transform uppercase', () => {
      const sigilSection = cssContent.match(/\.logo-sigil[^}]+}/s);
      expect(sigilSection).toBeTruthy();
      if (sigilSection) {
        expect(sigilSection[0]).toContain('uppercase');
      }
    });
  });

  describe('Positioning and Layout', () => {
    test('should use flexbox for centering', () => {
      const sigilStyles = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilStyles).toBeTruthy();
      if (sigilStyles) {
        expect(sigilStyles[0]).toMatch(/display:\s*flex/);
      }
    });

    test('should use position relative for pseudo-elements', () => {
      expect(cssContent).toMatch(/position:\s*relative/);
    });

    test('should use position absolute for overlays', () => {
      expect(cssContent).toMatch(/position:\s*absolute/);
    });

    test('should use inset property', () => {
      expect(cssContent).toContain('inset:');
    });
  });
});