/**
 * End-to-end integration tests for the logo system
 * Tests the complete flow: HTML -> CSS -> JavaScript fallback
 */

const fs = require('fs');

describe('Logo System End-to-End', () => {
  let scriptContent, styleContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    styleContent = fs.readFileSync('./docs/style.css', 'utf-8');
  });

  describe('Complete Flow', () => {
    test('HTML references logo.png with data-logo attribute', () => {
      const indexContent = fs.readFileSync('./docs/index.html', 'utf-8');
      expect(indexContent).toMatch(/<img[^>]*src="logo\.png"[^>]*data-logo/);
    });

    test('CSS styles img[data-logo] elements', () => {
      expect(styleContent).toMatch(/header\s+img\.logo/);
    });

    test('JavaScript initializes placeholders for failed images', () => {
      expect(scriptContent).toMatch(/function initLogoPlaceholders/);
    });

    test('CSS provides fallback placeholder styles', () => {
      expect(styleContent).toMatch(/\.logo-placeholder/);
    });
  });

  describe('Initialization Order', () => {
    test('init function calls logo placeholder initialization', () => {
      const initFunc = scriptContent.match(/function init\(\) \{[\s\S]*?\n  \}/);
      expect(initFunc).not.toBeNull();
      expect(initFunc[0]).toMatch(/initLogoPlaceholders/);
    });

    test('script runs on DOMContentLoaded', () => {
      expect(scriptContent).toMatch(/document\.addEventListener\('DOMContentLoaded', init\)/);
    });

    test('script runs immediately if already loaded', () => {
      expect(scriptContent).toMatch(/if\s*\(\s*document\.readyState\s*!==\s*['"]loading['"]/);
    });
  });

  describe('Graceful Degradation', () => {
    test('system works without JavaScript (CSS provides base styles)', () => {
      expect(styleContent).toMatch(/header\s+img\.logo/);
      expect(styleContent).toMatch(/height:\s*48px/);
    });

    test('system provides fallback when image missing', () => {
      expect(scriptContent).toMatch(/createFallback/);
      expect(styleContent).toMatch(/\.logo-placeholder/);
    });

    test('placeholder prevents duplicate creation', () => {
      const createFallbackFunc = scriptContent.match(/const createFallback = \([^)]*\) => \{[\s\S]*?\n    \};/);
      expect(createFallbackFunc).not.toBeNull();
      expect(createFallbackFunc[0]).toMatch(/if\s*\(\s*img\.dataset\.fallback\s*===\s*['"]true['"]\s*\)\s*return/);
    });
  });

  describe('Accessibility', () => {
    test('images have alt attributes in HTML', () => {
      const files = ['docs/index.html', 'docs/dashboard.html', 'docs/api.html'];
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const logoImgs = content.match(/<img[^>]*data-logo[^>]*>/g);
        expect(logoImgs).not.toBeNull();
        logoImgs.forEach(img => {
          expect(img).toMatch(/alt=/);
        });
      });
    });

    test('placeholders have aria-hidden', () => {
      const createFallbackFunc = scriptContent.match(/const createFallback = \([^)]*\) => \{[\s\S]*?\n    \};/);
      expect(createFallbackFunc).not.toBeNull();
      expect(createFallbackFunc[0]).toMatch(/setAttribute\(['"]aria-hidden['"],\s*['"]true['"]\)/);
    });

    test('failed images are hidden from display', () => {
      const createFallbackFunc = scriptContent.match(/const createFallback = \([^)]*\) => \{[\s\S]*?\n    \};/);
      expect(createFallbackFunc).not.toBeNull();
      expect(createFallbackFunc[0]).toMatch(/img\.style\.display\s*=\s*['"]none['"]/);
    });
  });

  describe('Theme Integration', () => {
    test('placeholder uses CSS custom properties', () => {
      const placeholderBlock = styleContent.match(/\.logo-placeholder\s*\{[^}]*\}/s);
      expect(placeholderBlock).not.toBeNull();
      expect(placeholderBlock[0]).toMatch(/var\(--text\)/);
    });

    test('theme variables are defined', () => {
      expect(styleContent).toMatch(/:root\s*\{[\s\S]*?--text:/);
      expect(styleContent).toMatch(/:root\s*\{[\s\S]*?--accent:/);
    });

    test('light theme overrides exist', () => {
      expect(styleContent).toMatch(/\[data-theme="light"\]\s*\{/);
    });
  });

  describe('Responsive Design', () => {
    test('mobile styles reduce logo size', () => {
      expect(styleContent).toMatch(/@media[^{]*max-width:\s*600px/);
      const mobileBlock = styleContent.match(/@media\s*\([^)]*max-width:\s*600px[^)]*\)\s*\{[\s\S]*?\n\}/);
      if (mobileBlock) {
        expect(mobileBlock[0]).toMatch(/header\s+img\.logo[\s\S]*?height:\s*40px/);
      }
    });

    test('placeholder adapts to container', () => {
      expect(styleContent).toMatch(/header\s+\.logo-placeholder/);
      expect(styleContent).toMatch(/\.sidebar\s+\.logo-placeholder/);
    });
  });
});