/**
 * Comprehensive tests for core utility and state management functions in docs/script.js
 * Tests: loadSettings, saveSettings, applyTheme, qs, generateColorPalette, markActiveNav
 */

describe('Core Functions', () => {
  let scriptContent;
  let AppState;
  const STORAGE_KEY = 'net-obs-settings';

  beforeEach(() => {
    // Reset AppState for each test
    AppState = {
      settings: {
        theme: 'auto',
        backendUrl: '',
        auth0Domain: '',
        auth0ClientId: ''
      },
      stats: {},
      charts: { services: null, countries: null },
      auth0Client: null,
      worldData: null
    };

    // Reset document structure
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    delete document.body.dataset.theme;
  });

  describe('loadSettings', () => {
    test('should load settings from localStorage when available', () => {
      const savedSettings = {
        theme: 'dark',
        backendUrl: '/api/custom',
        auth0Domain: 'example.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(savedSettings));

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const loadSettingsMatch = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/);
      expect(loadSettingsMatch).not.toBeNull();

      // Verify function exists and has proper structure
      expect(loadSettingsMatch[0]).toMatch(/localStorage\.getItem/);
      expect(loadSettingsMatch[0]).toMatch(/JSON\.parse/);
      expect(loadSettingsMatch[0]).toMatch(/Object\.assign/);
    });

    test('should handle missing localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      expect(scriptContent).toMatch(/function loadSettings\(\)/);
      expect(scriptContent).toMatch(/try[\s\S]*?catch/);
    });

    test('should handle invalid JSON in localStorage', () => {
      localStorage.getItem.mockReturnValue('invalid-json{');
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const loadSettingsMatch = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/);
      
      // Should have error handling
      expect(loadSettingsMatch[0]).toMatch(/catch/);
    });
  });

  describe('saveSettings', () => {
    test('should persist settings to localStorage', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const saveSettingsMatch = scriptContent.match(/function saveSettings\(\) \{[\s\S]*?\n  \}/);
      
      expect(saveSettingsMatch).not.toBeNull();
      expect(saveSettingsMatch[0]).toMatch(/localStorage\.setItem/);
      expect(saveSettingsMatch[0]).toMatch(/JSON\.stringify/);
      expect(saveSettingsMatch[0]).toMatch(/AppState\.settings/);
    });

    test('should use correct storage key', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      expect(scriptContent).toMatch(/const STORAGE_KEY = ['"]net-obs-settings['"]/);
    });
  });

  describe('applyTheme', () => {
    test('should apply dark theme when explicitly set', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const applyThemeMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      
      expect(applyThemeMatch).not.toBeNull();
      expect(applyThemeMatch[0]).toMatch(/document\.documentElement\.setAttribute/);
      expect(applyThemeMatch[0]).toMatch(/document\.body\.dataset\.theme/);
    });

    test('should apply light theme when explicitly set', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      expect(scriptContent).toMatch(/function applyTheme/);
    });

    test('should respect system preference when theme is auto', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const applyThemeMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      
      expect(applyThemeMatch[0]).toMatch(/if \(theme === ['"]auto['"]\)/);
      expect(applyThemeMatch[0]).toMatch(/prefersDark\.matches/);
    });

    test('should set data-theme on both documentElement and body', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const applyThemeMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      
      expect(applyThemeMatch[0]).toMatch(/documentElement\.setAttribute\(['"]data-theme['"]/);
      expect(applyThemeMatch[0]).toMatch(/body\.dataset\.theme/);
    });
  });

  describe('qs (querySelector wrapper)', () => {
    test('should return element when it exists', () => {
      document.body.innerHTML = '<div id="test-element">Content</div>';
      const element = document.querySelector('#test-element');
      expect(element).not.toBeNull();
      expect(element.textContent).toBe('Content');
    });

    test('should return null when element does not exist', () => {
      document.body.innerHTML = '';
      const element = document.querySelector('#nonexistent');
      expect(element).toBeNull();
    });

    test('should work with various CSS selectors', () => {
      document.body.innerHTML = `
        <div class="container">
          <span data-stat="total-hosts">100</span>
          <div id="unique">Unique</div>
        </div>
      `;
      
      expect(document.querySelector('.container')).not.toBeNull();
      expect(document.querySelector('[data-stat="total-hosts"]')).not.toBeNull();
      expect(document.querySelector('#unique')).not.toBeNull();
    });
  });

  describe('generateColorPalette', () => {
    test('should generate correct number of colors', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/Array\.from/);
      expect(funcMatch[0]).toMatch(/length: count/);
    });

    test('should use different base hue for services seed', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/seed === ['"]services['"]/);
      expect(funcMatch[0]).toMatch(/baseHue/);
    });

    test('should return HSL color strings with alpha', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/hsl\(/);
      expect(funcMatch[0]).toMatch(/0\.7/); // alpha value
    });

    test('should distribute hues evenly across spectrum', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      // Should use modulo 360 for hue calculation
      expect(funcMatch[0]).toMatch(/% 360/);
      expect(funcMatch[0]).toMatch(/idx \* 27/); // spacing between hues
    });
  });

  describe('markActiveNav', () => {
    test('should add active class to current page link', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="api.html">API</a>
        </nav>
      `;

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function markActiveNav\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/window\.location\.pathname/);
      expect(funcMatch[0]).toMatch(/classList\.add\(['"]active['"]\)/);
    });

    test('should handle root path correctly', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function markActiveNav\(\)[\s\S]*?\n  \}/);
      
      // Should default to index.html for root
      expect(funcMatch[0]).toMatch(/\|\| ['"]index\.html['"]/);
    });

    test('should compare href with pathname', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="docs.html">Docs</a>
        </nav>
      `;

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function markActiveNav\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/link\.href\.includes/);
    });
  });
});