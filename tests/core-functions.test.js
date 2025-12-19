/**
 * Comprehensive tests for core utility functions in docs/script.js
 * Tests loadSettings, saveSettings, applyTheme, qs, and theme toggle
 */

const fs = require('fs');

describe('Core Utility Functions', () => {
  let scriptContent;
  let loadSettings, saveSettings, applyTheme, qs;
  let AppState, STORAGE_KEY, prefersDark;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    // Reset DOM and mocks
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    delete document.body.dataset.theme;
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();

    // Extract and evaluate the IIFE content to get functions
    const iifeMath = scriptContent.match(/\(\(\) => \{([\s\S]*)\}\)\(\);/);
    if (iifeMath) {
      const code = iifeMath[1];
      // Create a sandboxed evaluation
      eval(`
        window.__latestCensys = null;
        const AppState = {
          settings: {
            backendUrl: '/api/censys-summary',
            auth0Domain: '',
            auth0ClientId: '',
            theme: 'auto'
          },
          stats: null,
          charts: {},
          auth0Client: null,
          worldData: null
        };
        const STORAGE_KEY = 'net-observation-settings';
        const prefersDark = typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-color-scheme: dark)')
          : { matches: true };
        
        ${code.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/)?.[0] || ''}
        ${code.match(/function saveSettings\(\) \{[\s\S]*?\n  \}/)?.[0] || ''}
        ${code.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/)?.[0] || ''}
        ${code.match(/function qs\(id\) \{[\s\S]*?\n  \}/)?.[0] || ''}
      `);
    }
  });

  describe('loadSettings', () => {
    test('should load settings from localStorage when valid JSON exists', () => {
      const mockSettings = JSON.stringify({ theme: 'dark', backendUrl: '/custom/api' });
      localStorage.getItem.mockReturnValue(mockSettings);

      expect(() => loadSettings()).not.toThrow();
      expect(localStorage.getItem).toHaveBeenCalledWith('net-observation-settings');
    });

    test('should handle missing localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue(null);
      
      expect(() => loadSettings()).not.toThrow();
      expect(localStorage.getItem).toHaveBeenCalled();
    });

    test('should handle invalid JSON gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid-json{');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(() => loadSettings()).not.toThrow();
      
      consoleWarnSpy.mockRestore();
    });

    test('should handle localStorage access errors', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(() => loadSettings()).not.toThrow();
      
      consoleWarnSpy.mockRestore();
    });

    test('should merge loaded settings into existing AppState.settings', () => {
      const funcMatch = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/Object\.assign\(AppState\.settings, parsed\)/);
    });
  });

  describe('saveSettings', () => {
    test('should save settings to localStorage as JSON', () => {
      localStorage.setItem.mockClear();
      
      expect(() => saveSettings()).not.toThrow();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'net-observation-settings',
        expect.any(String)
      );
    });

    test('should serialize AppState.settings correctly', () => {
      const funcMatch = scriptContent.match(/function saveSettings\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/JSON\.stringify\(AppState\.settings\)/);
    });
  });

  describe('applyTheme', () => {
    test('should set data-theme attribute on documentElement', () => {
      document.body.innerHTML = '<div>Test</div>';
      
      const funcMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/document\.documentElement\.setAttribute\('data-theme'/);
    });

    test('should set data-theme on body.dataset', () => {
      const funcMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/document\.body\.dataset\.theme\s*=/);
    });

    test('should resolve "auto" theme based on system preference', () => {
      const funcMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*theme\s*===\s*['"]auto['"]\s*\)/);
      expect(funcMatch[0]).toMatch(/prefersDark\.matches/);
    });

    test('should not call refreshChartThemes (removed function)', () => {
      const funcMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).not.toMatch(/refreshChartThemes/);
    });
  });

  describe('qs (querySelector utility)', () => {
    test('should be defined as a wrapper for document.querySelector', () => {
      const funcMatch = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/return document\.querySelector\(id\)/);
    });

    test('should accept a CSS selector parameter', () => {
      const funcMatch = scriptContent.match(/function qs\((.*?)\)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[1]).toBe('id');
    });

    test('should return Element or null based on JSDoc', () => {
      const jsdocMatch = scriptContent.match(/\/\*\*[\s\S]*?@returns \{Element\|null\}[\s\S]*?\*\/\s*function qs/);
      expect(jsdocMatch).not.toBeNull();
    });
  });

  describe('initThemeToggle', () => {
    test('should return early if toggle element not found', () => {
      document.body.innerHTML = '<div>No toggle</div>';
      const funcMatch = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?if \(!toggle\) return;/);
      expect(funcMatch).not.toBeNull();
    });

    test('should cycle through theme options: auto, dark, light', () => {
      const funcMatch = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\['auto',\s*'dark',\s*'light'\]/);
    });

    test('should handle keyboard events (Enter and Space)', () => {
      const funcMatch = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/evt\.key\s*===\s*'Enter'/);
      expect(funcMatch[0]).toMatch(/evt\.key\s*===\s*' '/);
    });

    test('should listen for system preference changes', () => {
      const funcMatch = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/prefersDark\.addEventListener|prefersDark\.addListener/);
    });

    test('should update label element with current theme', () => {
      const funcMatch = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/const updateLabel/);
      expect(funcMatch[0]).toMatch(/\[data-label\]/);
    });

    test('should save settings after theme change', () => {
      const funcMatch = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/saveSettings\(\)/);
    });
  });

  describe('initSidebar', () => {
    test('should return early if sidebar or toggle not found', () => {
      document.body.innerHTML = '<div>No sidebar</div>';
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?if \(!sidebar \|\| !toggle\) return;/);
      expect(funcMatch).not.toBeNull();
    });

    test('should toggle open/collapsed classes on sidebar', () => {
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/sidebar\.classList\.toggle\('open'/);
      expect(funcMatch[0]).toMatch(/sidebar\.classList\.toggle\('collapsed'/);
    });

    test('should update aria-expanded attribute', () => {
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/toggle\.setAttribute\('aria-expanded'/);
    });

    test('should collapse sidebar on narrow viewports (< 880px)', () => {
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/window\.innerWidth\s*<\s*880/);
      expect(funcMatch[0]).toMatch(/setState\(false\)/);
    });

    test('should use classList.add for initial desktop state', () => {
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/sidebar\.classList\.add\('open'\)/);
      expect(funcMatch[0]).not.toMatch(/setState\(true\)/);
    });
  });
});