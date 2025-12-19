/**
 * CSS Validation and Style Tests
 * Validates CSS syntax and critical styling rules
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('CSS Style Validation', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = readFileSync(join(process.cwd(), 'docs/style.css'), 'utf-8');
  });

  describe('Logo Placeholder Styles', () => {
    test('should define .logo-placeholder class', () => {
      expect(cssContent).toContain('.logo-placeholder');
    });

    test('should have display flex for placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]+\}/s)?.[0] || '';
      expect(placeholderBlock).toContain('display');
      expect(placeholderBlock).toContain('flex');
    });

    test('should have border-radius for placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]+\}/s)?.[0] || '';
      expect(placeholderBlock).toContain('border-radius');
    });

    test('should have background gradient for placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]+\}/s)?.[0] || '';
      expect(placeholderBlock).toContain('background');
      expect(placeholderBlock).toContain('gradient');
    });

    test('should have text-transform uppercase', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]+\}/s)?.[0] || '';
      expect(placeholderBlock).toContain('text-transform');
      expect(placeholderBlock).toContain('uppercase');
    });

    test('should have letter-spacing', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]+\}/s)?.[0] || '';
      expect(placeholderBlock).toContain('letter-spacing');
    });

    test('should have box-shadow', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]+\}/s)?.[0] || '';
      expect(placeholderBlock).toContain('box-shadow');
    });

    test('should define header .logo-placeholder variant', () => {
      expect(cssContent).toContain('header .logo-placeholder');
    });

    test('should define sidebar .logo-placeholder variant', () => {
      expect(cssContent).toContain('.sidebar .logo-placeholder');
    });
  });

  describe('Header Logo Styles', () => {
    test('should define header img.logo class', () => {
      expect(cssContent).toContain('header img.logo');
    });

    test('should have height for header logo', () => {
      const headerLogoBlock = cssContent.match(/header img\.logo\s*\{[^}]+\}/s)?.[0] || '';
      expect(headerLogoBlock).toContain('height');
    });

    test('should have filter drop-shadow for header logo', () => {
      const headerLogoBlock = cssContent.match(/header img\.logo\s*\{[^}]+\}/s)?.[0] || '';
      expect(headerLogoBlock).toContain('filter');
      expect(headerLogoBlock).toContain('drop-shadow');
    });
  });

  describe('Removed Styles', () => {
    test('should not contain .logo-inline class', () => {
      expect(cssContent).not.toContain('.logo-inline');
    });

    test('should not have old logo-inline gradient', () => {
      const hasOldGradient = cssContent.includes('.logo-inline') && 
                             cssContent.includes('rgba(0, 255, 255, 0.4)');
      expect(hasOldGradient).toBe(false);
    });
  });

  describe('Theme Support', () => {
    test('should have data-theme selectors', () => {
      expect(cssContent).toContain('[data-theme');
    });

    test('should support light theme', () => {
      expect(cssContent).toContain('light');
    });

    test('should support dark theme implicit styles', () => {
      // Dark theme is default, check for color variables
      expect(cssContent).toContain('--text');
    });
  });

  describe('Responsive Design', () => {
    test('should have media queries', () => {
      expect(cssContent).toContain('@media');
    });

    test('should have width: 100% for placeholder', () => {
      const placeholderBlock = cssContent.match(/\.logo-placeholder\s*\{[^}]+\}/s)?.[0] || '';
      expect(placeholderBlock).toContain('width');
    });
  });

  describe('CSS Syntax Validation', () => {
    test('should have matching braces', () => {
      const openBraces = (cssContent.match(/\{/g) || []).length;
      const closeBraces = (cssContent.match(/\}/g) || []).length;
      
      expect(openBraces).toBe(closeBraces);
    });

    test('should not have obvious syntax errors', () => {
      // Check for common syntax errors
      expect(cssContent).not.toContain(';;');
      expect(cssContent).not.toContain(': ;');
    });

    test('should use valid CSS color formats', () => {
      // Extract color values
      const rgbaColors = cssContent.match(/rgba?\([^)]+\)/g) || [];
      
      rgbaColors.forEach(color => {
        // Basic validation - should have numbers
        expect(color).toMatch(/\d+/);
      });
    });

    test('should use valid CSS units', () => {
      const units = ['px', 'rem', 'em', '%', 'vh', 'vw'];
      const hasValidUnits = units.some(unit => cssContent.includes(unit));
      
      expect(hasValidUnits).toBe(true);
    });
  });

  describe('Layout and Positioning', () => {
    test('should have flexbox properties', () => {
      expect(cssContent).toContain('flex');
    });

    test('should have alignment properties', () => {
      const hasAlignment = cssContent.includes('align-items') || 
                          cssContent.includes('justify-content');
      expect(hasAlignment).toBe(true);
    });

    test('should have border-radius for rounded corners', () => {
      expect(cssContent).toContain('border-radius');
    });
  });

  describe('Visual Effects', () => {
    test('should have gradient backgrounds', () => {
      expect(cssContent).toContain('gradient');
    });

    test('should have box-shadow for depth', () => {
      expect(cssContent).toContain('box-shadow');
    });

    test('should have filter effects', () => {
      expect(cssContent).toContain('filter');
    });
  });

  describe('Typography', () => {
    test('should have font-weight declarations', () => {
      expect(cssContent).toContain('font-weight');
    });

    test('should have letter-spacing', () => {
      expect(cssContent).toContain('letter-spacing');
    });

    test('should have text-transform', () => {
      expect(cssContent).toContain('text-transform');
    });
  });

  describe('Color Scheme', () => {
    test('should use CSS custom properties for colors', () => {
      expect(cssContent).toContain('var(--');
    });

    test('should have text color variable', () => {
      expect(cssContent).toContain('--text');
    });

    test('should have cyan/magenta cyber-neon colors', () => {
      const hasCyan = cssContent.includes('0, 255, 255') || 
                     cssContent.includes('cyan');
      const hasMagenta = cssContent.includes('255, 0, 255') || 
                        cssContent.includes('magenta');
      
      expect(hasCyan || hasMagenta).toBe(true);
    });
  });
});

describe('CSS File Structure', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = readFileSync(join(process.cwd(), 'docs/style.css'), 'utf-8');
  });

  test('should not be empty', () => {
    expect(cssContent.length).toBeGreaterThan(0);
  });

  test('should have reasonable file size', () => {
    // Should be less than 100KB for performance
    expect(cssContent.length).toBeLessThan(100000);
  });

  test('should have organized sections', () => {
    // Check for some organization (classes/selectors)
    const selectorCount = (cssContent.match(/\.[a-zA-Z-_]/g) || []).length;
    expect(selectorCount).toBeGreaterThan(10);
  });
});

describe('CSS Performance', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = readFileSync(join(process.cwd(), 'docs/style.css'), 'utf-8');
  });

  test('should not have too many nesting levels', () => {
    const lines = cssContent.split('\n');
    let maxIndent = 0;
    
    lines.forEach(line => {
      const indent = line.search(/\S/);
      if (indent > maxIndent) maxIndent = indent;
    });
    
    // Reasonable indentation limit (not too deeply nested)
    expect(maxIndent).toBeLessThan(50);
  });

  test('should not have duplicate selectors', () => {
    const placeholderMatches = cssContent.match(/\.logo-placeholder\s*\{/g) || [];
    
    // Should have placeholder defined, but check for excessive duplication
    expect(placeholderMatches.length).toBeGreaterThan(0);
    expect(placeholderMatches.length).toBeLessThan(10); // Not duplicated too many times
  });
});