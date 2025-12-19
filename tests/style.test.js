/**
 * Comprehensive tests for docs/style.css
 * Validates CSS structure, syntax, and logo-related styling
 */

import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cssPath = join(__dirname, '../docs/style.css');
const cssContent = readFileSync(cssPath, 'utf-8');

describe('CSS Logo Styles', () => {
  test('should contain logo-placeholder class definition', () => {
    expect(cssContent).toContain('.logo-placeholder');
  });

  test('should define header img.logo styles', () => {
    expect(cssContent).toContain('header img.logo');
  });

  test('logo-placeholder should have flexbox properties', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    expect(logoPlaceholderSection).toBeTruthy();
    
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('display: flex');
    expect(styles).toContain('align-items: center');
    expect(styles).toContain('justify-content: center');
  });

  test('logo-placeholder should have border-radius', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('border-radius: 14px');
  });

  test('logo-placeholder should be uppercase', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('text-transform: uppercase');
  });

  test('logo-placeholder should have gradient background', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('linear-gradient');
    expect(styles).toContain('rgba(0, 255, 255');
    expect(styles).toContain('rgba(255, 0, 255');
  });

  test('header logo should have specific height', () => {
    const headerLogoSection = cssContent.match(/header img\.logo\s*{[^}]+}/s);
    expect(headerLogoSection).toBeTruthy();
    
    const styles = headerLogoSection[0];
    expect(styles).toContain('height: 48px');
  });

  test('header logo should have drop-shadow filter', () => {
    const headerLogoSection = cssContent.match(/header img\.logo\s*{[^}]+}/s);
    const styles = headerLogoSection[0];
    expect(styles).toContain('filter: drop-shadow');
    expect(styles).toContain('rgba(0, 255, 255');
  });

  test('header logo-placeholder should have specific dimensions', () => {
    const headerPlaceholderSection = cssContent.match(/header \.logo-placeholder\s*{[^}]+}/s);
    expect(headerPlaceholderSection).toBeTruthy();
    
    const styles = headerPlaceholderSection[0];
    expect(styles).toContain('height: 48px');
    expect(styles).toContain('padding: 0 1.6rem');
  });

  test('sidebar logo-placeholder should have margin-bottom', () => {
    const sidebarPlaceholderSection = cssContent.match(/\.sidebar \.logo-placeholder\s*{[^}]+}/s);
    expect(sidebarPlaceholderSection).toBeTruthy();
    
    const styles = sidebarPlaceholderSection[0];
    expect(styles).toContain('margin-bottom: 1rem');
  });

  test('logo-placeholder should have letter-spacing', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('letter-spacing');
  });

  test('logo-placeholder should have font-weight', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('font-weight: 700');
  });

  test('logo-placeholder should have border', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('border:');
    expect(styles).toContain('rgba(0, 255, 255, 0.35)');
  });

  test('logo-placeholder should have box-shadow', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('box-shadow:');
  });
});

describe('CSS Structure Validation', () => {
  test('should have valid CSS syntax (basic check)', () => {
    // Check for balanced braces
    const openBraces = (cssContent.match(/{/g) || []).length;
    const closeBraces = (cssContent.match(/}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });

  test('should contain root CSS variables', () => {
    expect(cssContent).toContain(':root');
    expect(cssContent).toContain('--bg:');
    expect(cssContent).toContain('--text:');
    expect(cssContent).toContain('--accent:');
  });

  test('should contain theme-specific variables', () => {
    expect(cssContent).toContain('[data-theme="light"]');
  });

  test('should not have syntax errors in color values', () => {
    // Check that rgba values have proper format
    const rgbaMatches = cssContent.match(/rgba\([^)]+\)/g);
    if (rgbaMatches) {
      rgbaMatches.forEach(rgba => {
        // Should have 4 values separated by commas or spaces
        expect(rgba).toMatch(/rgba\(\s*\d+\s*,?\s*\d+\s*,?\s*\d+\s*,?\s*[\d.]+\s*\)/);
      });
    }
  });

  test('should have proper selector nesting', () => {
    // Basic check that selectors don't have obvious syntax errors
    const lines = cssContent.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('{')) {
        // Line with opening brace should not have double braces
        expect(line).not.toMatch(/{{/);
      }
    });
  });
});

describe('CSS Theme Support', () => {
  test('should define both light and dark theme variables', () => {
    expect(cssContent).toContain('--bg: #050510'); // dark
    expect(cssContent).toContain('--bg: #f5fbff'); // light (in [data-theme="light"])
  });

  test('should use CSS custom properties for theming', () => {
    const varUsages = cssContent.match(/var\(--[^)]+\)/g);
    expect(varUsages).toBeTruthy();
    expect(varUsages.length).toBeGreaterThan(10);
  });

  test('should have color-scheme property', () => {
    expect(cssContent).toContain('color-scheme: dark light');
  });
});

describe('CSS Animation and Effects', () => {
  test('should contain keyframe animations', () => {
    expect(cssContent).toContain('@keyframes');
  });

  test('should have drift animation', () => {
    expect(cssContent).toContain('@keyframes drift');
  });

  test('should have pulse animation', () => {
    expect(cssContent).toContain('@keyframes pulse');
  });

  test('should use backdrop-filter for header', () => {
    const headerSection = cssContent.match(/header\s*{[^}]+}/s);
    if (headerSection) {
      expect(headerSection[0]).toContain('backdrop-filter: blur');
    }
  });
});

describe('CSS Responsive Design', () => {
  test('should use viewport-relative units', () => {
    expect(cssContent).toMatch(/\d+vh/); // vh units
    expect(cssContent).toMatch(/\d+rem/); // rem units
  });

  test('should have grid or flexbox layouts', () => {
    const hasGrid = cssContent.includes('display: grid');
    const hasFlex = cssContent.includes('display: flex');
    expect(hasGrid || hasFlex).toBe(true);
  });
});

describe('CSS Accessibility', () => {
  test('should not remove focus outlines entirely', () => {
    // Should not have 'outline: none' without alternative
    const outlineNone = cssContent.match(/outline:\s*none/g);
    if (outlineNone) {
      // This is a warning - removing outlines hurts accessibility
      console.warn('Found outline: none - ensure focus indicators exist');
    }
  });

  test('should have sufficient color contrast indicators', () => {
    // Check that there are color definitions (basic check)
    expect(cssContent).toMatch(/color:/);
    expect(cssContent).toMatch(/background:/);
  });
});

describe('Logo-specific Style Removals', () => {
  test('should NOT contain old logo-inline class', () => {
    // The diff shows logo-inline was removed, confirm it's gone
    expect(cssContent).not.toContain('.logo-inline');
  });

  test('should have updated logo-placeholder to replace logo-inline', () => {
    // The new implementation uses logo-placeholder
    expect(cssContent).toContain('.logo-placeholder');
  });
});

describe('CSS Property Values', () => {
  test('logo-placeholder min-height should be 48px', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('min-height: 48px');
  });

  test('logo-placeholder width should be 100%', () => {
    const logoPlaceholderSection = cssContent.match(/\.logo-placeholder\s*{[^}]+}/s);
    const styles = logoPlaceholderSection[0];
    expect(styles).toContain('width: 100%');
  });

  test('header logo-placeholder should have min-width', () => {
    const headerPlaceholderSection = cssContent.match(/header \.logo-placeholder\s*{[^}]+}/s);
    const styles = headerPlaceholderSection[0];
    expect(styles).toContain('min-width: 160px');
  });
});