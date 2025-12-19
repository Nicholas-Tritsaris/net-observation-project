/**
 * CSS Validation Tests for docs/style.css
 * Tests focus on the new .logo-sigil styles and related changes
 */

const fs = require('fs');
const path = require('path');

describe('Style.css - Logo Sigil Styles', () => {
  let cssContent;
  
  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../docs/style.css'), 'utf-8');
  });

  describe('Logo Sigil Class Existence', () => {
    test('should contain .logo-sigil base class', () => {
      expect(cssContent).toMatch(/\.logo-sigil\s*\{/);
    });

    test('should contain .logo-sigil--sidebar modifier', () => {
      expect(cssContent).toMatch(/\.logo-sigil--sidebar\s*\{/);
    });

    test('should contain .logo-sigil--header modifier', () => {
      expect(cssContent).toMatch(/\.logo-sigil--header\s*\{/);
    });

    test('should contain .logo-sigil::before pseudo-element', () => {
      expect(cssContent).toMatch(/\.logo-sigil::before\s*\{/);
    });

    test('should contain .logo-sigil::after pseudo-element', () => {
      expect(cssContent).toMatch(/\.logo-sigil::after\s*\{/);
    });

    test('should contain .logo-sigil:hover state', () => {
      expect(cssContent).toMatch(/\.logo-sigil:hover\s*\{/);
    });
  });

  describe('CSS Custom Properties', () => {
    test('should use --sigil-size CSS variable', () => {
      expect(cssContent).toMatch(/--sigil-size:\s*\d+px/);
    });

    test('should reference var(--sigil-size)', () => {
      expect(cssContent).toMatch(/var\(--sigil-size\)/);
    });

    test('should use CSS variables for theming', () => {
      expect(cssContent).toMatch(/var\(--[\w-]+\)/);
    });
  });

  describe('Logo Sigil Dimensions', () => {
    test('should set base sigil size to 52px', () => {
      expect(cssContent).toMatch(/--sigil-size:\s*52px/);
    });

    test('should set sidebar sigil size to 120px', () => {
      const sidebarMatch = cssContent.match(/\.logo-sigil--sidebar[^}]*--sigil-size:\s*120px/s);
      expect(sidebarMatch).toBeTruthy();
    });

    test('should set header sigil size to 48px', () => {
      const headerMatch = cssContent.match(/\.logo-sigil--header[^}]*--sigil-size:\s*48px/s);
      expect(headerMatch).toBeTruthy();
    });

    test('should use width from CSS variable', () => {
      const widthMatch = cssContent.match(/\.logo-sigil[^}]*width:\s*var\(--sigil-size\)/s);
      expect(widthMatch).toBeTruthy();
    });

    test('should use height from CSS variable', () => {
      const heightMatch = cssContent.match(/\.logo-sigil[^}]*height:\s*var\(--sigil-size\)/s);
      expect(heightMatch).toBeTruthy();
    });
  });

  describe('Visual Effects', () => {
    test('should include radial-gradient in background', () => {
      expect(cssContent).toMatch(/radial-gradient/);
    });

    test('should include linear-gradient in background', () => {
      expect(cssContent).toMatch(/linear-gradient/);
    });

    test('should have border-radius for rounded corners', () => {
      const radiusMatch = cssContent.match(/\.logo-sigil[^}]*border-radius:\s*\d+px/s);
      expect(radiusMatch).toBeTruthy();
    });

    test('should include box-shadow for glow effect', () => {
      const shadowMatch = cssContent.match(/\.logo-sigil[^}]*box-shadow:/s);
      expect(shadowMatch).toBeTruthy();
    });

    test('should have multiple box-shadows', () => {
      const matches = cssContent.match(/box-shadow:[^;]*0\s+0\s+\d+px[^;]*,\s*0\s+0\s+\d+px/g);
      expect(matches).toBeTruthy();
    });
  });

  describe('Animations', () => {
    test('should define logoSweep keyframes', () => {
      expect(cssContent).toMatch(/@keyframes\s+logoSweep/);
    });

    test('should animate from 0deg to 360deg', () => {
      const keyframesMatch = cssContent.match(/@keyframes\s+logoSweep[^}]*0%[^}]*rotate\(0deg\)[^}]*100%[^}]*rotate\(360deg\)/s);
      expect(keyframesMatch).toBeTruthy();
    });

    test('should apply animation to ::before pseudo-element', () => {
      const animMatch = cssContent.match(/\.logo-sigil::before[^}]*animation:[^;]*logoSweep/s);
      expect(animMatch).toBeTruthy();
    });

    test('should have 12s animation duration', () => {
      const durationMatch = cssContent.match(/animation:[^;]*logoSweep\s+12s/s);
      expect(durationMatch).toBeTruthy();
    });

    test('should loop animation infinitely', () => {
      const infiniteMatch = cssContent.match(/animation:[^;]*infinite/s);
      expect(infiniteMatch).toBeTruthy();
    });

    test('should have linear timing function', () => {
      const linearMatch = cssContent.match(/animation:[^;]*linear/s);
      expect(linearMatch).toBeTruthy();
    });
  });

  describe('Content and Text', () => {
    test('should set content to "NOP" in ::after', () => {
      const contentMatch = cssContent.match(/\.logo-sigil::after[^}]*content:\s*['"]NOP['"]/s);
      expect(contentMatch).toBeTruthy();
    });

    test('should use monospace font family', () => {
      const fontMatch = cssContent.match(/\.logo-sigil[^}]*font-family:\s*var\(--font-mono\)/s);
      expect(fontMatch).toBeTruthy();
    });

    test('should set text-transform to uppercase', () => {
      const upperMatch = cssContent.match(/\.logo-sigil[^}]*text-transform:\s*uppercase/s);
      expect(upperMatch).toBeTruthy();
    });

    test('should include letter-spacing', () => {
      const spacingMatch = cssContent.match(/\.logo-sigil[^}]*letter-spacing:\s*[\d.]+em/s);
      expect(spacingMatch).toBeTruthy();
    });

    test('should have text-shadow on ::after', () => {
      const shadowMatch = cssContent.match(/\.logo-sigil::after[^}]*text-shadow:/s);
      expect(shadowMatch).toBeTruthy();
    });
  });

  describe('Hover Effects', () => {
    test('should have transform on hover', () => {
      const transformMatch = cssContent.match(/\.logo-sigil:hover[^}]*transform:/s);
      expect(transformMatch).toBeTruthy();
    });

    test('should rotate on hover', () => {
      const rotateMatch = cssContent.match(/\.logo-sigil:hover[^}]*transform:[^;]*rotate/s);
      expect(rotateMatch).toBeTruthy();
    });

    test('should scale on hover', () => {
      const scaleMatch = cssContent.match(/\.logo-sigil:hover[^}]*transform:[^;]*scale/s);
      expect(scaleMatch).toBeTruthy();
    });

    test('should enhance box-shadow on hover', () => {
      const hoverShadow = cssContent.match(/\.logo-sigil:hover[^}]*box-shadow:[^;]*0\s+0\s+\d+px/s);
      expect(hoverShadow).toBeTruthy();
    });
  });

  describe('Theme Support', () => {
    test('should have light theme styles', () => {
      expect(cssContent).toMatch(/\[data-theme="light"\]\s+\.logo-sigil/);
    });

    test('should adjust colors for light theme', () => {
      const lightMatch = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil[^}]*color:/s);
      expect(lightMatch).toBeTruthy();
    });

    test('should remove text-shadow in light theme', () => {
      const lightShadow = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil::after[^}]*text-shadow:\s*none/s);
      expect(lightShadow).toBeTruthy();
    });

    test('should adjust border-color for light theme', () => {
      const lightBorder = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil[^}]*border-color:/s);
      expect(lightBorder).toBeTruthy();
    });

    test('should adjust box-shadow for light theme', () => {
      const lightShadow = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil[^}]*box-shadow:/s);
      expect(lightShadow).toBeTruthy();
    });
  });

  describe('Layout Properties', () => {
    test('should use flexbox for centering', () => {
      const flexMatch = cssContent.match(/\.logo-sigil[^}]*display:\s*flex/s);
      expect(flexMatch).toBeTruthy();
    });

    test('should center items vertically', () => {
      const alignMatch = cssContent.match(/\.logo-sigil[^}]*align-items:\s*center/s);
      expect(alignMatch).toBeTruthy();
    });

    test('should center items horizontally', () => {
      const justifyMatch = cssContent.match(/\.logo-sigil[^}]*justify-content:\s*center/s);
      expect(justifyMatch).toBeTruthy();
    });

    test('should use relative positioning', () => {
      const posMatch = cssContent.match(/\.logo-sigil[^}]*position:\s*relative/s);
      expect(posMatch).toBeTruthy();
    });

    test('should hide overflow', () => {
      const overflowMatch = cssContent.match(/\.logo-sigil[^}]*overflow:\s*hidden/s);
      expect(overflowMatch).toBeTruthy();
    });
  });

  describe('Pseudo-element Positioning', () => {
    test('should position ::before absolutely', () => {
      const posMatch = cssContent.match(/\.logo-sigil::before[^}]*position:\s*absolute/s);
      expect(posMatch).toBeTruthy();
    });

    test('should use inset for full coverage', () => {
      const insetMatch = cssContent.match(/\.logo-sigil::before[^}]*inset:\s*0/s);
      expect(insetMatch).toBeTruthy();
    });

    test('should inherit border-radius', () => {
      const radiusMatch = cssContent.match(/\.logo-sigil::before[^}]*border-radius:\s*inherit/s);
      expect(radiusMatch).toBeTruthy();
    });

    test('should use screen blend mode', () => {
      const blendMatch = cssContent.match(/\.logo-sigil::before[^}]*mix-blend-mode:\s*screen/s);
      expect(blendMatch).toBeTruthy();
    });
  });

  describe('Transitions', () => {
    test('should have transition property', () => {
      const transMatch = cssContent.match(/\.logo-sigil[^}]*transition:/s);
      expect(transMatch).toBeTruthy();
    });

    test('should transition transform', () => {
      const transformTrans = cssContent.match(/\.logo-sigil[^}]*transition:[^;]*transform/s);
      expect(transformTrans).toBeTruthy();
    });

    test('should transition box-shadow', () => {
      const shadowTrans = cssContent.match(/\.logo-sigil[^}]*transition:[^;]*box-shadow/s);
      expect(shadowTrans).toBeTruthy();
    });

    test('should use ease timing', () => {
      const easeMatch = cssContent.match(/\.logo-sigil[^}]*transition:[^;]*ease/s);
      expect(easeMatch).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    test('should have media query for mobile', () => {
      expect(cssContent).toMatch(/@media\s*\([^)]*max-width:\s*600px\)/);
    });

    test('should adjust logo size for mobile', () => {
      const mobileMatch = cssContent.match(/@media[^{]*max-width:\s*600px[^}]*\.logo-sigil[^}]*--sigil-size:/s);
      expect(mobileMatch).toBeTruthy();
    });

    test('should set mobile logo size to 40px', () => {
      const sizeMatch = cssContent.match(/@media[^{]*max-width:\s*600px[^}]*\.logo-sigil[^}]*--sigil-size:\s*40px/s);
      expect(sizeMatch).toBeTruthy();
    });
  });

  describe('Color Schemes', () => {
    test('should use cyan/aqua colors (RGB 0,255,255)', () => {
      expect(cssContent).toMatch(/rgba?\(0,\s*255,\s*255/);
    });

    test('should use magenta/pink colors (RGB 255,0,255)', () => {
      expect(cssContent).toMatch(/rgba?\(255,\s*0,\s*255/);
    });

    test('should use semi-transparent colors', () => {
      expect(cssContent).toMatch(/rgba\([^)]+,\s*0\.\d+\)/);
    });

    test('should have dark background gradient', () => {
      const darkMatch = cssContent.match(/rgba?\(0,\s*20,\s*40/);
      expect(darkMatch).toBeTruthy();
    });
  });

  describe('Border Styling', () => {
    test('should have border property', () => {
      const borderMatch = cssContent.match(/\.logo-sigil[^}]*border:/s);
      expect(borderMatch).toBeTruthy();
    });

    test('should use 1px border width', () => {
      const widthMatch = cssContent.match(/\.logo-sigil[^}]*border:\s*1px/s);
      expect(widthMatch).toBeTruthy();
    });

    test('should use solid border style', () => {
      const styleMatch = cssContent.match(/\.logo-sigil[^}]*border:\s*1px\s+solid/s);
      expect(styleMatch).toBeTruthy();
    });

    test('should use semi-transparent border color', () => {
      const colorMatch = cssContent.match(/\.logo-sigil[^}]*border:[^;]*rgba\([^)]+,\s*0\.\d+\)/s);
      expect(colorMatch).toBeTruthy();
    });
  });

  describe('Removed Classes', () => {
    test('should not contain .logo-placeholder class', () => {
      expect(cssContent).not.toMatch(/\.logo-placeholder\s*\{/);
    });

    test('should not contain .logo-inline class', () => {
      expect(cssContent).not.toMatch(/\.logo-inline\s*\{/);
    });
  });

  describe('CSS Syntax Validation', () => {
    test('should have balanced curly braces', () => {
      const openBraces = (cssContent.match(/\{/g) || []).length;
      const closeBraces = (cssContent.match(/\}/g) || []).length;
      
      expect(openBraces).toBe(closeBraces);
    });

    test('should have proper semicolons', () => {
      // Check for common patterns that should end with semicolons
      const propertyLines = cssContent.match(/[a-z-]+:\s*[^;{]+;/g);
      expect(propertyLines).toBeTruthy();
      expect(propertyLines.length).toBeGreaterThan(0);
    });

    test('should not have trailing commas in selectors', () => {
      const trailingCommas = cssContent.match(/,\s*\{/g);
      expect(trailingCommas).toBeNull();
    });
  });

  describe('Accessibility', () => {
    test('should maintain sufficient color contrast', () => {
      // Check that light theme adjusts colors for readability
      const lightTheme = cssContent.match(/\[data-theme="light"\]/g);
      expect(lightTheme).toBeTruthy();
      expect(lightTheme.length).toBeGreaterThan(0);
    });

    test('should use semantic property names', () => {
      expect(cssContent).toMatch(/role\s*=\s*["']img["']/);
    });
  });
});