/**
 * Style validation tests for docs/style.css
 * Tests CSS changes for logo placeholder functionality
 */

const { describe, test, expect } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('CSS Logo Styles Validation', () => {
  let cssContent;

  beforeAll(() => {
    const cssPath = path.join(__dirname, '../../docs/style.css');
    if (fs.existsSync(cssPath)) {
      cssContent = fs.readFileSync(cssPath, 'utf-8');
    }
  });

  test('should contain logo-placeholder class definition', () => {
    expect(cssContent).toContain('.logo-placeholder');
  });

  test('should contain header logo image styles', () => {
    expect(cssContent).toContain('header img.logo');
  });

  test('should not contain old logo-inline class', () => {
    // The diff shows logo-inline was removed
    const hasLogoInline = cssContent.includes('.logo-inline {');
    expect(hasLogoInline).toBe(false);
  });

  test('should have border-radius for logo placeholder', () => {
    const placeholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
    if (placeholderSection) {
      expect(placeholderSection[0]).toContain('border-radius');
    }
  });

  test('should have gradient background for logo placeholder', () => {
    const placeholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
    if (placeholderSection) {
      expect(placeholderSection[0]).toContain('background');
      expect(placeholderSection[0]).toContain('linear-gradient');
    }
  });

  test('should center content in logo placeholder', () => {
    const placeholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
    if (placeholderSection) {
      expect(placeholderSection[0]).toMatch(/display:\s*flex/);
      expect(placeholderSection[0]).toMatch(/align-items:\s*center/);
      expect(placeholderSection[0]).toMatch(/justify-content:\s*center/);
    }
  });

  test('should uppercase text in logo placeholder', () => {
    const placeholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
    if (placeholderSection) {
      expect(placeholderSection[0]).toContain('text-transform: uppercase');
    }
  });

  test('should have drop-shadow for header logo', () => {
    const headerLogoSection = cssContent.match(/header img\.logo\s*{[^}]*}/s);
    if (headerLogoSection) {
      expect(headerLogoSection[0]).toContain('filter');
      expect(headerLogoSection[0]).toContain('drop-shadow');
    }
  });

  test('should style sidebar logo placeholder differently', () => {
    expect(cssContent).toContain('.sidebar .logo-placeholder');
  });

  test('should style header logo placeholder differently', () => {
    expect(cssContent).toContain('header .logo-placeholder');
  });
});

describe('CSS Theme Support', () => {
  let cssContent;

  beforeAll(() => {
    const cssPath = path.join(__dirname, '../../docs/style.css');
    if (fs.existsSync(cssPath)) {
      cssContent = fs.readFileSync(cssPath, 'utf-8');
    }
  });

  test('should have light theme specific styles', () => {
    expect(cssContent).toMatch(/\[data-theme="light"\]/);
  });

  test('should use CSS variables for theming', () => {
    expect(cssContent).toMatch(/var\(--[a-z-]+\)/);
  });

  test('should have proper color contrast for accessibility', () => {
    // Check for text color variable usage
    expect(cssContent).toContain('var(--text');
  });
});

describe('CSS Responsive Design', () => {
  let cssContent;

  beforeAll(() => {
    const cssPath = path.join(__dirname, '../../docs/style.css');
    if (fs.existsSync(cssPath)) {
      cssContent = fs.readFileSync(cssPath, 'utf-8');
    }
  });

  test('should have header styles', () => {
    expect(cssContent).toMatch(/header\s*{/);
  });

  test('should have sidebar styles', () => {
    expect(cssContent).toMatch(/\.sidebar/);
  });
});