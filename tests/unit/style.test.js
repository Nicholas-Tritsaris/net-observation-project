import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const cssContent = fs.readFileSync(path.join(process.cwd(), 'docs/style.css'), 'utf-8');

describe('CSS Style Tests - Logo Sigil', () => {
  it('should contain logo-sigil class definition', () => {
    expect(cssContent).toContain('.logo-sigil');
  });

  it('should define logo-sigil size with CSS variable', () => {
    expect(cssContent).toContain('--sigil-size');
  });

  it('should have logo-sigil--sidebar variant', () => {
    expect(cssContent).toContain('.logo-sigil--sidebar');
  });

  it('should have logo-sigil--header variant', () => {
    expect(cssContent).toContain('.logo-sigil--header');
  });

  it('should define logoSweep animation', () => {
    expect(cssContent).toContain('@keyframes logoSweep');
  });

  it('should apply logoSweep animation to logo-sigil::before', () => {
    const animationMatch = cssContent.match(/\.logo-sigil::before[\s\S]*?animation:\s*logoSweep/);
    expect(animationMatch).toBeTruthy();
  });

  it('should have theme-specific styles for light mode', () => {
    expect(cssContent).toContain('[data-theme="light"] .logo-sigil');
  });

  it('should define border-radius for logo-sigil', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?}/);
    expect(logoSigilSection).toBeTruthy();
    expect(logoSigilSection[0]).toContain('border-radius');
  });

  it('should use radial and linear gradients for background', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?background:[\s\S]*?;/);
    expect(logoSigilSection).toBeTruthy();
    expect(logoSigilSection[0]).toContain('radial-gradient');
    expect(logoSigilSection[0]).toContain('linear-gradient');
  });

  it('should define box-shadow with neon glow effect', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?box-shadow:[\s\S]*?;/);
    expect(logoSigilSection).toBeTruthy();
    expect(logoSigilSection[0]).toContain('rgba');
  });

  it('should use ::before pseudo-element for animation layer', () => {
    expect(cssContent).toContain('.logo-sigil::before');
  });

  it('should use ::after pseudo-element for content', () => {
    expect(cssContent).toContain('.logo-sigil::after');
  });

  it('should display "NOP" text in ::after content', () => {
    const afterMatch = cssContent.match(/\.logo-sigil::after[\s\S]*?content:\s*['"]NOP['"]/);
    expect(afterMatch).toBeTruthy();
  });

  it('should define hover state with transform effects', () => {
    expect(cssContent).toContain('.logo-sigil:hover');
    const hoverSection = cssContent.match(/\.logo-sigil:hover[\s\S]*?}/);
    expect(hoverSection[0]).toContain('transform');
  });

  it('should use conic-gradient for animated effect', () => {
    const beforeSection = cssContent.match(/\.logo-sigil::before[\s\S]*?}/);
    expect(beforeSection).toBeTruthy();
    expect(beforeSection[0]).toContain('conic-gradient');
  });

  it('should apply mix-blend-mode to ::before element', () => {
    const beforeSection = cssContent.match(/\.logo-sigil::before[\s\S]*?}/);
    expect(beforeSection[0]).toContain('mix-blend-mode');
  });

  it('should define transition for smooth animations', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?transition:[\s\S]*?;/);
    expect(logoSigilSection).toBeTruthy();
  });

  it('should set sidebar variant size to 120px', () => {
    const sidebarMatch = cssContent.match(/\.logo-sigil--sidebar[\s\S]*?--sigil-size:\s*120px/);
    expect(sidebarMatch).toBeTruthy();
  });

  it('should set header variant size to 48px', () => {
    const headerMatch = cssContent.match(/\.logo-sigil--header[\s\S]*?--sigil-size:\s*48px/);
    expect(headerMatch).toBeTruthy();
  });

  it('should define different light theme colors', () => {
    const lightThemeSection = cssContent.match(/\[data-theme="light"\] \.logo-sigil[\s\S]*?}/);
    expect(lightThemeSection).toBeTruthy();
    expect(lightThemeSection[0]).toContain('color');
  });

  it('should remove text-shadow in light theme for ::after', () => {
    const lightAfterMatch = cssContent.match(/\[data-theme="light"\] \.logo-sigil::after[\s\S]*?}/);
    expect(lightAfterMatch).toBeTruthy();
    expect(lightAfterMatch[0]).toContain('text-shadow: none');
  });

  it('should animate from 0deg to 360deg', () => {
    const keyframesMatch = cssContent.match(/@keyframes logoSweep[\s\S]*?0%[\s\S]*?100%[\s\S]*?}/);
    expect(keyframesMatch).toBeTruthy();
    expect(keyframesMatch[0]).toContain('0deg');
    expect(keyframesMatch[0]).toContain('360deg');
  });

  it('should use flexbox for centering content', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?}/);
    expect(logoSigilSection[0]).toContain('display: flex');
    expect(logoSigilSection[0]).toContain('align-items');
    expect(logoSigilSection[0]).toContain('justify-content');
  });

  it('should set position relative for pseudo-element layering', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?}/);
    expect(logoSigilSection[0]).toContain('position: relative');
  });

  it('should set overflow hidden to contain effects', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?}/);
    expect(logoSigilSection[0]).toContain('overflow: hidden');
  });

  it('should not contain old logo-placeholder class', () => {
    expect(cssContent.includes('.logo-placeholder {')).toBe(false);
  });

  it('should not contain old logo-inline class', () => {
    expect(cssContent.includes('.logo-inline {')).toBe(false);
  });

  it('should use monospace font family', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?}/);
    expect(logoSigilSection[0]).toContain('font-family: var(--font-mono)');
  });

  it('should apply uppercase text transformation', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?}/);
    expect(logoSigilSection[0]).toContain('text-transform: uppercase');
  });

  it('should define letter-spacing for visual effect', () => {
    const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?}/);
    expect(logoSigilSection[0]).toContain('letter-spacing');
  });

  describe('CSS Animation Properties', () => {
    it('should set animation duration to 12 seconds', () => {
      const animationMatch = cssContent.match(/animation:\s*logoSweep\s+12s/);
      expect(animationMatch).toBeTruthy();
    });

    it('should set animation timing to linear', () => {
      const animationMatch = cssContent.match(/animation:\s*logoSweep[\s\w]*linear/);
      expect(animationMatch).toBeTruthy();
    });

    it('should set animation to infinite', () => {
      const animationMatch = cssContent.match(/animation:\s*logoSweep[\s\w]*infinite/);
      expect(animationMatch).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should have media query for mobile devices', () => {
      expect(cssContent).toContain('@media (max-width: 600px)');
    });

    it('should adjust logo size on mobile', () => {
      const mobileMatch = cssContent.match(/@media \(max-width: 600px\)[\s\S]*?\.logo-sigil[\s\S]*?--sigil-size/);
      expect(mobileMatch).toBeTruthy();
    });
  });

  describe('Color Values', () => {
    it('should use cyan-magenta color scheme', () => {
      const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?background:[\s\S]*?;/);
      expect(logoSigilSection[0]).toContain('0, 255, 255'); // Cyan
      expect(logoSigilSection[0]).toContain('255, 0, 255'); // Magenta
    });

    it('should define semi-transparent colors', () => {
      const logoSigilSection = cssContent.match(/\.logo-sigil\s*{[\s\S]*?}/);
      expect(logoSigilSection[0]).toContain('rgba');
    });
  });

  describe('Pseudo-element Specifics', () => {
    it('should position ::before absolutely', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before[\s\S]*?}/);
      expect(beforeSection[0]).toContain('position: absolute');
    });

    it('should set ::before inset to 0', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before[\s\S]*?}/);
      expect(beforeSection[0]).toContain('inset: 0');
    });

    it('should inherit border-radius in ::before', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before[\s\S]*?}/);
      expect(beforeSection[0]).toContain('border-radius: inherit');
    });

    it('should set ::after position to relative', () => {
      const afterSection = cssContent.match(/\.logo-sigil::after[\s\S]*?}/);
      expect(afterSection[0]).toContain('position: relative');
    });

    it('should define ::after font-size', () => {
      const afterSection = cssContent.match(/\.logo-sigil::after[\s\S]*?}/);
      expect(afterSection[0]).toContain('font-size');
    });
  });
});

describe('CSS Structure and Validity', () => {
  it('should not have syntax errors (balanced braces)', () => {
    const openBraces = (cssContent.match(/{/g) || []).length;
    const closeBraces = (cssContent.match(/}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });

  it('should use consistent indentation', () => {
    const lines = cssContent.split('\n');
    const indentedLines = lines.filter(line => line.startsWith('  ') || line.startsWith('\t'));
    expect(indentedLines.length).toBeGreaterThan(0);
  });

  it('should end property declarations with semicolons', () => {
    const propertyLines = cssContent.match(/^\s+[a-z-]+:\s*[^;{]+;/gm);
    expect(propertyLines).toBeTruthy();
    expect(propertyLines.length).toBeGreaterThan(10);
  });

  it('should use CSS custom properties (variables)', () => {
    expect(cssContent).toContain('var(--');
  });

  it('should define custom properties with double-dash prefix', () => {
    expect(cssContent).toContain('--sigil-size');
  });
});