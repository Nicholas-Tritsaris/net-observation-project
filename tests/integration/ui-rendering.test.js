/**
 * UI Rendering and Visual Tests
 * Testing the visual aspects of logo-sigil changes
 */

const fs = require('fs');

describe('UI Rendering - Logo Sigil Visual Properties', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('logo-sigil should have cyber-neon color scheme', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    
    // Cyan/turquoise colors (0, 255, 255)
    expect(sigilStyles[0]).toContain('rgba(0, 255, 255');
    
    // Magenta/purple colors (255, 0, 255)
    expect(sigilStyles[0]).toContain('rgba(255, 0, 255');
  });

  test('logo-sigil should have glow effects', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    
    // Multiple box-shadows for layered glow
    const boxShadows = sigilStyles[0].match(/box-shadow:[^;]+;/);
    expect(boxShadows).toBeTruthy();
    expect(boxShadows[0]).toContain('0 0');
  });

  test('logo-sigil should be square with rounded corners', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    
    expect(sigilStyles[0]).toContain('width: var(--sigil-size)');
    expect(sigilStyles[0]).toContain('height: var(--sigil-size)');
    expect(sigilStyles[0]).toContain('border-radius:');
  });

  test('logo-sigil should use monospace font', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilStyles[0]).toContain('font-family: var(--font-mono)');
  });

  test('logo-sigil should have proper text spacing', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilStyles[0]).toContain('letter-spacing:');
    expect(sigilStyles[0]).toContain('text-transform: uppercase');
  });
});

describe('UI Rendering - Animation Quality', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('logoSweep animation should be smooth and continuous', () => {
    const animation = cssContent.match(/@keyframes\s+logoSweep\s*{[\s\S]*?}/);
    expect(animation[0]).toContain('linear');
    
    const animationUse = cssContent.match(/animation:\s*logoSweep\s+12s\s+linear\s+infinite/);
    expect(animationUse).toBeTruthy();
  });

  test('hover animation should have easing for smoothness', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilStyles[0]).toContain('ease');
  });

  test('transition duration should be appropriate for UX', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    const transitions = sigilStyles[0].match(/transition:[^;]+;/);
    expect(transitions).toBeTruthy();
    expect(transitions[0]).toContain('0.4s');
  });
});

describe('UI Rendering - Gradient Complexity', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('should use multiple gradient layers', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    
    // Count gradient functions
    const radialGradients = (sigilStyles[0].match(/radial-gradient/g) || []).length;
    const linearGradients = (sigilStyles[0].match(/linear-gradient/g) || []).length;
    
    expect(radialGradients).toBeGreaterThanOrEqual(2);
    expect(linearGradients).toBeGreaterThanOrEqual(1);
  });

  test('::before pseudo-element should use conic gradient', () => {
    const beforeStyles = cssContent.match(/\.logo-sigil::before\s*{[\s\S]*?^}/m);
    expect(beforeStyles[0]).toContain('conic-gradient');
  });

  test('gradients should have transparency for layering', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    
    // Check for transparent color stops
    expect(sigilStyles[0]).toMatch(/rgba\([^)]+,\s*0\)/);
  });
});

