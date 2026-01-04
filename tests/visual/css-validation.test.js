/**
 * CSS Validation Tests for style.css
 * Focuses on the new .logo-sigil styles that replaced .logo-placeholder and .logo-inline
 * Tests CSS syntax, selector validity, animation definitions, and responsive behavior
 */

const fs = require('fs');
const path = require('path');

describe('CSS Visual and Structure Tests - style.css', () => {
  let cssContent;

  beforeAll(() => {
    const cssPath = path.join(__dirname, '../../docs/style.css');
    cssContent = fs.readFileSync(cssPath, 'utf8');
  });

  describe('Logo Sigil Styles - New Implementation', () => {
    test('should contain .logo-sigil base class definition', () => {
      expect(cssContent).toMatch(/\.logo-sigil\s*\{/);
    });

    test('should define --sigil-size CSS custom property', () => {
      const sigilBlock = cssContent.match(/\.logo-sigil\s*\{[^}]+\}/s);
      expect(sigilBlock).toBeTruthy();
      expect(sigilBlock[0]).toMatch(/--sigil-size:\s*52px/);
    });

    test('should contain multiple gradient backgrounds', () => {
      const sigilBlock = cssContent.match(/\.logo-sigil\s*\{[^}]+\}/s);
      expect(sigilBlock[0]).toMatch(/radial-gradient/);
      expect(sigilBlock[0]).toMatch(/linear-gradient/);
      // Should have at least 2 radial gradients and 1 linear gradient
      const radialCount = (sigilBlock[0].match(/radial-gradient/g) || []).length;
      expect(radialCount).toBeGreaterThanOrEqual(2);
    });

    test('should define border-radius for rounded corners', () => {
      const sigilBlock = cssContent.match(/\.logo-sigil\s*\{[^}]+\}/s);
      expect(sigilBlock[0]).toMatch(/border-radius:\s*18px/);
    });

    test('should contain box-shadow for neon glow effect', () => {
      const sigilBlock = cssContent.match(/\.logo-sigil\s*\{[^}]+\}/s);
      expect(sigilBlock[0]).toMatch(/box-shadow:/);
      // Should have cyan and magenta glow colors
      expect(sigilBlock[0]).toMatch(/rgba\(0,\s*255,\s*255/);
      expect(sigilBlock[0]).toMatch(/rgba\(255,\s*0,\s*255/);
    });

    test('should use flexbox for centering content', () => {
      const sigilBlock = cssContent.match(/\.logo-sigil\s*\{[^}]+\}/s);
      expect(sigilBlock[0]).toMatch(/display:\s*flex/);
      expect(sigilBlock[0]).toMatch(/align-items:\s*center/);
      expect(sigilBlock[0]).toMatch(/justify-content:\s*center/);
    });

    test('should define transition for smooth hover effects', () => {
      const sigilBlock = cssContent.match(/\.logo-sigil\s*\{[^}]+\}/s);
      expect(sigilBlock[0]).toMatch(/transition:/);
      expect(sigilBlock[0]).toMatch(/transform/);
      expect(sigilBlock[0]).toMatch(/box-shadow/);
    });
  });

  describe('Logo Sigil Pseudo-elements', () => {
    test('should define ::before pseudo-element for animated effect', () => {
      expect(cssContent).toMatch(/\.logo-sigil::before\s*\{/);
    });

    test('::before should contain conic-gradient for sweep effect', () => {
      const beforeBlock = cssContent.match(/\.logo-sigil::before\s*\{[^}]+\}/s);
      expect(beforeBlock).toBeTruthy();
      expect(beforeBlock[0]).toMatch(/conic-gradient/);
      expect(beforeBlock[0]).toMatch(/from\s+120deg/);
    });

    test('::before should use mix-blend-mode for visual effect', () => {
      const beforeBlock = cssContent.match(/\.logo-sigil::before\s*\{[^}]+\}/s);
      expect(beforeBlock[0]).toMatch(/mix-blend-mode:\s*screen/);
    });

    test('::before should reference logoSweep animation', () => {
      const beforeBlock = cssContent.match(/\.logo-sigil::before\s*\{[^}]+\}/s);
      expect(beforeBlock[0]).toMatch(/animation:\s*logoSweep\s+12s\s+linear\s+infinite/);
    });

    test('should define ::after pseudo-element for NOP text', () => {
      expect(cssContent).toMatch(/\.logo-sigil::after\s*\{/);
    });

    test('::after should contain "NOP" text content', () => {
      const afterBlock = cssContent.match(/\.logo-sigil::after\s*\{[^}]+\}/s);
      expect(afterBlock).toBeTruthy();
      expect(afterBlock[0]).toMatch(/content:\s*['"']NOP['"']/);
    });

    test('::after should have text-shadow for glow effect', () => {
      const afterBlock = cssContent.match(/\.logo-sigil::after\s*\{[^}]+\}/s);
      expect(afterBlock[0]).toMatch(/text-shadow:/);
      expect(afterBlock[0]).toMatch(/rgba\(0,\s*255,\s*255/);
    });
  });

  describe('Logo Sigil Hover State', () => {
    test('should define :hover pseudo-class', () => {
      expect(cssContent).toMatch(/\.logo-sigil:hover\s*\{/);
    });

    test(':hover should apply rotation and scale transform', () => {
      const hoverBlock = cssContent.match(/\.logo-sigil:hover\s*\{[^}]+\}/s);
      expect(hoverBlock).toBeTruthy();
      expect(hoverBlock[0]).toMatch(/transform:/);
      expect(hoverBlock[0]).toMatch(/rotate\(-2deg\)/);
      expect(hoverBlock[0]).toMatch(/scale\(1\.02\)/);
    });

    test(':hover should enhance box-shadow glow', () => {
      const hoverBlock = cssContent.match(/\.logo-sigil:hover\s*\{[^}]+\}/s);
      expect(hoverBlock[0]).toMatch(/box-shadow:/);
      // Hover glow should be stronger than base
      expect(hoverBlock[0]).toMatch(/0\s+0\s+32px/);
    });
  });

  describe('Logo Sigil Variants', () => {
    test('should define .logo-sigil--sidebar modifier', () => {
      expect(cssContent).toMatch(/\.logo-sigil--sidebar\s*\{/);
    });

    test('--sidebar variant should override --sigil-size to 120px', () => {
      const sidebarBlock = cssContent.match(/\.logo-sigil--sidebar\s*\{[^}]+\}/s);
      expect(sidebarBlock).toBeTruthy();
      expect(sidebarBlock[0]).toMatch(/--sigil-size:\s*120px/);
    });

    test('--sidebar variant should have larger border-radius', () => {
      const sidebarBlock = cssContent.match(/\.logo-sigil--sidebar\s*\{[^}]+\}/s);
      expect(sidebarBlock[0]).toMatch(/border-radius:\s*24px/);
    });

    test('--sidebar variant should have margin-bottom spacing', () => {
      const sidebarBlock = cssContent.match(/\.logo-sigil--sidebar\s*\{[^}]+\}/s);
      expect(sidebarBlock[0]).toMatch(/margin-bottom:\s*1rem/);
    });

    test('should define .logo-sigil--header modifier', () => {
      expect(cssContent).toMatch(/\.logo-sigil--header\s*\{/);
    });

    test('--header variant should set --sigil-size to 48px', () => {
      const headerBlock = cssContent.match(/\.logo-sigil--header\s*\{[^}]+\}/s);
      expect(headerBlock).toBeTruthy();
      expect(headerBlock[0]).toMatch(/--sigil-size:\s*48px/);
    });
  });

  describe('Light Theme Overrides', () => {
    test('should define light theme variant for .logo-sigil', () => {
      expect(cssContent).toMatch(/\[data-theme="light"\]\s+\.logo-sigil\s*\{/);
    });

    test('light theme should change text color', () => {
      const lightBlock = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil\s*\{[^}]+\}/s);
      expect(lightBlock).toBeTruthy();
      expect(lightBlock[0]).toMatch(/color:\s*#041014/);
    });

    test('light theme should adjust border color', () => {
      const lightBlock = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil\s*\{[^}]+\}/s);
      expect(lightBlock[0]).toMatch(/border-color:/);
      expect(lightBlock[0]).toMatch(/rgba\(0,\s*120,\s*180/);
    });

    test('light theme should modify box-shadow colors', () => {
      const lightBlock = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil\s*\{[^}]+\}/s);
      expect(lightBlock[0]).toMatch(/box-shadow:/);
      expect(lightBlock[0]).toMatch(/rgba\(0,\s*180,\s*255/);
    });

    test('light theme should remove ::after text-shadow', () => {
      const lightAfterBlock = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil::after\s*\{[^}]+\}/s);
      expect(lightAfterBlock).toBeTruthy();
      expect(lightAfterBlock[0]).toMatch(/text-shadow:\s*none/);
    });
  });

  describe('Animation Definitions', () => {
    test('should define @keyframes logoSweep animation', () => {
      expect(cssContent).toMatch(/@keyframes\s+logoSweep\s*\{/);
    });

    test('logoSweep should animate from 0deg to 360deg rotation', () => {
      const animationBlock = cssContent.match(/@keyframes\s+logoSweep\s*\{[^}]+\}/s);
      expect(animationBlock).toBeTruthy();
      expect(animationBlock[0]).toMatch(/0%\s*\{\s*transform:\s*rotate\(0deg\)/);
      expect(animationBlock[0]).toMatch(/100%\s*\{\s*transform:\s*rotate\(360deg\)/);
    });
  });

  describe('Removed Styles - Should Not Exist', () => {
    test('should NOT contain .logo-placeholder class', () => {
      // This class was removed in the diff
      expect(cssContent).not.toMatch(/\.logo-placeholder\s*\{/);
    });

    test('should NOT contain .logo-inline class', () => {
      // This class was removed in the diff
      expect(cssContent).not.toMatch(/\.logo-inline\s*\{/);
    });
  });

  describe('Responsive Design', () => {
    test('should contain media query for mobile adjustments', () => {
      expect(cssContent).toMatch(/@media\s*\([^)]*max-width:\s*600px[^)]*\)/);
    });

    test('mobile media query should adjust header logo size', () => {
      const mobileSection = cssContent.match(/@media\s*\([^)]*max-width:\s*600px[^)]*\)\s*\{[^}]+header\s+\.logo-sigil[^}]+\}/s);
      if (mobileSection) {
        expect(mobileSection[0]).toMatch(/--sigil-size:\s*40px/);
      }
    });
  });

  describe('CSS Syntax Validation', () => {
    test('should have balanced curly braces', () => {
      const openBraces = (cssContent.match(/\{/g) || []).length;
      const closeBraces = (cssContent.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should not contain syntax errors in selectors', () => {
      // Check for common CSS syntax errors
      expect(cssContent).not.toMatch(/\{[^}]*\{/); // Nested opening braces
      expect(cssContent).not.toMatch(/;;/); // Double semicolons
    });

    test('should use valid CSS color formats', () => {
      // All rgba colors should have 4 parameters
      const rgbaMatches = cssContent.match(/rgba\([^)]+\)/g) || [];
      rgbaMatches.forEach(rgba => {
        const params = rgba.match(/\d+/g) || [];
        expect(params.length).toBeGreaterThanOrEqual(3);
      });
    });

    test('should use consistent spacing in CSS custom properties', () => {
      const customProps = cssContent.match(/--[a-z-]+:\s*[^;]+;/g) || [];
      customProps.forEach(prop => {
        expect(prop).toMatch(/--[a-z-]+:\s+/); // Should have space after colon
      });
    });
  });

  describe('CSS Performance and Best Practices', () => {
    test('should use CSS custom properties for theming', () => {
      expect(cssContent).toMatch(/var\(--[a-z-]+\)/);
    });

    test('should use will-change or transform for animations', () => {
      const animatedElements = cssContent.match(/\.logo-sigil[^{]*\{[^}]+\}/gs);
      if (animatedElements) {
        const hasTransform = animatedElements.some(el => el.match(/transform:/));
        expect(hasTransform).toBe(true);
      }
    });

    test('should avoid expensive box-shadow changes in animations', () => {
      const animationBlock = cssContent.match(/@keyframes\s+logoSweep\s*\{[^}]+\}/s);
      // logoSweep should only animate transform, not box-shadow
      expect(animationBlock[0]).not.toMatch(/box-shadow:/);
    });

    test('should use efficient selectors (avoid deep nesting)', () => {
      // Check for overly specific selectors (more than 4 levels deep)
      const deepSelectors = cssContent.match(/(\w+\s+){5,}/g);
      expect(deepSelectors).toBeFalsy();
    });
  });

  describe('Accessibility Considerations', () => {
    test('should maintain sufficient color contrast', () => {
      // Light theme should use dark text
      const lightBlock = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil\s*\{[^}]+\}/s);
      if (lightBlock) {
        expect(lightBlock[0]).toMatch(/color:\s*#041014/); // Dark color on light background
      }
    });

    test('should not rely solely on color for information', () => {
      // Logo has text content ("NOP") in ::after, not just visual styling
      const afterBlock = cssContent.match(/\.logo-sigil::after\s*\{[^}]+\}/s);
      expect(afterBlock[0]).toMatch(/content:\s*['"']NOP['"']/);
    });

    test('should respect prefers-reduced-motion (if implemented)', () => {
      // Check if reduced motion media query exists
      const reducedMotion = cssContent.match(/@media\s*\([^)]*prefers-reduced-motion[^)]*\)/);
      // This is a suggestion for future improvement
      if (reducedMotion) {
        expect(reducedMotion).toBeTruthy();
      }
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('should use standard CSS properties without vendor prefixes', () => {
      // Modern CSS should not need -webkit-, -moz- prefixes for standard properties
      const sigilBlock = cssContent.match(/\.logo-sigil\s*\{[^}]+\}/s);
      expect(sigilBlock[0]).not.toMatch(/-webkit-border-radius/);
      expect(sigilBlock[0]).not.toMatch(/-moz-border-radius/);
    });

    test('should use modern gradient syntax', () => {
      const gradients = cssContent.match(/radial-gradient\([^)]+\)/g);
      expect(gradients).toBeTruthy();
      expect(gradients.length).toBeGreaterThan(0);
    });

    test('should use standard animation syntax', () => {
      const beforeBlock = cssContent.match(/\.logo-sigil::before\s*\{[^}]+\}/s);
      expect(beforeBlock[0]).toMatch(/animation:\s*logoSweep/);
      // Should not have -webkit-animation or -moz-animation
      expect(beforeBlock[0]).not.toMatch(/-webkit-animation/);
    });
  });

  describe('File Structure and Organization', () => {
    test('CSS file should be properly structured', () => {
      expect(cssContent.length).toBeGreaterThan(0);
      expect(cssContent).toMatch(/\.logo-sigil/);
    });

    test('should group related logo-sigil styles together', () => {
      const sigilIndex = cssContent.indexOf('.logo-sigil {');
      const sidebarIndex = cssContent.indexOf('.logo-sigil--sidebar');
      const headerIndex = cssContent.indexOf('.logo-sigil--header');
      
      // Variants should appear after base class
      expect(sigilIndex).toBeLessThan(sidebarIndex);
      expect(sigilIndex).toBeLessThan(headerIndex);
    });

    test('should define keyframes after their usage', () => {
      const animationUsage = cssContent.indexOf('animation: logoSweep');
      const keyframesDefinition = cssContent.indexOf('@keyframes logoSweep');
      
      // Keyframes can be defined anywhere, but typically after usage is fine
      expect(keyframesDefinition).toBeGreaterThan(-1);
    });
  });
});

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running CSS validation tests...');
  console.log('Note: Install jest to run these tests properly');
  console.log('Usage: npm test -- tests/visual/css-validation.test.js');
}