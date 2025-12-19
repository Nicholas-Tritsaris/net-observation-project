import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('CSS Style Tests - Logo Sigil and Theme Changes', () => {
  let cssContent;

  beforeEach(() => {
    cssContent = readFileSync(resolve(__dirname, '../../docs/style.css'), 'utf-8');
  });

  describe('Logo Sigil Class Structure', () => {
    it('should define .logo-sigil base class', () => {
      expect(cssContent).toContain('.logo-sigil');
    });

    it('should define .logo-sigil--sidebar modifier', () => {
      expect(cssContent).toContain('.logo-sigil--sidebar');
    });

    it('should define .logo-sigil--header modifier', () => {
      expect(cssContent).toContain('.logo-sigil--header');
    });

    it('should define .logo-sigil::before pseudo-element', () => {
      expect(cssContent).toContain('.logo-sigil::before');
    });

    it('should define .logo-sigil::after pseudo-element', () => {
      expect(cssContent).toContain('.logo-sigil::after');
    });

    it('should define .logo-sigil:hover state', () => {
      expect(cssContent).toContain('.logo-sigil:hover');
    });
  });

  describe('Logo Sigil CSS Properties', () => {
    it('should define --sigil-size CSS variable', () => {
      expect(cssContent).toMatch(/--sigil-size:\s*\d+px/);
    });

    it('should use border-radius for rounded corners', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection).toBeTruthy();
      expect(sigilSection[0]).toContain('border-radius');
    });

    it('should define gradient background', () => {
      expect(cssContent).toContain('radial-gradient');
      expect(cssContent).toContain('linear-gradient');
    });

    it('should define box-shadow for glow effect', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection[0]).toContain('box-shadow');
    });

    it('should define transition properties', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection[0]).toContain('transition');
    });
  });

  describe('Logo Sigil Animation', () => {
    it('should define logoSweep keyframes animation', () => {
      expect(cssContent).toContain('@keyframes logoSweep');
    });

    it('should animate from 0deg to 360deg rotation', () => {
      const animationSection = cssContent.match(/@keyframes logoSweep\s*{[^}]+}/s);
      expect(animationSection).toBeTruthy();
      expect(animationSection[0]).toContain('0%');
      expect(animationSection[0]).toContain('100%');
      expect(animationSection[0]).toContain('rotate(0deg)');
      expect(animationSection[0]).toContain('rotate(360deg)');
    });

    it('should apply animation to ::before pseudo-element', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[^}]+}/s);
      expect(beforeSection[0]).toContain('animation');
      expect(beforeSection[0]).toContain('logoSweep');
    });

    it('should use conic-gradient for animation effect', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[^}]+}/s);
      expect(beforeSection[0]).toContain('conic-gradient');
    });
  });

  describe('Logo Sigil Content', () => {
    it('should display "NOP" text in ::after pseudo-element', () => {
      const afterSection = cssContent.match(/\.logo-sigil::after\s*{[^}]+}/s);
      expect(afterSection[0]).toContain("content: 'NOP'");
    });

    it('should apply text-shadow to ::after pseudo-element', () => {
      const afterSection = cssContent.match(/\.logo-sigil::after\s*{[^}]+}/s);
      expect(afterSection[0]).toContain('text-shadow');
    });
  });

  describe('Logo Sigil Size Variants', () => {
    it('should set sidebar variant to 120px', () => {
      const sidebarSection = cssContent.match(/\.logo-sigil--sidebar\s*{[^}]+}/s);
      expect(sidebarSection[0]).toContain('--sigil-size: 120px');
    });

    it('should set header variant to 48px', () => {
      const headerSection = cssContent.match(/\.logo-sigil--header\s*{[^}]+}/s);
      expect(headerSection[0]).toContain('--sigil-size: 48px');
    });

    it('should define base sigil size as 52px', () => {
      const baseSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(baseSection[0]).toContain('--sigil-size: 52px');
    });
  });

  describe('Light Theme Overrides', () => {
    it('should define light theme styles for .logo-sigil', () => {
      expect(cssContent).toMatch(/\[data-theme="light"\]\s+\.logo-sigil/);
    });

    it('should adjust colors for light theme', () => {
      const lightThemeSection = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil\s*{[^}]+}/s);
      expect(lightThemeSection).toBeTruthy();
      expect(lightThemeSection[0]).toContain('color');
    });

    it('should remove text-shadow in light theme ::after', () => {
      const lightAfterSection = cssContent.match(/\[data-theme="light"\]\s+\.logo-sigil::after\s*{[^}]+}/s);
      expect(lightAfterSection[0]).toContain('text-shadow: none');
    });
  });

  describe('Hover Effects', () => {
    it('should define transform on hover', () => {
      const hoverSection = cssContent.match(/\.logo-sigil:hover\s*{[^}]+}/s);
      expect(hoverSection[0]).toContain('transform');
    });

    it('should scale and rotate on hover', () => {
      const hoverSection = cssContent.match(/\.logo-sigil:hover\s*{[^}]+}/s);
      expect(hoverSection[0]).toMatch(/scale\([\d.]+\)/);
      expect(hoverSection[0]).toMatch(/rotate\(-?\d+deg\)/);
    });

    it('should enhance box-shadow on hover', () => {
      const hoverSection = cssContent.match(/\.logo-sigil:hover\s*{[^}]+}/s);
      expect(hoverSection[0]).toContain('box-shadow');
    });
  });

  describe('Responsive Design', () => {
    it('should define mobile breakpoint styles', () => {
      expect(cssContent).toContain('@media (max-width: 600px)');
    });

    it('should adjust header logo size for mobile', () => {
      const mobileSection = cssContent.match(/@media \(max-width: 600px\)\s*{[^}]+header\s+\.logo-sigil[^}]+}/s);
      expect(mobileSection).toBeTruthy();
      expect(mobileSection[0]).toContain('--sigil-size: 40px');
    });
  });

  describe('Color Values', () => {
    it('should use cyan (0, 255, 255) in gradients', () => {
      expect(cssContent).toMatch(/rgba?\(0,\s*255,\s*255/);
    });

    it('should use magenta (255, 0, 255) in gradients', () => {
      expect(cssContent).toMatch(/rgba?\(255,\s*0,\s*255/);
    });

    it('should use semi-transparent colors', () => {
      expect(cssContent).toMatch(/rgba?\([^)]+,\s*0\.\d+\)/);
    });
  });

  describe('Layout Properties', () => {
    it('should use flexbox for centering', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection[0]).toContain('display: flex');
      expect(sigilSection[0]).toContain('align-items: center');
      expect(sigilSection[0]).toContain('justify-content: center');
    });

    it('should set position relative for pseudo-elements', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection[0]).toContain('position: relative');
    });

    it('should set overflow hidden', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection[0]).toContain('overflow: hidden');
    });
  });

  describe('Typography', () => {
    it('should use monospace font family', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection[0]).toContain('font-family: var(--font-mono)');
    });

    it('should define letter-spacing', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection[0]).toContain('letter-spacing');
    });

    it('should use uppercase text', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection[0]).toContain('text-transform: uppercase');
    });
  });

  describe('Removed Classes', () => {
    it('should not contain .logo-placeholder class', () => {
      // This class was removed in the changes
      const hasOldClass = cssContent.includes('.logo-placeholder {');
      expect(hasOldClass).toBe(false);
    });

    it('should not contain .logo-inline class definition', () => {
      // This class was removed in the changes
      const hasOldClass = cssContent.includes('.logo-inline {');
      expect(hasOldClass).toBe(false);
    });
  });

  describe('Pseudo-element Positioning', () => {
    it('should position ::before absolutely', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[^}]+}/s);
      expect(beforeSection[0]).toContain('position: absolute');
      expect(beforeSection[0]).toContain('inset: 0');
    });

    it('should position ::after relatively', () => {
      const afterSection = cssContent.match(/\.logo-sigil::after\s*{[^}]+}/s);
      expect(afterSection[0]).toContain('position: relative');
    });

    it('should inherit border-radius in ::before', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[^}]+}/s);
      expect(beforeSection[0]).toContain('border-radius: inherit');
    });
  });

  describe('Visual Effects', () => {
    it('should use mix-blend-mode for ::before', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[^}]+}/s);
      expect(beforeSection[0]).toContain('mix-blend-mode: screen');
    });

    it('should define opacity for ::before', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[^}]+}/s);
      expect(beforeSection[0]).toContain('opacity');
    });

    it('should define border color with transparency', () => {
      const sigilSection = cssContent.match(/\.logo-sigil\s*{[^}]+}/s);
      expect(sigilSection[0]).toContain('border:');
    });
  });

  describe('Animation Timing', () => {
    it('should animate over 12 seconds', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[^}]+}/s);
      expect(beforeSection[0]).toContain('12s');
    });

    it('should use linear animation', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[^}]+}/s);
      expect(beforeSection[0]).toContain('linear');
    });

    it('should loop animation infinitely', () => {
      const beforeSection = cssContent.match(/\.logo-sigil::before\s*{[^}]+}/s);
      expect(beforeSection[0]).toContain('infinite');
    });
  });

  describe('Sidebar Specific Styles', () => {
    it('should define larger font size for sidebar variant', () => {
      const sidebarSection = cssContent.match(/\.logo-sigil--sidebar\s*{[^}]+}/s);
      expect(sidebarSection[0]).toMatch(/font-size:\s*[\d.]+rem/);
    });

    it('should define margin-bottom for sidebar variant', () => {
      const sidebarSection = cssContent.match(/\.logo-sigil--sidebar\s*{[^}]+}/s);
      expect(sidebarSection[0]).toContain('margin-bottom');
    });

    it('should use larger border-radius for sidebar', () => {
      const sidebarSection = cssContent.match(/\.logo-sigil--sidebar\s*{[^}]+}/s);
      expect(sidebarSection[0]).toContain('border-radius: 24px');
    });
  });
});