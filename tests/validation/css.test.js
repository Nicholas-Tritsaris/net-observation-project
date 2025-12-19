/**
 * CSS Validation Tests for docs/style.css
 * Testing changes: logo-sigil classes replacing logo-placeholder and logo-inline
 */

const fs = require('fs');
const path = require('path');

describe('CSS - Logo Sigil Styles', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('should define .logo-sigil base class', () => {
    expect(cssContent).toMatch(/\.logo-sigil\s*{/);
  });

  test('.logo-sigil should have CSS custom property for size', () => {
    const sigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?}/);
    expect(sigilSection).toBeTruthy();
    expect(sigilSection[0]).toContain('--sigil-size: 52px');
  });

  test('.logo-sigil should have proper dimensions', () => {
    const sigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilSection[0]).toContain('width: var(--sigil-size)');
    expect(sigilSection[0]).toContain('height: var(--sigil-size)');
  });

  test('.logo-sigil should have border-radius', () => {
    const sigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilSection[0]).toContain('border-radius: 18px');
  });

  test('.logo-sigil should have complex gradient background', () => {
    const sigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilSection[0]).toContain('radial-gradient');
    expect(sigilSection[0]).toContain('linear-gradient');
    expect(sigilSection[0]).toContain('rgba(0, 255, 255');
    expect(sigilSection[0]).toContain('rgba(255, 0, 255');
  });

  test('.logo-sigil should have neon glow box-shadow', () => {
    const sigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilSection[0]).toContain('box-shadow:');
    expect(sigilSection[0]).toContain('rgba(0, 255, 255, 0.4)');
    expect(sigilSection[0]).toContain('rgba(255, 0, 170, 0.3)');
  });

  test('.logo-sigil should have flexbox centering', () => {
    const sigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilSection[0]).toContain('display: flex');
    expect(sigilSection[0]).toContain('align-items: center');
    expect(sigilSection[0]).toContain('justify-content: center');
  });

  test('.logo-sigil should have transition animation', () => {
    const sigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilSection[0]).toContain('transition:');
    expect(sigilSection[0]).toMatch(/transform.*ease/);
    expect(sigilSection[0]).toMatch(/box-shadow.*ease/);
  });
});

describe('CSS - Logo Sigil Pseudo-elements', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('.logo-sigil::before should create animated gradient overlay', () => {
    expect(cssContent).toMatch(/\.logo-sigil::before\s*{/);
    
    const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[\s\S]*?^}/m);
    expect(beforeSection[0]).toContain('content: ""');
    expect(beforeSection[0]).toContain('position: absolute');
    expect(beforeSection[0]).toContain('inset: 0');
    expect(beforeSection[0]).toContain('conic-gradient');
    expect(beforeSection[0]).toContain('animation: logoSweep 12s linear infinite');
  });

  test('.logo-sigil::after should display NOP text', () => {
    expect(cssContent).toMatch(/\.logo-sigil::after\s*{/);
    
    const afterSection = cssContent.match(/\.logo-sigil::after\s*{[\s\S]*?^}/m);
    expect(afterSection[0]).toContain("content: 'NOP'");
    expect(afterSection[0]).toContain('position: relative');
    expect(afterSection[0]).toContain('text-shadow:');
  });
});

describe('CSS - Logo Sigil Hover State', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('.logo-sigil:hover should have transform effect', () => {
    expect(cssContent).toMatch(/\.logo-sigil:hover\s*{/);
    
    const hoverSection = cssContent.match(/\.logo-sigil:hover\s*{[\s\S]*?}/);
    expect(hoverSection[0]).toContain('transform: rotate(-2deg) scale(1.02)');
  });

  test('.logo-sigil:hover should enhance glow', () => {
    const hoverSection = cssContent.match(/\.logo-sigil:hover\s*{[\s\S]*?}/);
    expect(hoverSection[0]).toContain('box-shadow:');
    expect(hoverSection[0]).toContain('rgba(0, 255, 255, 0.45)');
    expect(hoverSection[0]).toContain('rgba(255, 0, 170, 0.35)');
  });
});