describe('UI Rendering - Variant Sizing', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('sidebar variant should be largest', () => {
    const sidebarSize = cssContent.match(/\.logo-sigil--sidebar\s*{[\s\S]*?--sigil-size:\s*(\d+)px/);
    expect(sidebarSize).toBeTruthy();
    expect(parseInt(sidebarSize[1])).toBe(120);
  });

  test('header variant should be medium', () => {
    const headerSize = cssContent.match(/\.logo-sigil--header\s*{[\s\S]*?--sigil-size:\s*(\d+)px/);
    expect(headerSize).toBeTruthy();
    expect(parseInt(headerSize[1])).toBe(48);
  });

  test('base size should be default', () => {
    const baseSize = cssContent.match(/\.logo-sigil\s*{[\s\S]*?--sigil-size:\s*(\d+)px/);
    expect(baseSize).toBeTruthy();
    expect(parseInt(baseSize[1])).toBe(52);
  });

  test('variants should scale proportionally', () => {
    const sidebarSize = 120;
    const headerSize = 48;
    const baseSize = 52;
    
    // Header should be smaller than base, sidebar should be largest
    expect(headerSize).toBeLessThan(baseSize);
    expect(sidebarSize).toBeGreaterThan(baseSize);
  });
});

describe('UI Rendering - Blend Modes and Effects', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('::before should use screen blend mode for glow effect', () => {
    const beforeStyles = cssContent.match(/\.logo-sigil::before\s*{[\s\S]*?^}/m);
    expect(beforeStyles[0]).toContain('mix-blend-mode: screen');
  });

  test('::before should have reduced opacity for subtlety', () => {
    const beforeStyles = cssContent.match(/\.logo-sigil::before\s*{[\s\S]*?^}/m);
    expect(beforeStyles[0]).toContain('opacity:');
    
    const opacity = beforeStyles[0].match(/opacity:\s*([\d.]+)/);
    expect(opacity).toBeTruthy();
    expect(parseFloat(opacity[1])).toBeLessThanOrEqual(1);
  });

  test('::after should have text-shadow for neon effect', () => {
    const afterStyles = cssContent.match(/\.logo-sigil::after\s*{[\s\S]*?^}/m);
    expect(afterStyles[0]).toContain('text-shadow:');
    expect(afterStyles[0]).toContain('rgba(0, 255, 255');
  });
});

describe('UI Rendering - Responsive Adjustments', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('should have mobile breakpoint defined', () => {
    expect(cssContent).toMatch(/@media[^{]*max-width:\s*600px/);
  });

  test('mobile styles should reduce logo size', () => {
    const mobileSection = cssContent.match(/@media\s*\([^)]*max-width:\s*600px[^)]*\)\s*{[\s\S]*?(?=@media|$)/);
    
    if (mobileSection && mobileSection[0].includes('logo-sigil')) {
      expect(mobileSection[0]).toMatch(/--sigil-size:\s*40px/);
    }
  });
});

describe('UI Rendering - Theme Consistency', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('light theme should adjust colors appropriately', () => {
    const lightTheme = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil\s*{[\s\S]*?}/);
    expect(lightTheme).toBeTruthy();
    
    // Should use darker colors for light theme
    expect(lightTheme[0]).toContain('color:');
    expect(lightTheme[0]).toContain('border-color:');
  });

  test('light theme should reduce or remove glow effects', () => {
    const lightTheme = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil\s*{[\s\S]*?}/);
    expect(lightTheme[0]).toContain('box-shadow:');
    
    // Should have different box-shadow than dark theme
    const darkShadow = cssContent.match(/\.logo-sigil\s*{[\s\S]*?box-shadow:[^;]+/);
    const lightShadow = lightTheme[0].match(/box-shadow:[^;]+/);
    
    expect(darkShadow[0]).not.toBe(lightShadow[0]);
  });

  test('light theme should remove text-shadow from ::after', () => {
    const lightAfter = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil::after\s*{[\s\S]*?}/);
    expect(lightAfter).toBeTruthy();
    expect(lightAfter[0]).toContain('text-shadow: none');
  });
});

describe('UI Rendering - Content Display', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('::after should display NOP text', () => {
    const afterStyles = cssContent.match(/\.logo-sigil::after\s*{[\s\S]*?^}/m);
    expect(afterStyles[0]).toContain("content: 'NOP'");
  });

  test('::after content should be positioned relatively', () => {
    const afterStyles = cssContent.match(/\.logo-sigil::after\s*{[\s\S]*?^}/m);
    expect(afterStyles[0]).toContain('position: relative');
  });

  test('::before should be empty (used for animation overlay)', () => {
    const beforeStyles = cssContent.match(/\.logo-sigil::before\s*{[\s\S]*?^}/m);
    expect(beforeStyles[0]).toContain('content: ""');
  });
});

describe('UI Rendering - Layout Properties', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('should use flexbox for centering', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilStyles[0]).toContain('display: flex');
    expect(sigilStyles[0]).toContain('align-items: center');
    expect(sigilStyles[0]).toContain('justify-content: center');
  });

  test('should handle overflow for pseudo-elements', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilStyles[0]).toContain('overflow: hidden');
  });

  test('::before should cover entire parent', () => {
    const beforeStyles = cssContent.match(/\.logo-sigil::before\s*{[\s\S]*?^}/m);
    expect(beforeStyles[0]).toContain('position: absolute');
    expect(beforeStyles[0]).toContain('inset: 0');
  });

  test('::before should inherit border-radius', () => {
    const beforeStyles = cssContent.match(/\.logo-sigil::before\s*{[\s\S]*?^}/m);
    expect(beforeStyles[0]).toContain('border-radius: inherit');
  });
});