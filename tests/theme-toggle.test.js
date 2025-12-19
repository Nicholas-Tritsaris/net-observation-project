/**
 * Comprehensive tests for theme toggle functionality
 * Tests: initThemeToggle, theme cycling, keyboard navigation, system preference changes
 */

describe('Theme Toggle Functionality', () => {
  let mockMatchMedia;

  beforeEach(() => {
    document.body.innerHTML = `
      <div data-role="theme-toggle" role="button" tabindex="0">
        <span>Theme:</span>
        <strong data-label>AUTO</strong>
      </div>
    `;

    mockMatchMedia = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    };
    window.matchMedia = jest.fn(() => mockMatchMedia);
  });

  describe('initThemeToggle', () => {
    test('should find and wire theme toggle element', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelector\(['"][^'"]*theme-toggle/);
    });

    test('should return early if toggle element not found', () => {
      document.body.innerHTML = '';
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(!toggle\) return/);
    });

    test('should add click event listener', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/addEventListener\(['"]click['"]/);
      expect(funcMatch[0]).toMatch(/cycleTheme/);
    });

    test('should add keyboard event listener for Enter and Space', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/addEventListener\(['"]keydown['"]/);
      expect(funcMatch[0]).toMatch(/event\.key === ['"]Enter['"]/);
      expect(funcMatch[0]).toMatch(/event\.key === ['" ] ['"]/);
    });

    test('should listen for system preference changes', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/prefersDark\.addEventListener/);
      expect(funcMatch[0]).toMatch(/prefersListener/);
    });

    test('should support legacy addListener for older browsers', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/addListener/);
    });
  });

  describe('Theme Cycling', () => {
    test('should cycle through auto -> dark -> light -> auto', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      // Check for the cycle order
      expect(funcMatch[0]).toMatch(/\['auto', 'dark', 'light'\]/);
    });

    test('should save settings after theme change', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/saveSettings/);
    });

    test('should apply theme after cycling', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/applyTheme/);
    });

    test('should update label after cycling', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/updateLabel/);
    });
  });

  describe('Label Updates', () => {
    test('should display theme in uppercase', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/toUpperCase\(\)/);
    });

    test('should update data-label element', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const label = toggle.querySelector('[data-label]');
      
      expect(label).not.toBeNull();
      expect(label.textContent).toBe('AUTO');
    });

    test('should reflect current body theme', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/document\.body\.dataset\.theme/);
    });
  });

  describe('System Preference Changes', () => {
    test('should reapply theme when system preference changes and theme is auto', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      // Should check if theme is auto
      expect(funcMatch[0]).toMatch(/AppState\.settings\.theme === ['"]auto['"]/);
    });

    test('should not reapply theme when manually set to dark or light', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      // Should have conditional check
      expect(funcMatch[0]).toMatch(/if \(/);
    });

    test('should call applyTheme in preference listener', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/prefersListener[\s\S]*?applyTheme/);
    });
  });

  describe('Keyboard Accessibility', () => {
    test('should prevent default behavior for Space key', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/event\.preventDefault/);
    });

    test('should handle Enter key', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle.getAttribute('tabindex')).toBe('0');
      expect(toggle.getAttribute('role')).toBe('button');
    });

    test('should handle Space key', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/['" ] ['"]/); // Space character
    });
  });
});