describe('CSS - Logo Sigil Variants', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('.logo-sigil--sidebar variant should exist', () => {
    expect(cssContent).toMatch(/\.logo-sigil--sidebar\s*{/);
  });

  test('.logo-sigil--sidebar should have larger size', () => {
    const sidebarSection = cssContent.match(/\.logo-sigil--sidebar\s*{[\s\S]*?}/);
    expect(sidebarSection[0]).toContain('--sigil-size: 120px');
  });

  test('.logo-sigil--sidebar should have specific styling', () => {
    const sidebarSection = cssContent.match(/\.logo-sigil--sidebar\s*{[\s\S]*?}/);
    expect(sidebarSection[0]).toContain('border-radius: 24px');
    expect(sidebarSection[0]).toContain('margin-bottom: 1rem');
    expect(sidebarSection[0]).toContain('font-size: 1.35rem');
  });

  test('.logo-sigil--header variant should exist', () => {
    expect(cssContent).toMatch(/\.logo-sigil--header\s*{/);
  });

  test('.logo-sigil--header should have smaller size', () => {
    const headerSection = cssContent.match(/\.logo-sigil--header\s*{[\s\S]*?}/);
    expect(headerSection[0]).toContain('--sigil-size: 48px');
  });
});

describe('CSS - Logo Sigil Light Theme', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('[data-theme="light"] .logo-sigil should have light theme styles', () => {
    expect(cssContent).toMatch(/\[data-theme="light"\]\s+\.logo-sigil\s*{/);
    
    const lightSection = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil\s*{[\s\S]*?}/);
    expect(lightSection[0]).toContain('color: #041014');
    expect(lightSection[0]).toContain('border-color:');
    expect(lightSection[0]).toContain('box-shadow:');
  });

  test('[data-theme="light"] .logo-sigil::after should remove text-shadow', () => {
    expect(cssContent).toMatch(/\[data-theme="light"\]\s+\.logo-sigil::after/);
    
    const lightAfterSection = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil::after\s*{[\s\S]*?}/);
    expect(lightAfterSection[0]).toContain('text-shadow: none');
  });
});

describe('CSS - Logo Sweep Animation', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('@keyframes logoSweep should be defined', () => {
    expect(cssContent).toMatch(/@keyframes\s+logoSweep\s*{/);
  });

  test('logoSweep should rotate 360 degrees', () => {
    const animSection = cssContent.match(/@keyframes\s+logoSweep\s*{[\s\S]*?}/);
    expect(animSection[0]).toContain('0%');
    expect(animSection[0]).toContain('100%');
    expect(animSection[0]).toContain('transform: rotate(0deg)');
    expect(animSection[0]).toContain('transform: rotate(360deg)');
  });
});

describe('CSS - Old Logo Classes Removed', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('.logo-placeholder class should not exist', () => {
    expect(cssContent).not.toMatch(/\.logo-placeholder\s*{/);
  });

  test('.logo-inline class should not exist', () => {
    expect(cssContent).not.toMatch(/\.logo-inline\s*{/);
  });

  test('old sidebar logo-placeholder selector should not exist', () => {
    expect(cssContent).not.toMatch(/\.sidebar\s+\.logo-placeholder/);
  });
});

describe('CSS - Responsive Logo Styles', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('mobile media query should adjust logo-sigil size', () => {
    const mediaQuery = cssContent.match(/@media\s*\([^)]*max-width:\s*600px[^)]*\)\s*{[\s\S]*?^}/m);
    
    if (mediaQuery) {
      expect(mediaQuery[0]).toMatch(/\.logo-sigil|--sigil-size:\s*40px/);
    }
  });
});

describe('CSS - Syntax Validation', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('CSS should have balanced braces', () => {
    const openBraces = (cssContent.match(/{/g) || []).length;
    const closeBraces = (cssContent.match(/}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });

  test('CSS should have balanced parentheses', () => {
    const openParens = (cssContent.match(/\(/g) || []).length;
    const closeParens = (cssContent.match(/\)/g) || []).length;
    expect(openParens).toBe(closeParens);
  });

  test('CSS custom properties should use valid syntax', () => {
    const customProps = cssContent.match(/--[\w-]+:\s*[^;]+;/g);
    expect(customProps).toBeTruthy();
    customProps.forEach(prop => {
      expect(prop).toMatch(/^--[\w-]+:/);
    });
  });

  test('CSS should not have TODO or FIXME comments', () => {
    expect(cssContent.toLowerCase()).not.toContain('todo');
    expect(cssContent.toLowerCase()).not.toContain('fixme');
  });
});